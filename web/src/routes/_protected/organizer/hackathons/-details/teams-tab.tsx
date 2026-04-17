import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '@/shared/api/team.service';
import type { Team } from '@/shared/api/team.service';
import type { Hackathon } from '@/shared/api/hackathon.service';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { Users, Plus, Search, Layout, ArrowRight, ShieldOff, AlertTriangle } from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { CreateTeamModal } from './create-team-modal';
import { toast } from 'sonner';

interface TeamsTabProps {
  hackathon: Hackathon;
}

export function TeamsTab({ hackathon }: TeamsTabProps) {
  const [search, setSearch] = useState('');
  const [trackId, setTrackId] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'teams', { trackId, search }],
    queryFn: () =>
      teamApi.list(hackathon.id, {
        trackId: trackId === 'all' ? undefined : trackId,
      }),
  });

  const disqualifyMutation = useMutation({
    mutationFn: (teamId: string) => teamApi.disqualify(teamId),
    onSuccess: () => {
      toast.success('Команду дискваліфіковано');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id, 'teams'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message || 'Не вдалося дискваліфікувати команду');
    },
  });

  const handleDisqualify = (team: Team) => {
    if (
      window.confirm(
        `Ви впевнені, що хочете дискваліфікувати команду "${team.name}"? Цю дію не можна скасувати.`
      )
    ) {
      disqualifyMutation.mutate(team.id);
    }
  };

  const filteredTeams =
    data?.items?.filter((t: Team) => t.name.toLowerCase().includes(search.toLowerCase())) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* ── Filter + Create bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-primary/5 shadow-sm">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Пошук команд..."
              className="pl-9 bg-background/50 border-primary/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <Select value={trackId} onValueChange={setTrackId}>
            <SelectTrigger className="w-full md:w-48 bg-background/50 border-primary/10">
              <SelectValue placeholder="Всі треки" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Всі треки</SelectItem>
              {hackathon.tracks?.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={() => setIsModalOpen(true)}
          className="gap-2 shadow-lg hover:shadow-primary/20 transition-all"
        >
          <Plus className="h-4 w-4" /> Створити команду
        </Button>
      </div>

      {/* ── Teams grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="animate-pulse bg-muted h-48 border-none" />
          ))
        ) : filteredTeams.length > 0 ? (
          filteredTeams.map((team: Team) => {
            const isDisqualified = team.status === 'DISQUALIFIED';
            return (
              <Card
                key={team.id}
                className={`bg-gradient-to-br from-white to-primary/[0.03] dark:from-slate-900 dark:to-slate-800/80 border-0 ring-1 group overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 ${
                  isDisqualified
                    ? 'ring-destructive/30 opacity-70'
                    : 'ring-primary/10 hover:shadow-primary/10 hover:ring-primary/20'
                }`}
              >
                <CardContent className="p-0">
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-xl uppercase ring-1 ring-primary/20 shrink-0">
                          {team.logoUrl ? (
                            <img
                              src={team.logoUrl}
                              alt={team.name}
                              className="w-full h-full object-cover rounded-xl"
                            />
                          ) : (
                            team.name.charAt(0)
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-lg group-hover:text-primary transition-colors truncate">
                            {team.name}
                          </h3>
                          <Badge
                            variant={isDisqualified ? 'destructive' : 'outline'}
                            className="text-[10px] uppercase font-bold border-primary/10"
                          >
                            {isDisqualified ? (
                              <span className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" /> Дискваліфікована
                              </span>
                            ) : (
                              team.status.replace('_', ' ')
                            )}
                          </Badge>
                        </div>
                      </div>

                      {/* Disqualify button — organizer only action */}
                      {!isDisqualified && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0 opacity-0 group-hover:opacity-100"
                          title="Дискваліфікувати команду"
                          onClick={() => handleDisqualify(team)}
                          disabled={disqualifyMutation.isPending}
                        >
                          <ShieldOff className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                      {team.description || 'Опис відсутній.'}
                    </p>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-primary/5">
                      <div className="flex items-center gap-1.5">
                        <Users className="h-3.5 w-3.5" />
                        <span>{team.members?.length || 0} Учасників</span>
                      </div>
                      {team.trackId && (
                        <div className="flex items-center gap-1.5">
                          <Layout className="h-3.5 w-3.5" />
                          <span className="truncate max-w-[100px]">
                            {hackathon.tracks?.find((tr) => tr.id === team.trackId)?.name}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button
                    asChild
                    variant="ghost"
                    className="w-full rounded-none border-t border-primary/5 h-12 hover:bg-primary hover:text-white transition-all group-hover:justify-between px-6"
                  >
                    <Link to={'/teams/$teamId' as any} params={{ teamId: team.id } as any}>
                      <span>Управляти командою</span>
                      <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center gap-5 border-2 border-dashed border-primary/20 rounded-3xl bg-primary/[0.02] dark:bg-primary/[0.01]">
            <Users className="h-20 w-20 text-primary/30" />
            <div className="text-center">
              <h3 className="text-xl font-bold">Команди не знайдено</h3>
              <p className="text-muted-foreground max-w-xs mx-auto">
                Спробуйте змінити фільтри або створіть нову команду.
              </p>
            </div>
            <Button variant="outline" onClick={() => setSearch('')}>
              Очистити пошук
            </Button>
          </div>
        )}
      </div>

      <CreateTeamModal
        hackathon={hackathon}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
