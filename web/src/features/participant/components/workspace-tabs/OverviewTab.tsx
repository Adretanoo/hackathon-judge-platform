import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Calendar, Users, MapPin, Globe, Info, ChevronRight, LogOut } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { participantApi } from '@/shared/api/participant.service';
import { useNavigate } from '@tanstack/react-router';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/shared/ui/alert-dialog";

interface OverviewTabProps {
  hackathon: any;
  status: any;
}

// ─── Native date helpers ──────────────────────────────────────────────────────

function fmt(d: string | null | undefined) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('uk-UA', { day: '2-digit', month: 'short', year: 'numeric' });
}

function distanceFromNow(d: string): string {
  const ms = new Date(d).getTime() - Date.now();
  const days = Math.round(ms / 86_400_000);
  if (days < 0) return '';
  if (days === 0) return 'сьогодні';
  if (days === 1) return 'завтра';
  return `через ${days} дн.`;
}

// ─── Status config ────────────────────────────────────────────────────────────

const STAGE_STATUS: Record<string, string> = {
  DRAFT:               'bg-muted text-muted-foreground',
  REGISTRATION_OPEN:   'bg-emerald-500 text-white',
  REGISTRATION_CLOSED: 'bg-amber-500 text-white',
  IN_PROGRESS:          'bg-primary text-primary-foreground',
  JUDGING:             'bg-cyan-500 text-white',
  COMPLETED:           'bg-muted-foreground text-background',
};

const STAGE_LABELS: Record<string, string> = {
  DRAFT:               'Чернетка',
  REGISTRATION_OPEN:   '✅ Реєстрація відкрита',
  REGISTRATION_CLOSED: '🔒 Реєстрація закрита',
  IN_PROGRESS:          '🔥 Хакінг іде',
  JUDGING:             '⚖️ Оцінювання',
  COMPLETED:           '🏆 Завершено',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function OverviewTab({ hackathon, status }: OverviewTabProps) {
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const start = hackathon.startDate ? new Date(hackathon.startDate) : null;
  const end   = hackathon.endDate   ? new Date(hackathon.endDate)   : null;

  const leaveMutation = useMutation({
    mutationFn: () => participantApi.leave(hackathon.id),
    onSuccess: () => {
      toast.success('Ви успішно скасували участь у хакатоні');
      queryClient.invalidateQueries({ queryKey: ['participant'] });
      navigate({ to: '/hackathons' as any });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Помилка при виході з хакатону');
    }
  });

  const stages = [
    { label: 'Реєстрація',  date: hackathon.registrationDeadline, done: !['DRAFT', 'REGISTRATION_OPEN'].includes(hackathon.status), active: hackathon.status === 'REGISTRATION_OPEN' },
    { label: 'Хакінг',      date: hackathon.startDate,            done: ['JUDGING', 'COMPLETED'].includes(hackathon.status),          active: hackathon.status === 'IN_PROGRESS' },
    { label: 'Оцінювання',  date: null,                           done: hackathon.status === 'COMPLETED',                             active: hackathon.status === 'JUDGING' },
    { label: 'Результати',  date: hackathon.endDate,              done: hackathon.status === 'COMPLETED',                             active: hackathon.status === 'COMPLETED' },
  ];

  return (
    <div className="space-y-6">
      {/* Status Banner */}
      <div className={cn('p-4 rounded-2xl flex items-center justify-between flex-wrap gap-2', STAGE_STATUS[hackathon.status] ?? 'bg-muted')}>
        <span className="font-black text-lg">{STAGE_LABELS[hackathon.status] ?? hackathon.status}</span>
        {start && start > new Date() && (
          <span className="text-sm opacity-80">Починається {distanceFromNow(hackathon.startDate)}</span>
        )}
        {start && end && start <= new Date() && end > new Date() && (
          <span className="text-sm opacity-80">Закінчується {distanceFromNow(hackathon.endDate)}</span>
        )}
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { icon: <Calendar className="h-4 w-4" />, label: 'Початок', value: fmt(hackathon.startDate) },
          { icon: <Calendar className="h-4 w-4" />, label: 'Кінець',  value: fmt(hackathon.endDate) },
          { icon: hackathon.isOnline ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />, label: 'Формат', value: hackathon.isOnline ? 'Online' : 'Offline' },
          { icon: <Users className="h-4 w-4" />, label: 'Макс. учасників', value: hackathon.maxParticipants ?? '∞' },
        ].map((item, i) => (
          <Card key={i} className="border">
            <CardContent className="p-4 space-y-1">
              <div className="flex items-center gap-1.5 text-muted-foreground text-xs">{item.icon} {item.label}</div>
              <p className="font-black text-base">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Description */}
      {hackathon.description && (
        <Card className="border">
          <CardContent className="p-5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-muted-foreground">
              <Info className="h-3.5 w-3.5" /> Про хакатон
            </div>
            <p className="text-sm leading-relaxed">{hackathon.description}</p>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Таймлайн</h3>
        <div className="relative pl-2">
          <div className="absolute left-5 top-3 bottom-3 w-0.5 bg-border" />
          <div className="space-y-3">
            {stages.map((s, i) => (
              <div key={i} className="flex items-center gap-4">
                <div className={cn(
                  'h-6 w-6 rounded-full border-2 flex items-center justify-center shrink-0 z-10 bg-background',
                  s.active  ? 'border-primary bg-primary' :
                  s.done    ? 'border-emerald-500 bg-emerald-500' :
                  'border-border'
                )}>
                  {s.active && <div className="h-2 w-2 rounded-full bg-white animate-pulse" />}
                  {s.done && !s.active && <ChevronRight className="h-3 w-3 text-white" />}
                </div>
                <div>
                  <span className={cn('font-bold text-sm',
                    s.active ? 'text-primary' : s.done ? 'text-emerald-600' : 'text-muted-foreground'
                  )}>
                    {s.label}
                  </span>
                  {s.date && (
                    <span className="text-xs text-muted-foreground ml-2">{fmt(s.date)}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tracks */}
      {hackathon.tracks && hackathon.tracks.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Треки</h3>
          <div className="flex flex-wrap gap-2">
            {hackathon.tracks.map((t: any) => (
              <Badge key={t.id} variant="outline" className="px-3 py-1.5 rounded-xl font-bold text-sm">
                {t.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* My Status */}
      {status?.registered && (
        <Card className="border border-emerald-200 bg-emerald-50 dark:bg-emerald-900/10">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="font-bold text-sm text-emerald-700 dark:text-emerald-400">Ви зареєстровані</p>
                <p className="text-xs text-emerald-600 dark:text-emerald-500">
                  {status.team ? `Команда: ${status.team.name}` : 'Поки що без команди'}
                </p>
              </div>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" className="rounded-xl gap-2 font-bold h-9 bg-red-500/10 text-red-600 hover:bg-red-500 hover:text-white border-0 shadow-none dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/50">
                  <LogOut className="h-4 w-4" /> Покинути
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black text-xl">Скасувати участь?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ви впевнені, що хочете покинути цей хакатон? 
                    Якщо ви перебуваєте у команді, вас буде автоматично з неї виключено.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Скасувати</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => leaveMutation.mutate()}
                    className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold"
                  >
                    {leaveMutation.isPending ? 'Вихід...' : 'Так, покинути хакатон'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
