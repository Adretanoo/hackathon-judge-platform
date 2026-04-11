/**
 * @file web/src/shared/api/notification.service.ts
 * @description API client for notification endpoints.
 */

import { authClient } from './auth-client';

export interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListResult {
  items: Notification[];
  total: number;
  page: number;
  limit: number;
  unreadCount: number;
}

export const notificationApi = {
  list: async (page = 1, limit = 20): Promise<NotificationListResult> => {
    const { data } = await authClient.get(`/notifications?page=${page}&limit=${limit}`);
    return data.data;
  },

  getUnreadCount: async (): Promise<number> => {
    const { data } = await authClient.get('/notifications/unread-count');
    return data.data.count;
  },

  markRead: async (id: string): Promise<void> => {
    await authClient.patch(`/notifications/${id}/read`);
  },

  markAllRead: async (): Promise<void> => {
    await authClient.patch('/notifications/read-all');
  },

  delete: async (id: string): Promise<void> => {
    await authClient.delete(`/notifications/${id}`);
  },
};
