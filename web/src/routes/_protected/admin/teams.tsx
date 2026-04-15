import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/shared/api/admin.service';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Users2, Search, ChevronDown, ChevronRight, ShieldOff } from 'lucide-react';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

export const Route = createFileRoute('/_protected/admin/teams')({
  component: AdminTeamsPage,
});

const TEAM_STATUS_COLOR: Record<string, string> = {
  FORMING: 'bg-blue-500/10 text-blue-600',
  COMPLETE: 'bg-green-500/10 text-green-700',
  SUBMITTED: 'bg-cyan-500/10 text-cyan-700',
  DISQUALIFIED: 'bg-destructive/10 text-destructive',
};

function AdminTeamsPage() {
  const queryClient = useQueryClient();
  const [selectedHackathonId, setSelectedHackathonId] = useState<string>('');
  const [expandedTeamId, setExpandedTeamId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Load hackathon list for the selector
  const { data: hackathonsData } = useQuery({
    queryKey: ['admin', 'hackathons', 'selector'],
    queryFn: () => adminApi.listHackathons({ limit: 100 }),
  });
  const hackathons: any[] = hackathonsData?.items || [];

  // Load teams for selected hackathon
  const { data: teamsData, isLoading } = useQuery({
    queryKey: ['admin', 'teams', selectedHackathonId],
    queryFn: () => adminApi.listTeams(selectedHackathonId),
    enabled: !!selectedHackathonId,
  });
  const teams: any[] = teamsData?.items || teamsData || [];

  const disqualifyMutation = useMutation({
    mutationFn: (teamId: string) => adminApi.updateTeamStatus(teamId, 'DISQUALIFIED'),
    onSuccess: () => {
      toast.success('Команду дискваліфіковано.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'teams', selectedHackathonId] });
    },
    onError: () => toast.error('Помилка при дискваліфікації'),
  });

  const filteredTeams = teams.filter((t: any) =>
    t.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Users2 className="w-7 h-7 text-blue-500" /> Teams
          </h1>
          <p className="text-muted-foreground mt-1">Перегляд та управління командами учасників.</p>
        </div>
      </div>

      {/* Hackathon selector */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex-1 min-w-64">
          <select
            value={selectedHackathonId}
            onChange={(e) => setSelectedHackathonId(e.target.value)}
            className="w-full flex h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="">Оберіть захід...</option>
            {hackathons.map((h: any) => (
              <option key={h.id} value={h.id}>{h.title}</option>
            ))}
          </select>
        </div>
        {selectedHackathonId && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Пошук команди..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-56 rounded-xl"
            />
          </div>
        )}
      </div>

      {!selectedHackathonId ? (
        <Card className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3 border-dashed border-2">
          <Users2 className="w-12 h-12 opacity-20" />
          <p className="font-bold text-lg">Оберіть захід для перегляду команд</p>
        </Card>
      ) : isLoading ? (
        <Card className="divide-y">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="p-4 flex gap-4 items-center">
              <div className="h-5 bg-muted animate-pulse rounded-md w-32" />
              <div className="h-5 bg-muted animate-pulse rounded-full w-20 ml-auto" />
            </div>
          ))}
        </Card>
      ) : filteredTeams.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground">
          <Users2 className="w-10 h-10 mx-auto mb-2 opacity-20" />
          <p className="font-bold">Команд не знайдено</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-primary/10 shadow-sm relative">
          <div className="overflow-x-auto">
            <div className="min-w-[600px]">
              {/* Header */}
              <div className="grid grid-cols-[28px_1fr_140px_80px_80px] gap-4 px-5 py-3 bg-muted/50 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b">
                <span />
                <span>Команда</span>
                <span>Статус</span>
                <span>Учасн.</span>
                <span className="text-right">Дії</span>
              </div>

              <div className="divide-y divide-border/40">
                {filteredTeams.map((team: any) => (
                  <div key={team.id}>
                    {/* Row */}
                    <div className="grid grid-cols-[28px_1fr_140px_80px_80px] gap-4 px-5 py-4 items-center hover:bg-muted/10 transition-colors">
                      <button
                        onClick={() => setExpandedTeamId(expandedTeamId === team.id ? null : team.id)}
                        className="text-muted-foreground hover:text-foreground"
                      >
                        {expandedTeamId === team.id
                          ? <ChevronDown className="w-4 h-4" />
                          : <ChevronRight className="w-4 h-4" />
                        }
                      </button>

                      <div>
                        <p className="font-bold">{team.name}</p>
                        {team.description && (
                          <p className="text-xs text-muted-foreground truncate max-w-xs">{team.description}</p>
                        )}
                      </div>

                      <div>
                        <span className={cn('text-[10px] font-black uppercase px-2 py-1 rounded-full', TEAM_STATUS_COLOR[team.status] || 'bg-muted text-muted-foreground')}>
                          {team.status}
                        </span>
                      </div>

                      <div className="text-sm text-muted-foreground font-bold">
                        {team.members?.length ?? team._count?.members ?? '?'}
                      </div>

                      <div className="flex justify-end">
                        {team.status !== 'DISQUALIFIED' && (
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Дискваліфікувати"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() => {
                              if (window.confirm(`Дискваліфікувати команду «${team.name}»?`)) {
                                disqualifyMutation.mutate(team.id);
                              }
                            }}
                          >
                            <ShieldOff className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Expanded Members */}
                    {expandedTeamId === team.id && (
                      <TeamMembersRow teamId={team.id} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

function TeamMembersRow({ teamId }: { teamId: string }) {
  const { data: teamDetail, isLoading } = useQuery({
    queryKey: ['admin', 'team-detail', teamId],
    queryFn: () => adminApi.getTeam(teamId),
  });

  const members: any[] = teamDetail?.members || [];

  return (
    <div className="bg-muted/5 border-t px-10 py-4 space-y-2">
      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-3">Склад команди</h4>
      {isLoading ? (
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      ) : members.length === 0 ? (
        <p className="text-sm text-muted-foreground italic">Немає учасників</p>
      ) : (
        <div className="space-y-2">
          {members.map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 text-sm py-1">
              <div className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-black flex items-center justify-center">
                {(m.user?.fullName || '?')[0].toUpperCase()}
              </div>
              <div>
                <span className="font-bold">{m.user?.fullName || 'Невідомо'}</span>
                <span className="ml-2 text-muted-foreground text-xs">{m.user?.email}</span>
              </div>
              <Badge variant="outline" className="ml-auto text-[9px] uppercase font-black">
                {m.role}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
