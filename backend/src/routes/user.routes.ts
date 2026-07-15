import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { uploadProfileImage } from '../middleware/upload.middleware';
import { uploadLimiter } from '../middleware/rateLimiter.middleware';
import { auditLog } from '../middleware/audit.middleware';
import { updateProfileSchema } from '../utils/validators';

const router = Router();

// All user routes require authentication
router.use(authenticate);

/**
 * @openapi
 * /api/users/profile:
 *   put:
 *     tags: [Users]
 *     summary: Update user profile
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/profile',
  validate(updateProfileSchema),
  auditLog('User'),
  userController.updateProfile
);

/**
 * @openapi
 * /api/users/profile/image:
 *   post:
 *     tags: [Users]
 *     summary: Upload profile image
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/profile/image',
  uploadLimiter,
  uploadProfileImage,
  auditLog('User'),
  userController.uploadProfileImage
);

/**
 * @openapi
 * /api/users/notifications:
 *   get:
 *     tags: [Users]
 *     summary: Get user notifications
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/notifications',
  userController.getNotifications
);

/**
 * @openapi
 * /api/users/notifications/unread-count:
 *   get:
 *     tags: [Users]
 *     summary: Get unread notifications count
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/notifications/unread-count',
  userController.getUnreadNotificationCount
);

/**
 * @openapi
 * /api/users/notifications/{id}/read:
 *   patch:
 *     tags: [Users]
 *     summary: Mark a notification as read
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/notifications/:id/read',
  userController.markNotificationAsRead
);

/**
 * @openapi
 * /api/users/notifications/read-all:
 *   patch:
 *     tags: [Users]
 *     summary: Mark all notifications as read
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/notifications/read-all',
  userController.markAllNotificationsAsRead
);

/**
 * @openapi
 * /api/users/announcements:
 *   get:
 *     tags: [Users]
 *     summary: Get announcements targeted to the user's role
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/announcements',
  userController.getAnnouncements
);

export default router;
