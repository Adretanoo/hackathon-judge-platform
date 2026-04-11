import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { hackathonApi } from '@/shared/api/hackathon.service';
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger,
  Badge,
  Button
} from '@/shared/ui';
import { 
  BarChart3, 
  Calendar, 
  Gavel, 
  Layout, 
  Settings, 
  Trophy,
  Download,
  AlertTriangle,
  ChevronLeft,
  Users,
  Code2,
  ShieldAlert,
  ClipboardList,
  UserSearch,
} from 'lucide-react';
import { Link } from '@tanstack/react-router';

// We import the refactored tabs that use the new Modals
import { StagesTab } from './tabs/StagesTab';
import { TracksTab } from './tabs/TracksTab';

// For the rest of the tabs we import them from the old location for now 
// or from their respective refactored locations. We will migrate them fully later.
import { 
  OverviewTab, 
  JudgesTab, 
  LeaderboardTab,
  TeamsTab,
  FreeAgentsTab,
  ProjectsTab,
  ConflictsTab,
  ExportTab,
  CriteriaTab,
  EditHackathonModal,
} from '@/routes/_protected/organizer/hackathons/-details';

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  DRAFT: 'secondary',
  REGISTRATION_OPEN: 'default',
  REGISTRATION_CLOSED: 'outline',
  ONGOING: 'default',
  JUDGING: 'default',
  COMPLETED: 'secondary',
  ARCHIVED: 'outline',
};

interface OrganizerAdminPanelProps {
  hackathonId: string;
}

export function OrganizerAdminPanel({ hackathonId }: OrganizerAdminPanelProps) {
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { data: hackathon, isLoading } = useQuery({
    queryKey: ['hackathon', hackathonId],
    queryFn: () => hackathonApi.getById(hackathonId),
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-muted-foreground italic">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin" />
          Завантаження панелі організатора...
        </div>
      </div>
    );
  }

  if (!hackathon) {
    return (
      <div className="p-12 text-center space-y-4">
        <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
        <h2 className="text-2xl font-bold">Хакатон не знайдено</h2>
        <Button asChild variant="outline">
          <Link to="/organizer/hackathons">Повернутися до списку</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-2">
          <Button variant="ghost" size="sm" asChild className="mb-4 -ml-3 text-muted-foreground">
            <Link to="/organizer/hackathons">
              <ChevronLeft className="mr-1 h-4 w-4" />
              Всі хакатони
            </Link>
          </Button>
          <div className="flex flex-wrap items-center gap-4">
            <h1 className="text-4xl font-black tracking-tight">{hackathon.title}</h1>
            <Badge variant={STATUS_BADGE_VARIANT[hackathon.status] ?? 'secondary'} className="uppercase text-xs font-bold px-3 py-1">
              {hackathon.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          {hackathon.subtitle && (
            <p className="text-muted-foreground text-lg">{hackathon.subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button variant="outline" size="sm" className="rounded-xl gap-2 font-bold px-4" asChild>
            <Link to="/leaderboard">
              <Download className="h-4 w-4" />
              Quick Export
            </Link>
          </Button>
          <Button size="sm" onClick={() => setIsEditOpen(true)} className="rounded-xl gap-2 font-bold px-4 shadow-sm">
            <Settings className="h-4 w-4" />
            Редагувати хакатон
          </Button>
        </div>
      </div>

      {/* ── Tabs ── */}
      <Tabs defaultValue="overview" className="space-y-8">
        <div className="overflow-x-auto pb-2 -mx-1 px-1">
          <TabsList className="inline-flex min-w-max h-14 bg-muted/20 p-1.5 gap-2 rounded-2xl border">
            <TabsTrigger value="overview" className="gap-2 px-5 rounded-xl font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <BarChart3 className="h-4 w-4" /> Дашборд
            </TabsTrigger>
            <TabsTrigger value="stages" className="gap-2 px-5 rounded-xl font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Calendar className="h-4 w-4" /> Етапи
            </TabsTrigger>
            <TabsTrigger value="tracks" className="gap-2 px-5 rounded-xl font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Layout className="h-4 w-4" /> Треки
            </TabsTrigger>
            <TabsTrigger value="criteria" className="gap-2 px-5 rounded-xl font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ClipboardList className="h-4 w-4" /> Критерії
            </TabsTrigger>
            <TabsTrigger value="teams" className="gap-2 px-5 rounded-xl font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Users className="h-4 w-4" /> Команди
            </TabsTrigger>
            <TabsTrigger value="participants" className="gap-2 px-5 rounded-xl font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <UserSearch className="h-4 w-4" /> Учасники
            </TabsTrigger>
            <TabsTrigger value="judges" className="gap-2 px-5 rounded-xl font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Gavel className="h-4 w-4" /> Судді
            </TabsTrigger>
            <TabsTrigger value="conflicts" className="gap-2 px-5 rounded-xl font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <ShieldAlert className="h-4 w-4 text-amber-500" /> Конфлікти
            </TabsTrigger>
            <TabsTrigger value="projects" className="gap-2 px-5 rounded-xl font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Code2 className="h-4 w-4" /> Проєкти
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="gap-2 px-5 rounded-xl font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Trophy className="h-4 w-4" /> Рейтинг
            </TabsTrigger>
            <TabsTrigger value="export" className="gap-2 px-5 rounded-xl font-medium data-[state=active]:bg-background data-[state=active]:shadow-sm">
              <Download className="h-4 w-4" /> Експорт
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="focus-visible:ring-0 mt-2">
          <OverviewTab hackathon={hackathon} />
        </TabsContent>
        <TabsContent value="stages" className="focus-visible:ring-0 mt-2">
          <StagesTab hackathon={hackathon} />
        </TabsContent>
        <TabsContent value="tracks" className="focus-visible:ring-0 mt-2">
          <TracksTab hackathon={hackathon} />
        </TabsContent>
        <TabsContent value="criteria" className="focus-visible:ring-0 mt-2">
          <CriteriaTab hackathon={hackathon} />
        </TabsContent>
        <TabsContent value="teams" className="focus-visible:ring-0 mt-2">
          <TeamsTab hackathon={hackathon} />
        </TabsContent>
        <TabsContent value="participants" className="focus-visible:ring-0 mt-2">
          <FreeAgentsTab hackathon={hackathon} />
        </TabsContent>
        <TabsContent value="projects" className="focus-visible:ring-0 mt-2">
          <ProjectsTab hackathonId={hackathonId} />
        </TabsContent>
        <TabsContent value="judges" className="focus-visible:ring-0 mt-2">
          <JudgesTab hackathon={hackathon} />
        </TabsContent>
        <TabsContent value="conflicts" className="focus-visible:ring-0 mt-2">
          <ConflictsTab hackathon={hackathon} />
        </TabsContent>
        <TabsContent value="leaderboard" className="focus-visible:ring-0 mt-2">
          <LeaderboardTab hackathon={hackathon} />
        </TabsContent>
        <TabsContent value="export" className="focus-visible:ring-0 mt-2">
          <ExportTab hackathon={hackathon} />
        </TabsContent>
      </Tabs>

      {/* ── Edit Modal ── */}
      {hackathon && (
        <EditHackathonModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          hackathon={hackathon}
        />
      )}
    </div>
  );
}
