/**
 * @file src/plugins/cors.ts
 * @description Registers @fastify/cors with environment-driven origin list.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { env } from '../config';

/**
 * CORS plugin.
 * Reads allowed origins from the CORS_ORIGIN env variable (comma-separated).
 */
export default fp(async function corsPlugin(app: FastifyInstance) {
  const origins = env.CORS_ORIGIN.split(',').map((o) => o.trim());

  await app.register(cors, {
    origin: origins,
    credentials: env.CORS_CREDENTIALS,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-Id'],
    exposedHeaders: ['X-Request-Id'],
    maxAge: 86_400, // 24 h preflight cache
  });

  app.log.info({ origins }, '✅  CORS configured');
});
