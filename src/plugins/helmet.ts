/**
 * @file src/plugins/helmet.ts
 * @description Registers @fastify/helmet for security headers.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import helmet from '@fastify/helmet';

/**
 * Helmet plugin – sets secure HTTP headers on every response.
 */
export default fp(async function helmetPlugin(app: FastifyInstance) {
  await app.register(helmet, {
    // Allow Swagger UI to load its inline scripts/styles
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
  });

  app.log.info('✅  Helmet security headers configured');
});
