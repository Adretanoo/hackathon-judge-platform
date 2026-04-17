/**
 * @file src/routes/upload.routes.ts
 * @description General endpoint for uploading images (avatars, avatars, banners, project files)
 */

import { FastifyInstance } from 'fastify';
import { UploadService } from '../services/upload.service';
import { successResponse } from '../utils/response';
import { BadRequestError } from '../utils/errors';
import crypto from 'node:crypto';

export async function uploadRoutes(app: FastifyInstance) {
  const svc = new UploadService();

  app.post(
    '/',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Uploads'],
        summary: 'Upload a file via multipart form-data',
        description: 'Expects a single file field named "file". Returns a secure_url.',
        security: [{ BearerAuth: [] }],
      },
    },
    async (req, reply) => {
      try {
        const parts = await req.file();
        if (!parts) {
          throw new BadRequestError('No file uploaded. Expected field "file".');
        }

        const buffer = await parts.toBuffer();
        const folder = (req.user as any).sub;
        
        // Extract extension from original filename
        const ext = parts.filename.includes('.') ? parts.filename.split('.').pop() : '';
        const filename = `${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;

        let secureUrl = await svc.uploadBuffer(buffer, folder, filename);

        // If it's a local path (starts with /public/), prepend the host
        if (secureUrl.startsWith('/')) {
            const host = req.headers.host || 'localhost:3000';
            const protocol = req.protocol || 'http';
            secureUrl = `${protocol}://${host}${secureUrl}`;
        }

        return reply.status(201).send(successResponse({ url: secureUrl }));
      } catch (err: any) {
        if (err instanceof BadRequestError) throw err;
        
        // Handle common multipart errors gracefully
        if (err.code === 'FST_REQ_FILE_TOO_LARGE') {
          throw new BadRequestError('File too large. Maximum size is 10MB.');
        }
        
        // Log the actual error for the developer
        req.log.error({ err }, 'Upload failure');
        throw err;
      }
    }
  );
}
