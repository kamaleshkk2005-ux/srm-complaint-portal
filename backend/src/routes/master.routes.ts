import { Router } from 'express';
import { masterController } from '../controllers/master.controller';
import { validate } from '../middleware/validate.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { auditLog } from '../middleware/audit.middleware';
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../utils/validators';

const router = Router();

// ─── Public/Open Routes ──────────────────────────────────────
router.get('/departments', masterController.getDepartments);
router.get('/categories', masterController.getCategories);

// ─── Admin Only Routes ───────────────────────────────────────
router.use(authenticate, isAdmin);

// Departments
router.post(
  '/departments',
  validate(createDepartmentSchema),
  auditLog('Department'),
  masterController.createDepartment
);
router.put(
  '/departments/:id',
  validate(updateDepartmentSchema),
  auditLog('Department'),
  masterController.updateDepartment
);
router.delete('/departments/:id', auditLog('Department'), masterController.deleteDepartment);
router.patch('/departments/:id/toggle-status', auditLog('Department'), masterController.toggleDepartmentStatus);

// Categories
router.post(
  '/categories',
  validate(createCategorySchema),
  auditLog('Category'),
  masterController.createCategory
);
router.put(
  '/categories/:id',
  validate(updateCategorySchema),
  auditLog('Category'),
  masterController.updateCategory
);
router.delete('/categories/:id', auditLog('Category'), masterController.deleteCategory);
router.patch('/categories/:id/toggle-status', auditLog('Category'), masterController.toggleCategoryStatus);

export default router;
