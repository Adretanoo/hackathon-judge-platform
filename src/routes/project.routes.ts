import type { FastifyInstance } from 'fastify';
import {
  createProjectHandler,
  updateProjectHandler,
  changeProjectStatusHandler,
  getProjectHandler,
  listProjectsHandler,
} from '../controllers/project.controller';
import { getProjectCriteriaHandler } from '../controllers/criteria.controller';
import {
  submitScoresHandler,
  getProjectScoresHandler,
} from '../controllers/score.controller';
import {
  createProjectSchema,
  updateProjectSchema,
  changeProjectStatusSchema,
  listProjectsSchema,
} from '../schemas/project.schema';
import { submitScoresSchema } from '../schemas/score.schema';

const genericSuccessSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {},
  },
} as const;

export async function projectRoutes(app: FastifyInstance): Promise<void> {
  app.post(
    '/',
    {
      schema: {
        tags: ['Projects'],
        summary: 'Create a new project',
        security: [{ BearerAuth: [] }],
        response: { 201: genericSuccessSchema },
      },
      preHandler: [app.authenticate],
    },
    (req, reply) => {
      req.body = createProjectSchema.parse(req.body);
      return createProjectHandler(req as any, reply);
    }
  );

  app.put(
    '/:id',
    {
      schema: {
        tags: ['Projects'],
        summary: 'Update project details',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema },
      },
      preHandler: [app.authenticate],
    },
    (req, reply) => {
      req.body = updateProjectSchema.parse(req.body);
      return updateProjectHandler(req as any, reply);
    }
  );

  app.patch(
    '/:id/status',
    {
      schema: {
        tags: ['Projects'],
        summary: 'Change project status',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema },
      },
      preHandler: [app.authenticate],
    },
    (req, reply) => {
      req.body = changeProjectStatusSchema.parse(req.body);
      return changeProjectStatusHandler(req as any, reply);
    }
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: ['Projects'],
        summary: 'Get project details',
        response: { 200: genericSuccessSchema },
      },
      preHandler: [app.authenticate],
    },
    getProjectHandler as any
  );

  app.get(
    '/',
    {
      schema: {
        tags: ['Projects'],
        summary: 'List projects',
        response: { 200: genericSuccessSchema },
      },
      preHandler: [app.authenticate],
    },
    (req, reply) => {
      req.query = listProjectsSchema.shape.querystring.parse(req.query);
      return listProjectsHandler(req as any, reply);
    }
  );

  app.get(
    '/:projectId/criteria',
    {
      schema: {
        tags: ['Projects', 'Criteria'],
        summary: 'Get criteria sheet for a specific project',
        response: { 200: genericSuccessSchema },
      },
      preHandler: [app.authenticate],
    },
    getProjectCriteriaHandler as any
  );

  // ─── Scores ────────────────────────────────────────────────────────────────

  app.post(
    '/:projectId/scores',
    {
      schema: {
        tags: ['Projects', 'Scores'],
        summary: 'Submit judge scores for a project',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema },
      },
      preHandler: [app.authenticate],
    },
    (req, reply) => {
      req.body = submitScoresSchema.parse(req.body);
      return submitScoresHandler(req as any, reply);
    }
  );

  app.get(
    '/:projectId/scores',
    {
      schema: {
        tags: ['Projects', 'Scores'],
        summary: 'Get scores for a project (with Z-Score normalization)',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema },
      },
      preHandler: [app.authenticate],
    },
    getProjectScoresHandler as any
  );
}
