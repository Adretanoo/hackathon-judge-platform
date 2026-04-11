/**
 * @file web/src/widgets/notifications/NotificationBell.tsx
 * @description Bell icon with unread badge + popover dropdown of recent notifications.
 * Polls every 60s for unread count. Reacts to real-time 'notification' socket events later.
 */

import { useState } from 'react';
import { Bell, Check, CheckCheck, Trash2, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationApi, type Notification } from '@/shared/api/notification.service';
import { Button } from '@/shared/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/shared/ui/popover';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { formatDistanceToNow } from '@/shared/lib/date';

// ─── Icon per notification type ──────────────────────────────────────────────
const TYPE_ICON: Record<string, string> = {
  TEAM_INVITE:              '🤝',
  JUDGE_ASSIGNED:           '⚖️',
  PROJECT_SUBMITTED:        '📦',
  SCORING_STARTED:          '🏁',
  CONFLICT_DETECTED:        '⚠️',
  HACKATHON_STATUS_CHANGED: '🔔',
  CAPTAIN_TRANSFERRED:      '👑',
  TEAM_LEFT:                '🚪',
  HACKATHON_LEFT:           '🚪',
};

// ─── Sub-component: single item ───────────────────────────────────────────────
function NotificationItem({
  n,
  onRead,
  onDelete,
}: {
  n: Notification;
  onRead: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const meta = n.metadata as any;
  const actionUrl = meta?.actionUrl as string | undefined;

  return (
    <div
      className={cn(
        'relative px-4 py-3 flex gap-3 transition-colors hover:bg-muted/40 group',
        !n.isRead && 'bg-primary/5 border-l-2 border-primary'
      )}
    >
      {/* Emoji icon */}
      <div className="text-xl shrink-0 mt-0.5 select-none">
        {TYPE_ICON[n.type] ?? '🔔'}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-semibold leading-tight truncate', !n.isRead && 'text-foreground')}>
          {n.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{n.body}</p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {formatDistanceToNow(n.createdAt)}
        </p>
      </div>

      {/* Actions (appear on hover) */}
      <div className="flex items-start gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        {!n.isRead && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-primary hover:text-primary/80"
            title="Позначити прочитаним"
            onClick={(e) => { e.stopPropagation(); onRead(n.id); }}
          >
            <Check className="h-3.5 w-3.5" />
          </Button>
        )}
        {actionUrl && (
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-muted-foreground"
            title="Перейти"
            onClick={(e) => { e.stopPropagation(); window.location.href = actionUrl; }}
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 text-muted-foreground hover:text-destructive"
          title="Видалити"
          onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

// ─── Main Bell component ──────────────────────────────────────────────────────
export function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  // Unread count (fast, cached, polls every 60s)
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: notificationApi.getUnreadCount,
    refetchInterval: 60_000,
    staleTime: 30_000,
  });

  // Full list (fetched when popover opens)
  const { data: result, isLoading } = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => notificationApi.list(1, 15),
    enabled: open,
    staleTime: 20_000,
  });

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['notifications'] });
  };

  const readMutation = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: invalidate,
  });

  const readAllMutation = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => { invalidate(); toast.success('Всі сповіщення прочитано'); },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationApi.delete,
    onSuccess: invalidate,
  });

  const items = result?.items ?? [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-muted-foreground hover:text-foreground"
          aria-label="Сповіщення"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[9px] font-black leading-none">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        align="end"
        className="w-80 p-0 shadow-xl rounded-2xl overflow-hidden"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4 text-primary" />
            <h3 className="font-bold text-sm">Сповіщення</h3>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs gap-1.5 text-muted-foreground hover:text-foreground"
              onClick={() => readAllMutation.mutate()}
              disabled={readAllMutation.isPending}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Прочитати всі
            </Button>
          )}
        </div>

        {/* List */}
        <div className="max-h-80 overflow-y-auto divide-y">
          {isLoading && (
            <div className="p-6 text-center text-sm text-muted-foreground animate-pulse">
              Завантаження...
            </div>
          )}

          {!isLoading && items.length === 0 && (
            <div className="p-8 text-center">
              <Bell className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Немає сповіщень</p>
            </div>
          )}

          {items.map((n) => (
            <NotificationItem
              key={n.id}
              n={n}
              onRead={(id) => readMutation.mutate(id)}
              onDelete={(id) => deleteMutation.mutate(id)}
            />
          ))}
        </div>

        {/* Footer */}
        {(result?.total ?? 0) > 15 && (
          <div className="border-t px-4 py-2 text-center">
            <Button variant="ghost" size="sm" className="text-xs text-primary">
              Переглянути всі ({result?.total})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
