/**
 * @file src/plugins/prisma.ts
 * @description Decorates the Fastify instance with a shared PrismaClient.
 *              Ensures the connection is cleanly closed on server shutdown.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { env } from '../config';

/**
 * Prisma plugin.
 * Exposes `app.prisma` for use in routes and controllers.
 */
export default fp(async function prismaPlugin(app: FastifyInstance) {
  const prisma = new PrismaClient({
    log:
      env.NODE_ENV === 'development'
        ? ['query', 'info', 'warn', 'error']
        : ['warn', 'error'],
  });

  await prisma.$connect();
  app.log.info('✅  Prisma connected to database');

  app.decorate('prisma', prisma);

  app.addHook('onClose', async () => {
    await prisma.$disconnect();
    app.log.info('🔌  Prisma disconnected');
  });
});

// ─── Module augmentation ──────────────────────────────────────────────────────
declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient;
  }
}
