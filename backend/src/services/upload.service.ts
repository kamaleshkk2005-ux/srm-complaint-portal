import cloudinary from '../config/cloudinary';
import { UploadApiOptions } from 'cloudinary';
import streamifier from 'streamifier';
import logger from '../config/logger';

export const uploadService = {
  /**
   * Upload file to Cloudinary from memory buffer
   */
  uploadFile: async (
    buffer: Buffer,
    originalName: string,
    folder: string
  ): Promise<{ url: string; publicId: string; fileType: string; fileSize: number }> => {
    return new Promise((resolve, reject) => {
      const options: UploadApiOptions = {
        folder,
        resource_type: 'auto', // Automatically detect resource type (image, video, raw)
        use_filename: true,
        unique_filename: true,
      };

      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            logger.error('Cloudinary upload error:', error);
            return reject(error);
          }

          if (!result) {
            return reject(new Error('Upload to Cloudinary failed with no result'));
          }

          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            fileType: result.format || result.resource_type,
            fileSize: result.bytes,
          });
        }
      );

      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  },

  /**
   * Delete file from Cloudinary by public ID
   */
  deleteFile: async (publicId: string): Promise<boolean> => {
    try {
      // We don't always know if it's an image or raw (like pdf), try both if first fails
      const result = await cloudinary.uploader.destroy(publicId);
      
      if (result.result !== 'ok') {
        // Try as raw (for PDFs usually)
        const rawResult = await cloudinary.uploader.destroy(publicId, { resource_type: 'raw' });
        return rawResult.result === 'ok';
      }
      
      return true;
    } catch (error) {
      logger.error(`Cloudinary delete error for ${publicId}:`, error);
      return false;
    }
  },

  /**
   * Promise wrapper for general Cloudinary uploads
   */
  uploadToCloudinary: (buffer: Buffer, options: UploadApiOptions): Promise<any> => {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) return reject(error);
          resolve(result);
        }
      );
      streamifier.createReadStream(buffer).pipe(uploadStream);
    });
  }
};
