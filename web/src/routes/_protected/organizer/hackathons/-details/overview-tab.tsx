import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
} from '@/shared/ui';
import {
  Users,
  Calendar,
  Globe,
  MapPin,
  Link as LinkIcon,
  MessageSquare,
  Rocket,
  ArrowRight,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/ui/dropdown-menu';
import { hackathonApi, HackathonStatus } from '@/shared/api/hackathon.service';
import type { Hackathon } from '@/shared/api/hackathon.service';
import { toast } from 'sonner';

interface OverviewTabProps {
  hackathon: Hackathon;
}

// Status transition map: current status → allowed next statuses
const STATUS_TRANSITIONS: Record<string, HackathonStatus[]> = {
  DRAFT: [HackathonStatus.PUBLISHED, HackathonStatus.REGISTRATION_OPEN],
  PUBLISHED: [HackathonStatus.REGISTRATION_OPEN, HackathonStatus.DRAFT],
  REGISTRATION_OPEN: [HackathonStatus.REGISTRATION_CLOSED, HackathonStatus.IN_PROGRESS],
  REGISTRATION_CLOSED: [HackathonStatus.IN_PROGRESS],
  IN_PROGRESS: [HackathonStatus.JUDGING],
  JUDGING: [HackathonStatus.COMPLETED],
  COMPLETED: [HackathonStatus.ARCHIVED],
  ARCHIVED: [],
};

const STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  PUBLISHED: 'Published',
  REGISTRATION_OPEN: 'Registration Open',
  REGISTRATION_CLOSED: 'Registration Closed',
  IN_PROGRESS: 'In Progress',
  JUDGING: 'Judging',
  COMPLETED: 'Completed',
  ARCHIVED: 'Archived',
};

const STATUS_BADGE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  DRAFT: 'secondary',
  PUBLISHED: 'outline',
  REGISTRATION_OPEN: 'default',
  REGISTRATION_CLOSED: 'outline',
  IN_PROGRESS: 'default',
  JUDGING: 'default',
  COMPLETED: 'secondary',
  ARCHIVED: 'outline',
};

