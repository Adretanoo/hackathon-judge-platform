/**
 * @file src/services/upload.service.ts
 * @description Interfaces with Cloudinary for handling generic image/file uploads.
 */

import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { env } from '../config/env';
import { InternalServerError } from '../utils/errors';

// Configured once at startup
cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key:    env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
});

export class UploadService {
  /**
   * Uploads a raw buffer to Cloudinary using streams.
   * Useful when using @fastify/multipart attached buffers.
   */
  async uploadBuffer(buffer: Buffer, folder: string, filename?: string): Promise<string> {
    if (!env.CLOUDINARY_CLOUD_NAME) {
      throw new InternalServerError('Cloudinary is not configured. File upload disabled.');
    }

    const options: UploadApiOptions = {
      folder: `hackathon-platform/${folder}`,
      resource_type: 'auto',
      public_id: filename, 
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) return reject(new InternalServerError(`Cloudinary upload failed: ${error.message}`));
          if (!result) return reject(new InternalServerError('Cloudinary returned no result'));
          resolve(result.secure_url);
        }
      );
      
      // Write the buffer into the stream and finish
      uploadStream.end(buffer);
    });
  }
}
