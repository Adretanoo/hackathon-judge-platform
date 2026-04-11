import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teamApi } from '@/shared/api/team.service';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Users, Search, UserPlus, ChevronRight } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';

interface FindTeamTabProps {
  hackathonId: string;
  myTeamId?: string;
}

export function FindTeamTab({ hackathonId, myTeamId }: FindTeamTabProps) {
  const [view, setView] = useState<'teams' | 'agents'>('teams');
  const [search, setSearch] = useState('');

  const { data: teamsData, isLoading: loadingTeams } = useQuery({
    queryKey: ['hackathon', hackathonId, 'teams'],
    queryFn: () => teamApi.list(hackathonId, { limit: 50 }),
  });

  const { data: agentsData, isLoading: loadingAgents } = useQuery({
    queryKey: ['hackathon', hackathonId, 'free-agents'],
    queryFn: () => teamApi.listFreeAgents(hackathonId),
    enabled: view === 'agents',
  });

  const teams = (teamsData?.items ?? []).filter((t: any) => t.id !== myTeamId);
  const agents = agentsData?.items ?? [];

  const filteredTeams = search
    ? teams.filter((t: any) => t.name.toLowerCase().includes(search.toLowerCase()))
    : teams;
  const filteredAgents = search
    ? agents.filter((a: any) => (a.fullName + a.username).toLowerCase().includes(search.toLowerCase()))
    : agents;

  return (
    <div className="space-y-5">
      {/* View Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="flex bg-muted rounded-xl p-1 gap-1">
          <button
            onClick={() => setView('teams')}
            className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', view === 'teams' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
          >
            <span className="flex items-center gap-2"><Users className="h-4 w-4" /> Команди ({teams.length})</span>
          </button>
          <button
            onClick={() => setView('agents')}
            className={cn('px-4 py-2 rounded-lg text-sm font-bold transition-all', view === 'agents' ? 'bg-background shadow-sm' : 'text-muted-foreground')}
          >
            <span className="flex items-center gap-2"><UserPlus className="h-4 w-4" /> Вільні агенти ({agents.length})</span>
          </button>
        </div>

        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Пошук..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 rounded-xl text-sm"
          />
        </div>
      </div>

      {/* Teams View */}
      {view === 'teams' && (
        loadingTeams ? <CardsSkeleton /> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredTeams.map((team: any) => (
              <Card key={team.id} className="border hover:border-primary/30 hover:shadow-sm transition-all group">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold">{team.name}</h3>
                      {team.description && <p className="text-xs text-muted-foreground line-clamp-1">{team.description}</p>}
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{team.status}</Badge>
                  </div>

                  {team.members && (
                    <div className="flex items-center gap-1">
                      {team.members.slice(0, 5).map((m: any, i: number) => (
                        <Avatar key={i} className="h-6 w-6 -ml-1 first:ml-0 border-2 border-background">
                          <AvatarFallback className="text-[9px] bg-primary/10 text-primary font-bold">
                            {m.user?.fullName?.charAt(0) ?? '?'}
                          </AvatarFallback>
                        </Avatar>
                      ))}
                      <span className="text-xs text-muted-foreground ml-2">{team.members.length} учасників</span>
                    </div>
                  )}

                  <Button variant="outline" size="sm" asChild className="w-full rounded-xl text-xs gap-1.5 group-hover:border-primary group-hover:text-primary transition-colors">
                    <Link to="/teams/$teamId" params={{ teamId: team.id } as any}>
                      Переглянути <ChevronRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
            {filteredTeams.length === 0 && (
              <div className="col-span-2 py-12 text-center text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Команд не знайдено.</p>
              </div>
            )}
          </div>
        )
      )}

      {/* Free Agents View */}
      {view === 'agents' && (
        loadingAgents ? <CardsSkeleton /> : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filteredAgents.map((agent: any) => (
              <Card key={agent.id} className="border hover:border-primary/30 hover:shadow-sm transition-all">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {agent.fullName?.charAt(0) ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{agent.fullName}</p>
                      <p className="text-xs text-muted-foreground">@{agent.username}</p>
                    </div>
                  </div>

                  {agent.bio && <p className="text-xs text-muted-foreground line-clamp-2">{agent.bio}</p>}

                  {agent.skills?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {agent.skills.map((s: string, i: number) => (
                        <Badge key={i} variant="outline" className="text-[10px] px-2 py-0.5">{s}</Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
            {filteredAgents.length === 0 && (
              <div className="col-span-2 py-12 text-center text-muted-foreground">
                <UserPlus className="h-8 w-8 mx-auto mb-2 opacity-20" />
                <p className="text-sm">Вільних агентів не знайдено.</p>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid gap-3 sm:grid-cols-2 animate-pulse">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="p-4 border rounded-xl space-y-3">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-3 bg-muted rounded w-3/4" />
          <div className="h-8 bg-muted rounded-xl" />
        </div>
      ))}
    </div>
  );
}
