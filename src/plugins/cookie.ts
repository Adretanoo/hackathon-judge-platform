/**
 * @file src/plugins/cookie.ts
 * @description Registers @fastify/cookie for securely managing HTTP-only cookies,
 *              primarily used for refresh tokens.
 */

import fp from 'fastify-plugin';
import cookie, { type FastifyCookieOptions } from '@fastify/cookie';
import type { FastifyInstance } from 'fastify';
import { env } from '../config';

export default fp(async function cookiePlugin(app: FastifyInstance) {
  await app.register(cookie, {
    secret: env.JWT_SECRET, // using secret to optionally sign cookies, though httpOnly + secure is primary defense
    hook: 'onRequest',
  } as FastifyCookieOptions);

  app.log.info('✅  Cookie plugin configured');
});
