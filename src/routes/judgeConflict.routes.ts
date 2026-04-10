/**
 * @file src/routes/judgeConflict.routes.ts
 * @description Routes for listing and overriding Judge Conflicts.
 */

import type { FastifyInstance } from 'fastify';
import { RoleName } from '@prisma/client';
import { hasRole } from '../middleware/auth';
import {
  listConflictsHandler,
  overrideConflictHandler,
} from '../controllers/judgeConflict.controller';
import { overrideConflictSchema } from '../schemas/judgeConflict.schema';

const errorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [false] },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: { type: 'object', additionalProperties: true },
      },
    },
  },
} as const;

const genericSuccessSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: { 
      type: 'object', 
      additionalProperties: true 
    },
  },
} as const;

export async function judgeConflictRoutes(app: FastifyInstance): Promise<void> {
  // Routes are mounted under /api/v1/hackathons by the main index,
  // or we can just mount them under /api/v1/conflicts. 
  // Let's assume we register it manually in route register to be /api/v1/hackathons.

  app.get(
    '/:hackathonId/conflicts',
    {
      schema: {
        tags: ['Hackathons', 'Judges', 'Conflicts'],
        summary: 'List all judge conflicts in a hackathon',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN], { context: 'hackathon', paramName: 'hackathonId' })
      ],
    },
    listConflictsHandler as any
  );

  app.patch(
    '/:hackathonId/conflicts/:conflictId/override',
    {
      schema: {
        tags: ['Hackathons', 'Judges', 'Conflicts'],
        summary: 'Manually override a judge conflict',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema, 400: errorSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN], { context: 'hackathon', paramName: 'hackathonId' })
      ],
    },
    (req, reply) => {
      req.body = overrideConflictSchema.parse(req.body);
      return overrideConflictHandler(req as any, reply);
    }
  );
}
