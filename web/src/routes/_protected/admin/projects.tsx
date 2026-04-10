import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/shared/api/admin.service';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Input } from '@/shared/ui/input';
import {
  Rocket, Search, Eye,
  GitBranch, Link2, Video,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

export const Route = createFileRoute('/_protected/admin/projects')({
  component: AdminProjectsPage,
});

const PROJECT_STATUSES = ['ALL', 'DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'DISQUALIFIED'];

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-muted',
  SUBMITTED: 'bg-blue-500/10 text-blue-600 border-blue-100',
  UNDER_REVIEW: 'bg-yellow-400/10 text-yellow-700 border-yellow-200',
  ACCEPTED: 'bg-green-500/10 text-green-700 border-green-200',
  REJECTED: 'bg-red-500/10 text-red-600 border-red-200',
  DISQUALIFIED: 'bg-destructive/10 text-destructive border-destructive/20',
};

function AdminProjectsPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [search, setSearch] = useState('');
  const [viewProject, setViewProject] = useState<any | null>(null);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'projects', statusFilter, page],
    queryFn: () =>
      adminApi.listProjects({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        page,
        limit: 15,
      }),
    placeholderData: (prev) => prev,
  });

  const projects: any[] = data?.items || data || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 15);

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      adminApi.updateProjectStatus(id, status),
    onSuccess: () => {
      toast.success('Статус проекту оновлено.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'projects'] });
    },
    onError: () => toast.error('Помилка при зміні статусу'),
  });

  const filtered = projects.filter((p: any) =>
    p.title?.toLowerCase().includes(search.toLowerCase()) ||
    p.team?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Rocket className="w-7 h-7 text-purple-500" /> Projects
          </h1>
          <p className="text-muted-foreground mt-1">Всі проекти платформи. Всього: <strong>{total}</strong></p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Пошук проекту чи команди..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 w-64 rounded-xl"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {PROJECT_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => { setStatusFilter(s); setPage(1); }}
              className={cn(
                'text-[10px] font-black uppercase px-3 py-1.5 rounded-full border transition-all',
                statusFilter === s
                  ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                  : 'border-border text-muted-foreground hover:border-primary/40'
              )}
            >
              {s === 'ALL' ? 'Всі' : s.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <Card className="overflow-hidden border-primary/10 shadow-sm">
        <div className="grid grid-cols-[1fr_140px_120px_100px_80px] gap-4 px-5 py-3 bg-muted/50 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b">
          <span>Проект / Команда</span>
          <span>Статус</span>
          <span>Середній бал</span>
          <span>Подано</span>
          <span className="text-right">Дії</span>
        </div>

        {isLoading ? (
          <div className="divide-y">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="grid grid-cols-[1fr_140px_120px_100px_80px] gap-4 px-5 py-4 items-center">
                <div className="space-y-1">
                  <div className="h-4 w-48 bg-muted/60 rounded animate-pulse" />
                  <div className="h-3 w-28 bg-muted/40 rounded animate-pulse" />
                </div>
                <div className="h-5 w-20 bg-muted/60 rounded-full animate-pulse" />
                <div className="h-4 w-12 bg-muted/40 rounded animate-pulse" />
                <div className="h-4 w-16 bg-muted/40 rounded animate-pulse" />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3">
            <Rocket className="w-12 h-12 opacity-20" />
            <p className="font-bold text-lg">Проектів не знайдено</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {filtered.map((p: any) => (
              <div
                key={p.id}
                className="grid grid-cols-[1fr_140px_120px_100px_80px] gap-4 px-5 py-4 items-center hover:bg-muted/10 transition-colors"
              >
                <div>
                  <p className="font-bold">{p.title}</p>
                  <p className="text-xs text-muted-foreground">
                    Команда: {p.team?.name || '—'}
                    {p.team?.hackathon?.title && ` · ${p.team.hackathon.title}`}
                  </p>
                </div>

                {/* Editable status */}
                <select
                  value={p.status}
                  onChange={(e) => statusMutation.mutate({ id: p.id, status: e.target.value })}
                  className={cn(
                    'text-[10px] font-black uppercase px-2 py-1 rounded-full border cursor-pointer focus:outline-none focus:ring-1 focus:ring-primary',
                    STATUS_COLOR[p.status] || 'bg-muted'
                  )}
                >
                  {['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED', 'DISQUALIFIED'].map((s) => (
                    <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                  ))}
                </select>

                <div className="text-sm font-bold">
                  {p.averageScore != null ? (
                    <span className="text-primary">{Number(p.averageScore).toFixed(1)} pts</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </div>

                <div className="text-xs text-muted-foreground">
                  {p.submittedAt ? new Date(p.submittedAt).toLocaleDateString('uk-UA') : '—'}
                </div>

                <div className="flex justify-end">
                  <Button variant="ghost" size="icon" onClick={() => setViewProject(p)}>
                    <Eye className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-4 border-t bg-muted/20">
            <p className="text-sm text-muted-foreground">Сторінка {page} з {totalPages}</p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Назад</Button>
              <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Далі</Button>
            </div>
          </div>
        )}
      </Card>

      {/* Project Detail Modal */}
      <Dialog open={!!viewProject} onOpenChange={() => setViewProject(null)}>
        <DialogContent className="max-w-xl p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Rocket className="w-5 h-5 text-primary" />
              {viewProject?.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Команда: <strong>{viewProject?.team?.name}</strong> · Статус: {viewProject?.status}
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6 space-y-4">
            {viewProject?.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{viewProject.description}</p>
            )}
            <div className="space-y-2">
              {viewProject?.repoUrl && (
                <a href={viewProject.repoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <GitBranch className="w-4 h-4" /> Repository: {viewProject.repoUrl}
                </a>
              )}
              {viewProject?.demoUrl && (
                <a href={viewProject.demoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Link2 className="w-4 h-4" /> Demo: {viewProject.demoUrl}
                </a>
              )}
              {viewProject?.videoUrl && (
                <a href={viewProject.videoUrl} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-primary hover:underline">
                  <Video className="w-4 h-4" /> Video: {viewProject.videoUrl}
                </a>
              )}
            </div>
            {viewProject?.techStack?.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2">
                {viewProject.techStack.map((tech: string) => (
                  <Badge key={tech} variant="secondary" className="text-[10px] uppercase font-bold">{tech}</Badge>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="px-6 pb-6 border-t pt-4">
            <Button variant="secondary" onClick={() => setViewProject(null)}>Закрити</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
