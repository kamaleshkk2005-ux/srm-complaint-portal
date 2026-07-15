import React, { createContext, useContext, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let socketInstance: Socket | null = null;

    if (isAuthenticated) {
      const token = localStorage.getItem('accessToken');
      const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

      socketInstance = io(socketUrl, {
        auth: { token },
        transports: ['websocket'], // Use websocket for better stability
      });

      socketInstance.on('connect', () => {
        setIsConnected(true);
        console.log('Socket.io connected:', socketInstance?.id);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        console.log('Socket.io disconnected');
      });

      socketInstance.on('connect_error', (err) => {
        console.error('Socket connection error:', err.message);
      });

      setSocket(socketInstance);
    } else {
      // Disconnect if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
        setIsConnected(false);
      }
    }

    return () => {
      if (socketInstance) {
        socketInstance.disconnect();
      }
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};
