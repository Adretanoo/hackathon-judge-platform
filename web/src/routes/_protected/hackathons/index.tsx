import { useState } from 'react';
import { createFileRoute, Link, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hackathonApi, HackathonStatus } from '@/shared/api/hackathon.service';
import { participantApi } from '@/shared/api/participant.service';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { cn } from '@/shared/lib/utils';
import {
  Rocket, Calendar, Users, MapPin, Globe, ChevronRight,
  Search, Trophy, CheckCircle2, ArrowRight,
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Native date helpers ─────────────────────────────────────────────────────

function fmtRange(start: string, end: string) {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short' };
  return `${s.toLocaleDateString('uk-UA', opts)} — ${e.toLocaleDateString('uk-UA', { ...opts, year: 'numeric' })}`;
}

function isFuture(d: string) { return new Date(d) > new Date(); }

function distanceFromNow(d: string): string {
  const days = Math.round((new Date(d).getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return 'сьогодні';
  if (days === 1) return 'завтра';
  return `через ${days} дн.`;
}

export const Route = createFileRoute('/_protected/hackathons/' as any)({
  component: HackathonsPage,
});

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<string, { label: string; className: string }> = {
  DRAFT: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  REGISTRATION_OPEN: { label: 'Registration Open', className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' },
  REGISTRATION_CLOSED: { label: 'Registration Closed', className: 'bg-amber-100 text-amber-700' },
  IN_PROGRESS: { label: 'Hacking 🔥', className: 'bg-primary/10 text-primary' },
  JUDGING: { label: 'Judging', className: 'bg-cyan-100 text-cyan-700' },
  COMPLETED: { label: 'Finished', className: 'bg-muted text-muted-foreground' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] ?? { label: status, className: 'bg-muted text-muted-foreground' };
  return (
    <span className={cn('px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider', config.className)}>
      {config.label}
    </span>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

function HackathonsPage() {
  const [tab, setTab] = useState<'explore' | 'mine'>('explore');
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // All public hackathons
  const { data: allData, isLoading: loadingAll } = useQuery({
    queryKey: ['hackathons', 'public'],
    queryFn: () => hackathonApi.list({ limit: 50 }),
  });

  // My registered hackathons
  const { data: myHackathons = [], isLoading: loadingMine } = useQuery({
    queryKey: ['participant', 'hackathons'],
    queryFn: participantApi.myHackathons,
  });

  const registerMutation = useMutation({
    mutationFn: participantApi.register,
    onSuccess: (_, hackathonId) => {
      toast.success('Успішно зареєстровано!');
      queryClient.invalidateQueries({ queryKey: ['participant', 'hackathons'] });
      navigate({ to: '/hackathons/$hackathonId' as any, params: { hackathonId } as any });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.error?.message ?? 'Помилка реєстрації');
    },
  });

  const myIds = new Set(myHackathons.map((h: any) => h.id));

  const allHackathons = allData?.items ?? [];
  const filtered = allHackathons.filter((h: any) =>
    !search || h.title.toLowerCase().includes(search.toLowerCase())
  );
  const exploreList = filtered.filter((h: any) => !myIds.has(h.id) && h.status !== HackathonStatus.DRAFT);
  const mineList = myHackathons;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight">західи</h1>
          <p className="text-muted-foreground mt-1">Реєструйтеся, знаходьте команду, перемагайте.</p>
        </div>
        <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
          {(['explore', 'mine'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-bold transition-all',
                tab === t ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'
              )}
            >
              {t === 'explore' ? '🌍 Дослідити' : `🎯 Мої (${myIds.size})`}
            </button>
          ))}
        </div>
      </div>

      {/* Search (only on explore) */}
      {tab === 'explore' && (
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Пошук західів..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
      )}

      {/* Grid */}
      {tab === 'explore' ? (
        loadingAll ? <HackathonGridSkeleton /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {exploreList.map((h: any) => (
              <HackathonCard
                key={h.id}
                hackathon={h}
                isRegistered={myIds.has(h.id)}
                onRegister={() => registerMutation.mutate(h.id)}
                registering={registerMutation.isPending && registerMutation.variables === h.id}
              />
            ))}
            {exploreList.length === 0 && (
              <div className="col-span-3 py-20 text-center text-muted-foreground">
                <Rocket className="h-12 w-12 mx-auto mb-3 opacity-20" />
                <p>Немає доступних західів для реєстрації.</p>
              </div>
            )}
          </div>
        )
      ) : (
        loadingMine ? <HackathonGridSkeleton /> : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {mineList.map((h: any) => (
              <MyHackathonCard key={h.id} hackathon={h} />
            ))}
            {mineList.length === 0 && (
              <div className="col-span-3 py-20 text-center space-y-4">
                <Trophy className="h-12 w-12 mx-auto opacity-20 text-muted-foreground" />
                <div>
                  <p className="font-bold">Ви ще не зареєстровані ні в одному західі.</p>
                  <p className="text-sm text-muted-foreground mt-1">Перейдіть на вкладку «Дослідити» і зареєструйтеся.</p>
                </div>
                <Button onClick={() => setTab('explore')} className="gap-2 rounded-xl">
                  Дослідити західи <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        )
      )}
    </div>
  );
}

// ─── Cards ───────────────────────────────────────────────────────────────────

function HackathonCard({ hackathon: h, isRegistered, onRegister, registering }: {
  hackathon: any; isRegistered: boolean; onRegister: () => void; registering: boolean;
}) {
  const canRegister = h.status === 'REGISTRATION_OPEN' && !isRegistered;

  return (
    <Card className="overflow-hidden border hover:shadow-lg transition-all duration-200 group flex flex-col">
      {/* Accent Strip */}
      <div className={cn('h-1', canRegister ? 'bg-emerald-500' : 'bg-muted')} />
      <CardContent className="p-5 flex flex-col flex-1 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-black text-lg leading-tight group-hover:text-primary transition-colors">{h.title}</h3>
          <StatusBadge status={h.status} />
        </div>

        {h.description && (
          <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">{h.description}</p>
        )}

        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            {h.startDate && h.endDate ? fmtRange(h.startDate, h.endDate) : '—'}
            {h.startDate && isFuture(h.startDate) && (
              <span className="text-primary font-bold">· {distanceFromNow(h.startDate)}</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            {h.isOnline ? <Globe className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
            {h.isOnline ? 'Online' : 'Offline'}
            {h._count?.userRoles !== undefined && (
              <span className="ml-2 flex items-center gap-1"><Users className="h-3 w-3" /> {h._count.userRoles} учасників</span>
            )}
          </div>
        </div>

        <div className="mt-auto pt-2 flex gap-2">
          {isRegistered ? (
            <Link
              to={'/hackathons/$hackathonId' as any}
              params={{ hackathonId: h.id } as any}
              className="flex-1"
            >
              <Button variant="outline" className="w-full rounded-xl gap-2 font-bold">
                Відкрити <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          ) : (
            <Button
              className="flex-1 rounded-xl font-bold gap-2"
              disabled={!canRegister || registering}
              onClick={onRegister}
            >
              {registering ? 'Реєстрація...' : canRegister ? 'Зареєструватися' : 'Недоступно'}
              {canRegister && !registering && <ArrowRight className="h-4 w-4" />}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function MyHackathonCard({ hackathon: h }: { hackathon: any }) {
  const isActive = h.endDate ? new Date(h.endDate) > new Date() : true;

  return (
    <Link to={'/hackathons/$hackathonId' as any} params={{ hackathonId: h.id } as any}>
      <Card className="overflow-hidden border hover:shadow-lg hover:border-primary/30 transition-all duration-200 group cursor-pointer">
        <div className={cn('h-1.5', isActive ? 'bg-primary' : 'bg-muted')} />
        <CardContent className="p-5 space-y-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-black text-lg group-hover:text-primary transition-colors">{h.title}</h3>
            <StatusBadge status={h.status} />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" />
            {h.startDate && h.endDate ? fmtRange(h.startDate, h.endDate) : '—'}
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
              <span className="text-emerald-600 font-bold">Зареєстровано</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-primary font-bold group-hover:gap-2 transition-all">
              Відкрити <ChevronRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function HackathonGridSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
      {[...Array(6)].map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <div className="h-1 bg-muted" />
          <CardContent className="p-5 space-y-3">
            <div className="h-5 bg-muted rounded w-3/4" />
            <div className="h-3 bg-muted rounded w-full" />
            <div className="h-3 bg-muted rounded w-2/3" />
            <div className="h-9 bg-muted rounded-xl" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
