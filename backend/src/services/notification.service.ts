import prisma from '../config/database';
import { emitNotification, emitToRole } from '../socket/notification.socket';
import { getPaginationMeta } from '../utils/helpers';
import logger from '../config/logger';
import { TargetRole } from '../types/enums';

export const notificationService = {
  /**
   * Create a notification in DB and emit via socket
   */
  createNotification: async (
    userId: string,
    title: string,
    message: string,
    type: string,
    relatedId?: string,
    relatedType?: string
  ) => {
    try {
      const notification = await prisma.notification.create({
        data: {
          userId,
          title,
          message,
          type,
          relatedId,
          relatedType,
        },
      });

      // Emit real-time notification
      emitNotification(userId, notification);

      return notification;
    } catch (error) {
      logger.error('Error creating notification:', error);
      throw error;
    }
  },

  /**
   * Broadcast notification to all users of a specific role
   */
  broadcastNotification: async (
    targetRole: TargetRole,
    title: string,
    message: string,
    type: string,
    relatedId?: string,
    relatedType?: string
  ) => {
    try {
      // Create DB records (this could be optimized for very large user bases)
      let usersToNotify = [];
      
      if (targetRole === TargetRole.ALL) {
        usersToNotify = await prisma.user.findMany({
          where: { isActive: true },
          select: { id: true }
        });
      } else {
        // Map TargetRole enum to Role enum
        const role = targetRole === TargetRole.STUDENT ? 'STUDENT' : 'STAFF';
        usersToNotify = await prisma.user.findMany({
          where: { role, isActive: true },
          select: { id: true }
        });
      }

      if (usersToNotify.length === 0) return 0;

      // Create notifications in bulk
      const notificationData = usersToNotify.map((user) => ({
        userId: user.id,
        title,
        message,
        type,
        relatedId,
        relatedType,
      }));

      await prisma.notification.createMany({
        data: notificationData,
      });

      // Emit via socket to role room
      const payload = {
        title,
        message,
        type,
        relatedId,
        relatedType,
        createdAt: new Date(),
        isRead: false
      };
      
      emitToRole(targetRole, payload);

      return usersToNotify.length;
    } catch (error) {
      logger.error('Error broadcasting notification:', error);
      throw error;
    }
  },

  /**
   * Get paginated notifications for a user
   */
  getUserNotifications: async (userId: string, skip: number, limit: number, isRead?: boolean) => {
    const where = {
      userId,
      ...(isRead !== undefined ? { isRead } : {}),
    };

    const [total, notifications] = await Promise.all([
      prisma.notification.count({ where }),
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    const page = Math.floor(skip / limit) + 1;

    return {
      notifications,
      pagination: getPaginationMeta(total, page, limit),
    };
  },

  /**
   * Get unread notification count
   */
  getUnreadCount: async (userId: string) => {
    return prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  },

  /**
   * Mark a single notification as read
   */
  markAsRead: async (notificationId: string, userId: string) => {
    return prisma.notification.updateMany({
      where: {
        id: notificationId,
        userId, // Ensure they own it
      },
      data: {
        isRead: true,
      },
    });
  },

  /**
   * Mark all notifications as read for a user
   */
  markAllAsRead: async (userId: string) => {
    return prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
      },
    });
  },
};
