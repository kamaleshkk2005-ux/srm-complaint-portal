export const ROLES = {
  STUDENT: 'STUDENT',
  STAFF: 'STAFF',
  ADMIN: 'ADMIN',
} as const;

export const COMPLAINT_STATUSES = {
  SUBMITTED: 'SUBMITTED',
  ASSIGNED: 'ASSIGNED',
  IN_PROGRESS: 'IN_PROGRESS',
  WAITING_FOR_STUDENT: 'WAITING_FOR_STUDENT',
  RESOLVED: 'RESOLVED',
  REJECTED: 'REJECTED',
  CLOSED: 'CLOSED',
} as const;

export const PRIORITIES = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;

// Valid status transitions
export const STATUS_TRANSITIONS: Record<string, string[]> = {
  SUBMITTED: ['ASSIGNED', 'REJECTED'],
  ASSIGNED: ['IN_PROGRESS', 'WAITING_FOR_STUDENT', 'REJECTED'],
  IN_PROGRESS: ['WAITING_FOR_STUDENT', 'RESOLVED', 'REJECTED'],
  WAITING_FOR_STUDENT: ['IN_PROGRESS', 'CLOSED', 'RESOLVED'],
  RESOLVED: ['CLOSED'],
  REJECTED: ['SUBMITTED'],
  CLOSED: [],
};

export const SOCKET_EVENTS = {
  // Connection
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  // Notification
  NOTIFICATION: 'notification',
  // Chat
  JOIN_COMPLAINT: 'join_complaint',
  LEAVE_COMPLAINT: 'leave_complaint',
  MESSAGE_SEND: 'message_send',
  MESSAGE_RECEIVED: 'message_received',
  TYPING: 'typing',
  STOP_TYPING: 'stop_typing',
  READ_RECEIPT: 'read_receipt',
  // User rooms
  JOIN_USER_ROOM: 'join_user_room',
} as const;

export const FILE_LIMITS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  maxFiles: 5,
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ],
  allowedExtensions: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf'],
};

export const CLOUDINARY_FOLDERS = {
  COMPLAINTS: 'college-complaints/attachments',
  PROFILES: 'college-complaints/profiles',
  MESSAGES: 'college-complaints/messages',
};

export const NOTIFICATION_TYPES = {
  COMPLAINT_SUBMITTED: 'COMPLAINT_SUBMITTED',
  COMPLAINT_ASSIGNED: 'COMPLAINT_ASSIGNED',
  COMPLAINT_STATUS_UPDATED: 'COMPLAINT_STATUS_UPDATED',
  COMPLAINT_RESOLVED: 'COMPLAINT_RESOLVED',
  COMPLAINT_CLOSED: 'COMPLAINT_CLOSED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  ANNOUNCEMENT: 'ANNOUNCEMENT',
  SYSTEM: 'SYSTEM',
} as const;

export const PASSWORD_RESET_PREFIX = 'pwd_reset_';
