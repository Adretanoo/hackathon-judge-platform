/**
 * @file src/plugins/rateLimit.ts
 * @description Registers @fastify/rate-limit to protect the API from abuse.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import rateLimit from '@fastify/rate-limit';
import { env } from '../config';

/**
 * Rate-limit plugin.
 * Uses in-memory store by default; swap to Redis store in production.
 */
export default fp(async function rateLimitPlugin(app: FastifyInstance) {
  await app.register(rateLimit, {
    max: env.RATE_LIMIT_MAX,
    timeWindow: env.RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder(_req, context) {
      return {
        success: false,
        error: {
          code: 'TOO_MANY_REQUESTS',
          message: `Rate limit exceeded. Retry after ${Math.ceil(context.ttl / 1000)} seconds.`,
        },
      };
    },
  });

  app.log.info(
    { max: env.RATE_LIMIT_MAX, windowMs: env.RATE_LIMIT_WINDOW_MS },
    '✅  Rate limiting configured',
  );
});
