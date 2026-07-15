import { Server, Socket } from 'socket.io';
import { SOCKET_EVENTS } from '../utils/constants';
import { AuthenticatedSocket } from '../types';

export const setupChatSocket = (io: Server, socket: Socket) => {
  const user = (socket as any).user as AuthenticatedSocket;

  // Join a specific complaint chat room
  socket.on(SOCKET_EVENTS.JOIN_COMPLAINT, (complaintId: string) => {
    socket.join(`complaint:${complaintId}`);
  });

  // Leave a specific complaint chat room
  socket.on(SOCKET_EVENTS.LEAVE_COMPLAINT, (complaintId: string) => {
    socket.leave(`complaint:${complaintId}`);
  });

  // Typing indicators
  socket.on(SOCKET_EVENTS.TYPING, (complaintId: string) => {
    socket.to(`complaint:${complaintId}`).emit(SOCKET_EVENTS.TYPING, {
      userId: user.userId,
      complaintId,
    });
  });

  socket.on(SOCKET_EVENTS.STOP_TYPING, (complaintId: string) => {
    socket.to(`complaint:${complaintId}`).emit(SOCKET_EVENTS.STOP_TYPING, {
      userId: user.userId,
      complaintId,
    });
  });

  // Client sent a new message
  // In our architecture, the client posts via REST API to save to DB,
  // and the REST API could trigger the emit, OR client sends via socket and socket saves to DB.
  // We'll use the REST API approach for robustness (handles file uploads easier),
  // but we can broadcast the received message here if needed.
  socket.on(SOCKET_EVENTS.MESSAGE_SEND, (data: { complaintId: string; message: any }) => {
    // Broadcast to everyone else in the room
    socket.to(`complaint:${data.complaintId}`).emit(SOCKET_EVENTS.MESSAGE_RECEIVED, data.message);
  });
};
