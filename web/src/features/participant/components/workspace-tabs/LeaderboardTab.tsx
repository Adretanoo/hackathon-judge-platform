import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/shared/api/auth-client';
import { Card, CardContent } from '@/shared/ui/card';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import { Crown, TrendingUp, Medal } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface LeaderboardTabProps {
  hackathonId: string;
}

export function LeaderboardTab({ hackathonId }: LeaderboardTabProps) {
  const { data: leaderboard = [], isLoading } = useQuery({
    queryKey: ['hackathon', hackathonId, 'leaderboard'],
    queryFn: async () => {
      const { data } = await authClient.get(`/hackathons/${hackathonId}/leaderboard`);
      return data.data?.entries ?? data.data ?? [];
    },
    refetchInterval: 30_000, // refresh every 30s
  });

  const RANK_ICON = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-slate-400" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-amber-700" />;
    return <span className="text-sm font-black text-muted-foreground w-5 text-center">#{rank}</span>;
  };

  if (isLoading) {
    return (
      <div className="space-y-2 animate-pulse">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-16 bg-muted rounded-xl" />
        ))}
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="py-20 text-center space-y-3">
        <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground opacity-20" />
        <p className="font-bold text-muted-foreground">Лідерборд ще не доступний.</p>
        <p className="text-sm text-muted-foreground">Результати з'являться після завершення оцінювання.</p>
      </div>
    );
  }

  const maxScore = Math.max(...leaderboard.map((e: any) => e.normalizedScore ?? e.totalScore ?? 0), 1);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">
          Поточний рейтинг · {leaderboard.length} команд
        </h3>
        <span className="text-[10px] text-muted-foreground">Оновлюється кожні 30с</span>
      </div>

      {/* Top 3 podium */}
      {leaderboard.length >= 3 && (
        <div className="grid grid-cols-3 gap-2 pb-2">
          {[1, 0, 2].map((index) => {
            const entry = leaderboard[index];
            if (!entry) return <div key={index} />;
            const rank = index + 1;
            const isFirst = rank === 1;
            return (
              <Card key={entry.id ?? index} className={cn(
                'border text-center overflow-hidden',
                isFirst ? 'shadow-lg border-yellow-200 dark:border-yellow-800' : ''
              )}>
                <div className={cn('h-1.5', isFirst ? 'bg-yellow-400' : rank === 2 ? 'bg-slate-400' : 'bg-amber-700')} />
                <CardContent className="p-3 space-y-1">
                  {RANK_ICON(rank)}
                  <Avatar className="h-8 w-8 mx-auto">
                    <AvatarFallback className={cn('text-xs font-black', isFirst ? 'bg-yellow-100 text-yellow-800' : 'bg-muted text-muted-foreground')}>
                      {entry.teamName?.charAt(0) ?? entry.projectTitle?.charAt(0) ?? '?'}
                    </AvatarFallback>
                  </Avatar>
                  <p className="text-xs font-black truncate">{entry.teamName ?? entry.projectTitle ?? '—'}</p>
                  <p className={cn('text-lg font-black', isFirst ? 'text-yellow-600' : 'text-foreground')}>
                    {(entry.normalizedScore ?? entry.totalScore ?? 0).toFixed(1)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Full List */}
      <div className="space-y-2">
        {leaderboard.map((entry: any, rank1: number) => {
          const rank = rank1 + 1;
          const score = entry.normalizedScore ?? entry.totalScore ?? 0;
          const pct = (score / maxScore) * 100;

          return (
            <div
              key={entry.id ?? rank1}
              className={cn(
                'flex items-center gap-3 p-4 rounded-xl border transition-all',
                rank <= 3 ? 'bg-muted/30 border-primary/10' : 'hover:bg-muted/20'
              )}
            >
              <div className="w-8 flex items-center justify-center shrink-0">
                {RANK_ICON(rank)}
              </div>

              <Avatar className="h-9 w-9 shrink-0">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {entry.teamName?.charAt(0) ?? entry.projectTitle?.charAt(0) ?? '?'}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-bold text-sm truncate">{entry.teamName ?? '—'}</p>
                {entry.projectTitle && (
                  <div className="flex items-center gap-1.5">
                    <div className="h-1 rounded-full bg-muted overflow-hidden flex-1 max-w-[120px]">
                      <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[10px] text-muted-foreground truncate">{entry.projectTitle}</span>
                  </div>
                )}
              </div>

              <div className="text-right shrink-0">
                <p className="font-black text-lg">{score.toFixed(1)}</p>
                <p className="text-[10px] text-muted-foreground">{entry.judgeCount ?? 0} суддів</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
