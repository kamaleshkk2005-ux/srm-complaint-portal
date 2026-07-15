import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler.middleware';
import { tokenService } from '../services/token.service';
import { emailService } from '../services/email.service';
import { successResponse } from '../utils/helpers';
import {
  RegisterInput,
  LoginInput,
  ForgotPasswordInput,
} from '../utils/validators';
import { Role } from '../types/enums';

export const authController = {
  /**
   * Register a new student
   */
  register: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: RegisterInput = req.body;

      const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
      if (existingUser) throw new AppError('Email is already registered', 400);

      const existingStudent = await prisma.student.findUnique({
        where: { registerNumber: data.registerNumber },
      });
      if (existingStudent) throw new AppError('Register number is already in use', 400);

      const hashedPassword = await bcrypt.hash(data.password, 12);

      const user = await prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: { email: data.email, password: hashedPassword, role: Role.STUDENT },
        });
        await tx.student.create({
          data: {
            userId: newUser.id,
            fullName: data.fullName,
            registerNumber: data.registerNumber,
            phone: data.phone,
            departmentId: data.departmentId,
            academicYear: data.academicYear,
          },
        });
        return newUser;
      });

      emailService.sendWelcomeEmail(data.email, data.fullName).catch(console.error);

      const accessToken = tokenService.generateAccessToken(user.id, user.email, user.role);
      const refreshToken = await tokenService.generateRefreshToken(user.id);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json(
        successResponse('Registration successful', {
          user: { id: user.id, email: user.email, personalEmail: user.personalEmail, role: user.role },
          accessToken,
        })
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * Login user
   */
  login: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const data: LoginInput = req.body;

      const user = await prisma.user.findUnique({
        where: { email: data.email },
        include: { student: true, staff: true },
      });

      if (!user) throw new AppError('Invalid email or password', 401);

      if (!user.isActive)
        throw new AppError('Your account has been deactivated. Contact admin.', 403);

      const isPasswordValid = await bcrypt.compare(data.password, user.password);
      if (!isPasswordValid) throw new AppError('Invalid email or password', 401);

      // ✅ Role validation — selected role must match the stored role
      if (data.role && user.role !== data.role) {
        throw new AppError(
          'Selected role does not match this account. Please choose the correct role.',
          403
        );
      }

      const accessToken = tokenService.generateAccessToken(user.id, user.email, user.role);
      const refreshToken = await tokenService.generateRefreshToken(user.id);

      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: (data.rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
      });

      let profile = null;
      if (user.role === Role.STUDENT && user.student) {
        profile = {
          fullName: user.student.fullName,
          profileImage: user.student.profileImage,
          identifier: user.student.registerNumber,
        };
      } else if ((user.role === Role.STAFF || user.role === Role.ADMIN) && user.staff) {
        profile = {
          fullName: user.staff.fullName,
          profileImage: user.staff.profileImage,
          identifier: user.staff.employeeId,
        };
      } else if (user.role === Role.ADMIN) {
        profile = { fullName: 'Administrator', identifier: 'ADMIN' };
      }

      res.json(
        successResponse('Login successful', {
          user: { id: user.id, email: user.email, personalEmail: user.personalEmail, role: user.role, profile },
          accessToken,
        })
      );
    } catch (err) {
      next(err);
    }
  },

  /**
   * Logout user
   */
  logout: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (refreshToken) await tokenService.revokeRefreshToken(refreshToken);
      res.clearCookie('refreshToken');
      res.json(successResponse('Logged out successfully'));
    } catch (err) {
      next(err);
    }
  },

  /**
   * Refresh token
   */
  refreshToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const refreshToken = req.cookies.refreshToken;
      if (!refreshToken) throw new AppError('Refresh token missing', 401);

      const userId = await tokenService.verifyRefreshToken(refreshToken);
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user || !user.isActive) throw new AppError('User not found or inactive', 401);

      const accessToken = tokenService.generateAccessToken(user.id, user.email, user.role);
      res.json(successResponse('Token refreshed', { accessToken }));
    } catch (err) {
      res.clearCookie('refreshToken');
      next(err);
    }
  },

  /**
   * Forgot password
   */
  forgotPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { email } = req.body;
      const user = await prisma.user.findUnique({
        where: { email },
        include: { student: true, staff: true },
      });

      if (!user || !user.isActive) {
        return res.json(successResponse('If an account exists, a reset link has been sent.'));
      }

      const resetToken = await tokenService.createPasswordResetToken(user.id);
      const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}&id=${user.id}`;
      const name = user.student?.fullName || user.staff?.fullName || 'User';
      await emailService.sendPasswordResetEmail(user.email, name, resetUrl);

      res.json(successResponse('If an account exists, a reset link has been sent.'));
    } catch (err) {
      next(err);
    }
  },

  /**
   * Reset password
   */
  resetPassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { token, password } = req.body;
      const userId = req.query.id as string;
      if (!userId) throw new AppError('User ID is missing', 400);

      await tokenService.verifyPasswordResetToken(userId, token);
      const hashedPassword = await bcrypt.hash(password, 12);
      await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
      await tokenService.deletePasswordResetToken(userId);
      await tokenService.revokeAllUserTokens(userId);

      res.json(successResponse('Password reset successful. Please login again.'));
    } catch (err) {
      next(err);
    }
  },

  /**
   * Change password for logged in user
   */
  changePassword: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) throw new AppError('User not found', 404);

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) throw new AppError('Incorrect current password', 400);

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });

      res.json(successResponse('Password changed successfully'));
    } catch (err) {
      next(err);
    }
  },

  /**
   * Get current user details
   */
  getCurrentUser: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          student: { include: { department: true } },
          staff: { include: { department: true } },
        },
      });

      if (!user) throw new AppError('User not found', 404);

      let profile = null;
      let department = null;

      if (user.role === Role.STUDENT && user.student) {
        profile = user.student;
        department = user.student.department;
      } else if ((user.role === Role.STAFF || user.role === Role.ADMIN) && user.staff) {
        profile = user.staff;
        department = user.staff.department;
      }

      res.json(
        successResponse('User details retrieved', {
          id: user.id,
          email: user.email,
          personalEmail: user.personalEmail,
          role: user.role,
          isActive: user.isActive,
          profile,
          department,
        })
      );
    } catch (err) {
      next(err);
    }
  },
};

