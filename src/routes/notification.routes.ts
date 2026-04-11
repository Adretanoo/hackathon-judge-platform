/**
 * @file src/routes/notification.routes.ts
 * @description CRUD API for user notifications.
 * All endpoints are protected and scoped to the authenticated user — no cross-user leakage.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { NotificationService } from '../services/notification.service';
import { successResponse } from '../utils/response';

const paginationSchema = z.object({
  page:  z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

export async function notificationRoutes(app: FastifyInstance) {
  const svc = new NotificationService(app);

  /**
   * GET /notifications
   * List notifications for the authenticated user (paginated).
   */
  app.get(
    '/',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Notifications'],
        summary: 'List notifications for current user',
        security: [{ BearerAuth: [] }],
        querystring: paginationSchema,
      },
    },
    async (req, reply) => {
      const userId = (req.user as any).sub;
      const { page, limit } = req.query as any;
      const result = await svc.listForUser(userId, page, limit);
      return reply.send(successResponse(result));
    }
  );

  /**
   * GET /notifications/unread-count
   * Returns the cached unread count — used to power the bell badge.
   */
  app.get(
    '/unread-count',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Notifications'],
        summary: 'Get unread notification count',
        security: [{ BearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const userId = (req.user as any).sub;
      const count = await svc.getUnreadCount(userId);
      return reply.send(successResponse({ count }));
    }
  );

  /**
   * PATCH /notifications/:id/read
   * Mark a single notification as read.
   */
  app.patch(
    '/:id/read',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Notifications'],
        summary: 'Mark notification as read',
        security: [{ BearerAuth: [] }],
        params: z.object({ id: z.string() }),
      },
    },
    async (req, reply) => {
      const userId = (req.user as any).sub;
      const { id } = req.params as { id: string };
      await svc.markRead(id, userId);
      return reply.send(successResponse({ ok: true }));
    }
  );

  /**
   * PATCH /notifications/read-all
   * Mark ALL unread notifications as read.
   */
  app.patch(
    '/read-all',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Notifications'],
        summary: 'Mark all notifications as read',
        security: [{ BearerAuth: [] }],
      },
    },
    async (req, reply) => {
      const userId = (req.user as any).sub;
      await svc.markAllRead(userId);
      return reply.send(successResponse({ ok: true }));
    }
  );

  /**
   * DELETE /notifications/:id
   * Delete (dismiss) a single notification.
   */
  app.delete(
    '/:id',
    {
      preHandler: [app.authenticate],
      schema: {
        tags: ['Notifications'],
        summary: 'Delete a notification',
        security: [{ BearerAuth: [] }],
        params: z.object({ id: z.string() }),
      },
    },
    async (req, reply) => {
      const userId = (req.user as any).sub;
      const { id } = req.params as { id: string };
      await svc.delete(id, userId);
      return reply.send(successResponse({ ok: true }));
    }
  );
}
