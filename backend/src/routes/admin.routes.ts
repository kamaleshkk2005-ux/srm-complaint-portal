import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { validate, validatePagination } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { auditLog } from '../middleware/audit.middleware';
import {
  createStudentSchema,
  updateStudentSchema,
  createStaffSchema,
  updateStaffSchema,
  createAnnouncementSchema,
  updateAnnouncementSchema,
  updateSettingSchema,
} from '../utils/validators';

const router = Router();

// All admin routes require authentication and ADMIN role
router.use(authenticate, isAdmin);

// ─── User Management (Students) ──────────────────────────────
router.get('/students', validatePagination, adminController.getStudents);
router.get('/students/:id', adminController.getStudentById);
router.post(
  '/students',
  validate(createStudentSchema),
  auditLog('Student'),
  adminController.createStudent
);
router.put(
  '/students/:id',
  validate(updateStudentSchema),
  auditLog('Student'),
  adminController.updateStudent
);
router.delete('/students/:id', auditLog('User'), adminController.deleteUser);
router.patch('/users/:id/toggle-status', auditLog('User'), adminController.toggleUserStatus);

// ─── User Management (Staff) ─────────────────────────────────
router.get('/staff', validatePagination, adminController.getStaffs);
router.get('/staff/:id', adminController.getStaffById);
router.post(
  '/staff',
  validate(createStaffSchema),
  auditLog('Staff'),
  adminController.createStaff
);
router.put(
  '/staff/:id',
  validate(updateStaffSchema),
  auditLog('Staff'),
  adminController.updateStaff
);
router.delete('/staff/:id', auditLog('User'), adminController.deleteUser);

// ─── Announcements ───────────────────────────────────────────
router.get('/announcements', validatePagination, adminController.getAnnouncements);
router.post(
  '/announcements',
  validate(createAnnouncementSchema),
  auditLog('Announcement'),
  adminController.createAnnouncement
);
router.put(
  '/announcements/:id',
  validate(updateAnnouncementSchema),
  auditLog('Announcement'),
  adminController.updateAnnouncement
);
router.delete('/announcements/:id', auditLog('Announcement'), adminController.deleteAnnouncement);

// ─── Settings ────────────────────────────────────────────────
router.get('/settings', adminController.getSettings);
router.put(
  '/settings/:key',
  validate(updateSettingSchema),
  auditLog('Settings'),
  adminController.updateSetting
);

// ─── Audit Logs ──────────────────────────────────────────────
router.get('/audit-logs', validatePagination, adminController.getAuditLogs);

export default router;
