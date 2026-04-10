import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/shared/api/admin.service';
import { CreateHackathonModal } from '@/features/hackathons/components/modals/CreateHackathonModal';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import {
  Trophy, Plus, Search, Edit2, Trash2,
  Settings2,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

export const Route = createFileRoute('/_protected/admin/hackathons')({
  component: AdminHackathonsPage,
});

const STATUS_OPTIONS = [
  'DRAFT', 'PUBLISHED', 'REGISTRATION_OPEN', 'REGISTRATION_CLOSED',
  'IN_PROGRESS', 'JUDGING', 'COMPLETED', 'ARCHIVED',
];

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-muted',
  PUBLISHED: 'bg-blue-500/10 text-blue-600 border-blue-200',
  REGISTRATION_OPEN: 'bg-green-500/10 text-green-700 border-green-200',
  REGISTRATION_CLOSED: 'bg-orange-500/10 text-orange-600 border-orange-200',
  IN_PROGRESS: 'bg-primary/10 text-primary border-primary/20',
  JUDGING: 'bg-purple-500/10 text-purple-600 border-purple-200',
  COMPLETED: 'bg-gray-500/10 text-gray-600 border-gray-200',
  ARCHIVED: 'bg-gray-300/10 text-gray-400 border-gray-100',
};

function AdminHackathonsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingHackathon, setEditingHackathon] = useState<any | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'hackathons', page, search],
    queryFn: () => adminApi.listHackathons({ page, limit: 15, search: search || undefined }),
    placeholderData: (prev) => prev,
  });

  const hackathons: any[] = data?.items || [];
  const total: number = data?.total || 0;
  const totalPages = Math.ceil(total / 15);

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteHackathon(id),
    onSuccess: () => {
      toast.success('Хакатон видалено.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'hackathons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error?.message || 'Не вдалося видалити хакатон'),
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.changeHackathonStatus(id, status),
    onSuccess: () => {
      toast.success('Статус змінено.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'hackathons'] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error?.message || 'Не вдалося змінити статус'),
  });

  const handleDelete = (h: any) => {
    if (h.status !== 'DRAFT') {
      toast.error('Видалити можна лише хакатони зі статусом DRAFT');
      return;
    }
    if (window.confirm(`Видалити «${h.title}»? Цю дію не можна відмінити.`)) {
      deleteMutation.mutate(h.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Trophy className="w-7 h-7 text-yellow-500" /> Hackathons
          </h1>
          <p className="text-muted-foreground mt-1">
            Управління всіма хакатонами платформи. Всього: <strong>{total}</strong>
          </p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="font-bold gap-2 shadow-lg" size="lg">
          <Plus className="w-5 h-5" /> Створити хакатон
        </Button>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Пошук по назві..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="pl-9 rounded-xl"
        />
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-primary/10 shadow-sm">
        {/* Table head */}
        <div className="grid grid-cols-[1fr_140px_160px_120px_120px] gap-4 px-5 py-3 bg-muted/50 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b">
          <span>Назва</span>
          <span>Статус</span>
          <span>Дати</span>
          <span>Команди</span>
          <span className="text-right">Дії</span>
        </div>

        {isLoading ? (
          <div className="divide-y">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_140px_160px_120px_120px] gap-4 px-5 py-4 items-center">
                <div className="h-5 bg-muted/60 rounded-md animate-pulse w-48" />
                <div className="h-5 bg-muted/60 rounded-full animate-pulse w-20" />
                <div className="h-4 bg-muted/60 rounded-md animate-pulse w-32" />
                <div className="h-4 bg-muted/60 rounded-md animate-pulse w-10" />
                <div className="h-8 bg-muted/60 rounded-md animate-pulse ml-auto w-20" />
              </div>
            ))}
          </div>
        ) : hackathons.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Trophy className="w-12 h-12 opacity-20" />
            <p className="font-bold text-lg">Хакатонів не знайдено</p>
            <Button onClick={() => setIsCreateOpen(true)} variant="outline">Створити перший</Button>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {hackathons.map((h: any) => (
              <div
                key={h.id}
                className="grid grid-cols-[1fr_140px_160px_120px_120px] gap-4 px-5 py-4 items-center hover:bg-muted/10 transition-colors"
              >
                {/* Title */}
                <div>
                  <p className="font-bold leading-tight">{h.title}</p>
                  {h.subtitle && (
                    <p className="text-xs text-muted-foreground truncate max-w-xs">{h.subtitle}</p>
                  )}
                </div>

                {/* Status dropdown */}
                <div>
                  <select
                    value={h.status}
                    onChange={(e) => statusMutation.mutate({ id: h.id, status: e.target.value })}
                    className={cn(
                      'text-[10px] font-black uppercase px-2 py-1 rounded-full border cursor-pointer',
                      'focus:outline-none focus:ring-1 focus:ring-primary',
                      STATUS_COLOR[h.status] || 'bg-muted'
                    )}
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Dates */}
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>🗓 {new Date(h.startDate).toLocaleDateString('uk-UA')}</p>
                  <p>🏁 {new Date(h.endDate).toLocaleDateString('uk-UA')}</p>
                </div>

                {/* Teams count */}
                <div className="text-sm font-bold text-muted-foreground">
                  {h._count?.teams ?? '—'} команд
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Панель управління"
                    asChild
                  >
                    <Link to="/organizer/hackathons/$hackathonId" params={{ hackathonId: h.id }}>
                      <Settings2 className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Редагувати"
                    onClick={() => { setEditingHackathon(h); setIsCreateOpen(true); }}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    title="Видалити (лише DRAFT)"
                    className="text-destructive hover:bg-destructive/10"
                    onClick={() => handleDelete(h)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">
              Сторінка {page} з {totalPages} (всього {total})
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                Назад
              </Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                Далі
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Modal */}
      <CreateHackathonModal
        isOpen={isCreateOpen}
        onClose={() => { setIsCreateOpen(false); setEditingHackathon(null); }}
        editHackathon={editingHackathon}
      />
    </div>
  );
}
