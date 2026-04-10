/**
 * @file src/routes/config.routes.ts
 * @description Route definitions for System Config.
 */

import { FastifyInstance } from 'fastify';
import { RoleName } from '@prisma/client';
import { hasRole } from '../middleware/auth';
import { listConfigsHandler, updateConfigsHandler } from '../controllers/config.controller';

export async function configRoutes(app: FastifyInstance) {
  // ─── GET /api/v1/config ───────────────────────────────────────────────────
  app.get(
    '/',
    {
      preHandler: [app.authenticate, hasRole([RoleName.GLOBAL_ADMIN])],
      schema: {
        tags: ['Config'],
        summary: 'Get all system configurations (Admin only)',
        security: [{ BearerAuth: [] }]
      }
    },
    listConfigsHandler as any
  );

  // ─── PATCH /api/v1/config ──────────────────────────────────────────────────
  app.patch(
    '/',
    {
      preHandler: [app.authenticate, hasRole([RoleName.GLOBAL_ADMIN])],
      schema: {
        tags: ['Config'],
        summary: 'Update or set multiple system configurations (Admin only)',
        security: [{ BearerAuth: [] }]
      }
    },
    updateConfigsHandler as any
  );
}
