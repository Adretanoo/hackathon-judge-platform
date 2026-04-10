/**
 * @file src/routes/user.routes.ts
 * @description Route definitions for User Management (Admin/Organizer).
 */

import type { FastifyInstance } from 'fastify';
import { RoleName } from '@prisma/client';
import { hasRole } from '../middleware/auth';
import {
  getUsersHandler,
  getUserByIdHandler,
  updateUserHandler,
  deleteUserHandler,
  assignRoleHandler,
} from '../controllers/user.controller';
import {
  listUsersQuerySchema,
  updateUserAdminSchema,
  assignRoleSchema,
} from '../schemas/user.schema';
import { idParamCuidSchema } from '../schemas/common';

export async function userRoutes(app: FastifyInstance): Promise<void> {
  // Common error response schema
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

  const successWrapper = (dataSchema: any) => ({
    type: 'object',
    properties: {
      success: { type: 'boolean', enum: [true] },
      data: dataSchema,
    },
  });

  // ─── GET /users ────────────────────────────────────────────────────────────

  app.get(
    '/',
    {
      schema: {
        tags: ['Users'],
        summary: 'List all users',
        description: 'Allowed roles: GLOBAL_ADMIN, ORGANIZER. Supports search by username/email/skills.',
        security: [{ BearerAuth: [] }],
        querystring: {
          type: 'object',
          properties: {
            page: { type: 'number', minimum: 1, default: 1 },
            limit: { type: 'number', minimum: 1, maximum: 100, default: 20 },
            search: { type: 'string' },
            role: { type: 'string', enum: Object.values(RoleName) },
            skills: { type: 'string' },
            sortBy: { type: 'string' },
            sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'asc' },
          },
        },
        response: {
          200: successWrapper({
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              items: { type: 'array', items: { type: 'object', additionalProperties: true } },
            },
          }),
          401: errorSchema,
          403: errorSchema,
        },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.GLOBAL_ADMIN, RoleName.ORGANIZER]),
      ],
    },
    (req, reply) => {
      // Manual parse because schema description differs slightly from Zod
      req.query = listUsersQuerySchema.parse(req.query);
      return getUsersHandler(req as any, reply);
    },
  );

  // ─── GET /users/:id ────────────────────────────────────────────────────────

  app.get(
    '/:id',
    {
      schema: {
        tags: ['Users'],
        summary: 'Get user details by ID',
        security: [{ BearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: {
          200: successWrapper({ type: 'object', additionalProperties: true }),
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
        },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.GLOBAL_ADMIN, RoleName.ORGANIZER]),
      ],
    },
    (req, reply) => {
      req.params = idParamCuidSchema.parse(req.params);
      return getUserByIdHandler(req as any, reply);
    },
  );

  // ─── PATCH /users/:id ──────────────────────────────────────────────────────

  app.patch(
    '/:id',
    {
      schema: {
        tags: ['Users'],
        summary: 'Update user profile (Admin)',
        security: [{ BearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        body: {
          type: 'object',
          properties: {
            fullName: { type: 'string' },
            avatarUrl: { type: 'string', format: 'uri' },
            bio: { type: 'string' },
            skills: { type: 'array', items: { type: 'string' } },
            isActive: { type: 'boolean' },
            isVerified: { type: 'boolean' },
          },
        },
        response: {
          200: successWrapper({ type: 'object', additionalProperties: true }),
          400: errorSchema,
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
        },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.GLOBAL_ADMIN, RoleName.ORGANIZER]),
      ],
    },
    (req, reply) => {
      req.params = idParamCuidSchema.parse(req.params);
      req.body = updateUserAdminSchema.parse(req.body);
      return updateUserHandler(req as any, reply);
    },
  );

  // ─── DELETE /users/:id ─────────────────────────────────────────────────────

  app.delete(
    '/:id',
    {
      schema: {
        tags: ['Users'],
        summary: 'Delete user account',
        security: [{ BearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        response: {
          200: successWrapper({
            type: 'object',
            properties: { success: { type: 'boolean', enum: [true] } },
          }),
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
        },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.GLOBAL_ADMIN, RoleName.ORGANIZER]),
      ],
    },
    (req, reply) => {
      req.params = idParamCuidSchema.parse(req.params);
      return deleteUserHandler(req as any, reply);
    },
  );

  // ─── POST /users/:id/roles ─────────────────────────────────────────────────

  app.post(
    '/:id/roles',
    {
      schema: {
        tags: ['Users'],
        summary: 'Assign a new role to user',
        description: 'Assigns a global or hackathon-scoped role.',
        security: [{ BearerAuth: [] }],
        params: {
          type: 'object',
          properties: { id: { type: 'string' } },
          required: ['id'],
        },
        body: {
          type: 'object',
          required: ['role'],
          properties: {
            role: { type: 'string', enum: Object.values(RoleName) },
            hackathonId: { type: 'string' },
          },
        },
        response: {
          200: successWrapper({
            type: 'object',
            properties: {
              success: { type: 'boolean' },
              message: { type: 'string' },
            },
          }),
          400: errorSchema,
          401: errorSchema,
          403: errorSchema,
          404: errorSchema,
        },
      },
      preHandler: [
        app.authenticate,
        hasRole([RoleName.GLOBAL_ADMIN, RoleName.ORGANIZER]),
      ],
    },
    (req, reply) => {
      req.params = idParamCuidSchema.parse(req.params);
      req.body = assignRoleSchema.parse(req.body);
      return assignRoleHandler(req as any, reply);
    },
  );
}
