import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { judgingApi } from '@/shared/api/judging.service';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { cn } from '@/shared/lib/utils';
import {
  Gavel, CheckCircle2, Clock, ShieldAlert, ChevronRight,
  Trophy, Layers, ArrowRight,
} from 'lucide-react';
import { ScorePanel } from './ScorePanel';
import type { JudgingProject } from '@/shared/api/judging.service';

// ─── Status Helpers ──────────────────────────────────────────────────────────

function getProjectStatus(project: JudgingProject): 'scored' | 'conflict' | 'pending' {
  if (project.hasConflict) return 'conflict';
  if (project.isScored || project.myScore !== null) return 'scored';
  return 'pending';
}

const STATUS_ICON = {
  scored: <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />,
  conflict: <ShieldAlert className="h-4 w-4 text-amber-500 shrink-0" />,
  pending: <Clock className="h-4 w-4 text-muted-foreground shrink-0" />,
};

// ─── Main Component ──────────────────────────────────────────────────────────

export function JudgeDashboard() {
  const [selectedHackathonId, setSelectedHackathonId] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // 1. Load judge's hackathons
  const { data: hackathons = [], isLoading: loadingHackathons } = useQuery({
    queryKey: ['judging', 'hackathons'],
    queryFn: judgingApi.listMyHackathons,
  });

  // Auto-select first hackathon
  useEffect(() => {
    if (!selectedHackathonId && hackathons.length > 0) {
      setSelectedHackathonId(hackathons[0].id);
    }
  }, [hackathons, selectedHackathonId]);

  // 2. Load projects for selected hackathon
  const { data: projectsResult, isLoading: loadingProjects } = useQuery({
    queryKey: ['judging', 'projects', selectedHackathonId],
    queryFn: () => judgingApi.listMyProjects(selectedHackathonId!),
    enabled: !!selectedHackathonId,
  });

  const projects: JudgingProject[] = projectsResult?.items ?? [];

  const pendingProjects = projects.filter(p => getProjectStatus(p) === 'pending');
  const scoredProjects = projects.filter(p => getProjectStatus(p) === 'scored');
  const conflictProjects = projects.filter(p => getProjectStatus(p) === 'conflict');
  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null;

  const goToNextProject = () => {
    const currentIndex = pendingProjects.findIndex(p => p.id === selectedProjectId);
    const next = pendingProjects[currentIndex + 1] ?? pendingProjects[0];
    if (next) setSelectedProjectId(next.id);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-in fade-in duration-300">

      {/* ── Top Header ── */}
      <div className="flex items-center justify-between px-6 py-4 border-b bg-background/80 backdrop-blur shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10">
            <Gavel className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight">Панель Судді</h1>
            <p className="text-xs text-muted-foreground">Оцінюйте проєкти за критеріями треку</p>
          </div>
        </div>

        {/* Stats chips */}
        <div className="hidden md:flex items-center gap-3">
          <StatChip icon={<Layers className="h-3.5 w-3.5" />} label="Призначено" value={projects.length} />
          <StatChip icon={<CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />} label="Оцінено" value={scoredProjects.length} color="emerald" />
          <StatChip icon={<Clock className="h-3.5 w-3.5 text-amber-500" />} label="Очікують" value={pendingProjects.length} color="amber" />
        </div>

        {/* Hackathon selector */}
        {hackathons.length > 1 && (
          <div className="flex items-center gap-2">
            {hackathons.map(h => (
              <button
                key={h.id}
                onClick={() => { setSelectedHackathonId(h.id); setSelectedProjectId(null); }}
                className={cn(
                  'px-3 py-1.5 rounded-xl text-sm font-bold transition-all',
                  selectedHackathonId === h.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
              >
                {h.title}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Split Layout ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT: Project List (sticky sidebar) */}
        <aside className="w-80 shrink-0 border-r overflow-y-auto bg-muted/10">
          {loadingProjects ? (
            <ProjectListSkeleton />
          ) : (
            <div className="divide-y divide-border/50">
              {/* Pending section */}
              {pendingProjects.length > 0 && (
                <>
                  <div className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 sticky top-0 z-10 border-b flex items-center justify-between">
                    <span>Очікують</span>
                    <Badge className="text-[9px] h-4 px-1.5 bg-amber-100 text-amber-800">{pendingProjects.length}</Badge>
                  </div>
                  {pendingProjects.map(p => (
                    <ProjectListItem
                      key={p.id}
                      project={p}
                      isSelected={p.id === selectedProjectId}
                      onClick={() => setSelectedProjectId(p.id)}
                    />
                  ))}
                </>
              )}

              {/* Conflict section */}
              {conflictProjects.length > 0 && (
                <>
                  <div className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 sticky top-0 z-10 border-b flex items-center justify-between">
                    <span>Конфлікти</span>
                    <Badge className="text-[9px] h-4 px-1.5 bg-amber-100 text-amber-800">{conflictProjects.length}</Badge>
                  </div>
                  {conflictProjects.map(p => (
                    <ProjectListItem
                      key={p.id}
                      project={p}
                      isSelected={p.id === selectedProjectId}
                      onClick={() => setSelectedProjectId(p.id)}
                    />
                  ))}
                </>
              )}

              {/* Scored section */}
              {scoredProjects.length > 0 && (
                <>
                  <div className="px-4 py-2.5 text-[10px] font-black uppercase tracking-widest text-muted-foreground bg-muted/30 sticky top-0 z-10 border-b flex items-center justify-between">
                    <span>Оцінено</span>
                    <Badge className="text-[9px] h-4 px-1.5 bg-emerald-100 text-emerald-800">{scoredProjects.length}</Badge>
                  </div>
                  <div className="opacity-60">
                    {scoredProjects.map(p => (
                      <ProjectListItem
                        key={p.id}
                        project={p}
                        isSelected={p.id === selectedProjectId}
                        onClick={() => setSelectedProjectId(p.id)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Empty state */}
              {projects.length === 0 && !loadingProjects && (
                <div className="p-8 text-center space-y-3">
                  <Trophy className="h-10 w-10 mx-auto text-muted-foreground/30" />
                  <p className="text-sm text-muted-foreground">
                    {selectedHackathonId
                      ? 'Вам не призначено жодного проєкту.'
                      : 'Виберіть хакатон вище.'}
                  </p>
                </div>
              )}
            </div>
          )}
        </aside>

        {/* RIGHT: Score Panel */}
        <main className="flex-1 overflow-hidden">
          {selectedProject ? (
            <ScorePanel
              key={selectedProject.id}
              project={selectedProject}
              hackathonId={selectedHackathonId!}
              onNext={pendingProjects.length > 1 ? goToNextProject : undefined}
              nextLabel={`Наступний (${pendingProjects.length - 1} залишилось)`}
            />
          ) : (
            <EmptyRight loading={loadingHackathons || loadingProjects} hasPending={pendingProjects.length > 0} onStart={() => setSelectedProjectId(pendingProjects[0]?.id ?? null)} />
          )}
        </main>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProjectListItem({ project, isSelected, onClick }: { project: JudgingProject; isSelected: boolean; onClick: () => void }) {
  const status = getProjectStatus(project);
  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left px-4 py-3 flex items-center gap-3 transition-all group hover:bg-muted/30',
        isSelected && 'bg-primary/5 border-l-2 border-l-primary'
      )}
    >
      {STATUS_ICON[status]}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm truncate">{project.title}</p>
        <p className="text-xs text-muted-foreground truncate">{project.team?.name ?? '—'}</p>
      </div>
      <div className="flex items-center gap-1.5 shrink-0">
        {project.myScore !== undefined && project.myScore !== null && (
          <span className="text-xs font-black text-emerald-600">{project.myScore}</span>
        )}
        <ChevronRight className={cn('h-4 w-4 text-muted-foreground/30 transition-colors', isSelected && 'text-primary')} />
      </div>
    </button>
  );
}

function StatChip({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color?: string }) {
  return (
    <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold', color === 'emerald' && 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20', color === 'amber' && 'border-amber-200 bg-amber-50 text-amber-700 dark:bg-amber-900/20', !color && 'border-border bg-muted/50 text-muted-foreground')}>
      {icon} {label}: <span className="font-black">{value}</span>
    </div>
  );
}

function ProjectListSkeleton() {
  return (
    <div className="divide-y divide-border/40 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="px-4 py-3 flex items-center gap-3">
          <div className="h-4 w-4 rounded-full bg-muted" />
          <div className="flex-1 space-y-1.5">
            <div className="h-3 bg-muted rounded w-3/4" />
            <div className="h-2.5 bg-muted rounded w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyRight({ loading, hasPending, onStart }: { loading: boolean; hasPending: boolean; onStart: () => void }) {
  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          <p className="italic text-sm">Завантаження...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="h-full flex items-center justify-center">
      <div className="text-center space-y-4 max-w-sm px-4">
        <div className="p-5 rounded-2xl bg-primary/5 w-fit mx-auto">
          <Gavel className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-black">Готові до оцінювання?</h2>
        <p className="text-muted-foreground text-sm">Виберіть проєкт зі списку ліворуч або натисніть кнопку нижче.</p>
        {hasPending && (
          <Button onClick={onStart} size="lg" className="w-full font-bold gap-2 rounded-xl">
            Розпочати оцінювання <ArrowRight className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
