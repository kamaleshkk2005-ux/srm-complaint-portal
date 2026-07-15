import { Router } from 'express';
import { complaintController } from '../controllers/complaint.controller';
import { validate, validatePagination } from '../middleware/validate.middleware';
import { authenticate, optionalAuthenticate } from '../middleware/auth.middleware';
import { isStudent, isStaff, authorize } from '../middleware/role.middleware';
import { uploadAttachments, uploadLimiter } from '../middleware/upload.middleware';
import { auditLog } from '../middleware/audit.middleware';
import {
  createComplaintSchema,
  updateComplaintSchema,
  updateStatusSchema,
  assignComplaintSchema,
  sendMessageSchema,
} from '../utils/validators';

const router = Router();

// ─── Public/Optional Routes ──────────────────────────────────
/**
 * @openapi
 * /api/complaints/public/{complaintId}:
 *   get:
 *     tags: [Complaints]
 *     summary: Get basic complaint status for public tracking
 */
router.get(
  '/public/:complaintId',
  optionalAuthenticate,
  complaintController.getPublicComplaint
);

// ─── Authenticated Routes ────────────────────────────────────
router.use(authenticate);

/**
 * @openapi
 * /api/complaints:
 *   get:
 *     tags: [Complaints]
 *     summary: Get paginated complaints based on user role and filters
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  validatePagination,
  complaintController.getComplaints
);

/**
 * @openapi
 * /api/complaints/{id}:
 *   get:
 *     tags: [Complaints]
 *     summary: Get specific complaint details by internal ID
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id',
  complaintController.getComplaintById
);

/**
 * @openapi
 * /api/complaints/{id}/messages:
 *   get:
 *     tags: [Complaints]
 *     summary: Get chat messages for a complaint
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/:id/messages',
  complaintController.getComplaintMessages
);

/**
 * @openapi
 * /api/complaints/{id}/messages:
 *   post:
 *     tags: [Complaints]
 *     summary: Send a message in a complaint thread
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/:id/messages',
  validate(sendMessageSchema),
  complaintController.sendMessage
);

// ─── Student Only Routes ─────────────────────────────────────
/**
 * @openapi
 * /api/complaints:
 *   post:
 *     tags: [Complaints]
 *     summary: Submit a new complaint
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  isStudent,
  uploadLimiter,
  uploadAttachments, // multipart/form-data
  validate(createComplaintSchema),
  auditLog('Complaint'),
  complaintController.createComplaint
);

/**
 * @openapi
 * /api/complaints/{id}:
 *   put:
 *     tags: [Complaints]
 *     summary: Update a complaint (only if SUBMITTED)
 *     security:
 *       - bearerAuth: []
 */
router.put(
  '/:id',
  isStudent,
  validate(updateComplaintSchema),
  auditLog('Complaint'),
  complaintController.updateComplaint
);

/**
 * @openapi
 * /api/complaints/{id}:
 *   delete:
 *     tags: [Complaints]
 *     summary: Delete a complaint (only if SUBMITTED)
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  isStudent,
  auditLog('Complaint'),
  complaintController.deleteComplaint
);

// ─── Staff & Admin Routes ────────────────────────────────────
/**
 * @openapi
 * /api/complaints/{id}/status:
 *   patch:
 *     tags: [Complaints]
 *     summary: Update complaint status
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/status',
  isStaff,
  validate(updateStatusSchema),
  auditLog('Complaint'),
  complaintController.updateStatus
);

// ─── Admin Only Routes ───────────────────────────────────────
/**
 * @openapi
 * /api/complaints/{id}/assign:
 *   patch:
 *     tags: [Complaints]
 *     summary: Assign a complaint to a staff member
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/assign',
  authorize('ADMIN'),
  validate(assignComplaintSchema),
  auditLog('Complaint'),
  complaintController.assignComplaint
);

export default router;
