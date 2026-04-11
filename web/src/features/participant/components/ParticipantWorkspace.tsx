import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hackathonApi } from '@/shared/api/hackathon.service';
import { participantApi } from '@/shared/api/participant.service';
import { cn } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import {
  LayoutGrid, Users, Search, FileText, TrendingUp, Trophy,
  Calendar, ChevronLeft, Rocket,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

// Tab components
import { OverviewTab }    from '@/features/participant/components/workspace-tabs/OverviewTab';
import { MyTeamTab }      from '@/features/participant/components/workspace-tabs/MyTeamTab';
import { FindTeamTab }    from '@/features/participant/components/workspace-tabs/FindTeamTab';
import { ProjectTab }     from '@/features/participant/components/workspace-tabs/ProjectTab';
import { ProgressTab }    from '@/features/participant/components/workspace-tabs/ProgressTab';
import { LeaderboardTab } from '@/features/participant/components/workspace-tabs/LeaderboardTab';

// ─── Types ───────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'team' | 'find' | 'project' | 'progress' | 'leaderboard';

interface TabDef {
  id: TabId;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  requiresTeam?: boolean;
}

const TABS: TabDef[] = [
  { id: 'overview',     label: 'Огляд',             icon: <LayoutGrid className="h-4 w-4" /> },
  { id: 'team',         label: 'Моя команда',        icon: <Users className="h-4 w-4" /> },
  { id: 'find',         label: 'Знайти команду',     icon: <Search className="h-4 w-4" /> },
  { id: 'project',      label: 'Проєкт',             icon: <FileText className="h-4 w-4" />, requiresTeam: true },
  { id: 'progress',     label: 'Мій прогрес',        icon: <TrendingUp className="h-4 w-4" /> },
  { id: 'leaderboard',  label: 'Лідерборд',          icon: <Trophy className="h-4 w-4" /> },
];

// ─── Main Component ──────────────────────────────────────────────────────────

interface ParticipantWorkspaceProps {
  hackathonId: string;
}

export function ParticipantWorkspace({ hackathonId }: ParticipantWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // Hackathon details
  const { data: hackathon, isLoading: loadingHackathon } = useQuery({
    queryKey: ['hackathon', hackathonId],
    queryFn: () => hackathonApi.getById(hackathonId),
  });

  // Participation status (team, project)
  const { data: status, isLoading: loadingStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['participant', 'status', hackathonId],
    queryFn: () => participantApi.getStatus(hackathonId),
  });

  const isLoading = loadingHackathon || loadingStatus;

  if (isLoading) return <WorkspaceSkeleton />;
  if (!hackathon) return (
    <div className="p-12 text-center text-muted-foreground">
      <Rocket className="h-12 w-12 mx-auto mb-3 opacity-20" />
      <p>Хакатон не знайдено.</p>
            <Link to={'/hackathons' as any} className="text-primary hover:underline mt-2 inline-block text-sm">← Повернутися до списку</Link>
    </div>
  );

  if (!status?.registered) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-80px)] p-12 text-center animate-in fade-in">
        <Rocket className="h-16 w-16 mb-4 opacity-20 text-primary" />
        <h2 className="text-2xl font-black text-foreground mb-2">Ви ще не зареєстровані</h2>
        <p className="mb-6 max-w-md mx-auto text-muted-foreground">
          Щоб отримати доступ до робочого простору, створення команд і подання проєкту, необхідно зареєструватись на цей хакатон.
        </p>
        <Link to={'/hackathons' as any} className="text-sm font-bold bg-primary text-primary-foreground px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
          ← Повернутись до списку хакатонів
        </Link>
      </div>
    );
  }

  const hasTeam = !!status?.team;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-in fade-in duration-300">

      {/* ── Workspace Header ── */}
      <div className="shrink-0 px-6 py-4 border-b bg-background flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <Link to={'/hackathons' as any} className="text-muted-foreground hover:text-foreground transition-colors shrink-0">
            <ChevronLeft className="h-5 w-5" />
          </Link>
          <div className="p-2 rounded-xl bg-primary/10 shrink-0">
            <Rocket className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="font-black text-lg truncate">{hackathon.title}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              {hackathon.startDate ? new Date(hackathon.startDate).toLocaleDateString('uk-UA') : '—'}
              {' — '}
              {hackathon.endDate ? new Date(hackathon.endDate).toLocaleDateString('uk-UA') : '—'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {hasTeam && (
            <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400 text-[10px]">
              <Users className="h-3 w-3 mr-1" /> {status!.team!.name}
            </Badge>
          )}
          <Badge className="text-[10px]" variant="outline">{hackathon.status}</Badge>
        </div>
      </div>

      {/* ── Tab Navigation ── */}
      <div className="shrink-0 px-6 border-b overflow-x-auto">
        <nav className="flex gap-1 -mb-px">
          {TABS.map(tab => {
            const isDisabled = tab.requiresTeam && !hasTeam;
            return (
              <button
                key={tab.id}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap',
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30',
                  isDisabled && 'opacity-40 cursor-not-allowed hover:border-transparent hover:text-muted-foreground'
                )}
                title={isDisabled ? 'Спочатку приєднайтесь до команди' : undefined}
              >
                {tab.icon}
                {tab.label}
                {tab.badge && (
                  <span className="ml-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[9px] font-black">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Tab Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 max-w-5xl mx-auto">
          {activeTab === 'overview' && (
            <OverviewTab hackathon={hackathon} status={status} />
          )}
          {activeTab === 'team' && (
            <MyTeamTab
              hackathonId={hackathonId}
              status={status}
              onUpdated={refetchStatus}
              onNavigateToFind={() => setActiveTab('find')}
            />
          )}
          {activeTab === 'find' && (
            <FindTeamTab hackathonId={hackathonId} myTeamId={status?.team?.id} />
          )}
          {activeTab === 'project' && hasTeam && (
            <ProjectTab
              team={status!.team!}
              project={status?.project}
              onUpdated={refetchStatus}
            />
          )}
          {activeTab === 'progress' && (
            <ProgressTab hackathonId={hackathonId} status={status} hackathon={hackathon} />
          )}
          {activeTab === 'leaderboard' && (
            <LeaderboardTab hackathonId={hackathonId} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function WorkspaceSkeleton() {
  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-pulse">
      <div className="h-16 bg-muted/20 border-b" />
      <div className="h-12 bg-muted/10 border-b px-6 flex items-end gap-6 pb-0">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-4 w-20 bg-muted rounded mb-3" />
        ))}
      </div>
      <div className="flex-1 p-6 space-y-4">
        <div className="h-32 bg-muted rounded-xl" />
        <div className="h-24 bg-muted rounded-xl" />
      </div>
    </div>
  );
}
