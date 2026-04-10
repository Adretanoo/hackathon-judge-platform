/**
 * @file src/server.ts
 * @description Application entry point.
 *              Builds the Fastify instance, registers all plugins and routes,
 *              then starts listening on the configured host:port.
 *
 * @module server
 */

import Fastify, { type FastifyInstance } from 'fastify';
import { env } from './config';
import { logger } from './utils/logger';

// ─── Plugins ──────────────────────────────────────────────────────────────────
import helmetPlugin from './plugins/helmet';
import corsPlugin from './plugins/cors';
import rateLimitPlugin from './plugins/rateLimit';
import swaggerPlugin from './plugins/swagger';
import cookiePlugin from './plugins/cookie';
import jwtPlugin from './plugins/jwt';
import prismaPlugin from './plugins/prisma';
import errorHandlerPlugin from './plugins/errorHandler';

// ─── Routes ───────────────────────────────────────────────────────────────────
import { registerRoutes } from './routes';

/**
 * Builds and configures the Fastify application instance.
 *
 * Separated from `start()` so the same instance can be used in integration
 * tests without actually binding to a port.
 *
 * @returns Configured FastifyInstance (not yet listening).
 */
export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: env.LOG_LEVEL,
      ...(env.NODE_ENV === 'development' && {
        transport: {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        },
      }),
    },
    trustProxy: true,
    requestIdHeader: 'x-request-id',
    requestIdLogLabel: 'requestId',
    disableRequestLogging: false,
    ajv: {
      customOptions: {
        strict: 'log',
        keywords: ['kind', 'modifier'],
      },
    },
  });

  // ── Security & infrastructure ────────────────────────────────────────────
  await app.register(helmetPlugin);
  await app.register(corsPlugin);
  await app.register(rateLimitPlugin);

  // ── Database ─────────────────────────────────────────────────────────────
  await app.register(prismaPlugin);

  // ── Auth ─────────────────────────────────────────────────────────────────
  await app.register(cookiePlugin);
  await app.register(jwtPlugin);

  // ── API documentation ────────────────────────────────────────────────────
  await app.register(swaggerPlugin);

  // ── Routes ───────────────────────────────────────────────────────────────
  await registerRoutes(app);

  // ── Error handling (must be last) ────────────────────────────────────────
  await app.register(errorHandlerPlugin);

  return app;
}

/**
 * Starts the HTTP server.
 * Handles graceful shutdown on SIGTERM / SIGINT.
 */
async function start(): Promise<void> {
  const app = await buildApp();

  // ── Graceful shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    logger.info({ signal }, '⏳  Received shutdown signal, closing server...');
    try {
      await app.close();
      logger.info('✅  Server closed gracefully');
      process.exit(0);
    } catch (err) {
      logger.error({ err }, '❌  Error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => void shutdown('SIGTERM'));
  process.on('SIGINT', () => void shutdown('SIGINT'));

  // ── Unhandled rejection guard ─────────────────────────────────────────────
  process.on('unhandledRejection', (reason) => {
    logger.error({ reason }, '🚨  Unhandled promise rejection');
  });

  // ── Start listening ───────────────────────────────────────────────────────
  try {
    const address = await app.listen({
      port: env.PORT,
      host: env.HOST,
    });

    logger.info(`🚀  Server running at ${address}`);
    logger.info(`📚  API docs available at ${address}/documentation`);
    logger.info(`💚  Health check at ${address}/health`);
  } catch (err) {
    logger.error({ err }, '❌  Failed to start server');
    process.exit(1);
  }
}

// ─── Entrypoint ───────────────────────────────────────────────────────────────
void start();
