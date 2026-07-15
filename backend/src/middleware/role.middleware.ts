import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.middleware';

export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError('Not authenticated', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('Forbidden: You do not have permission to access this resource', 403)
      );
    }

    next();
  };
};

export const isAdmin = authorize('ADMIN');
export const isStaff = authorize('STAFF', 'ADMIN');
export const isStudent = authorize('STUDENT');
