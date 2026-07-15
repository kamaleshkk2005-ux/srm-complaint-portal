import { Request, Response } from 'express';
import prisma from '../config/database';
import { AppError } from '../middleware/errorHandler.middleware';
import { successResponse } from '../utils/helpers';
import { notificationService } from '../services/notification.service';
import { uploadService } from '../services/upload.service';
import { CLOUDINARY_FOLDERS } from '../utils/constants';
import { Role, TargetRole } from '../types/enums';

export const userController = {
  /**
   * Update User Profile (Student or Staff)
   */
  updateProfile: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const role = req.user!.role;
    const { fullName, phone, academicYear, designation, personalEmail } = req.body;

    if (personalEmail !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { personalEmail },
      });
    }

    if (role === Role.STUDENT) {
      await prisma.student.update({
        where: { userId },
        data: {
          ...(fullName && { fullName }),
          ...(phone && { phone }),
          ...(academicYear && { academicYear }),
        },
      });
    } else if (role === Role.STAFF || role === Role.ADMIN) {
      // Admin might not have a staff profile in some systems, check first
      const staff = await prisma.staff.findUnique({ where: { userId } });
      if (staff) {
        await prisma.staff.update({
          where: { userId },
          data: {
            ...(fullName && { fullName }),
            ...(phone && { phone }),
            ...(designation && { designation }),
          },
        });
      }
    }

    res.json(successResponse('Profile updated successfully'));
  },

  /**
   * Upload Profile Image
   */
  uploadProfileImage: async (req: Request, res: Response) => {
    if (!req.file) {
      throw new AppError('No image provided', 400);
    }

    const userId = req.user!.id;
    const role = req.user!.role;

    // Upload to Cloudinary
    const result = await uploadService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      CLOUDINARY_FOLDERS.PROFILES
    );

    let oldImageUrl = null;

    // Update DB and get old image URL to delete later
    if (role === Role.STUDENT) {
      const student = await prisma.student.findUnique({ where: { userId } });
      oldImageUrl = student?.profileImage;
      
      await prisma.student.update({
        where: { userId },
        data: { profileImage: result.url },
      });
    } else if (role === Role.STAFF || role === Role.ADMIN) {
      const staff = await prisma.staff.findUnique({ where: { userId } });
      oldImageUrl = staff?.profileImage;
      
      if (staff) {
        await prisma.staff.update({
          where: { userId },
          data: { profileImage: result.url },
        });
      }
    }

    // Delete old image from Cloudinary (extract public_id from URL)
    if (oldImageUrl) {
      try {
        const urlParts = oldImageUrl.split('/');
        const publicIdWithExtension = urlParts[urlParts.length - 1];
        const publicId = `${CLOUDINARY_FOLDERS.PROFILES}/${publicIdWithExtension.split('.')[0]}`;
        await uploadService.deleteFile(publicId);
      } catch (error) {
        console.error('Failed to delete old profile image:', error);
      }
    }

    res.json(successResponse('Profile image updated', { url: result.url }));
  },

  /**
   * Get User Notifications
   */
  getNotifications: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { skip, limit } = res.locals.pagination || { skip: 0, limit: 10 };
    const isRead = req.query.isRead === 'true' ? true : req.query.isRead === 'false' ? false : undefined;

    const result = await notificationService.getUserNotifications(userId, skip, limit, isRead);

    res.json({
      success: true,
      message: 'Notifications retrieved',
      data: result.notifications,
      pagination: result.pagination,
    });
  },

  /**
   * Get unread notification count
   */
  getUnreadNotificationCount: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const count = await notificationService.getUnreadCount(userId);
    
    res.json(successResponse('Unread count retrieved', { count }));
  },

  /**
   * Mark Notification as Read
   */
  markNotificationAsRead: async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const notificationId = req.params.id;

    await notificationService.markAsRead(notificationId, userId);
    
    res.json(successResponse('Notification marked as read'));
  },

  /**
   * Mark all notifications as read
   */
  markAllNotificationsAsRead: async (req: Request, res: Response) => {
    const userId = req.user!.id;

    await notificationService.markAllAsRead(userId);
    
    res.json(successResponse('All notifications marked as read'));
  },

  /**
   * Get active announcements for user's role
   */
  getAnnouncements: async (req: Request, res: Response) => {
    const role = req.user!.role;
    
    const targetRoles: TargetRole[] = [TargetRole.ALL];
    if (role === Role.STUDENT) targetRoles.push(TargetRole.STUDENT);
    if (role === Role.STAFF || role === Role.ADMIN) targetRoles.push(TargetRole.STAFF);

    const announcements = await prisma.announcement.findMany({
      where: {
        isActive: true,
        targetRole: { in: targetRoles }
      },
      orderBy: { createdAt: 'desc' },
      take: 5 // Get latest 5
    });

    res.json(successResponse('Announcements retrieved', announcements));
  }
};
