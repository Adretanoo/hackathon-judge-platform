/**
 * @file src/routes/audit.routes.ts
 * @description Admin-only read API for the audit trail.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AuditService } from '../services/audit.service';
import { successResponse } from '../utils/response';
import { AuditAction, AuditEntityType, RoleName } from '@prisma/client';
import { ForbiddenError } from '../utils/errors';

export async function auditRoutes(app: FastifyInstance) {
  const svc = new AuditService(app);

  /**
   * GET /audit-logs
   * Admin-only endpoint to query the audit trail with rich filters.
   */
  app.get(
    '/',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Audit'],
        summary: 'Query audit logs (admin only)',
        security: [{ BearerAuth: [] }],
        querystring: z.object({
          entityType: z.nativeEnum(AuditEntityType).optional(),
          entityId:   z.string().optional(),
          userId:     z.string().optional(),
          action:     z.nativeEnum(AuditAction).optional(),
          from:       z.string().datetime().optional(),
          to:         z.string().datetime().optional(),
          page:       z.coerce.number().min(1).default(1),
          limit:      z.coerce.number().min(1).max(200).default(50),
        }),
      },
    },
    async (req, reply) => {
      const callerId = (req.user as any).sub;

      // Only GLOBAL_ADMIN can read audit logs
      const adminRole = await app.prisma.userRole.findFirst({
        where: { userId: callerId, roleName: RoleName.GLOBAL_ADMIN, hackathonId: null },
      });
      if (!adminRole) throw new ForbiddenError('Admin access required');

      const q = req.query as any;
      const result = await svc.query({
        entityType: q.entityType,
        entityId:   q.entityId,
        userId:     q.userId,
        action:     q.action,
        from:       q.from ? new Date(q.from) : undefined,
        to:         q.to   ? new Date(q.to)   : undefined,
        page:       q.page,
        limit:      q.limit,
      });

      return reply.send(successResponse(result));
    }
  );
}