export function OverviewTab({ hackathon }: OverviewTabProps) {
  const queryClient = useQueryClient();
  const [statusChanging, setStatusChanging] = useState(false);

  const { data: participants = [] } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'participants'],
    queryFn: async () => {
      const { authClient } = await import('@/shared/api/auth-client');
      const { data } = await authClient.get(`/hackathons/${hackathon.id}/participants`);
      return data.data ?? [];
    },
  });

  const { data: teams } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'teams'],
    queryFn: async () => {
      const { authClient } = await import('@/shared/api/auth-client');
      const { data } = await authClient.get(`/hackathons/${hackathon.id}/teams`);
      return data.data;
    },
  });

  const { data: judges = [] } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'judges'],
    queryFn: () => hackathonApi.listJudges(hackathon.id),
  });

  const { data: projects } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'projects'],
    queryFn: async () => {
      const { authClient } = await import('@/shared/api/auth-client');
      const { data } = await authClient.get(`/projects`, { params: { hackathonId: hackathon.id } });
      return data.data;
    },
  });

  const statusMutation = useMutation({
    mutationFn: (newStatus: HackathonStatus) =>
      hackathonApi.changeStatus(hackathon.id, newStatus),
    onMutate: () => setStatusChanging(true),
    onSuccess: (updated) => {
      toast.success(`Статус змінено на «${STATUS_LABELS[updated.status]}»`);
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id] });
      queryClient.invalidateQueries({ queryKey: ['hackathons', 'organizer'] });
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error?.message || 'Не вдалося змінити статус'),
    onSettled: () => setStatusChanging(false),
  });

  const allowedNextStatuses = STATUS_TRANSITIONS[hackathon.status] ?? [];

  const statsItems = [
    { label: 'Учасники', value: participants?.length ?? '—' },
    { label: 'Команди', value: teams?.meta?.totalCount ?? teams?.meta?.total ?? teams?.items?.length ?? teams?.length ?? '—' },
    { label: 'Проєкти', value: projects?.meta?.totalCount ?? projects?.meta?.total ?? projects?.items?.length ?? projects?.length ?? '—' },
    { label: 'Судді', value: (judges as any[])?.length ?? '—' },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* ── Left column (2/3) ── */}
      <div className="lg:col-span-2 space-y-6">
        {/* Status change card */}
        <Card className="border-primary/10 shadow-md bg-gradient-to-br from-primary/5 to-transparent">
          <CardContent className="p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-widest">
                Поточний статус
              </p>
              <div className="flex items-center gap-3">
                <Badge
                  variant={STATUS_BADGE_VARIANT[hackathon.status] ?? 'secondary'}
                  className="uppercase text-xs font-bold px-3 py-1"
                >
                  {STATUS_LABELS[hackathon.status] ?? hackathon.status.replace(/_/g, ' ')}
                </Badge>
                <span className="text-xs text-muted-foreground">
                  {allowedNextStatuses.length === 0
                    ? 'Фінальний статус'
                    : `→ можна перейти до: ${allowedNextStatuses.map((s) => STATUS_LABELS[s]).join(', ')}`}
                </span>
              </div>
            </div>

            {allowedNextStatuses.length > 0 && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2 font-bold rounded-xl shrink-0"
                    disabled={statusChanging}
                  >
                    {statusChanging ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                    Змінити статус
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="min-w-[200px]">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">
                    Перейти до
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {allowedNextStatuses.map((status) => (
                    <DropdownMenuItem
                      key={status}
                      onClick={() => statusMutation.mutate(status)}
                      className="gap-2 font-medium cursor-pointer"
                    >
                      <ArrowRight className="h-3.5 w-3.5 text-primary" />
                      {STATUS_LABELS[status]}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </CardContent>
        </Card>

        {/* About card */}
        <Card className="border-primary/5 shadow-md">
          <CardHeader>
            <CardTitle>About this Hackathon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{hackathon.description || 'No description provided.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <MetaItem icon={<Calendar className="h-4 w-4 text-primary" />} label="Event Duration">
                {new Date(hackathon.startDate).toLocaleDateString()} —{' '}
                {new Date(hackathon.endDate).toLocaleDateString()}
              </MetaItem>

              <MetaItem
                icon={hackathon.isOnline
                  ? <Globe className="h-4 w-4 text-primary" />
                  : <MapPin className="h-4 w-4 text-primary" />}
                label="Location"
              >
                {hackathon.isOnline ? 'Fully Online' : hackathon.location || 'Not specified'}
              </MetaItem>

              <MetaItem icon={<Users className="h-4 w-4 text-primary" />} label="Team Size">
                {hackathon.minTeamSize} – {hackathon.maxTeamSize} members
              </MetaItem>

              {hackathon.websiteUrl && (
                <MetaItem icon={<LinkIcon className="h-4 w-4 text-primary" />} label="Website">
                  <a
                    href={hackathon.websiteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline truncate block max-w-[200px]"
                  >
                    {hackathon.websiteUrl.replace(/^https?:\/\//, '')}
                  </a>
                </MetaItem>
              )}
            </div>
          </CardContent>
        </Card>

        {/* CTA cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-primary/5 border-primary/10">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <Rocket className="h-8 w-8 text-primary" />
              <h3 className="font-bold">Participant Dashboard</h3>
              <p className="text-xs text-muted-foreground">
                View what participants see and test registration flows.
              </p>
              <Button variant="outline" size="sm" className="w-full mt-2">
                Preview UI <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-secondary/20 border-secondary/30">
            <CardContent className="p-6 flex flex-col items-center text-center gap-3">
              <MessageSquare className="h-8 w-8 text-secondary-foreground" />
              <h3 className="font-bold">Announcements</h3>
              <p className="text-xs text-muted-foreground">
                Send push notifications and emails to all participants.
              </p>
              <Button variant="outline" size="sm" className="w-full mt-2">
                Manage News <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* ── Right column (1/3) ── */}
      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">
              Quick Stats
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statsItems.map((item, i) => (
              <div
                key={i}
                className={`flex justify-between items-end ${i < statsItems.length - 1 ? 'border-b pb-4' : ''}`}
              >
                <span className="text-sm text-muted-foreground font-medium">{item.label}</span>
                <span className="text-2xl font-black tracking-tight">{item.value}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {hackathon.bannerUrl && (
          <Card className="overflow-hidden shadow-xl border-none">
            <img
              src={hackathon.bannerUrl}
              alt="Hackathon Banner"
              className="w-full h-48 object-cover hover:scale-105 transition-transform duration-700"
            />
            <div className="p-3 bg-card border-t text-center">
              <p className="text-[10px] text-muted-foreground uppercase font-bold">Event Banner</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

// ─── Helper ───────────────────────────────────────────────────────────────────

function MetaItem({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-primary/10 shrink-0">{icon}</div>
      <div>
        <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">{label}</p>
        <div className="text-sm font-medium">{children}</div>
      </div>
    </div>
  );
}
