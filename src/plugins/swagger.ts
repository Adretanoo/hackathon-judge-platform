/**
 * @file src/plugins/swagger.ts
 * @description Registers @fastify/swagger and @fastify/swagger-ui (Scalar theme).
 *              API docs available at GET /documentation
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { env } from '../config';

/**
 * Swagger / OpenAPI plugin.
 * Registers the OpenAPI spec generator and the Scalar UI viewer.
 */
export default fp(async function swaggerPlugin(app: FastifyInstance) {
  await app.register(swagger, {
    openapi: {
      openapi: '3.0.3',
      info: {
        title: 'Hackathon Judge Platform API',
        description:
          'REST API for automated hackathon evaluation and judging. ' +
          'Supports multi-role access (Admin, Judge, Participant), ' +
          'project submissions, scoring criteria, and real-time leaderboards.',
        version: '1.0.0',
        contact: {
          name: 'API Support',
          email: 'support@hackathon-judge.dev',
        },
        license: {
          name: 'MIT',
          url: 'https://opensource.org/licenses/MIT',
        },
      },
      servers: [
        {
          url: `http://${env.HOST}:${env.PORT}`,
          description: 'Local development server',
        },
      ],
      tags: [
        { name: 'Health', description: 'Service health endpoints' },
        { name: 'Auth', description: 'Authentication & token management' },
        { name: 'Users', description: 'User management (Admin)' },
        { name: 'Hackathons', description: 'Hackathon lifecycle management' },
        { name: 'Projects', description: 'Project submissions' },
        { name: 'Criteria', description: 'Judging criteria configuration' },
        { name: 'Scores', description: 'Score submission and aggregation' },
        { name: 'Leaderboard', description: 'Real-time leaderboard' },
      ],
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'JWT access token obtained from /api/v1/auth/login',
          },
        },
      },
      security: [{ BearerAuth: [] }],
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
      defaultModelsExpandDepth: 3,
      displayRequestDuration: true,
      filter: true,
    },
    staticCSP: true,
    transformStaticCSP: (header) => header,
    logo: {
      type: 'image/svg+xml',
      content: Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
      ),
    },
  });

  app.log.info('✅  Swagger UI available at /documentation');
});
