import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/shared/api/project.service';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Card, CardContent } from '@/shared/ui/card';
import {
  GitBranch, ExternalLink, Send, Save, FileText,
  AlertCircle, CheckCircle2, Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

interface ProjectTabProps {
  team: any;
  project: any | null;
  onUpdated: () => void;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  DRAFT:        { label: 'Чернетка',    color: 'text-muted-foreground', icon: <FileText className="h-3.5 w-3.5" /> },
  SUBMITTED:    { label: 'Подано',      color: 'text-blue-600',          icon: <Send className="h-3.5 w-3.5" /> },
  UNDER_REVIEW: { label: 'На розгляді', color: 'text-amber-600',         icon: <AlertCircle className="h-3.5 w-3.5" /> },
  REVIEWED:     { label: 'Оцінено',     color: 'text-emerald-600',       icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  WINNER:       { label: '🏆 Переможець', color: 'text-yellow-600',      icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
};

export function ProjectTab({ team, project, onUpdated }: ProjectTabProps) {
  const queryClient = useQueryClient();
  const isSubmitted = project?.status === 'SUBMITTED' || project?.status === 'UNDER_REVIEW' || project?.status === 'REVIEWED' || project?.status === 'WINNER';

  const [form, setForm] = useState({
    title:       project?.title       ?? '',
    description: project?.description ?? '',
    repoUrl:     project?.repoUrl     ?? '',
    demoUrl:     project?.demoUrl     ?? '',
  });
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save every 30s
  useEffect(() => {
    if (!isDirty || isSubmitted) return;
    const t = setTimeout(() => project ? saveDraftMutation.mutate() : null, 30_000);
    return () => clearTimeout(t);
  }, [isDirty, form, isSubmitted]);

  const update = (field: string, value: string) => {
    setForm(f => ({ ...f, [field]: value }));
    setIsDirty(true);
  };

  // ─── Create project ───────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => projectApi.create({
      title: form.title,
      description: form.description || undefined,
      repoUrl: form.repoUrl || undefined,
      demoUrl: form.demoUrl || undefined,
      teamId: team.id,
    }),
    onSuccess: () => {
      toast.success('Проєкт збережено!');
      setIsDirty(false);
      setLastSaved(new Date());
      onUpdated();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? 'Помилка при збереженні'),
  });

  // ─── Save draft ───────────────────────────────────────────────────────────
  const saveDraftMutation = useMutation({
    mutationFn: () => projectApi.update(project!.id, {
      title: form.title,
      description: form.description || undefined,
      repoUrl: form.repoUrl || undefined,
      demoUrl: form.demoUrl || undefined,
    }),
    onSuccess: () => {
      setIsDirty(false);
      setLastSaved(new Date());
      toast.success('Чернетку збережено', { duration: 2000 });
      onUpdated();
    },
    onError: () => toast.error('Помилка при збереженні чернетки'),
  });

  // ─── Submit ───────────────────────────────────────────────────────────────
  const submitMutation = useMutation({
    mutationFn: async () => {
      // Save latest data first, then change status to SUBMITTED
      if (project) {
        await projectApi.update(project.id, form);
        await projectApi.changeStatus(project.id, 'SUBMITTED');
      } else {
        const created = await projectApi.create({ ...form, teamId: team.id });
        await projectApi.changeStatus(created.id, 'SUBMITTED');
      }
    },
    onSuccess: () => {
      toast.success('🚀 Проєкт подано!', { description: 'Судді отримали ваш проєкт.' });
      onUpdated();
      queryClient.invalidateQueries({ queryKey: ['participant', 'status'] });
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? 'Помилка при поданні'),
  });

  const isSaving = createMutation.isPending || saveDraftMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      {project && (
        <div className={cn('flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-bold', isSubmitted ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-muted/30')}>
          {STATUS_CONFIG[project.status]?.icon}
          {STATUS_CONFIG[project.status]?.label ?? project.status}
          {isSubmitted && <span className="text-xs font-normal ml-auto text-muted-foreground">Редагування заблоковано</span>}
        </div>
      )}

      {/* Form */}
      <Card className="border">
        <CardContent className="p-6 space-y-5">
          <h3 className="font-black text-base flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {project ? 'Редагувати проєкт' : 'Новий проєкт'}
          </h3>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Назва *</label>
              <Input
                placeholder="EcoAI — розумний моніторинг лісів"
                value={form.title}
                onChange={e => update('title', e.target.value)}
                disabled={isSubmitted}
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Опис</label>
              <Textarea
                placeholder="Опишіть ваш проєкт: яку проблему вирішує, яке рішення пропонує..."
                value={form.description}
                onChange={e => update('description', e.target.value)}
                disabled={isSubmitted}
                className="rounded-xl resize-none h-32"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <GitBranch className="h-3 w-3" /> Репозиторій
                </label>
                <Input
                  placeholder="https://github.com/..."
                  value={form.repoUrl}
                  onChange={e => update('repoUrl', e.target.value)}
                  disabled={isSubmitted}
                  className="rounded-xl"
                  type="url"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <ExternalLink className="h-3 w-3" /> Demo URL
                </label>
                <Input
                  placeholder="https://eco-ai.vercel.app"
                  value={form.demoUrl}
                  onChange={e => update('demoUrl', e.target.value)}
                  disabled={isSubmitted}
                  className="rounded-xl"
                  type="url"
                />
              </div>
            </div>
          </div>

          {/* Auto-save status */}
          {lastSaved && !isDirty && (
            <p className="text-[11px] text-muted-foreground flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Збережено о {lastSaved.toLocaleTimeString()}
            </p>
          )}
          {isDirty && <p className="text-[11px] text-amber-500">• Незбережені зміни</p>}
        </CardContent>
      </Card>

      {/* Action Buttons */}
      {!isSubmitted && (
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <Button
            variant="outline"
            className="rounded-xl gap-2"
            disabled={!isDirty || isSaving}
            onClick={() => project ? saveDraftMutation.mutate() : createMutation.mutate()}
          >
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Зберегти чернетку
          </Button>

          <Button
            className="rounded-xl gap-2 font-bold px-6 shadow-sm"
            disabled={!form.title.trim() || submitMutation.isPending}
            onClick={() => submitMutation.mutate()}
          >
            {submitMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            🚀 Подати проєкт
          </Button>
        </div>
      )}
    </div>
  );
}
