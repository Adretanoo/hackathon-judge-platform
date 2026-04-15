/**
 * @file src/plugins/jwt.ts
 * @description Registers @fastify/jwt and decorates the Fastify instance
 *              with authenticate / optionalAuthenticate helpers.
 */

import fp from 'fastify-plugin';
import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import fastifyJwt from '@fastify/jwt';
import { env } from '../config';
import { UnauthorizedError } from '../utils/errors';
import type { JwtPayload } from '../types';

/**
 * JWT plugin.
 * Adds `app.authenticate` and `app.optionalAuthenticate` decorators.
 */
export default fp(async function jwtPlugin(app: FastifyInstance) {
  await app.register(fastifyJwt, {
    secret: env.JWT_SECRET,
    sign: {
      expiresIn: env.JWT_EXPIRES_IN,
    },
  });

  /**
   * Decorator: verifies the Bearer token and sets `request.user`.
   * Throws 401 if missing or invalid.
   */
  app.decorate(
    'authenticate',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      try {
        // Support token in query parameter for file downloads (CSV, PDF)
        const qToken = (request.query as any)?.token;
        if (!request.headers.authorization && qToken) {
          request.headers.authorization = `Bearer ${qToken}`;
        }
        
        await request.jwtVerify<JwtPayload>();
      } catch {
        throw new UnauthorizedError('Invalid or expired access token');
      }
    },
  );

  /**
   * Decorator: verifies the token if present, but does NOT throw if absent.
   * Useful for public endpoints that need to know about the user optionally.
   */
  app.decorate(
    'optionalAuthenticate',
    async (request: FastifyRequest, _reply: FastifyReply) => {
      const authHeader = request.headers.authorization;
      if (authHeader?.startsWith('Bearer ')) {
        try {
          await request.jwtVerify<JwtPayload>();
        } catch {
          // Silently ignore invalid tokens for optional auth
        }
      }
    },
  );

  app.log.info('✅  JWT plugin configured');
});

// ─── Module augmentation ──────────────────────────────────────────────────────
declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
    optionalAuthenticate: (
      request: FastifyRequest,
      reply: FastifyReply,
    ) => Promise<void>;
  }
}
