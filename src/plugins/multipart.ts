/**
 * @file src/plugins/multipart.ts
 * @description Configures @fastify/multipart for file uploads.
 */

import fp from 'fastify-plugin';
import fastifyMultipart from '@fastify/multipart';

export default fp(async (app) => {
  await app.register(fastifyMultipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
  });
});
