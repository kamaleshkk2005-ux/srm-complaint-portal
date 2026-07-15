import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { generatePasswordResetToken, hashToken } from '../utils/helpers';
import { AppError } from '../middleware/errorHandler.middleware';

export const tokenService = {
  /**
   * Generate access token (JWT)
   */
  generateAccessToken: (id: string, email: string, role: string): string => {
    return jwt.sign(
      { id, email, role },
      process.env.JWT_SECRET as string,
      { expiresIn: (process.env.JWT_EXPIRES_IN || '15m') as any }
    );
  },

  /**
   * Generate refresh token and store in DB
   */
  generateRefreshToken: async (userId: string): Promise<string> => {
    const token = jwt.sign(
      { id: userId },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN || '7d') as any }
    );

    // Calculate expiry date for DB (7 days from now)
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    // Clean up old refresh tokens for this user if they have more than 5
    const count = await prisma.refreshToken.count({ where: { userId } });
    if (count >= 5) {
      const oldestTokens = await prisma.refreshToken.findMany({
        where: { userId },
        orderBy: { createdAt: 'asc' },
        take: count - 4,
      });
      await prisma.refreshToken.deleteMany({
        where: { id: { in: oldestTokens.map((t) => t.id) } },
      });
    }

    await prisma.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });

    return token;
  },

  /**
   * Verify access token
   */
  verifyAccessToken: (token: string) => {
    return jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;
  },

  /**
   * Verify refresh token against DB
   */
  verifyRefreshToken: async (token: string) => {
    try {
      // 1. Verify JWT signature
      const decoded = jwt.verify(
        token,
        process.env.REFRESH_TOKEN_SECRET as string
      ) as { id: string };

      // 2. Check if token exists in DB and is not expired
      const dbToken = await prisma.refreshToken.findUnique({
        where: { token },
      });

      if (!dbToken) {
        throw new AppError('Invalid refresh token', 401);
      }

      if (dbToken.expiresAt < new Date()) {
        await prisma.refreshToken.delete({ where: { id: dbToken.id } });
        throw new AppError('Refresh token expired', 401);
      }

      return decoded.id;
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  },

  /**
   * Revoke a specific refresh token
   */
  revokeRefreshToken: async (token: string): Promise<void> => {
    await prisma.refreshToken.deleteMany({
      where: { token },
    });
  },

  /**
   * Revoke all refresh tokens for a user
   */
  revokeAllUserTokens: async (userId: string): Promise<void> => {
    await prisma.refreshToken.deleteMany({
      where: { userId },
    });
  },

  /**
   * Create password reset token, hash it, store in Settings (as temp solution), return plain token
   */
  createPasswordResetToken: async (userId: string): Promise<string> => {
    const { token, hashedToken } = generatePasswordResetToken();
    const expiresAt = Date.now() + parseInt(process.env.PASSWORD_RESET_EXPIRES_IN || '3600000', 10);
    
    // Store in Settings table using a structured key
    const key = `pwd_reset_${userId}`;
    const value = JSON.stringify({ hashedToken, expiresAt });

    await prisma.settings.upsert({
      where: { key },
      update: { value },
      create: { key, value, description: 'Temp password reset token' },
    });

    return token;
  },

  /**
   * Verify password reset token
   */
  verifyPasswordResetToken: async (userId: string, token: string): Promise<boolean> => {
    const key = `pwd_reset_${userId}`;
    const setting = await prisma.settings.findUnique({ where: { key } });

    if (!setting) {
      throw new AppError('Invalid or expired password reset token', 400);
    }

    const { hashedToken, expiresAt } = JSON.parse(setting.value);

    if (Date.now() > expiresAt) {
      await prisma.settings.delete({ where: { key } });
      throw new AppError('Password reset token has expired', 400);
    }

    const providedHashedToken = hashToken(token);
    
    if (providedHashedToken !== hashedToken) {
      throw new AppError('Invalid password reset token', 400);
    }

    return true;
  },
  
  /**
   * Delete password reset token after use
   */
  deletePasswordResetToken: async (userId: string): Promise<void> => {
    const key = `pwd_reset_${userId}`;
    await prisma.settings.deleteMany({ where: { key } });
  }
};
