/**
 * @file src/routes/hackathon.routes.ts
 * @description Routes for handling Hackathon resources (CRUD, stages, tracks, awards).
 */

import type { FastifyInstance } from 'fastify';
import { hasRole } from '../middleware/auth';
import { RoleName } from '@prisma/client';
import {
  createHackathonHandler,
  getHackathonsHandler,
  getHackathonByIdHandler,
  updateHackathonHandler,
  changeHackathonStatusHandler,
  createStageHandler,
  updateStageHandler,
  deleteStageHandler,
  createTrackHandler,
  updateTrackHandler,
  deleteTrackHandler,
  createAwardHandler,
  updateAwardHandler,
  deleteAwardHandler,
} from '../controllers/hackathon.controller';
import {
  createHackathonSchema,
  updateHackathonSchema,
  changeHackathonStatusSchema,
  createStageSchema,
  updateStageSchema,
  createTrackSchema,
  updateTrackSchema,
  createAwardSchema,
  updateAwardSchema,
} from '../schemas/hackathon.schema';

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

// A generic success wrapper schema trick to appease fast-json-stringify for any return type
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

export async function hackathonRoutes(app: FastifyInstance): Promise<void> {

  // ─── Hackathons ─────────────────────────────────────────────────────────────

  app.post(
    '/',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Create a new Hackathon',
        description: 'Only GLOBAL_ADMIN or ORGANIZER global roles can create.',
        security: [{ BearerAuth: [] }],
        response: {
          201: genericSuccessSchema,
          400: errorSchema,
        },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.GLOBAL_ADMIN, RoleName.ORGANIZER], { context: 'global' }),
      ],
    },
    (req, reply) => {
      // Must manually parse body due to Fastify lack of easy generic TS mapping 
      // without TypeProviders, or we can just rely on the controller.
      req.body = createHackathonSchema.parse(req.body);
      return createHackathonHandler(req as any, reply);
    }
  );

  app.get(
    '/',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'List hackathons',
        response: { 200: genericSuccessSchema },
      },
    },
    getHackathonsHandler as any
  );

  app.get(
    '/:id',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Get Hackathon by ID',
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
    },
    getHackathonByIdHandler as any
  );

  app.put(
    '/:id',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Update a Hackathon',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    (req, reply) => {
      req.body = updateHackathonSchema.parse(req.body);
      return updateHackathonHandler(req as any, reply);
    }
  );

  app.patch(
    '/:id/status',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Change Hackathon status',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    (req, reply) => {
      req.body = changeHackathonStatusSchema.parse(req.body);
      return changeHackathonStatusHandler(req as any, reply);
    }
  );

  // ─── Stages ──────────────────────────────────────────────────────────────────

  app.post(
    '/:id/stages',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Add a stage',
        security: [{ BearerAuth: [] }],
        response: { 201: genericSuccessSchema, 400: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    (req, reply) => {
      req.body = createStageSchema.parse(req.body);
      return createStageHandler(req as any, reply);
    }
  );

  app.put(
    '/:id/stages/:stageId',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Update a stage',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    (req, reply) => {
      req.body = updateStageSchema.parse(req.body);
      return updateStageHandler(req as any, reply);
    }
  );

  app.delete(
    '/:id/stages/:stageId',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Delete a stage',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    deleteStageHandler as any
  );

  // ─── Tracks ──────────────────────────────────────────────────────────────────

  app.post(
    '/:id/tracks',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Add a track',
        security: [{ BearerAuth: [] }],
        response: { 201: genericSuccessSchema, 400: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    (req, reply) => {
      req.body = createTrackSchema.parse(req.body);
      return createTrackHandler(req as any, reply);
    }
  );

  app.put(
    '/:id/tracks/:trackId',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Update a track',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    (req, reply) => {
      req.body = updateTrackSchema.parse(req.body);
      return updateTrackHandler(req as any, reply);
    }
  );

  app.delete(
    '/:id/tracks/:trackId',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Delete a track',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    deleteTrackHandler as any
  );

  // ─── Awards ──────────────────────────────────────────────────────────────────

  app.post(
    '/:id/awards',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Add an award',
        security: [{ BearerAuth: [] }],
        response: { 201: genericSuccessSchema, 400: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    (req, reply) => {
      req.body = createAwardSchema.parse(req.body);
      return createAwardHandler(req as any, reply);
    }
  );

  app.put(
    '/:id/awards/:awardId',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Update an award',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    (req, reply) => {
      req.body = updateAwardSchema.parse(req.body);
      return updateAwardHandler(req as any, reply);
    }
  );

  app.delete(
    '/:id/awards/:awardId',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Delete an award',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    deleteAwardHandler as any
  );
}
