/**
 * @file src/services/notification.service.ts
 * @description In-app notification creation, retrieval, and read-state management.
 * Pushes real-time updates via Socket.io when available.
 */

import { FastifyInstance } from 'fastify';
import { NotificationType } from '@prisma/client';

const UNREAD_CACHE_TTL = 300; // 5 minutes

export class NotificationService {
  constructor(private app: FastifyInstance) {}

  /**
   * Create a notification and push it to the user in real-time.
   */
  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    body: string;
    metadata?: Record<string, unknown>;
  }) {
    const notification = await this.app.prisma.notification.create({
      data: {
        userId:   params.userId,
        type:     params.type,
        title:    params.title,
        body:     params.body,
        metadata: (params.metadata ?? {}) as any,
      },
    });

    // Push real-time via Socket.io (if plugin is attached)
    if ((this.app as any).io) {
      (this.app as any).io
        .to(`user:${params.userId}`)
        .emit('notification', notification);
    }

    // Invalidate cached unread count
    await this.app.redis.del(`notifs:unread:${params.userId}`);

    return notification;
  }

  /**
   * Bulk-create notifications (e.g. notify all hackathon participants).
   */
  async createBulk(
    userIds: string[],
    params: Omit<Parameters<NotificationService['create']>[0], 'userId'>
  ) {
    const results = await Promise.allSettled(
      userIds.map((userId) => this.create({ ...params, userId }))
    );
    return results;
  }

  /**
   * List notifications for a user, paginated.
   */
  async listForUser(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [items, total, unreadCount] = await Promise.all([
      this.app.prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.app.prisma.notification.count({ where: { userId } }),
      this.getUnreadCount(userId),
    ]);

    return { items, total, page, limit, unreadCount };
  }

  /**
   * Get unread count from Redis cache (fallback to DB).
   */
  async getUnreadCount(userId: string): Promise<number> {
    const cacheKey = `notifs:unread:${userId}`;
    const cached = await this.app.redis.get(cacheKey);
    if (cached !== null) return parseInt(cached, 10);

    const count = await this.app.prisma.notification.count({
      where: { userId, isRead: false },
    });

    await this.app.redis.setex(cacheKey, UNREAD_CACHE_TTL, String(count));
    return count;
  }

  /**
   * Mark a single notification as read.
   */
  async markRead(notificationId: string, userId: string) {
    const notif = await this.app.prisma.notification.findUnique({
      where: { id: notificationId },
    });

    if (!notif || notif.userId !== userId) {
      return null; // silently ignore — no leaking info about other users
    }

    if (notif.isRead) return notif; // already read, skip DB write

    const updated = await this.app.prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });

    await this.app.redis.del(`notifs:unread:${userId}`);
    return updated;
  }

  /**
   * Mark all notifications as read for a user.
   */
  async markAllRead(userId: string) {
    await this.app.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    await this.app.redis.set(`notifs:unread:${userId}`, '0', 'EX', UNREAD_CACHE_TTL);
  }

  /**
   * Delete a notification (user can dismiss it).
   */
  async delete(notificationId: string, userId: string) {
    const notif = await this.app.prisma.notification.findUnique({
      where: { id: notificationId },
    });
    if (!notif || notif.userId !== userId) return null;

    await this.app.prisma.notification.delete({ where: { id: notificationId } });
    await this.app.redis.del(`notifs:unread:${userId}`);
    return { deleted: true };
  }
}
