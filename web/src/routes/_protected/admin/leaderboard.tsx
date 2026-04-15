import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/shared/api/admin.service';
import { Card } from '@/shared/ui/card';
import { BarChart3, Trophy } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export const Route = createFileRoute('/_protected/admin/leaderboard')({
  component: AdminLeaderboardPage,
});

const MEDAL: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

function AdminLeaderboardPage() {
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState('');

  const { data: hackathonsData } = useQuery({
    queryKey: ['admin', 'hackathons', 'selector'],
    queryFn: () => adminApi.listHackathons({ limit: 100 }),
  });
  const hackathons: any[] = hackathonsData?.items || [];

  const { data: leaderboard, isLoading } = useQuery({
    queryKey: ['admin', 'leaderboard', selectedHackathonId, selectedTrackId],
    queryFn: () => adminApi.getLeaderboard(selectedHackathonId, selectedTrackId || undefined),
    enabled: !!selectedHackathonId,
  });

  const entries: any[] = leaderboard?.entries || leaderboard || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between border-b pb-5 gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-blue-500" /> Leaderboard
          </h1>
          <p className="text-muted-foreground mt-1">Рейтинг команд у реальному часі.</p>
        </div>
      </div>

      {/* Selectors */}
      <div className="flex items-center gap-4 flex-wrap">
        <select
          value={selectedHackathonId}
          onChange={(e) => { setSelectedHackathonId(e.target.value); setSelectedTrackId(''); }}
          className="h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-64"
        >
          <option value="">Оберіть захід...</option>
          {hackathons.map((h: any) => (
            <option key={h.id} value={h.id}>{h.title}</option>
          ))}
        </select>
      </div>

      {/* Leaderboard Table */}
      {!selectedHackathonId ? (
        <Card className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3 border-dashed border-2">
          <BarChart3 className="w-12 h-12 opacity-20" />
          <p className="font-bold text-lg">Оберіть захід</p>
        </Card>
      ) : isLoading ? (
        <Card className="divide-y">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="p-4 flex items-center gap-4">
              <div className="w-8 h-8 rounded-full bg-muted animate-pulse" />
              <div className="h-5 w-48 bg-muted animate-pulse rounded" />
              <div className="h-5 w-16 bg-muted animate-pulse rounded ml-auto" />
            </div>
          ))}
        </Card>
      ) : entries.length === 0 ? (
        <Card className="p-12 text-center text-muted-foreground flex flex-col items-center gap-3">
          <Trophy className="w-12 h-12 opacity-20" />
          <p className="font-bold text-lg">Рейтинг недоступний</p>
          <p className="text-sm">Можливо захід ще не перейшов у стадію суддівства.</p>
        </Card>
      ) : (
        <Card className="overflow-hidden border-primary/10 shadow-sm relative">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              {/* Header */}
              <div className="grid grid-cols-[60px_1fr_180px_100px_120px] gap-4 px-5 py-3 bg-muted/50 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b">
                <span>Ранг</span>
                <span>Команда</span>
                <span>Трек</span>
                <span>Балів</span>
                <span>Проекти</span>
              </div>

              <div className="divide-y divide-border/40">
                {entries.map((entry: any, idx: number) => {
                  const rank = entry.rank ?? idx + 1;
                  return (
                    <div
                      key={entry.teamId || idx}
                      className={cn(
                        'grid grid-cols-[60px_1fr_180px_100px_120px] gap-4 px-5 py-4 items-center transition-colors',
                        rank === 1 && 'bg-yellow-50/50 dark:bg-yellow-500/5',
                        rank === 2 && 'bg-gray-50/50 dark:bg-gray-500/5',
                        rank === 3 && 'bg-orange-50/50 dark:bg-orange-500/5',
                        rank > 3 && 'hover:bg-muted/10'
                      )}
                    >
                      <div className="flex items-center justify-center">
                        {MEDAL[rank] ? (
                          <span className="text-2xl">{MEDAL[rank]}</span>
                        ) : (
                          <span className="text-sm font-black text-muted-foreground">{rank}</span>
                        )}
                      </div>

                      <div>
                        <p className="font-bold">{entry.teamName || entry.team?.name || `Team #${rank}`}</p>
                        {entry.projectTitle && (
                          <p className="text-xs text-muted-foreground truncate">{entry.projectTitle}</p>
                        )}
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {entry.track?.name || entry.trackName || entry.track || '—'}
                      </div>

                      <div>
                        <span className={cn(
                          'text-lg font-black',
                          rank === 1 && 'text-yellow-600',
                          rank === 2 && 'text-gray-500',
                          rank === 3 && 'text-orange-500',
                          rank > 3 && 'text-foreground',
                        )}>
                          {entry.normalizedScore != null
                            ? Number(entry.normalizedScore).toFixed(2)
                            : entry.totalRawScore != null
                              ? Number(entry.totalRawScore).toFixed(1)
                              : '—'}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1">pts</span>
                      </div>

                      <div className="text-sm text-muted-foreground">
                        {entry.projectCount ?? 1} проект
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
