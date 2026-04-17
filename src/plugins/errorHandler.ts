/**
 * @file src/plugins/errorHandler.ts
 * @description Global Fastify error handler plugin.
 *              Converts AppErrors and Zod/Fastify validation errors into
 *              the standard API error envelope.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { errorResponse } from '../utils/response';

/**
 * Error handler plugin.
 * Must be registered AFTER all routes so it can catch their errors.
 */
export default fp(async function errorHandlerPlugin(app: FastifyInstance) {
  app.setErrorHandler(
    (error: Error, request: FastifyRequest, reply: FastifyReply) => {
      // ── AppError (our custom hierarchy) ─────────────────────────────────
      if (error instanceof AppError) {
        request.log.warn({ err: error }, error.message);
        return reply.status(error.statusCode).send(
          errorResponse(error.code, error.message, error.details),
        );
      }

      // ── Zod validation error ─────────────────────────────────────────────
      if (error instanceof ZodError) {
        request.log.warn({ err: error }, 'Zod validation failed');
        return reply.status(422).send(
          errorResponse('VALIDATION_ERROR', 'Validation failed', error.issues),
        );
      }

      // ── Fastify built-in validation error (FST_ERR_VALIDATION) ───────────
      if ('statusCode' in error && (error as { statusCode?: number }).statusCode === 400) {
        request.log.warn({ err: error }, 'Request validation failed');
        return reply.status(400).send(
          errorResponse('BAD_REQUEST', error.message),
        );
      }

      // ── JWT errors ───────────────────────────────────────────────────────
      if (error.name === 'JsonWebTokenError' || error.name === 'TokenExpiredError') {
        return reply.status(401).send(
          errorResponse('UNAUTHORIZED', 'Invalid or expired token'),
        );
      }

      // ── Prisma Errors ───────────────────────────────────────────────────
      if (error.name === 'PrismaClientKnownRequestError') {
        request.log.warn({ err: error }, 'Prisma Database Error');
        return reply.status(400).send(
          errorResponse('BAD_REQUEST', 'Database operation failed due to a constraint or invalid reference.')
        );
      }

      // ── Unhandled / unexpected errors ────────────────────────────────────
      request.log.error({ err: error }, 'Unhandled error');
      return reply.status(500).send(
        errorResponse('INTERNAL_SERVER_ERROR', 'An unexpected error occurred'),
      );
    },
  );

  // 404 handler for unknown routes
  app.setNotFoundHandler((request: FastifyRequest, reply: FastifyReply) => {
    request.log.warn({ url: request.url }, 'Route not found');
    return reply.status(404).send(
      errorResponse('NOT_FOUND', `Route ${request.method} ${request.url} not found`),
    );
  });

  app.log.info('✅  Global error handler configured');
});
