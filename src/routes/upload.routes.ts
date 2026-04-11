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
      // Because we used attachFieldsToBody: true, the multipart parser 
      // puts fields and files into req.body.
      // But actually attachFieldsToBody puts files in a specific format OR we can use req.file()
      
      const parts = await req.file();
      if (!parts) {
        throw new BadRequestError('No file uploaded. Expected field "file".');
      }

      const buffer = await parts.toBuffer();
      const folder = (req.user as any).sub; // Store under the user's ID folder
      const filename = `${crypto.randomUUID()}`;

      const secureUrl = await svc.uploadBuffer(buffer, folder, filename);

      return reply.status(201).send(successResponse({ url: secureUrl }));
    }
  );
}
