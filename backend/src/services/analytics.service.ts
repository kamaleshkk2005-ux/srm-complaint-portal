import prisma from '../config/database';
import { COMPLAINT_STATUSES } from '../utils/constants';

interface AnalyticsFilters {
  status?: string;
  priority?: string;
  departmentId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
}

function buildWhereClause(filters: AnalyticsFilters) {
  const where: any = {};
  if (filters.status) where.status = filters.status;
  if (filters.priority) where.priority = filters.priority;
  if (filters.departmentId) where.departmentId = filters.departmentId;
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {};
    if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
    if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
  }
  return where;
}

export const analyticsService = {
  /**
   * Get overall dashboard stats with optional filters
   */
  getDashboardStats: async (filters: AnalyticsFilters = {}) => {
    const where = buildWhereClause(filters);

    const total = await prisma.complaint.count({ where });

    const statusCountsRaw = await prisma.complaint.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    const statusMap = statusCountsRaw.reduce((acc, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {} as Record<string, number>);

    const priorityCountsRaw = await prisma.complaint.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true },
    });

    const priorityMap = priorityCountsRaw.reduce((acc, curr) => {
      acc[curr.priority] = curr._count.priority;
      return acc;
    }, {} as Record<string, number>);

    const resolvedWhere = { ...where, status: COMPLAINT_STATUSES.RESOLVED, resolvedAt: { not: null } };
    const resolvedComplaints = await prisma.complaint.findMany({
      where: resolvedWhere,
      select: { createdAt: true, resolvedAt: true },
    });

    let avgResolutionTime = 0;
    if (resolvedComplaints.length > 0) {
      const totalTime = resolvedComplaints.reduce((sum, complaint) => {
        const timeDiff = complaint.resolvedAt!.getTime() - complaint.createdAt.getTime();
        return sum + timeDiff;
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedComplaints.length / (1000 * 60 * 60 * 24));
    }

    return {
      total,
      submitted: statusMap[COMPLAINT_STATUSES.SUBMITTED] || 0,
      assigned: statusMap[COMPLAINT_STATUSES.ASSIGNED] || 0,
      inProgress: statusMap[COMPLAINT_STATUSES.IN_PROGRESS] || 0,
      waitingForStudent: statusMap[COMPLAINT_STATUSES.WAITING_FOR_STUDENT] || 0,
      resolved: statusMap[COMPLAINT_STATUSES.RESOLVED] || 0,
      rejected: statusMap[COMPLAINT_STATUSES.REJECTED] || 0,
      closed: statusMap[COMPLAINT_STATUSES.CLOSED] || 0,
      avgResolutionTime, // in days
      highPriority: priorityMap['HIGH'] || 0,
      mediumPriority: priorityMap['MEDIUM'] || 0,
      lowPriority: priorityMap['LOW'] || 0,
      urgentPriority: priorityMap['URGENT'] || 0,
    };
  },

  /**
   * Get complaints count by category with filters
   */
  getCategoryStats: async (filters: AnalyticsFilters = {}) => {
    const where = buildWhereClause(filters);
    const rawStats = await prisma.complaint.groupBy({
      by: ['categoryId'],
      where,
      _count: { categoryId: true },
    });

    const categories = await prisma.category.findMany();

    return rawStats.map(stat => {
      const category = categories.find(c => c.id === stat.categoryId);
      return {
        category: category?.name || 'Unknown',
        count: stat._count.categoryId,
      };
    }).sort((a, b) => b.count - a.count);
  },

  /**
   * Get complaints count by department with filters
   */
  getDepartmentStats: async (filters: AnalyticsFilters = {}) => {
    const where = buildWhereClause(filters);
    const rawStats = await prisma.complaint.groupBy({
      by: ['departmentId'],
      where,
      _count: { departmentId: true },
    });

    const departments = await prisma.department.findMany();

    return rawStats.map(stat => {
      const department = departments.find(d => d.id === stat.departmentId);
      return {
        department: department?.name || 'Unknown',
        code: department?.code || 'N/A',
        count: stat._count.departmentId,
      };
    }).sort((a, b) => b.count - a.count);
  },

  /**
   * Get complaints count by priority with filters
   */
  getPriorityStats: async (filters: AnalyticsFilters = {}) => {
    const where = buildWhereClause(filters);
    const rawStats = await prisma.complaint.groupBy({
      by: ['priority'],
      where,
      _count: { priority: true },
    });

    return rawStats.map(stat => ({
      priority: stat.priority,
      count: stat._count.priority,
    }));
  },

  /**
   * Get status distribution with filters
   */
  getStatusStats: async (filters: AnalyticsFilters = {}) => {
    const where = buildWhereClause(filters);
    const rawStats = await prisma.complaint.groupBy({
      by: ['status'],
      where,
      _count: { status: true },
    });

    return rawStats.map(stat => ({
      status: stat.status,
      count: stat._count.status,
    }));
  },

  /**
   * Get monthly trend for the last 12 months with filters
   */
  getMonthlyTrend: async (filters: AnalyticsFilters = {}) => {
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const baseWhere = buildWhereClause(filters);
    
    const [complaints, resolvedComplaints] = await Promise.all([
      prisma.complaint.findMany({
        where: { ...baseWhere, createdAt: { gte: twelveMonthsAgo } },
        select: { createdAt: true },
      }),
      prisma.complaint.findMany({
        where: { ...baseWhere, status: COMPLAINT_STATUSES.RESOLVED, resolvedAt: { gte: twelveMonthsAgo } },
        select: { resolvedAt: true },
      }),
    ]);

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const trendMap = new Map<string, { registered: number; resolved: number }>();

    for (let i = 0; i < 12; i++) {
      const d = new Date();
      d.setMonth(d.getMonth() - (11 - i));
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      trendMap.set(key, { registered: 0, resolved: 0 });
    }

    complaints.forEach(c => {
      const key = `${monthNames[c.createdAt.getMonth()]} ${c.createdAt.getFullYear()}`;
      if (trendMap.has(key)) {
        trendMap.get(key)!.registered += 1;
      }
    });

    resolvedComplaints.forEach(c => {
      if (!c.resolvedAt) return;
      const key = `${monthNames[c.resolvedAt.getMonth()]} ${c.resolvedAt.getFullYear()}`;
      if (trendMap.has(key)) {
        trendMap.get(key)!.resolved += 1;
      }
    });

    return Array.from(trendMap.entries()).map(([month, data]) => ({ month, ...data }));
  },

  /**
   * Get staff performance stats with filters
   */
  getStaffPerformance: async (filters: AnalyticsFilters = {}) => {
    const baseWhere = buildWhereClause(filters);
    const rawStats = await prisma.complaint.groupBy({
      by: ['assignedStaffId'],
      where: { ...baseWhere, assignedStaffId: { not: null } },
      _count: { assignedStaffId: true },
    });

    const staffIds = rawStats.map(s => s.assignedStaffId).filter(Boolean) as string[];
    const staffs = await prisma.staff.findMany({
      where: { id: { in: staffIds } },
      select: { id: true, fullName: true },
    });

    const resolvedStats = await prisma.complaint.groupBy({
      by: ['assignedStaffId'],
      where: {
        ...baseWhere,
        assignedStaffId: { in: staffIds },
        status: COMPLAINT_STATUSES.RESOLVED,
      },
      _count: { assignedStaffId: true },
    });

    // Avg resolution time per staff
    const resolvedWithTime = await prisma.complaint.findMany({
      where: {
        assignedStaffId: { in: staffIds },
        status: COMPLAINT_STATUSES.RESOLVED,
        resolvedAt: { not: null },
      },
      select: { assignedStaffId: true, createdAt: true, resolvedAt: true },
    });

    const avgTimeMap: Record<string, number> = {};
    const timeCountMap: Record<string, number> = {};
    resolvedWithTime.forEach(c => {
      if (!c.resolvedAt || !c.assignedStaffId) return;
      const days = (c.resolvedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      avgTimeMap[c.assignedStaffId] = (avgTimeMap[c.assignedStaffId] || 0) + days;
      timeCountMap[c.assignedStaffId] = (timeCountMap[c.assignedStaffId] || 0) + 1;
    });

    return rawStats
      .sort((a, b) => b._count.assignedStaffId - a._count.assignedStaffId)
      .slice(0, 10)
      .map(stat => {
        const staff = staffs.find(s => s.id === stat.assignedStaffId);
        const resolved = resolvedStats.find(r => r.assignedStaffId === stat.assignedStaffId);
        const totalTime = avgTimeMap[stat.assignedStaffId!] || 0;
        const totalCount = timeCountMap[stat.assignedStaffId!] || 0;

        return {
          staffName: staff?.fullName || 'Unknown',
          assigned: stat._count.assignedStaffId,
          resolved: resolved?._count.assignedStaffId || 0,
          avgTime: totalCount > 0 ? Math.round(totalTime / totalCount) : 0,
        };
      });
  },

  /**
   * Get all charts data at once with filters
   */
  getAllChartsData: async (filters: AnalyticsFilters = {}) => {
    const [summary, categories, departments, priorities, statusDist, trend, staffPerformance] = await Promise.all([
      analyticsService.getDashboardStats(filters),
      analyticsService.getCategoryStats(filters),
      analyticsService.getDepartmentStats(filters),
      analyticsService.getPriorityStats(filters),
      analyticsService.getStatusStats(filters),
      analyticsService.getMonthlyTrend(filters),
      analyticsService.getStaffPerformance(filters),
    ]);

    return { summary, categories, departments, priorities, statusDist, trend, staffPerformance };
  },
};
