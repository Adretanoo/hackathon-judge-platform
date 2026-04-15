import { useState, useEffect, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { judgingApi } from '@/shared/api/judging.service';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Textarea } from '@/shared/ui/textarea';
import { cn } from '@/shared/lib/utils';
import {
  GitBranch, ExternalLink, ShieldAlert, CheckCircle2,
  ChevronRight, Send, Loader2, AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { JudgingProject, ProjectCriterion, ScoreItem } from '@/shared/api/judging.service';
import { useJudgingStore } from '../store/judging.store';

interface ScorePanelProps {
  project: JudgingProject;
  hackathonId: string;
  onNext?: () => void;
  nextLabel?: string;
}

// ─── Score Form State ────────────────────────────────────────────────────────

type ScoreMap = Record<string, number>; // criteriaId → scoreValue

export function ScorePanel({ project, hackathonId, onNext, nextLabel }: ScorePanelProps) {
  const queryClient = useQueryClient();
  const commentRef = useRef<HTMLTextAreaElement>(null);

  // ─── Data Fetching ──────────────────────────────────────────────────────

  const { data: criteria, isLoading: loadingCriteria } = useQuery({
    queryKey: ['project', project.id, 'criteria'],
    queryFn: () => judgingApi.getProjectCriteria(project.id),
    staleTime: 60_000,
  });

  const { data: existingScores } = useQuery({
    queryKey: ['project', project.id, 'my-scores'],
    queryFn: async () => {
      const { authClient } = await import('@/shared/api/auth-client');
      // Get my user id from localStorage or session
      const meRes = await authClient.get('/auth/me');
      const me = meRes.data?.data;
      return judgingApi.getMyScores(project.id, me?.id ?? '');
    },
    enabled: project.isScored || !!project.myScore,
  });

  // ─── Local Score State ───────────────────────────────────────────────────

  const [scores, setScores] = useState<ScoreMap>({});
  const [comment, setComment] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  const { draftScores, saveDraft, clearDraft, isBlindJudging } = useJudgingStore();

  // Pre-fill with existing scores or local draft
  useEffect(() => {
    if (isDirty) return; // Prevent overwriting user's active input!

    const localDraft = draftScores[project.id];
    const safeCriteria = criteria || [];
    const safeScores = existingScores || [];

    if (safeScores.length > 0) {
      const map: ScoreMap = {};
      safeScores.forEach((s: any) => {
        map[s.criteriaId] = s.scoreValue;
        if (s.comment) setComment(s.comment);
      });
      setScores(map);
    } else if (localDraft) {
      // Load from Zustand local storage draft
      const map: ScoreMap = {};
      for (const [cId, val] of Object.entries(localDraft.scores)) {
        map[cId] = Number(val);
      }
      setScores(map);
      setComment(localDraft.notes);
      setIsDirty(true);
    } else if (safeCriteria.length > 0) {
      // Default all to 0
      const defaults: ScoreMap = {};
      safeCriteria.forEach(c => { defaults[c.id] = 0; });
      setScores(defaults);
    }
  }, [existingScores, criteria, project.id, isDirty]);

  // ─── Submit / Draft Mutations ────────────────────────────────────────────

  const buildPayload = (): ScoreItem[] => {
    const safeCriteria = criteria || [];
    return safeCriteria.map(c => ({
      criteriaId: c.id,
      scoreValue: scores[c.id] ?? 0,
      comment: comment || undefined,
    }));
  };

  const submitMutation = useMutation({
    mutationFn: () => judgingApi.submitScores(project.id, buildPayload()),
    onSuccess: () => {
      toast.success('✅ Оцінку збережено!', { description: `Проєкт «${project.title}» успішно оцінено.` });
      setIsDirty(false);
      setLastSaved(new Date());
      queryClient.invalidateQueries({ queryKey: ['judging', 'projects', hackathonId] });
      queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      clearDraft(project.id); // clear local draft on successful submit
      // Auto-navigate to next project after brief delay
      if (onNext) setTimeout(onNext, 800);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message ?? 'Помилка при збереженні оцінки';
      toast.error('❌ Помилка', { description: msg });
    },
  });

  // ─── Local Auto-save draft every 5s ─────────────────────────────────────

  useEffect(() => {
    const safeCriteria = criteria || [];
    if (!isDirty || safeCriteria.length === 0) return;
    const timer = setTimeout(() => {
      // Save to local Zustand store instead of backend
      const draftMap: Record<string, string> = {};
      for (const [k, v] of Object.entries(scores)) {
        draftMap[k] = String(v);
      }
      saveDraft(project.id, { scores: draftMap, notes: comment });
      setLastSaved(new Date());
    }, 5000); // 5 sec debounce
    return () => clearTimeout(timer);
  }, [isDirty, scores, comment, project.id, saveDraft, criteria?.length]);

  // ─── Score Update ────────────────────────────────────────────────────────

  const setScore = useCallback((id: string, value: number) => {
    setScores(prev => ({ ...prev, [id]: value }));
    setIsDirty(true);
  }, []);

  // ─── Keyboard: Enter to submit ───────────────────────────────────────────

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      if (!project.hasConflict) submitMutation.mutate();
    }
  };

  // ─── Auto Evaluate (AI Copilot) ──────────────────────────────────────────

  const aiMutation = useMutation({
    mutationFn: () => judgingApi.autoEvaluateProject(project.id),
    onSuccess: (data: any) => {
      if (data && Array.isArray(data.scores)) {
        const aiScores: ScoreMap = {};
        data.scores.forEach((s: any) => {
          aiScores[s.criteriaId] = s.scoreValue;
        });
        setScores(aiScores);
        setComment(data.generalComment || 'Оцінено за допомогою ШІ.');
        setIsDirty(true);
        toast.success('🤖 AI Аналіз завершено', { description: 'Оцінки запропоновані. Не забудьте перевірити та підтвердити!' });
      }
    },
    onError: (err: any) => {
      toast.error('❌ Помилка AI', { description: err?.response?.data?.error?.message ?? 'Не вдалося виконати автоматичне оцінювання' });
    }
  });

  const handleAutoEvaluate = () => {
    aiMutation.mutate();
  };

  // ─── Calculated total score (weighted) ───────────────────────────────────

  const safeCriteria = criteria || [];

  const totalWeightedScore = safeCriteria.reduce((sum, c) => {
    const raw = scores[c.id] ?? 0;
    let max = Number(c.maxScore);
    if (isNaN(max) || max <= 0) max = 10;
    return sum + (raw / max) * Number(c.weight) * 100;
  }, 0);
  const totalWeight = safeCriteria.reduce((sum, c) => sum + Number(c.weight), 0);
  const normalizedScore = totalWeight > 0 ? (totalWeightedScore / (totalWeight * 100)) * 100 : 0;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className="h-full flex flex-col overflow-hidden bg-muted/10"
      onKeyDown={handleKeyDown}
    >
      {/* ── Project Header ── */}
      <div className={cn("px-6 py-4 border-b flex items-start justify-between gap-4 shrink-0 transition-colors", project.isScored && !isDirty ? "bg-muted/30" : "bg-background")}>
        <div className="space-y-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl font-black truncate">{project.title}</h2>
            {project.isScored && (
              <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px] font-bold">
                <CheckCircle2 className="h-3 w-3 mr-1" /> Оцінено
              </Badge>
            )}
            {project.hasConflict && (
              <Badge variant="destructive" className="text-[10px] font-bold">
                <ShieldAlert className="h-3 w-3 mr-1" /> Конфлікт
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            Команда: <span className={cn("font-semibold", isBlindJudging && "italic blur-sm select-none")}>
              {isBlindJudging ? 'Hidden (Blind Judging)' : (project.team?.name ?? '—')}
            </span>
          </p>
        </div>

        {/* Links */}
        <div className="flex items-center gap-2 shrink-0">
          {project.repoUrl && (
            <Button variant="outline" size="sm" asChild className="gap-2 rounded-xl">
              <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                <GitBranch className="h-3.5 w-3.5" /> Repo
              </a>
            </Button>
          )}
          {project.demoUrl && (
            <Button variant="outline" size="sm" asChild className="gap-2 rounded-xl">
              <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Demo
              </a>
            </Button>
          )}
        </div>
      </div>

      {/* ── Conflict Warning ── */}
      {project.hasConflict && (
        <div className="mx-6 mt-4 p-4 rounded-xl border border-destructive/30 bg-destructive/5 flex items-start gap-3 shrink-0">
          <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-destructive text-sm">Конфлікт інтересів</p>
            <p className="text-xs text-destructive/80 mt-0.5">
              Ви пов'язані з цією командою. Організатор має надати дозвіл на оцінювання.
            </p>
          </div>
        </div>
      )}

      {/* ── Scored Notice ── */}
      {project.isScored && !isDirty && (
        <div className="mx-6 mt-4 p-4 rounded-xl border border-emerald-500/30 bg-emerald-500/5 flex items-start gap-3 shrink-0 animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
          <div>
            <p className="font-bold text-emerald-700 dark:text-emerald-500 text-sm">Проєкт вже успішно оцінено</p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-0.5">
              Ваші попередні бали автоматично завантажено. Ви переглядаєте їх. Щоб відредагувати, просто змініть значення і натисніть «Зберегти зміни».
            </p>
          </div>
        </div>
      )}

      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 grid grid-cols-1 xl:grid-cols-5 gap-6">

          {/* Left: Project Description */}
          <div className="xl:col-span-2 space-y-4">
            {project.description && (
              <div className="p-4 rounded-xl bg-muted/30 border">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-2">Опис проєкту</p>
                <p className="text-sm leading-relaxed">{project.description}</p>
              </div>
            )}

            {/* Score Preview */}
            {safeCriteria.length > 0 && (
              <div className="p-4 rounded-xl border bg-card">
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground mb-3">Поточний бал</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl font-black tracking-tight text-primary">
                    {normalizedScore.toFixed(1)}
                  </span>
                  <span className="text-lg text-muted-foreground mb-1">/ 100</span>
                </div>
                <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-300"
                    style={{ width: `${Math.min(normalizedScore, 100)}%` }}
                  />
                </div>
              </div>
            )}

            {/* Auto-save status */}
            {lastSaved && (
              <p className="text-[10px] text-muted-foreground text-center">
                ✓ Збережено о {lastSaved.toLocaleTimeString()}
              </p>
            )}
            {isDirty && (
              <p className="text-[10px] text-amber-500 text-center">
                • Незбережені зміни
              </p>
            )}
          </div>

          {/* Right: Criteria + Comment */}
          <div className="xl:col-span-3 space-y-4">
            {loadingCriteria ? (
              <CriteriaSkeleton />
            ) : safeCriteria.length === 0 ? (
              <div className="p-8 text-center rounded-xl border-2 border-dashed space-y-2">
                <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Критеріїв не знайдено для цього треку.</p>
                <p className="text-xs text-muted-foreground">Зверніться до організатора.</p>
              </div>
            ) : (
              <>
                <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">
                  Критерії оцінювання ({safeCriteria.length})
                </h3>
                <div className="space-y-3">
                  {safeCriteria.map((criterion, index) => (
                    <CriterionRow
                      key={criterion.id}
                      criterion={criterion}
                      value={scores[criterion.id] ?? 0}
                      onChange={(v) => setScore(criterion.id, v)}
                      tabIndex={index + 1}
                      disabled={project.hasConflict ?? false}
                    />
                  ))}
                </div>

                {/* Comment */}
                <div className="space-y-2 pt-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
                    Коментар для команди (необов'язково)
                  </label>
                  <Textarea
                    ref={commentRef}
                    value={comment}
                    onChange={e => { setComment(e.target.value); setIsDirty(true); }}
                    placeholder="Напишіть ваші враження, сильні та слабкі сторони проєкту..."
                    className="h-28 resize-none text-sm rounded-xl"
                    tabIndex={safeCriteria.length + 1}
                    disabled={project.hasConflict ?? false}
                  />
                  <p className="text-[10px] text-muted-foreground">
                    Команда побачить цей коментар після завершення західу. · Ctrl+Enter = Підтвердити
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Sticky Footer: Action Bar ── */}
      <div className="px-6 py-4 border-t bg-background flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
          {/* Draft button removed since it auto-saves locally */}
          {lastSaved && (
            <span className="text-[10px] bg-muted px-2 py-1 rounded-md text-muted-foreground mr-2">
              Чернетку {lastSaved.toLocaleTimeString()}
            </span>
          )}
          {!project.hasConflict && safeCriteria.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2 rounded-xl text-indigo-500 border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 dark:border-indigo-900 dark:hover:bg-indigo-900/40"
              onClick={handleAutoEvaluate}
              disabled={aiMutation.isPending}
            >
              {aiMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : '🤖'}
              {aiMutation.isPending ? 'Аналіз...' : 'ШІ Оцінка'}
            </Button>
          )}
        </div>

        <div className="flex items-center gap-3">
          {onNext && (
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 rounded-xl text-muted-foreground"
              onClick={onNext}
            >
              {nextLabel ?? 'Наступний'} <ChevronRight className="h-4 w-4" />
            </Button>
          )}

          <Button
            size="default"
            variant={project.isScored && !isDirty ? 'secondary' : 'default'}
            className={cn("gap-2 font-bold rounded-xl px-6 shadow-sm transition-all", project.isScored && isDirty && "bg-amber-500 hover:bg-amber-600 text-white")}
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending || project.hasConflict || safeCriteria.length === 0}
          >
            {submitMutation.isPending ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> {project.isScored ? 'Оновлення...' : 'Збереження...'}</>
            ) : (
              <><Send className="h-4 w-4" /> {project.isScored ? (isDirty ? '💾 Зберегти нові зміни' : 'Редагувати оцінку') : 'Підтвердити оцінку'}</>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Criterion Row ────────────────────────────────────────────────────────────

function CriterionRow({
  criterion,
  value,
  onChange,
  tabIndex,
  disabled,
}: {
  criterion: ProjectCriterion;
  value: number;
  onChange: (v: number) => void;
  tabIndex: number;
  disabled: boolean;
}) {
  let maxScore = Number(criterion.maxScore);
  if (isNaN(maxScore) || maxScore <= 0) maxScore = 10;

  const percent = maxScore > 0 ? (value / maxScore) * 100 : 0;

  const colorClass =
    percent >= 80 ? 'text-emerald-600' :
      percent >= 50 ? 'text-amber-600' :
        'text-muted-foreground';

  return (
    <div className={cn(
      'p-4 rounded-xl border bg-card space-y-3 transition-all',
      disabled && 'opacity-50 pointer-events-none',
      !disabled && 'hover:border-primary/30 hover:shadow-sm'
    )}>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-bold text-sm">{criterion.name}</p>
          {criterion.description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{criterion.description}</p>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className="text-[9px] font-bold">
            Вага ×{criterion.weight}
          </Badge>
          <Badge variant="outline" className="text-[9px] font-bold text-muted-foreground">
            Макс {maxScore}
          </Badge>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Slider */}
        <input
          type="range"
          min={0}
          max={maxScore}
          step={1}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className="flex-1 h-2 accent-primary cursor-pointer"
          tabIndex={tabIndex}
          disabled={disabled}
        />

        {/* Numeric input */}
        <input
          type="number"
          min={0}
          max={maxScore}
          value={value}
          onChange={e => {
            const rawValue = e.target.value;
            // Prevent clearing from defaulting immediately, allow empty string logic by local state, 
            // but for slider we require number. If empty, assume 0.
            if (rawValue === '') {
              onChange(0);
              return;
            }
            let v = Number(rawValue);
            if (isNaN(v)) v = 0;
            v = Math.max(0, Math.min(maxScore, v));
            onChange(v);
          }}
          className={cn(
            'w-16 h-10 rounded-xl border text-center font-black text-lg transition-colors bg-background',
            'focus:outline-none focus:ring-2 focus:ring-primary/50',
            colorClass
          )}
          tabIndex={-1}
          disabled={disabled}
        />

        {/* Score / Max */}
        <span className="text-xs text-muted-foreground w-10 text-right shrink-0">
          / {maxScore}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-muted rounded-full overflow-hidden">
        <div
          className={cn(
            'h-full rounded-full transition-all duration-200',
            percent >= 80 ? 'bg-emerald-500' :
              percent >= 50 ? 'bg-amber-500' :
                'bg-primary/50'
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function CriteriaSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4 rounded-xl border bg-card space-y-3">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-2.5 bg-muted rounded w-full" />
          <div className="flex items-center gap-3">
            <div className="h-2 bg-muted rounded flex-1" />
            <div className="h-10 w-16 bg-muted rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}
