/**
 * @file src/services/audit.service.ts
 * @description Immutable action logging for compliance, debugging, and admin visibility.
 * Use AuditService.for(app).log() inside any other service to record actions.
 */

import { FastifyInstance } from 'fastify';
import { AuditAction, AuditEntityType, Prisma } from '@prisma/client';

type AuditQueryFilters = {
  entityType?: AuditEntityType;
  entityId?: string;
  userId?: string;
  action?: AuditAction;
  from?: Date;
  to?: Date;
  page: number;
  limit: number;
};

export class AuditService {
  constructor(private app: FastifyInstance) {}

  /**
   * Static factory for use inside other services.
   * Usage: await AuditService.for(this.app).log({ ... })
   */
  static for(app: FastifyInstance): AuditService {
    return new AuditService(app);
  }

  /**
   * Record an audit log entry. Fire-and-forget safe — errors are logged but not thrown.
   */
  async log(params: {
    userId: string;
    action: AuditAction;
    entityType: AuditEntityType;
    entityId: string;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.app.prisma.auditLog.create({
        data: {
          userId:     params.userId,
          action:     params.action,
          entityType: params.entityType,
          entityId:   params.entityId,
          metadata:   (params.metadata ?? {}) as any,
        },
      });
    } catch (err) {
      // Audit failures must NEVER break business logic
      this.app.log.warn({ err }, '[AuditService] Failed to write audit log');
    }
  }

  /**
   * Query audit logs with rich filtering for admin panel.
   */
  async query(filters: AuditQueryFilters) {
    const where: Prisma.AuditLogWhereInput = {};

    if (filters.entityType) where.entityType = filters.entityType;
    if (filters.entityId)   where.entityId   = filters.entityId;
    if (filters.userId)     where.userId      = filters.userId;
    if (filters.action)     where.action      = filters.action;

    if (filters.from || filters.to) {
      where.createdAt = {};
      if (filters.from) (where.createdAt as any).gte = filters.from;
      if (filters.to)   (where.createdAt as any).lte = filters.to;
    }

    const skip = (filters.page - 1) * filters.limit;

    const [items, total] = await Promise.all([
      this.app.prisma.auditLog.findMany({
        where,
        skip,
        take: filters.limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { id: true, username: true, fullName: true, avatarUrl: true },
          },
        },
      }),
      this.app.prisma.auditLog.count({ where }),
    ]);

    return {
      items,
      total,
      page: filters.page,
      limit: filters.limit,
      totalPages: Math.ceil(total / filters.limit),
    };
  }
}
