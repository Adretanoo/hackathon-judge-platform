import fs from 'node:fs/promises';
import path from 'node:path';
import { v2 as cloudinary, UploadApiOptions } from 'cloudinary';
import { env } from '../config/env';
import { InternalServerError, BadRequestError } from '../utils/errors';

export class UploadService {
  /**
   * Uploads a raw buffer to Cloudinary using streams.
   * Falls back to local storage if Cloudinary is not configured or fails.
   */
  async uploadBuffer(buffer: Buffer, folder: string, filename?: string): Promise<string> {
    const finalFilename = filename || `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const useCloudinary = !!env.CLOUDINARY_CLOUD_NAME && !!env.CLOUDINARY_API_KEY && !!env.CLOUDINARY_API_SECRET;

    if (useCloudinary) {
      // Configure on demand to catch any runtime env updates (if applicable)
      cloudinary.config({
        cloud_name: env.CLOUDINARY_CLOUD_NAME,
        api_key:    env.CLOUDINARY_API_KEY,
        api_secret: env.CLOUDINARY_API_SECRET,
      });

      try {
        const result = await this.uploadToCloudinary(buffer, folder, finalFilename);
        return result;
      } catch (err: any) {
        console.error('⚠️  Cloudinary upload failed, falling back to local storage:', err.message);
        // Fall through to local storage
      }
    }

    // Local Storage Fallback
    return await this.uploadToLocal(buffer, folder, finalFilename);
  }

  /**
   * Helper: Upload to Cloudinary using streams
   */
  private async uploadToCloudinary(buffer: Buffer, folder: string, filename: string): Promise<string> {
    const options: UploadApiOptions = {
      folder: `hackathon-platform/${folder}`,
      resource_type: 'auto',
      public_id: filename, 
    };

    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        options,
        (error, result) => {
          if (error) {
            const isClientError = error.http_code === 400 || error.http_code === 401;
            const ErrorClass = isClientError ? BadRequestError : InternalServerError;
            return reject(new ErrorClass(error.message));
          }
          if (!result) return reject(new InternalServerError('Cloudinary returned no result'));
          resolve(result.secure_url);
        }
      );
      uploadStream.end(buffer);
    });
  }

  /**
   * Helper: Save to local public/uploads directory
   */
  private async uploadToLocal(buffer: Buffer, folder: string, filename: string): Promise<string> {
    const uploadDir = path.join(process.cwd(), 'public', 'uploads', folder);
    
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      
      // Determine extension (generic placeholder or keep as is)
      // Since we don't have the original mime here easily without extra libs, 
      // we'll just save it. Cloudinary 'auto' does this better.
      // But for local we should ideally have an extension.
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);

      // Return a URL that the frontend can use (relative to server root)
      // Since we registered /public/ prefix in server.ts
      return `/public/uploads/${folder}/${filename}`;
    } catch (err: any) {
      throw new InternalServerError(`Local upload failed: ${err.message}`);
    }
  }
}
