import { Request, Response, NextFunction } from 'express';
import { analyticsService } from '../services/analytics.service';
import { reportService } from '../services/report.service';
import { successResponse } from '../utils/helpers';
import fs from 'fs';

export const analyticsController = {
  getDashboardStats: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stats = await analyticsService.getDashboardStats();
      res.json(successResponse('Dashboard stats retrieved', stats));
    } catch (e) { next(e); }
  },

  getChartsData: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const [categories, departments, priorities, trend, staffPerformance] = await Promise.all([
        analyticsService.getCategoryStats(),
        analyticsService.getDepartmentStats(),
        analyticsService.getPriorityStats(),
        analyticsService.getMonthlyTrend(),
        analyticsService.getStaffPerformance(),
      ]);
      res.json(successResponse('Charts data retrieved', { categories, departments, priorities, trend, staffPerformance }));
    } catch (e) { next(e); }
  },

  /**
   * New: Get all analytics + charts with filters in one request
   */
  getReportsDashboard: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = {
        status: req.query.status as string,
        priority: req.query.priority as string,
        departmentId: req.query.departmentId as string,
        categoryId: req.query.categoryId as string,
        dateFrom: req.query.dateFrom as string,
        dateTo: req.query.dateTo as string,
      };
      const data = await analyticsService.getAllChartsData(filters);
      res.json(successResponse('Reports dashboard data retrieved', data));
    } catch (e) { next(e); }
  },

  generateReportCSV: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = req.query as any;
      const filePath = await reportService.generateCSV(filters);
      res.download(filePath, 'complaints_report.csv', (err) => {
        if (err) console.error('Error downloading CSV:', err);
        fs.unlink(filePath, (e) => { if (e) console.error('Error deleting temp CSV:', e); });
      });
    } catch (e) { next(e); }
  },

  generateReportExcel: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const filters = req.query as any;
      const filePath = await reportService.generateExcel(filters);
      res.download(filePath, 'complaints_report.xlsx', (err) => {
        if (err) console.error('Error downloading Excel:', err);
        fs.unlink(filePath, (e) => { if (e) console.error('Error deleting temp Excel:', e); });
      });
    } catch (e) { next(e); }
  },
};
