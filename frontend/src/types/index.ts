export interface User {
  id: string;
  email: string;
  personalEmail?: string | null;
  role: 'STUDENT' | 'STAFF' | 'ADMIN';
  isActive: boolean;
  profile?: {
    fullName: string;
    profileImage?: string;
    identifier: string; // registerNumber or employeeId or ADMIN
  };
  department?: Department;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export type ComplaintStatus = 
  | 'SUBMITTED' 
  | 'ASSIGNED' 
  | 'IN_PROGRESS' 
  | 'WAITING_FOR_STUDENT' 
  | 'RESOLVED' 
  | 'REJECTED' 
  | 'CLOSED';

export interface Complaint {
  id: string;
  complaintId: string;
  studentId: string;
  assignedStaffId?: string;
  departmentId: string;
  categoryId: string;
  title: string;
  description: string;
  priority: Priority;
  status: ComplaintStatus;
  location?: string;
  resolvedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // Relations included in list API
  student?: { fullName: string; registerNumber: string };
  assignedStaff?: { fullName: string; employeeId: string };
  department?: { name: string; code?: string };
  category?: { name: string };
  attachments?: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  history?: Array<{
    id: string;
    oldStatus?: string;
    newStatus: string;
    comment?: string;
    createdAt: string;
    changedBy: {
      email: string;
      role: string;
      student?: { fullName: string };
      staff?: { fullName: string };
    };
  }>;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
