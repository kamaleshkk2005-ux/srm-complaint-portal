import { Request, Response, NextFunction } from 'express';
import xss from 'xss';

/**
 * Middleware to sanitize incoming request bodies, queries, and params against XSS attacks.
 */
export const xssSanitize = (req: Request, res: Response, next: NextFunction) => {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params) as any;
  }
  next();
};

const sanitizeObject = (obj: any): any => {
  if (typeof obj === 'string') {
    return xss(obj);
  }
  
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeObject(item));
  }
  
  if (typeof obj === 'object' && obj !== null) {
    const sanitizedObj: any = {};
    for (const [key, value] of Object.entries(obj)) {
      sanitizedObj[key] = sanitizeObject(value);
    }
    return sanitizedObj;
  }
  
  return obj;
};
