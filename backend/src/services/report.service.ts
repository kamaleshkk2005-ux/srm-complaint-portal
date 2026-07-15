import prisma from '../config/database';
import { createObjectCsvWriter } from 'csv-writer';
import ExcelJS from 'exceljs';
import path from 'path';
import fs from 'fs';
import { formatDate, getStatusLabel } from '../utils/helpers';

export interface ReportFilters {
  status?: string;
  priority?: string;
  departmentId?: string;
  categoryId?: string;
  dateFrom?: string;
  dateTo?: string;
  [key: string]: string | undefined;
}

export const reportService = {
  getReportData: async (filters: ReportFilters) => {
    const where: any = {};
    if (filters.dateFrom || filters.dateTo) {
      where.createdAt = {};
      if (filters.dateFrom) where.createdAt.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.createdAt.lte = new Date(filters.dateTo);
    }
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.categoryId) where.categoryId = filters.categoryId;
    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;

    return prisma.complaint.findMany({
      where,
      include: {
        student: { select: { fullName: true, registerNumber: true, academicYear: true } },
        assignedStaff: { select: { fullName: true, employeeId: true } },
        department: { select: { name: true, code: true } },
        category: { select: { name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  generateCSV: async (filters: ReportFilters): Promise<string> => {
    const data = await reportService.getReportData(filters);
    const dir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `report_${Date.now()}.csv`);

    const csvWriter = createObjectCsvWriter({
      path: filePath,
      header: [
        { id: 'complaintId', title: 'Complaint ID' },
        { id: 'title', title: 'Title' },
        { id: 'description', title: 'Description' },
        { id: 'studentName', title: 'Student Name' },
        { id: 'registerNumber', title: 'Student ID' },
        { id: 'academicYear', title: 'Academic Year' },
        { id: 'department', title: 'Department' },
        { id: 'category', title: 'Category' },
        { id: 'priority', title: 'Priority' },
        { id: 'status', title: 'Status' },
        { id: 'assignedTo', title: 'Assigned Staff' },
        { id: 'createdDate', title: 'Created Date' },
        { id: 'resolvedDate', title: 'Resolved Date' },
        { id: 'resolutionTime', title: 'Resolution Time (Days)' },
      ],
    });

    const records = data.map(c => {
      const resolutionDays = c.resolvedAt
        ? Math.round((c.resolvedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      return {
        complaintId: c.complaintId,
        title: `"${c.title.replace(/"/g, '""')}"`,
        description: `"${c.description.replace(/"/g, '""')}"`,
        studentName: c.student.fullName,
        registerNumber: c.student.registerNumber,
        academicYear: c.student.academicYear,
        department: c.department.name,
        category: c.category.name,
        priority: c.priority,
        status: getStatusLabel(c.status),
        assignedTo: c.assignedStaff?.fullName || 'Unassigned',
        createdDate: formatDate(c.createdAt),
        resolvedDate: c.resolvedAt ? formatDate(c.resolvedAt) : 'N/A',
        resolutionTime: resolutionDays !== null ? String(resolutionDays) : 'N/A',
      };
    });

    await csvWriter.writeRecords(records);
    return filePath;
  },

  generateExcel: async (filters: ReportFilters): Promise<string> => {
    const data = await reportService.getReportData(filters);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'College Complaint System';
    workbook.created = new Date();

    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FF4F46E5' } },
      alignment: { horizontal: 'center' as const },
      border: {
        top: { style: 'thin' as const }, left: { style: 'thin' as const },
        bottom: { style: 'thin' as const }, right: { style: 'thin' as const },
      },
    };

    // ── Sheet 1: Complaint Details ──────────────────────────
    const ws1 = workbook.addWorksheet('Complaint Details');
    ws1.columns = [
      { header: 'Complaint ID', key: 'complaintId', width: 18 },
      { header: 'Title', key: 'title', width: 40 },
      { header: 'Description', key: 'description', width: 50 },
      { header: 'Student Name', key: 'studentName', width: 22 },
      { header: 'Student ID', key: 'registerNumber', width: 15 },
      { header: 'Academic Year', key: 'academicYear', width: 14 },
      { header: 'Department', key: 'department', width: 28 },
      { header: 'Category', key: 'category', width: 18 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Status', key: 'status', width: 18 },
      { header: 'Assigned Staff', key: 'assignedTo', width: 22 },
      { header: 'Created Date', key: 'createdDate', width: 14 },
      { header: 'Resolved Date', key: 'resolvedDate', width: 14 },
      { header: 'Resolution Time (Days)', key: 'resolutionTime', width: 22 },
    ];

    ws1.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));

    data.forEach((c, idx) => {
      const resolutionDays = c.resolvedAt
        ? Math.round((c.resolvedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : null;
      const row = ws1.addRow({
        complaintId: c.complaintId,
        title: c.title,
        description: c.description,
        studentName: c.student.fullName,
        registerNumber: c.student.registerNumber,
        academicYear: c.student.academicYear,
        department: c.department.name,
        category: c.category.name,
        priority: c.priority,
        status: getStatusLabel(c.status),
        assignedTo: c.assignedStaff?.fullName || 'Unassigned',
        createdDate: formatDate(c.createdAt),
        resolvedDate: c.resolvedAt ? formatDate(c.resolvedAt) : 'N/A',
        resolutionTime: resolutionDays !== null ? resolutionDays : 'N/A',
      });
      row.fill = {
        type: 'pattern', pattern: 'solid',
        fgColor: { argb: idx % 2 === 0 ? 'FFF8F9FF' : 'FFFFFFFF' },
      };
    });

    ws1.autoFilter = { from: 'A1', to: 'N1' };

    // ── Sheet 2: Department Summary ──────────────────────────
    const ws2 = workbook.addWorksheet('Department Summary');
    ws2.columns = [
      { header: 'Department', key: 'department', width: 30 },
      { header: 'Total Complaints', key: 'total', width: 18 },
      { header: 'Resolved', key: 'resolved', width: 14 },
      { header: 'Pending', key: 'pending', width: 14 },
      { header: 'Resolution Rate (%)', key: 'rate', width: 20 },
    ];
    ws2.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));

    const deptMap: Record<string, { total: number; resolved: number }> = {};
    data.forEach(c => {
      const dept = c.department.name;
      if (!deptMap[dept]) deptMap[dept] = { total: 0, resolved: 0 };
      deptMap[dept].total++;
      if (c.status === 'RESOLVED') deptMap[dept].resolved++;
    });
    Object.entries(deptMap).forEach(([dept, stats], idx) => {
      const row = ws2.addRow({
        department: dept,
        total: stats.total,
        resolved: stats.resolved,
        pending: stats.total - stats.resolved,
        rate: stats.total > 0 ? `${Math.round((stats.resolved / stats.total) * 100)}%` : '0%',
      });
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFF8F9FF' : 'FFFFFFFF' } };
    });

    // ── Sheet 3: Category Summary ──────────────────────────
    const ws3 = workbook.addWorksheet('Category Summary');
    ws3.columns = [
      { header: 'Category', key: 'category', width: 25 },
      { header: 'Total Complaints', key: 'total', width: 18 },
      { header: 'Resolved', key: 'resolved', width: 14 },
      { header: 'High Priority', key: 'high', width: 14 },
    ];
    ws3.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));

    const catMap: Record<string, { total: number; resolved: number; high: number }> = {};
    data.forEach(c => {
      const cat = c.category.name;
      if (!catMap[cat]) catMap[cat] = { total: 0, resolved: 0, high: 0 };
      catMap[cat].total++;
      if (c.status === 'RESOLVED') catMap[cat].resolved++;
      if (c.priority === 'HIGH' || c.priority === 'URGENT') catMap[cat].high++;
    });
    Object.entries(catMap).forEach(([cat, stats], idx) => {
      const row = ws3.addRow({ category: cat, total: stats.total, resolved: stats.resolved, high: stats.high });
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFF8F9FF' : 'FFFFFFFF' } };
    });

    // ── Sheet 4: Monthly Trends ──────────────────────────
    const ws4 = workbook.addWorksheet('Monthly Trends');
    ws4.columns = [
      { header: 'Month', key: 'month', width: 15 },
      { header: 'Complaints Registered', key: 'registered', width: 22 },
      { header: 'Complaints Resolved', key: 'resolved', width: 22 },
    ];
    ws4.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthMap = new Map<string, { registered: number; resolved: number }>();
    for (let i = 0; i < 12; i++) {
      const d = new Date(); d.setMonth(d.getMonth() - (11 - i));
      const key = `${monthNames[d.getMonth()]} ${d.getFullYear()}`;
      monthMap.set(key, { registered: 0, resolved: 0 });
    }
    data.forEach(c => {
      const key = `${monthNames[c.createdAt.getMonth()]} ${c.createdAt.getFullYear()}`;
      if (monthMap.has(key)) monthMap.get(key)!.registered++;
      if (c.resolvedAt) {
        const rKey = `${monthNames[c.resolvedAt.getMonth()]} ${c.resolvedAt.getFullYear()}`;
        if (monthMap.has(rKey)) monthMap.get(rKey)!.resolved++;
      }
    });
    [...monthMap.entries()].forEach(([month, stats], idx) => {
      const row = ws4.addRow({ month, registered: stats.registered, resolved: stats.resolved });
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFF8F9FF' : 'FFFFFFFF' } };
    });

    // ── Sheet 5: Priority Statistics ──────────────────────────
    const ws5 = workbook.addWorksheet('Priority Statistics');
    ws5.columns = [
      { header: 'Priority', key: 'priority', width: 15 },
      { header: 'Count', key: 'count', width: 12 },
      { header: 'Percentage', key: 'percentage', width: 15 },
    ];
    ws5.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));

    const prioMap: Record<string, number> = {};
    data.forEach(c => { prioMap[c.priority] = (prioMap[c.priority] || 0) + 1; });
    Object.entries(prioMap).forEach(([prio, count], idx) => {
      const row = ws5.addRow({ priority: prio, count, percentage: `${Math.round((count / data.length) * 100)}%` });
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFF8F9FF' : 'FFFFFFFF' } };
    });

    // ── Sheet 6: Staff Performance ──────────────────────────
    const ws6 = workbook.addWorksheet('Staff Performance');
    ws6.columns = [
      { header: 'Staff Name', key: 'staffName', width: 25 },
      { header: 'Assigned', key: 'assigned', width: 14 },
      { header: 'Resolved', key: 'resolved', width: 14 },
      { header: 'Avg Resolution Time (Days)', key: 'avgTime', width: 28 },
      { header: 'Resolution Rate (%)', key: 'rate', width: 22 },
    ];
    ws6.getRow(1).eachCell(cell => Object.assign(cell, headerStyle));

    const staffMap: Record<string, { assigned: number; resolved: number; totalDays: number; count: number }> = {};
    data.forEach(c => {
      if (!c.assignedStaff) return;
      const name = c.assignedStaff.fullName;
      if (!staffMap[name]) staffMap[name] = { assigned: 0, resolved: 0, totalDays: 0, count: 0 };
      staffMap[name].assigned++;
      if (c.status === 'RESOLVED' && c.resolvedAt) {
        staffMap[name].resolved++;
        staffMap[name].totalDays += (c.resolvedAt.getTime() - c.createdAt.getTime()) / (1000 * 60 * 60 * 24);
        staffMap[name].count++;
      }
    });
    Object.entries(staffMap).forEach(([name, stats], idx) => {
      const row = ws6.addRow({
        staffName: name,
        assigned: stats.assigned,
        resolved: stats.resolved,
        avgTime: stats.count > 0 ? Math.round(stats.totalDays / stats.count) : 'N/A',
        rate: stats.assigned > 0 ? `${Math.round((stats.resolved / stats.assigned) * 100)}%` : '0%',
      });
      row.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: idx % 2 === 0 ? 'FFF8F9FF' : 'FFFFFFFF' } };
    });

    const dir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    const filePath = path.join(dir, `report_${Date.now()}.xlsx`);
    await workbook.xlsx.writeFile(filePath);
    return filePath;
  },
};
