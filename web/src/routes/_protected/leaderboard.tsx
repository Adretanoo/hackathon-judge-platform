import { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { hackathonApi, type Track } from '@/shared/api/hackathon.service';
import { type LeaderboardData, type LeaderboardEntry, useLeaderboardSocket } from '@/shared/hooks/use-leaderboard-socket';
import { LeaderboardPodium, LeaderboardTableRow } from '@/shared/components/leaderboard/leaderboard-components';
import { Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import {
  Trophy,
  Wifi,
  WifiOff,
  RefreshCw,
  Filter,
  BarChart3,
  Sparkles,
  Clock,
} from 'lucide-react';

export const Route = createFileRoute('/_protected/leaderboard')({
  component: LeaderboardPage,
});

function LeaderboardPage() {
  const [selectedHackathonId, setSelectedHackathonId] = useState<string | null>(null);
  const [selectedTrackId, setSelectedTrackId] = useState<string>('all');
  const [isLive] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<string | null>(null);
  const prevRanksRef = useRef<Record<string, number>>({});

  // --- Fetch all hackathons (for selection) ---
  const { data: hackathonsPage } = useQuery({
    queryKey: ['hackathons'],
    queryFn: () => hackathonApi.list(),
    select: (d) => d.items as any[],
  });

  // Auto-select first hackathon
  useEffect(() => {
    if (hackathonsPage && hackathonsPage.length > 0 && !selectedHackathonId) {
      setSelectedHackathonId(hackathonsPage[0].id);
    }
  }, [hackathonsPage, selectedHackathonId]);

  // --- Fetch hackathon detail for tracks ---
  const { data: hackathon } = useQuery({
    queryKey: ['hackathon', selectedHackathonId],
    queryFn: () => hackathonApi.getById(selectedHackathonId!),
    enabled: !!selectedHackathonId,
  });

  const tracks: Track[] = hackathon?.tracks || [];

  // --- HTTP leaderboard (initial + fallback) ---
  const { data: leaderboardData, refetch, isFetching } = useQuery<LeaderboardData>({
    queryKey: ['leaderboard', selectedHackathonId],
    queryFn: () => hackathonApi.getLeaderboard(
      selectedHackathonId!,
      selectedTrackId !== 'all' ? selectedTrackId : undefined
    ),
    enabled: !!selectedHackathonId,
    staleTime: 30_000,
  });

  // --- Live WebSocket (updates TanStack Query cache) ---
  useLeaderboardSocket({
    hackathonId: selectedHackathonId || '',
    onUpdate: () => {
      setLastUpdate(new Date().toLocaleTimeString());
      // Save previous ranks for change indicators
      leaderboardData?.entries.forEach(e => {
        prevRanksRef.current[e.projectId] = e.rank;
      });
    },
  });

  // --- Filter entries by track ---
  const allEntries: LeaderboardEntry[] = leaderboardData?.entries || [];
  const filteredEntries = selectedTrackId === 'all'
    ? allEntries
    : allEntries; // Track filtering is done server-side via query refetch

  const top3 = filteredEntries.slice(0, 3);

  // Trigger refetch when track changes
  const handleTrackChange = (val: string) => {
    setSelectedTrackId(val);
    // Manually refetch with new trackId
    setTimeout(() => refetch(), 50);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 py-10 space-y-8">
        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary shadow-sm">
                <Trophy className="h-6 w-6" />
              </div>
              <div>
                <h1 className="text-4xl font-black tracking-tight text-foreground">Leaderboard</h1>
                <p className="text-muted-foreground text-sm">Real-time normalized rankings</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Live status indicator */}
            <div className={cn(
              'flex items-center gap-2 px-4 py-2 rounded-xl border text-sm font-bold',
              isLive
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-muted border-muted-foreground/20 text-muted-foreground'
            )}>
              {isLive ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                  </span>
                  <Wifi className="h-3.5 w-3.5" />
                  LIVE
                </>
              ) : (
                <>
                  <WifiOff className="h-3.5 w-3.5" />
                  Static
                </>
              )}
            </div>

            {lastUpdate && (
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-2 rounded-xl bg-muted/50 font-medium">
                <Clock className="h-3 w-3" />
                Updated {lastUpdate}
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="rounded-xl gap-2"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} />
              Refresh
            </Button>
          </div>
        </div>

        {/* ── Hackathon + Track filters ── */}
        <div className="flex flex-wrap gap-3 p-5 bg-card rounded-2xl border border-border shadow-sm">
          <div className="flex items-center gap-2 mr-2 text-muted-foreground">
            <Filter className="h-4 w-4" />
            <span className="text-sm font-bold uppercase tracking-widest text-xs">Filters</span>
          </div>

          {/* Hackathon selector */}
          <Select
            value={selectedHackathonId || ''}
            onValueChange={setSelectedHackathonId}
          >
            <SelectTrigger className="w-52 rounded-xl bg-muted/30 border-0 focus:ring-2 ring-primary/30 h-9 text-sm font-semibold">
              <SelectValue placeholder="Select hackathon..." />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              {(hackathonsPage || []).map((h: any) => (
                <SelectItem key={h.id} value={h.id} className="text-sm">
                  {h.name || h.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Track filter */}
          {tracks.length > 0 && (
            <Select value={selectedTrackId} onValueChange={handleTrackChange}>
              <SelectTrigger className="w-44 rounded-xl bg-muted/30 border-0 focus:ring-2 ring-primary/30 h-9 text-sm font-semibold">
                <SelectValue placeholder="All tracks" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-sm font-semibold">All Tracks</SelectItem>
                {tracks.map((t) => (
                  <SelectItem key={t.id} value={t.id} className="text-sm">
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="ml-auto flex items-center gap-2">
            <Badge variant="secondary" className="rounded-xl font-bold text-xs px-3 h-9 flex items-center gap-1.5">
              <BarChart3 className="h-3 w-3" />
              {filteredEntries.length} teams
            </Badge>
          </div>
        </div>

        {/* ── Podium (Top 3) ── */}
        {top3.length > 0 && (
          <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 pt-6 flex items-center gap-3">
              <Sparkles className="h-5 w-5 text-amber-500" />
              <h2 className="font-black text-lg">Top Performers</h2>
            </div>
            <LeaderboardPodium top3={top3} />
          </div>
        )}

        {/* ── Full Leaderboard Table ── */}
        <div className="bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
          <div className="px-6 py-5 border-b border-border flex items-center justify-between">
            <h2 className="font-black text-lg flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              Full Rankings
            </h2>
            <span className="text-xs text-muted-foreground font-medium">
              Ranked by normalized Z-score
            </span>
          </div>

          {filteredEntries.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <Trophy className="h-12 w-12 mx-auto mb-3 opacity-10" />
              <p className="font-semibold">No scores submitted yet.</p>
              <p className="text-sm mt-1">Rankings will appear once judges begin evaluating projects.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-3 pl-6 pr-3 text-left text-[10px] uppercase font-black tracking-widest text-muted-foreground w-16">Rank</th>
                    <th className="py-3 pr-4 text-left text-[10px] uppercase font-black tracking-widest text-muted-foreground">Team / Project</th>
                    <th className="py-3 pr-4 text-center text-[10px] uppercase font-black tracking-widest text-muted-foreground hidden md:table-cell">Raw</th>
                    <th className="py-3 pr-4 text-center text-[10px] uppercase font-black tracking-widest text-muted-foreground hidden lg:table-cell">Avg</th>
                    <th className="py-3 pr-6 text-right text-[10px] uppercase font-black tracking-widest text-muted-foreground">Z-Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.03]">
                  {filteredEntries.map((entry) => (
                    <LeaderboardTableRow
                      key={entry.projectId}
                      entry={entry}
                      prevRank={prevRanksRef.current[entry.projectId]}
                      isHighlighted={false}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Legend ── */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          {[
            { label: 'Raw Score', desc: 'Sum of weighted criteria scores', color: 'bg-slate-100 text-slate-700' },
            { label: 'Avg Score', desc: 'Per-judge weighted average', color: 'bg-blue-50 text-blue-700' },
            { label: 'Z-Score', desc: 'Judge-bias normalized ranking score', color: 'bg-primary/5 text-primary' },
          ].map((item) => (
            <div key={item.label} className={cn('rounded-2xl py-4 px-5', item.color)}>
              <p className="font-black text-sm">{item.label}</p>
              <p className="text-xs mt-0.5 opacity-70">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
