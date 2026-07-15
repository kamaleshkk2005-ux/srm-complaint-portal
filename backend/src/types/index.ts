import { Request } from 'express';

// ─── Express augmentation ─────────────────────────────────────
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

// ─── JWT ─────────────────────────────────────────────────────
export interface JwtPayload {
  id: string;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

// ─── API Response ─────────────────────────────────────────────
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: ValidationError[];
}

export interface ValidationError {
  field: string;
  message: string;
}

// ─── Pagination ───────────────────────────────────────────────
export interface PaginationQuery {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  success: boolean;
  message: string;
  data: T[];
  pagination: PaginationMeta;
}

// ─── Complaint Filters ────────────────────────────────────────
export interface ComplaintFilters {
  status?: string;
  categoryId?: string;
  departmentId?: string;
  priority?: string;
  assignedStaffId?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// ─── Upload ──────────────────────────────────────────────────
export interface UploadResult {
  url: string;
  publicId: string;
  fileType: string;
  fileSize: number;
  originalName: string;
}

// ─── Analytics ───────────────────────────────────────────────
export interface DashboardStats {
  total: number;
  submitted: number;
  assigned: number;
  inProgress: number;
  waitingForStudent: number;
  resolved: number;
  rejected: number;
  closed: number;
  avgResolutionTime: number;
}

export interface MonthlyTrend {
  month: string;
  count: number;
}

export interface CategoryStat {
  category: string;
  count: number;
}

export interface DepartmentStat {
  department: string;
  count: number;
}

export interface PriorityStat {
  priority: string;
  count: number;
}

export interface StaffPerformance {
  staffName: string;
  assigned: number;
  resolved: number;
  avgTime: number;
}

export interface ResolutionRate {
  rate: number;
  resolved: number;
  total: number;
}

// ─── Notification ─────────────────────────────────────────────
export interface NotificationPayload {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  relatedId?: string;
  relatedType?: string;
  createdAt: Date;
}

// ─── Socket ──────────────────────────────────────────────────
export interface AuthenticatedSocket {
  userId: string;
  email: string;
  role: string;
}

// ─── Report Filters ───────────────────────────────────────────
export interface ReportFilters {
  dateFrom?: string;
  dateTo?: string;
  departmentId?: string;
  categoryId?: string;
  status?: string;
  priority?: string;
}
