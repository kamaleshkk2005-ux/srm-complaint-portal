import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler.middleware';
import { successResponse, getPaginationMeta } from '../utils/helpers';
import { notificationService } from '../services/notification.service';
import { Role } from '../types/enums';

export const adminController = {
  // ─── Students ────────────────────────────────────────────────

  getStudents: async (req: Request, res: Response) => {
    const { skip, limit } = res.locals.pagination;
    const { search, departmentId } = req.query;

    let where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { registerNumber: { contains: search as string, mode: 'insensitive' } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: {
          user: { select: { email: true, isActive: true } },
          department: { select: { name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const page = Math.floor(skip / limit) + 1;

    res.json({
      success: true,
      message: 'Students retrieved',
      data: students,
      pagination: getPaginationMeta(total, page, limit),
    });
  },

  getStudentById: async (req: Request, res: Response) => {
    const student = await prisma.student.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { email: true, isActive: true } },
        department: true,
        complaints: { take: 5, orderBy: { createdAt: 'desc' } }
      },
    });

    if (!student) throw new AppError('Student not found', 404);
    res.json(successResponse('Student retrieved', student));
  },

  createStudent: async (req: Request, res: Response) => {
    const data = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new AppError('Email already in use', 400);

    const existingStudent = await prisma.student.findUnique({ where: { registerNumber: data.registerNumber } });
    if (existingStudent) throw new AppError('Register number already in use', 400);

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const student = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: data.email, password: hashedPassword, role: Role.STUDENT },
      });

      return tx.student.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          registerNumber: data.registerNumber,
          phone: data.phone,
          departmentId: data.departmentId,
          academicYear: data.academicYear,
        },
        include: { user: { select: { email: true } } }
      });
    });

    res.status(201).json(successResponse('Student created successfully', student));
  },

  updateStudent: async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    const updated = await prisma.student.update({
      where: { id },
      data,
      include: { user: { select: { email: true } } }
    });

    res.json(successResponse('Student updated successfully', updated));
  },

  // ─── Staff ───────────────────────────────────────────────────

  getStaffs: async (req: Request, res: Response) => {
    const { skip, limit } = res.locals.pagination;
    const { search, departmentId } = req.query;

    let where: any = {};
    if (departmentId) where.departmentId = departmentId;
    if (search) {
      where.OR = [
        { fullName: { contains: search as string, mode: 'insensitive' } },
        { employeeId: { contains: search as string, mode: 'insensitive' } },
        { user: { email: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [total, staff] = await Promise.all([
      prisma.staff.count({ where }),
      prisma.staff.findMany({
        where,
        include: {
          user: { select: { email: true, isActive: true } },
          department: { select: { name: true, code: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const page = Math.floor(skip / limit) + 1;

    res.json({
      success: true,
      message: 'Staff retrieved',
      data: staff,
      pagination: getPaginationMeta(total, page, limit),
    });
  },

  getStaffById: async (req: Request, res: Response) => {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { email: true, isActive: true } },
        department: true,
        assignedComplaints: { take: 5, orderBy: { createdAt: 'desc' } }
      },
    });

    if (!staff) throw new AppError('Staff not found', 404);
    res.json(successResponse('Staff retrieved', staff));
  },

  createStaff: async (req: Request, res: Response) => {
    const data = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email: data.email } });
    if (existingUser) throw new AppError('Email already in use', 400);

    const existingStaff = await prisma.staff.findUnique({ where: { employeeId: data.employeeId } });
    if (existingStaff) throw new AppError('Employee ID already in use', 400);

    const hashedPassword = await bcrypt.hash(data.password, 12);

    const staff = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { email: data.email, password: hashedPassword, role: Role.STAFF },
      });

      return tx.staff.create({
        data: {
          userId: user.id,
          fullName: data.fullName,
          employeeId: data.employeeId,
          phone: data.phone,
          departmentId: data.departmentId,
          designation: data.designation,
        },
        include: { user: { select: { email: true } } }
      });
    });

    res.status(201).json(successResponse('Staff created successfully', staff));
  },

  updateStaff: async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    const updated = await prisma.staff.update({
      where: { id },
      data,
      include: { user: { select: { email: true } } }
    });

    res.json(successResponse('Staff updated successfully', updated));
  },

  // ─── User Generic Actions ────────────────────────────────────

  toggleUserStatus: async (req: Request, res: Response) => {
    const { id } = req.params; // User ID
    const { isActive } = req.body;

    if (typeof isActive !== 'boolean') {
      throw new AppError('isActive must be a boolean', 400);
    }

    // Don't let admin deactivate themselves
    if (id === req.user!.id) {
      throw new AppError('Cannot deactivate your own account', 400);
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, isActive: true, role: true }
    });

    res.json(successResponse(`User ${isActive ? 'activated' : 'deactivated'} successfully`, updated));
  },

  deleteUser: async (req: Request, res: Response) => {
    // Determine if it's a student ID, staff ID, or User ID
    // For simplicity, we assume this takes User ID, or handle cascading based on param
    const { id } = req.params; // Assume this is User ID for safe cascading
    
    if (id === req.user!.id) {
      throw new AppError('Cannot delete your own account', 400);
    }
    
    await prisma.user.delete({ where: { id } });
    res.json(successResponse('User deleted successfully'));
  },

  // ─── Announcements ───────────────────────────────────────────

  getAnnouncements: async (req: Request, res: Response) => {
    const { skip, limit } = res.locals.pagination;

    const [total, announcements] = await Promise.all([
      prisma.announcement.count(),
      prisma.announcement.findMany({
        include: { author: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const page = Math.floor(skip / limit) + 1;

    res.json({
      success: true,
      message: 'Announcements retrieved',
      data: announcements,
      pagination: getPaginationMeta(total, page, limit),
    });
  },

  createAnnouncement: async (req: Request, res: Response) => {
    const { title, content, targetRole } = req.body;
    const authorId = req.user!.id;

    const announcement = await prisma.announcement.create({
      data: { title, content, targetRole, authorId },
    });

    // Notify users via socket & DB
    notificationService.broadcastNotification(
      targetRole,
      'New Announcement',
      title,
      'ANNOUNCEMENT',
      announcement.id,
      'Announcement'
    ).catch(console.error);

    res.status(201).json(successResponse('Announcement created', announcement));
  },

  updateAnnouncement: async (req: Request, res: Response) => {
    const { id } = req.params;
    const data = req.body;

    const updated = await prisma.announcement.update({
      where: { id },
      data,
    });

    res.json(successResponse('Announcement updated', updated));
  },

  deleteAnnouncement: async (req: Request, res: Response) => {
    await prisma.announcement.delete({ where: { id: req.params.id } });
    res.json(successResponse('Announcement deleted'));
  },

  // ─── Settings ────────────────────────────────────────────────

  getSettings: async (req: Request, res: Response) => {
    const settings = await prisma.settings.findMany();
    // Exclude password reset tokens from settings list
    const filtered = settings.filter(s => !s.key.startsWith('pwd_reset_'));
    res.json(successResponse('Settings retrieved', filtered));
  },

  updateSetting: async (req: Request, res: Response) => {
    const { key } = req.params;
    const { value } = req.body;

    const updated = await prisma.settings.update({
      where: { key },
      data: { value },
    });

    res.json(successResponse('Setting updated', updated));
  },

  // ─── Audit Logs ──────────────────────────────────────────────

  getAuditLogs: async (req: Request, res: Response) => {
    const { skip, limit } = res.locals.pagination;
    const { entity, action } = req.query;

    let where: any = {};
    if (entity) where.entity = entity;
    if (action) where.action = action;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: { user: { select: { email: true } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const page = Math.floor(skip / limit) + 1;

    res.json({
      success: true,
      message: 'Audit logs retrieved',
      data: logs,
      pagination: getPaginationMeta(total, page, limit),
    });
  }
};
