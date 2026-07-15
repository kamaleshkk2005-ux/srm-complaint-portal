import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodTypeAny } from 'zod';
import { parsePagination } from '../utils/helpers';
import { paginationSchema } from '../utils/validators';

export const validate = (schema: ZodTypeAny) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = await schema.parseAsync(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        }));
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors,
        });
      }
      next(error);
    }
  };
};

export const validatePagination = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const validatedQuery = await paginationSchema.parseAsync(req.query);
    // Merge parsed values back using Object.assign to avoid type conflicts
    Object.assign(req.query, validatedQuery);
    
    // Add parsed values for Prisma
    const { skip, limit, page } = parsePagination({
      page: validatedQuery.page,
      limit: validatedQuery.limit,
    });
    
    res.locals.pagination = { skip, limit, page };
    next();
  } catch (error) {
    next(error);
  }
};
