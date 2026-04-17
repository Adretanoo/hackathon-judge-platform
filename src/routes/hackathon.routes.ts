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
  getMyHackathonsHandler,
  getHackathonByIdHandler,
  updateHackathonHandler,
  changeHackathonStatusHandler,
  completeHackathonHandler,
  createStageHandler,
  updateStageHandler,
  deleteStageHandler,
  createTrackHandler,
  updateTrackHandler,
  deleteTrackHandler,
  createAwardHandler,
  updateAwardHandler,
  deleteAwardHandler,
  registerParticipantHandler,
  listParticipantsHandler,
  assignJudgeHandler,
  removeJudgeHandler,
  listJudgesHandler,
} from '../controllers/hackathon.controller';
import {
  createCriteriaHandler,
  getCriteriaForHackathonHandler,
  deleteCriteriaHandler,
  updateCriteriaHandler,
} from '../controllers/criteria.controller';
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
  assignJudgeSchema,
} from '../schemas/hackathon.schema';
import { createCriteriaSchema, updateCriteriaSchema } from '../schemas/criteria.schema';

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
        body: createHackathonSchema,
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
    createHackathonHandler as any
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
    '/my',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'List my hackathons',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema },
      },
      preHandler: [app.authenticate],
    },
    getMyHackathonsHandler as any
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
        body: updateHackathonSchema,
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    updateHackathonHandler as any
  );

  app.patch(
    '/:id/status',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Change Hackathon status',
        security: [{ BearerAuth: [] }],
        body: changeHackathonStatusSchema,
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    changeHackathonStatusHandler as any
  );

  app.patch(
    '/:id/complete',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Complete a Hackathon',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    completeHackathonHandler as any
  );

  // ─── Stages ──────────────────────────────────────────────────────────────────

  app.post(
    '/:id/stages',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Add a stage',
        security: [{ BearerAuth: [] }],
        body: createStageSchema,
        response: { 201: genericSuccessSchema, 400: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    createStageHandler as any
  );

  app.put(
    '/:id/stages/:stageId',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Update a stage',
        security: [{ BearerAuth: [] }],
        body: updateStageSchema,
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    updateStageHandler as any
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
        body: createTrackSchema,
        response: { 201: genericSuccessSchema, 400: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    createTrackHandler as any
  );

  app.put(
    '/:id/tracks/:trackId',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Update a track',
        security: [{ BearerAuth: [] }],
        body: updateTrackSchema,
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    updateTrackHandler as any
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
        body: createAwardSchema,
        response: { 201: genericSuccessSchema, 400: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    createAwardHandler as any
  );

  app.put(
    '/:id/awards/:awardId',
    {
      schema: {
        tags: ['Hackathons'],
        summary: 'Update an award',
        security: [{ BearerAuth: [] }],
        body: updateAwardSchema,
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    updateAwardHandler as any
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

  // ─── Criteria ────────────────────────────────────────────────────────────────

  app.post(
    '/:id/criteria',
    {
      schema: {
        tags: ['Hackathons', 'Criteria'],
        summary: 'Add a judging criteria to a hackathon track',
        security: [{ BearerAuth: [] }],
        body: createCriteriaSchema,
        response: { 201: genericSuccessSchema, 400: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    createCriteriaHandler as any
  );

  app.get(
    '/:id/criteria',
    {
      schema: {
        tags: ['Hackathons', 'Criteria'],
        summary: 'Get all criteria for this hackathon',
        response: { 200: genericSuccessSchema },
      },
    },
    getCriteriaForHackathonHandler as any
  );

  app.patch(
    '/:id/criteria/:criterionId',
    {
      schema: {
        tags: ['Hackathons', 'Criteria'],
        summary: 'Update a judging criterion',
        security: [{ BearerAuth: [] }],
        body: updateCriteriaSchema,
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    updateCriteriaHandler as any
  );

  app.delete(
    '/:id/criteria/:criterionId',
    {
      schema: {
        tags: ['Hackathons', 'Criteria'],
        summary: 'Delete a judging criterion',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema, 404: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN], { context: 'hackathon', paramName: 'id' }),
      ],
    },
    deleteCriteriaHandler as any
  );

  // ─── Participants & Judges ───────────────────────────────────────────────

  app.post(
    '/:id/register',
    {
      schema: {
        tags: ['Hackathons', 'Participants'],
        summary: 'Register as a participant',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema, 400: errorSchema },
      },
      preHandler: [app.authenticate],
    },
    registerParticipantHandler as any
  );

  app.get(
    '/:id/participants',
    {
      schema: {
        tags: ['Hackathons', 'Participants'],
        summary: 'List all participants',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN], { context: 'hackathon', paramName: 'id' })
      ],
    },
    listParticipantsHandler as any
  );

  app.post(
    '/:id/judges/assign',
    {
      schema: {
        tags: ['Hackathons', 'Judges'],
        summary: 'Assign a judge to a hackathon or track',
        security: [{ BearerAuth: [] }],
        body: assignJudgeSchema,
        response: { 201: genericSuccessSchema, 400: errorSchema, 409: errorSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN], { context: 'hackathon', paramName: 'id' })
      ],
    },
    assignJudgeHandler as any
  );

  app.delete(
    '/:id/judges/:userId',
    {
      schema: {
        tags: ['Hackathons', 'Judges'],
        summary: 'Remove a judge from a hackathon',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN], { context: 'hackathon', paramName: 'id' })
      ],
    },
    removeJudgeHandler as any
  );

  app.get(
    '/:id/judges',
    {
      schema: {
        tags: ['Hackathons', 'Judges'],
        summary: 'List judges for a hackathon',
        security: [{ BearerAuth: [] }],
        response: { 200: genericSuccessSchema },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.ORGANIZER, RoleName.GLOBAL_ADMIN], { context: 'hackathon', paramName: 'id' })
      ],
    },
    listJudgesHandler as any
  );
}
