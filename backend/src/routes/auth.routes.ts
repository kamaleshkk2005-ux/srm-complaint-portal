import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { authLimiter, generalLimiter } from '../middleware/rateLimiter.middleware';
import { auditLog } from '../middleware/audit.middleware';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from '../utils/validators';

const router = Router();

/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new student
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  auditLog('User'),
  authController.register
);

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login user (Student/Staff/Admin)
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  auditLog('UserSession'),
  authController.login
);

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Logout user and invalidate refresh token
 */
router.post(
  '/logout',
  authenticate,
  auditLog('UserSession'),
  authController.logout
);

/**
 * @openapi
 * /api/auth/refresh-token:
 *   post:
 *     tags: [Auth]
 *     summary: Get a new access token using a refresh token
 */
router.post(
  '/refresh-token',
  generalLimiter,
  authController.refreshToken
);

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [Auth]
 *     summary: Request a password reset link
 */
router.post(
  '/forgot-password',
  authLimiter,
  validate(forgotPasswordSchema),
  auditLog('PasswordReset'),
  authController.forgotPassword
);

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [Auth]
 *     summary: Reset password using the token
 */
router.post(
  '/reset-password',
  authLimiter,
  validate(resetPasswordSchema),
  auditLog('User'),
  authController.resetPassword
);

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change password for logged in user
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/change-password',
  authenticate,
  authLimiter,
  validate(changePasswordSchema),
  auditLog('User'),
  authController.changePassword
);

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Get current authenticated user details
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/me',
  authenticate,
  authController.getCurrentUser
);

export default router;
