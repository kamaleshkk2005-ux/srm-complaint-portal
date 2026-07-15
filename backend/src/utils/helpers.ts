import crypto from 'crypto';
import { PaginationMeta } from '../types';

/**
 * Generate unique complaint ID in format COMP-YYYY-XXXXX
 */
export const generateComplaintId = (): string => {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `COMP-${year}-${random}`;
};

/**
 * Generate employee ID
 */
export const generateEmployeeId = (): string => {
  const random = Math.floor(10000 + Math.random() * 90000);
  return `EMP-${random}`;
};

/**
 * Calculate pagination metadata
 */
export const getPaginationMeta = (
  total: number,
  page: number,
  limit: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);
  return {
    total,
    page,
    limit,
    totalPages,
    hasNextPage: page < totalPages,
    hasPreviousPage: page > 1,
  };
};

/**
 * Parse and validate pagination query params
 */
export const parsePagination = (query: {
  page?: string | number;
  limit?: string | number;
}): { page: number; limit: number; skip: number } => {
  const page = Math.max(1, parseInt(String(query.page || '1'), 10));
  const limit = Math.min(100, Math.max(1, parseInt(String(query.limit || '10'), 10)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Format date to readable string
 */
export const formatDate = (date: Date | null | undefined): string => {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

/**
 * Calculate resolution time in hours
 */
export const calculateResolutionTime = (
  createdAt: Date,
  resolvedAt: Date | null
): number => {
  if (!resolvedAt) return 0;
  const diffMs = resolvedAt.getTime() - createdAt.getTime();
  return Math.round(diffMs / (1000 * 60 * 60));
};

/**
 * Generate password reset token (plain + hashed pair)
 */
export const generatePasswordResetToken = (): {
  token: string;
  hashedToken: string;
} => {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
  return { token, hashedToken };
};

/**
 * Hash a token with SHA-256
 */
export const hashToken = (token: string): string => {
  return crypto.createHash('sha256').update(token).digest('hex');
};

/**
 * Create success response
 */
export const successResponse = <T>(
  message: string,
  data?: T
): { success: true; message: string; data?: T } => ({
  success: true,
  message,
  ...(data !== undefined && { data }),
});

/**
 * Create error response
 */
export const errorResponse = (
  message: string,
  errors?: Array<{ field: string; message: string }>
): { success: false; message: string; errors?: Array<{ field: string; message: string }> } => ({
  success: false,
  message,
  ...(errors && { errors }),
});

/**
 * Sanitize string input (basic XSS prevention)
 */
export const sanitizeString = (str: string): string => {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

/**
 * Get file extension from filename
 */
export const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

/**
 * Check if value is a valid UUID
 */
export const isValidUUID = (value: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(value);
};

/**
 * Get label from status
 */
export const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    SUBMITTED: 'Submitted',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    WAITING_FOR_STUDENT: 'Waiting for Student',
    RESOLVED: 'Resolved',
    REJECTED: 'Rejected',
    CLOSED: 'Closed',
  };
  return labels[status] || status;
};

/**
 * Truncate string to max length
 */
export const truncate = (str: string, maxLength: number): string => {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength) + '...';
};
