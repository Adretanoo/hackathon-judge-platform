import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Hackathon } from '@/shared/api/hackathon.service';
import { authClient } from '@/shared/api/auth-client';
import {
  Card,
  CardContent,
  Button,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { Skeleton } from '@/shared/ui/skeleton';
import {
  AlertTriangle,
  ShieldAlert,
  UserX,
  CheckCircle2,
  ExternalLink,
  Filter,
  RefreshCw,
} from 'lucide-react';

interface ConflictsTabProps {
  hackathon: Hackathon;
}

export function ConflictsTab({ hackathon }: ConflictsTabProps) {
  const [trackFilter, setTrackFilter] = useState<string>('all');

  const { data: conflicts, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'conflicts'],
    queryFn: async () => {
      const { data } = await authClient.get(`/hackathons/${hackathon.id}/conflicts`);
      return data.data as ConflictItem[];
    },
  });

  const filtered = !conflicts
    ? []
    : trackFilter === 'all'
    ? conflicts
    : conflicts.filter((c) => c.trackId === trackFilter);

  const resolved = filtered.filter((c) => c.resolved);
  const unresolved = filtered.filter((c) => !c.resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-3">
            <ShieldAlert className="h-6 w-6 text-amber-500" />
            Conflicts of Interest
          </h2>
          <p className="text-sm text-muted-foreground">
            Judges with potential bias — review and resolve before final scoring.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hackathon.tracks && hackathon.tracks.length > 0 && (
            <Select value={trackFilter} onValueChange={setTrackFilter}>
              <SelectTrigger className="w-44 h-9 rounded-xl text-sm">
                <Filter className="h-3.5 w-3.5 mr-2 text-muted-foreground" />
                <SelectValue placeholder="All Tracks" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Tracks</SelectItem>
                {hackathon.tracks.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="rounded-xl gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Conflicts"
          value={filtered.length}
          color="text-amber-600"
          bg="bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800/40"
        />
        <StatCard
          label="Unresolved"
          value={unresolved.length}
          color="text-destructive"
          bg="bg-destructive/5 border-destructive/20"
        />
        <StatCard
          label="Resolved"
          value={resolved.length}
          color="text-emerald-600"
          bg="bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800/40"
        />
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : unresolved.length === 0 && resolved.length === 0 ? (
        <EmptyConflicts />
      ) : (
        <div className="space-y-8">
          {unresolved.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-destructive flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" /> Requires Attention ({unresolved.length})
              </h3>
              {unresolved.map((c) => (
                <ConflictCard key={c.id} conflict={c} hackathon={hackathon} />
              ))}
            </section>
          )}
          {resolved.length > 0 && (
            <section className="space-y-3">
              <h3 className="text-sm font-black uppercase tracking-widest text-emerald-600 flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" /> Resolved ({resolved.length})
              </h3>
              {resolved.map((c) => (
                <ConflictCard key={c.id} conflict={c} hackathon={hackathon} resolved />
              ))}
            </section>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface ConflictItem {
  id: string;
  judgeId: string;
  teamId: string;
  trackId?: string;
  reason: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  resolved: boolean;
  overridden: boolean;
  judge: { id: string; fullName: string; username: string };
  team: { id: string; name: string };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <Card className={`border ${bg}`}>
      <CardContent className="p-5 flex flex-col gap-1">
        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
        <p className={`text-4xl font-black tracking-tight ${color}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function ConflictCard({
  conflict,
  hackathon,
  resolved = false,
}: {
  conflict: ConflictItem;
  hackathon: Hackathon;
  resolved?: boolean;
}) {
  const severityColor = {
    LOW: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800/40',
    MEDIUM: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/20 dark:border-orange-800/40',
    HIGH: 'bg-destructive/10 text-destructive border-destructive/20',
  }[conflict.severity];

  const trackName = hackathon.tracks?.find((t) => t.id === conflict.trackId)?.name;

  return (
    <Card className={`border transition-all ${resolved ? 'opacity-60' : 'border-amber-200 dark:border-amber-800/40 shadow-sm'}`}>
      <CardContent className="p-5 flex flex-wrap md:flex-nowrap items-start gap-4">
        <div className={`p-2.5 rounded-xl border shrink-0 ${severityColor}`}>
          {resolved ? <CheckCircle2 className="h-5 w-5" /> : <UserX className="h-5 w-5" />}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-bold text-sm">{conflict.judge.fullName}</p>
            <span className="text-xs text-muted-foreground">@{conflict.judge.username}</span>
            <Badge variant="outline" className={`text-[10px] border ${severityColor}`}>
              {conflict.severity}
            </Badge>
            {resolved && <Badge className="bg-emerald-500/10 text-emerald-700 text-[10px]">Resolved</Badge>}
            {conflict.overridden && <Badge variant="destructive" className="text-[10px]">Overridden</Badge>}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{conflict.reason}</p>
          <div className="flex flex-wrap gap-3 text-xs text-muted-foreground pt-1">
            <span>⚔️ Team: <strong>{conflict.team.name}</strong></span>
            {trackName && <span>🏷️ Track: <strong>{trackName}</strong></span>}
          </div>
        </div>
        {!resolved && (
          <div className="flex items-center gap-2 shrink-0 self-start">
            <Button variant="outline" size="sm" className="h-8 rounded-xl text-xs gap-1.5">
              <ExternalLink className="h-3 w-3" /> View Judge
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function EmptyConflicts() {
  return (
    <div className="py-20 flex flex-col items-center justify-center gap-4 text-center text-muted-foreground">
      <div className="p-5 rounded-full bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40">
        <CheckCircle2 className="h-10 w-10 text-emerald-500" />
      </div>
      <div className="space-y-1">
        <p className="font-bold text-lg text-foreground">No conflicts detected</p>
        <p className="text-sm max-w-xs">
          All judges pass the conflict-of-interest check for this hackathon.
        </p>
      </div>
    </div>
  );
}
