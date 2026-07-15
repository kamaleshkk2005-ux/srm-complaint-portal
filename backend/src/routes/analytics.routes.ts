import { Router } from 'express';
import { analyticsController } from '../controllers/analytics.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isStaff, isAdmin } from '../middleware/role.middleware';

const router = Router();
router.use(authenticate);

// Staff and Admin can view dashboard stats
router.get('/dashboard', isStaff, analyticsController.getDashboardStats);

// Admin Only
router.get('/charts', isAdmin, analyticsController.getChartsData);

// New: Full reports dashboard with all charts + filters
router.get('/reports/dashboard', isAdmin, analyticsController.getReportsDashboard);

// Export endpoints
router.get('/reports/csv', isAdmin, analyticsController.generateReportCSV);
router.get('/reports/excel', isAdmin, analyticsController.generateReportExcel);

// Legacy export routes (kept for backward compatibility)
router.get('/report/csv', isAdmin, analyticsController.generateReportCSV);
router.get('/report/excel', isAdmin, analyticsController.generateReportExcel);

export default router;
