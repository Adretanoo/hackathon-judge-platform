/**
 * @file src/routes/auth.routes.ts
 * @description Authentication route definitions with full OpenAPI annotations.
 */

import type { FastifyInstance } from 'fastify';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  meHandler,
  logoutHandler,
} from '../controllers/auth.controller';
import {
  registerBodySchema,
  loginBodySchema,
} from '../schemas/auth.schema';

// ─── Reusable sub-schemas ─────────────────────────────────────────────────────

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

const authDataSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        username: { type: 'string' },
        fullName: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: { type: 'string' },
      },
    },
  },
} as const;

const authSuccessSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: authDataSchema,
  },
} as const;

const tokenSuccessSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
      },
    },
  },
} as const;

const meSuccessSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'object',
      properties: {
        sub: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: { type: 'string' },
        iat: { type: 'number' },
        exp: { type: 'number' },
      },
    },
  },
} as const;

const logoutSuccessSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'object',
      properties: {
        message: { type: 'string' },
      },
    },
  },
} as const;

export async function authRoutes(app: FastifyInstance): Promise<void> {
  // ── POST /auth/register ──────────────────────────────────────────────────
  app.post(
    '/register',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Register a new account',
        description: 'Creates a new user account and returns an access token via body and refresh token via HttpOnly cookie.',
        security: [],
        body: {
          type: 'object',
          required: ['username', 'fullName', 'email', 'password'],
          properties: {
            username: { type: 'string', minLength: 3, maxLength: 50 },
            fullName: { type: 'string', minLength: 2, maxLength: 100 },
            email: { type: 'string', format: 'email' },
            password: { type: 'string', minLength: 8 },
            role: { type: 'string', enum: ['GLOBAL_ADMIN', 'ORGANIZER', 'JUDGE', 'MENTOR', 'PARTICIPANT'] },
          },
        },
        response: {
          201: { description: 'Account created successfully', ...authSuccessSchema },
          409: { description: 'Conflict', ...errorSchema },
          422: { description: 'Validation error', ...errorSchema },
        },
      },
      preHandler: async (request) => {
        request.body = registerBodySchema.parse(request.body);
      },
    },
    registerHandler,
  );

  // ── POST /auth/login ─────────────────────────────────────────────────────
  app.post(
    '/login',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Login',
        description: 'Authenticates and returns an access token via body and refresh token via HttpOnly cookie.',
        security: [],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            password: { type: 'string' },
          },
        },
        response: {
          200: { description: 'Login successful', ...authSuccessSchema },
          401: { description: 'Invalid credentials', ...errorSchema },
        },
      },
      preHandler: async (request) => {
        request.body = loginBodySchema.parse(request.body);
      },
    },
    loginHandler,
  );

  // ── POST /auth/refresh ───────────────────────────────────────────────────
  app.post(
    '/refresh',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Refresh access token',
        description: 'Reads refresh token from HttpOnly cookie and issues a new access + refresh token.',
        security: [],
        response: {
          200: { description: 'Token refreshed', ...tokenSuccessSchema },
          401: { description: 'Invalid or expired refresh token', ...errorSchema },
        },
      },
    },
    refreshHandler,
  );

  // ── POST /auth/logout ────────────────────────────────────────────────────
  app.post(
    '/logout',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Logout',
        description: 'Revokes the refresh token and clears the cookie.',
        security: [],
        response: {
          200: { description: 'Logged out successfully', ...logoutSuccessSchema },
        },
      },
    },
    logoutHandler,
  );

  // ── GET /auth/me ─────────────────────────────────────────────────────────
  app.get(
    '/me',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Get current user',
        description: 'Returns the JWT payload of the currently authenticated user.',
        response: {
          200: { description: 'Current user profile', ...meSuccessSchema },
          401: { description: 'Not authenticated', ...errorSchema },
        },
      },
      preHandler: [app.authenticate],
    },
    meHandler,
  );
}
