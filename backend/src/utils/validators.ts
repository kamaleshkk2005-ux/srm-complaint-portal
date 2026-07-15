import { z } from 'zod';

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Full name must be at least 2 characters').max(100),
    registerNumber: z
      .string()
      .min(5, 'Register number must be at least 5 characters')
      .max(20)
      .regex(/^[A-Z0-9]+$/i, 'Register number must be alphanumeric'),
    email: z.string().email('Please enter a valid email'),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
    departmentId: z.string().uuid('Please select a valid department'),
    academicYear: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year'], {
      errorMap: () => ({ message: 'Please select a valid academic year' }),
    }),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const loginSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  password: z.string().min(1, 'Password is required'),
  role: z.enum(['STUDENT', 'STAFF', 'ADMIN'], {
    required_error: 'Please select a role',
  }),
  rememberMe: z.boolean().optional(),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email'),
});

export const resetPasswordSchema = z
  .object({
    token: z.string().min(1, 'Token is required'),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateProfileSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Please enter a valid 10-digit Indian mobile number')
    .optional(),
  academicYear: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year']).optional(),
  designation: z.string().max(100).optional(),
  personalEmail: z
    .union([z.string().email('Please enter a valid email address.'), z.literal('')])
    .optional()
    .transform((e) => (e === '' ? null : e)),
});

export const createComplaintSchema = z.object({
  departmentId: z.string().uuid('Please select a valid department'),
  categoryId: z.string().uuid('Please select a valid category'),
  title: z.string().min(10, 'Title must be at least 10 characters').max(200),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT'], {
    errorMap: () => ({ message: 'Please select a valid priority' }),
  }),
  location: z.string().max(200).optional(),
});

export const updateComplaintSchema = z.object({
  title: z.string().min(10).max(200).optional(),
  description: z.string().min(20).max(5000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional(),
  location: z.string().max(200).optional(),
  categoryId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
});

export const updateStatusSchema = z.object({
  status: z.enum([
    'SUBMITTED',
    'ASSIGNED',
    'IN_PROGRESS',
    'WAITING_FOR_STUDENT',
    'RESOLVED',
    'REJECTED',
    'CLOSED',
  ]),
  comment: z.string().max(1000).optional(),
});

export const assignComplaintSchema = z.object({
  staffId: z.string().uuid('Please select a valid staff member'),
});

export const createStudentSchema = z
  .object({
    fullName: z.string().min(2).max(100),
    registerNumber: z.string().min(5).max(20).regex(/^[A-Z0-9]+$/i),
    email: z.string().email(),
    phone: z.string().regex(/^[6-9]\d{9}$/),
    departmentId: z.string().uuid(),
    academicYear: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year']),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateStudentSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  departmentId: z.string().uuid().optional(),
  academicYear: z.enum(['1st Year', '2nd Year', '3rd Year', '4th Year']).optional(),
});

export const createStaffSchema = z
  .object({
    fullName: z.string().min(2).max(100),
    email: z.string().email(),
    phone: z.string().regex(/^[6-9]\d{9}$/),
    employeeId: z.string().min(3).max(20),
    departmentId: z.string().uuid(),
    designation: z.string().min(2).max(100),
    password: passwordSchema,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const updateStaffSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  phone: z.string().regex(/^[6-9]\d{9}$/).optional(),
  departmentId: z.string().uuid().optional(),
  designation: z.string().min(2).max(100).optional(),
});

export const createDepartmentSchema = z.object({
  name: z.string().min(2).max(100),
  code: z
    .string()
    .min(2)
    .max(10)
    .regex(/^[A-Z]+$/, 'Code must be uppercase letters only'),
  description: z.string().max(500).optional(),
});

export const updateDepartmentSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const createCategorySchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().max(500).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional(),
});

export const createAnnouncementSchema = z.object({
  title: z.string().min(5).max(200),
  content: z.string().min(10).max(5000),
  targetRole: z.enum(['ALL', 'STUDENT', 'STAFF']).default('ALL'),
});

export const updateAnnouncementSchema = z.object({
  title: z.string().min(5).max(200).optional(),
  content: z.string().min(10).max(5000).optional(),
  targetRole: z.enum(['ALL', 'STUDENT', 'STAFF']).optional(),
  isActive: z.boolean().optional(),
});

export const sendMessageSchema = z.object({
  content: z.string().max(5000).optional(),
  fileUrl: z.string().url().optional(),
  fileName: z.string().max(255).optional(),
  fileType: z.string().max(100).optional(),
}).refine((data) => data.content || data.fileUrl, {
  message: 'Message must have either content or a file',
});

export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export const broadcastNotificationSchema = z.object({
  title: z.string().min(3).max(200),
  message: z.string().min(5).max(1000),
  targetRole: z.enum(['ALL', 'STUDENT', 'STAFF', 'ADMIN']).default('ALL'),
});

export const updateSettingSchema = z.object({
  value: z.string().min(1, 'Value is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type CreateComplaintInput = z.infer<typeof createComplaintSchema>;
export type UpdateComplaintInput = z.infer<typeof updateComplaintSchema>;
export type UpdateStatusInput = z.infer<typeof updateStatusSchema>;
export type AssignComplaintInput = z.infer<typeof assignComplaintSchema>;
export type CreateStudentInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;
export type CreateStaffInput = z.infer<typeof createStaffSchema>;
export type UpdateStaffInput = z.infer<typeof updateStaffSchema>;
export type CreateDepartmentInput = z.infer<typeof createDepartmentSchema>;
export type UpdateDepartmentInput = z.infer<typeof updateDepartmentSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;
export type CreateAnnouncementInput = z.infer<typeof createAnnouncementSchema>;
export type UpdateAnnouncementInput = z.infer<typeof updateAnnouncementSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type BroadcastNotificationInput = z.infer<typeof broadcastNotificationSchema>;
export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;

