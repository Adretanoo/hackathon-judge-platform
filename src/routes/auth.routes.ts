/**
 * @file src/routes/auth.routes.ts
 * @description Authentication route definitions with full OpenAPI annotations.
 *
 * NOTE: Every response schema must satisfy AJV + fast-json-stringify requirements:
 *  - `type` must be specified
 *  - error responses (`4xx`) must include `properties`
 *  - `description` is only a documentation string, not a schema keyword at
 *     the properties-value level, so we keep it at the schema root only.
 */

import type { FastifyInstance } from 'fastify';
import {
  registerHandler,
  loginHandler,
  refreshHandler,
  meHandler,
} from '../controllers/auth.controller';
import {
  registerBodySchema,
  loginBodySchema,
  refreshTokenBodySchema,
} from '../schemas/auth.schema';

// ─── Reusable sub-schemas ─────────────────────────────────────────────────────

/** Standard error response envelope */
const errorSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [false] },
    error: {
      type: 'object',
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: {},
      },
    },
  },
} as const;

/** Auth token pair + user profile */
const authDataSchema = {
  type: 'object',
  properties: {
    accessToken: { type: 'string' },
    refreshToken: { type: 'string' },
    user: {
      type: 'object',
      properties: {
        id: { type: 'string', format: 'uuid' },
        name: { type: 'string' },
        email: { type: 'string', format: 'email' },
        role: { type: 'string', enum: ['ADMIN', 'JUDGE', 'PARTICIPANT'] },
      },
    },
  },
} as const;

/** Success envelope wrapping auth data */
const authSuccessSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: authDataSchema,
  },
} as const;

/** Success envelope wrapping token pair only */
const tokenSuccessSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean', enum: [true] },
    data: {
      type: 'object',
      properties: {
        accessToken: { type: 'string' },
        refreshToken: { type: 'string' },
      },
    },
  },
} as const;

/** Success envelope wrapping the JWT payload (me endpoint) */
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

// ─── Route registration ───────────────────────────────────────────────────────

/**
 * Registers /auth/* routes on the Fastify instance.
 *
 * @param app - Fastify application instance.
 */
export async function authRoutes(app: FastifyInstance): Promise<void> {
  // ── POST /auth/register ──────────────────────────────────────────────────
  app.post(
    '/register',
    {
      schema: {
        tags: ['Auth'],
        summary: 'Register a new account',
        description:
          'Creates a new user account and returns a JWT token pair. ' +
          'Passwords must contain at least one uppercase letter, lowercase letter and digit.',
        security: [],
        body: {
          type: 'object',
          required: ['name', 'email', 'password'],
          properties: {
            name: {
              type: 'string',
              minLength: 2,
              maxLength: 100,
              description: 'Full name of the user',
              examples: ['Jane Doe'],
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'Unique email address',
              examples: ['jane@example.com'],
            },
            password: {
              type: 'string',
              minLength: 8,
              description: 'Password (min 8 chars, must include upper, lower, digit)',
              examples: ['Secret123'],
            },
            role: {
              type: 'string',
              enum: ['ADMIN', 'JUDGE', 'PARTICIPANT'],
              default: 'PARTICIPANT',
              description: 'Account role',
            },
          },
        },
        response: {
          201: {
            description: 'Account created successfully',
            ...authSuccessSchema,
          },
          409: {
            description: 'Email already in use',
            ...errorSchema,
          },
          422: {
            description: 'Validation error',
            ...errorSchema,
          },
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
        description:
          'Authenticates with email + password and returns a JWT access + refresh token pair.',
        security: [],
        body: {
          type: 'object',
          required: ['email', 'password'],
          properties: {
            email: {
              type: 'string',
              format: 'email',
              examples: ['jane@example.com'],
            },
            password: {
              type: 'string',
              examples: ['Secret123'],
            },
          },
        },
        response: {
          200: {
            description: 'Login successful',
            ...authSuccessSchema,
          },
          401: {
            description: 'Invalid credentials',
            ...errorSchema,
          },
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
        description:
          'Exchanges a valid refresh token for a new access + refresh token pair.',
        security: [],
        body: {
          type: 'object',
          required: ['refreshToken'],
          properties: {
            refreshToken: { type: 'string' },
          },
        },
        response: {
          200: {
            description: 'Token refreshed',
            ...tokenSuccessSchema,
          },
          401: {
            description: 'Invalid or expired refresh token',
            ...errorSchema,
          },
        },
      },
      preHandler: async (request) => {
        request.body = refreshTokenBodySchema.parse(request.body);
      },
    },
    refreshHandler,
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
          200: {
            description: 'Current user profile',
            ...meSuccessSchema,
          },
          401: {
            description: 'Not authenticated',
            ...errorSchema,
          },
        },
      },
      preHandler: [app.authenticate],
    },
    meHandler,
  );
}
