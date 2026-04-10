/**
 * @file src/middleware/auth.ts
 * @description RBAC Middleware helpers for Fastify.
 *              Validates user roles against global or hackathon-specific contexts.
 */

import type { FastifyReply, FastifyRequest } from 'fastify';
import { RoleName } from '@prisma/client';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import type { JwtPayload } from '../types';

export interface RoleGuardOptions {
  /** 
   * 'global' relies on the primary role inside the JWT payload.
   * 'hackathon' queries the DB to Verify a hackathon-scoped UserRole. 
   */
  context?: 'global' | 'hackathon';
  /** Path param or body field name containing the Hackathon ID (default: 'hackathonId') */
  paramName?: string;
  /** Allow GLOBAL_ADMIN to bypass (default: true) */
  allowGlobalAdminBypass?: boolean;
}

/**
 * Creates a preHandler middleware to enforce role-based access control.
 * IMPORTANT: Must be placed AFTER `app.authenticate` in the preHandler array.
 * 
 * @param allowedRoles - Array of RoleName that are permitted access.
 * @param options - Configuration for context-aware limits.
 */
export function hasRole(
  allowedRoles: RoleName[],
  options: RoleGuardOptions = {}
) {
  const {
    context = 'global',
    paramName = 'hackathonId',
    allowGlobalAdminBypass = true,
  } = options;

  return async (request: FastifyRequest, _reply: FastifyReply) => {
    const user = request.user as JwtPayload | undefined;

    if (!user || !user.sub) {
      throw new UnauthorizedError('Authentication required');
    }

    const userJwtRole = user.role as RoleName;

    // GLOBAL_ADMIN bypass — JWT fast-path first, then DB fallback
    // (handles the case where GLOBAL_ADMIN was assigned after the JWT was issued)
    if (allowGlobalAdminBypass) {
      if (userJwtRole === RoleName.GLOBAL_ADMIN) {
        return;
      }
      const dbAdminRole = await request.server.prisma.userRole.findFirst({
        where: { userId: user.sub, roleName: RoleName.GLOBAL_ADMIN, hackathonId: null },
      });
      if (dbAdminRole) return;
    }

    // Global context — use JWT role
    if (context === 'global') {
      if (!allowedRoles.includes(userJwtRole)) {
        throw new ForbiddenError('Insufficient global permissions');
      }
      return;
    }

    // Hackathon context — check DB for scoped role
    if (context === 'hackathon') {
      const params = request.params as Record<string, any>;
      const body = request.body as Record<string, any>;
      const query = request.query as Record<string, any>;
      const hackathonId = params?.[paramName] || body?.[paramName] || query?.[paramName];

      if (!hackathonId) {
        throw new ForbiddenError(`Missing ${paramName} context for role check`);
      }

      const userRoleRecord = await request.server.prisma.userRole.findFirst({
        where: { userId: user.sub, hackathonId, roleName: { in: allowedRoles } },
      });

      if (!userRoleRecord) {
        throw new ForbiddenError('Insufficient permissions for this hackathon context');
      }
    }
  };
}
