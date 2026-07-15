import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import logger from '../config/logger';
import { JwtPayload, AuthenticatedSocket } from '../types';
import { setupNotificationSocket } from './notification.socket';
import { setupChatSocket } from './chat.socket';

let io: Server;

export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });

  // Authentication Middleware
  io.use((socket: Socket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
      
      // Attach user info to socket
      (socket as any).user = {
        userId: decoded.id,
        email: decoded.email,
        role: decoded.role
      } as AuthenticatedSocket;

      next();
    } catch (error) {
      next(new Error('Authentication error: Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = (socket as any).user as AuthenticatedSocket;
    logger.info(`Socket connected: ${socket.id} (User: ${user.userId})`);

    // Join personal room for direct notifications
    socket.join(`user:${user.userId}`);
    
    // Join role-based room for broadcast announcements
    socket.join(`role:${user.role}`);

    // Setup module-specific sockets
    setupNotificationSocket(io, socket);
    setupChatSocket(io, socket);

    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: ${socket.id}`);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};
