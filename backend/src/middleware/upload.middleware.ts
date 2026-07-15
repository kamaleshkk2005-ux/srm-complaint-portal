import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { AppError } from './errorHandler.middleware';
import { FILE_LIMITS } from '../utils/constants';

// Use memory storage for direct upload to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (FILE_LIMITS.allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only JPG, PNG, GIF, WEBP and PDF are allowed.', 400));
  }
};

const upload = multer({
  storage,
  limits: {
    fileSize: FILE_LIMITS.maxSize,
  },
  fileFilter,
});

// Simple per-request upload guard (limits file count before multer processes)
export const uploadLimiter = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export const uploadSingle = upload.single('file');
export const uploadMultiple = upload.array('files', FILE_LIMITS.maxFiles);
export const uploadAttachments = upload.array('attachments', FILE_LIMITS.maxFiles);
export const uploadProfileImage = upload.single('profileImage');

