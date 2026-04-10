/**
 * @file src/routes/health.routes.ts
 * @description Health-check route definitions with full, AJV-compatible response schemas.
 *
 * NOTE: Every response schema must be a complete JSON Schema object with `type`
 *       and `properties` so that fast-json-stringify can build the serializer
 *       without throwing "description must be object,boolean".
 */

import type { FastifyInstance } from 'fastify';
import { livenessHandler, readinessHandler } from '../controllers/health.controller';

// ─── Reusable sub-schemas ─────────────────────────────────────────────────────

/** Status of a single dependency (database, redis…) */
const dependencyStatusSchema = {
  type: 'object',
  properties: {
    status: { type: 'string', enum: ['ok', 'error'] },
    latencyMs: { type: 'number' },
    error: { type: 'string' },
  },
} as const;

/** Full readiness report returned by GET /health/ready */
const healthReportSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok', 'degraded', 'error'] },
        timestamp: { type: 'string', format: 'date-time' },
        uptime: { type: 'number' },
        version: { type: 'string' },
        environment: { type: 'string' },
        dependencies: {
          type: 'object',
          properties: {
            database: dependencyStatusSchema,
            redis: dependencyStatusSchema,
          },
        },
      },
    },
  },
} as const;

/** Lightweight liveness response */
const livenessSchema = {
  type: 'object',
  properties: {
    success: { type: 'boolean' },
    data: {
      type: 'object',
      properties: {
        status: { type: 'string', enum: ['ok'] },
        timestamp: { type: 'string', format: 'date-time' },
      },
    },
  },
} as const;

// ─── Route registration ───────────────────────────────────────────────────────

/**
 * Registers health-check routes on the Fastify instance.
 *
 * @param app - Fastify application instance.
 */
export async function healthRoutes(app: FastifyInstance): Promise<void> {
  // ── GET /health ────────────────────────────────────────────────────────────
  app.get(
    '/health',
    {
      config: { rateLimit: { max: 300, timeWindow: '1 minute' } },
      schema: {
        tags: ['Health'],
        summary: 'Liveness check',
        description:
          'Returns 200 if the server process is running. ' +
          'No dependency checks — suitable for Kubernetes liveness probes.',
        security: [],
        response: {
          200: {
            description: 'Service is alive',
            ...livenessSchema,
          },
        },
      },
    },
    livenessHandler,
  );

  // ── GET /health/ready ──────────────────────────────────────────────────────
  app.get(
    '/health/ready',
    {
      config: { rateLimit: { max: 60, timeWindow: '1 minute' } },
      schema: {
        tags: ['Health'],
        summary: 'Readiness check',
        description:
          'Returns 200 when all dependencies (database, Redis) are reachable. ' +
          'Returns 503 when the service is not ready to accept traffic. ' +
          'Suitable for Kubernetes readiness probes.',
        security: [],
        response: {
          200: {
            description: 'Service is fully ready',
            ...healthReportSchema,
          },
          503: {
            description: 'Service is not ready — one or more dependencies are down',
            ...healthReportSchema,
          },
        },
      },
    },
    readinessHandler,
  );
}
