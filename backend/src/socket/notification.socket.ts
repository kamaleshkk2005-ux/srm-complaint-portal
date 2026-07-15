import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../utils/constants';
import { getIO } from './index';
import { TargetRole } from '../types/enums';

export const setupNotificationSocket = (io: Server, socket: Socket) => {
  // Listen for client explicit read receipts if needed
  socket.on(SOCKET_EVENTS.READ_RECEIPT, (notificationId: string) => {
    // In a real app, you might want to update DB here directly via socket,
    // but we usually prefer doing it via REST API. 
    // This is just a placeholder for potential real-time bidirectional flows.
  });
};

/**
 * Helper to emit notification to a specific user
 */
export const emitNotification = (userId: string, data: any) => {
  try {
    const io = getIO();
    io.to(`user:${userId}`).emit(SOCKET_EVENTS.NOTIFICATION, data);
  } catch (error) {
    console.error('Socket emit error:', error);
  }
};

/**
 * Helper to emit to an entire role group
 */
export const emitToRole = (targetRole: TargetRole, data: any) => {
  try {
    const io = getIO();
    if (targetRole === TargetRole.ALL) {
      io.to('role:STUDENT').to('role:STAFF').to('role:ADMIN').emit(SOCKET_EVENTS.NOTIFICATION, data);
    } else {
      io.to(`role:${targetRole}`).emit(SOCKET_EVENTS.NOTIFICATION, data);
    }
  } catch (error) {
    console.error('Socket emit error:', error);
  }
};
