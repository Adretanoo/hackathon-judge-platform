import type { FastifyInstance } from 'fastify';
import { RoleName } from '@prisma/client';
import { hasRole } from '../middleware/auth';
import {
  listJudgingProjectsHandler,
  listJudgingHackathonsHandler,
  getJudgingStatsHandler
} from '../controllers/judging.controller';

export async function judgingRoutes(app: FastifyInstance): Promise<void> {
  app.get(
    '/hackathons',
    {
      schema: {
        tags: ['Judging'],
        summary: 'List hackathons where current user is a judge',
        security: [{ BearerAuth: [] }]
      },
      preHandler: [app.authenticate]
    },
    listJudgingHackathonsHandler as any
  );

  app.get(
    '/projects',
    {
      schema: {
        tags: ['Judging'],
        summary: 'List projects assigned to the current judge',
        security: [{ BearerAuth: [] }],
        querystring: {
          type: 'object',
          required: ['hackathonId'],
          properties: {
            hackathonId: { type: 'string' }
          }
        }
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.JUDGE, RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN])
      ]
    },
    listJudgingProjectsHandler as any
  );

  app.get(
    '/stats',
    {
      schema: {
        tags: ['Judging'],
        summary: 'Get current judge scoring statistics',
        security: [{ BearerAuth: [] }]
      },
      preHandler: [app.authenticate]
    },
    getJudgingStatsHandler as any
  );
}
