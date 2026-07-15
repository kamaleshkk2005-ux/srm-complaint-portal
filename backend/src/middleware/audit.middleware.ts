import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import logger from '../config/logger';

export const auditLog = (entity: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // We want to log AFTER the response is sent to capture success/failure
    res.on('finish', async () => {
      // Only log successful modifications (POST, PUT, PATCH, DELETE)
      if (
        ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method) &&
        res.statusCode >= 200 &&
        res.statusCode < 300
      ) {
        try {
          let action = 'CREATE';
          if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';
          if (req.method === 'DELETE') action = 'DELETE';

          // Try to extract entityId from params or response locals
          const entityId = req.params.id || res.locals.entityId || null;

          // Don't log passwords or sensitive data in newData
          const newData = { ...req.body };
          if (newData.password) delete newData.password;
          if (newData.confirmPassword) delete newData.confirmPassword;

          await prisma.auditLog.create({
            data: {
              userId: req.user?.id || null, // null for public endpoints like register
              action,
              entity,
              entityId,
              newData: Object.keys(newData).length > 0 ? newData : undefined,
              ipAddress: req.ip || req.socket.remoteAddress || 'unknown',
              userAgent: req.headers['user-agent'] || 'unknown',
            },
          });
        } catch (error) {
          logger.error('Error writing audit log:', error);
        }
      }
    });
    
    next();
  };
};
