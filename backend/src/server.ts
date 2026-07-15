import http from 'http';
import app from './app';
import logger from './config/logger';
import prisma from './config/database';
import { initSocket } from './socket';

const PORT = process.env.PORT || 5000;

// Create HTTP Server
const server = http.createServer(app);

// Initialize Socket.io (Disabled for Vercel Serverless)
// initSocket(server);

// Start server
const startServer = async () => {
  try {
    // Check DB Connection
    await prisma.$connect();
    logger.info('📦 Connected to PostgreSQL database via Prisma');

    server.listen(PORT, () => {
      logger.info(`🚀 Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
      logger.info(`📚 Swagger Docs available at http://localhost:${PORT}/api-docs`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

// Handle unhandled rejections and exceptions
process.on('unhandledRejection', (err: any) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  // In production, you might want to gracefully shut down
  if (process.env.NODE_ENV === 'production') {
    server.close(() => process.exit(1));
  }
});

process.on('uncaughtException', (err: any) => {
  logger.error(`Uncaught Exception: ${err.message}`);
  // Must exit on uncaught exception to avoid undefined state
  process.exit(1);
});
