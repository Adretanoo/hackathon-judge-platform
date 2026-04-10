/**
 * @file src/middleware/requireRole.ts
 * @description Fastify preHandler factory that enforces role-based access control.
 */

import type { FastifyReply, FastifyRequest, preHandlerHookHandler } from 'fastify';
import type { UserRole } from '../types';
import { ForbiddenError } from '../utils/errors';

/**
 * Creates a Fastify preHandler that restricts access to users with one of
 * the specified roles.  Call `app.authenticate` in the same route's
 * preHandler array before this hook.
 *
 * @param roles - Allowed roles for the route.
 * @returns     Fastify preHandler hook.
 *
 * @example
 * ```ts
 * {
 *   preHandler: [app.authenticate, requireRole(UserRole.ADMIN)],
 * }
 * ```
 */
export function requireRole(...roles: UserRole[]): preHandlerHookHandler {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = request.user as { role: UserRole } | undefined;

    if (!user) {
      throw new ForbiddenError('Authentication required');
    }

    if (!roles.includes(user.role)) {
      throw new ForbiddenError(
        `Access denied. Required role(s): ${roles.join(', ')}`,
      );
    }
  };
}
