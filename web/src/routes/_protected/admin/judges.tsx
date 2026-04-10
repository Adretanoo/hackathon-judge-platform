import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/shared/api/admin.service';
import { Card } from '@/shared/ui/card';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Label } from '@/shared/ui/label';
import {
  Shield, ShieldX, AlertTriangle, CheckCircle2,
  UserCheck,
} from 'lucide-react';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/shared/ui/dialog';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

export const Route = createFileRoute('/_protected/admin/judges')({
  component: AdminJudgesPage,
});

const CONFLICT_TYPE_LABEL: Record<string, string> = {
  TEAM_MEMBER: 'Член команди',
  SUPERVISOR: 'Науковий керівник',
  PERSONAL: 'Особисті стосунки',
  MENTORED_TEAM: 'Команда під менторством',
  RELATIVE: 'Родич',
  OTHER: 'Інше',
};

function AdminJudgesPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'judges' | 'conflicts'>('judges');
  const [selectedHackathonId, setSelectedHackathonId] = useState('');
  const [overrideTarget, setOverrideTarget] = useState<any | null>(null);
  const [overrideReason, setOverrideReason] = useState('');

  const { data: hackathonsData } = useQuery({
    queryKey: ['admin', 'hackathons', 'selector'],
    queryFn: () => adminApi.listHackathons({ limit: 100 }),
  });
  const hackathons: any[] = hackathonsData?.items || [];

  const { data: judges, isLoading: judgesLoading } = useQuery({
    queryKey: ['admin', 'judges', selectedHackathonId],
    queryFn: () => adminApi.listJudges(selectedHackathonId),
    enabled: !!selectedHackathonId,
  });

  const { data: conflicts, isLoading: conflictsLoading } = useQuery({
    queryKey: ['admin', 'conflicts', selectedHackathonId],
    queryFn: () => adminApi.listConflicts(selectedHackathonId),
    enabled: !!selectedHackathonId,
  });

  const overrideMutation = useMutation({
    mutationFn: ({ conflictId, reason }: { conflictId: string; reason: string }) =>
      adminApi.overrideConflict(selectedHackathonId, conflictId, reason),
    onSuccess: () => {
      toast.success('Конфлікт успішно overridden.');
      queryClient.invalidateQueries({ queryKey: ['admin', 'conflicts', selectedHackathonId] });
      setOverrideTarget(null);
      setOverrideReason('');
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error?.message || 'Помилка при override'),
  });

  const judgesList: any[] = judges?.items || judges || [];
  const conflictsList: any[] = conflicts?.items || conflicts || [];
  const pendingConflicts = conflictsList.filter((c: any) => !c.overridden);
  const resolvedConflicts = conflictsList.filter((c: any) => c.overridden);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b pb-5">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Shield className="w-7 h-7 text-purple-500" /> Judges & Conflicts
          </h1>
          <p className="text-muted-foreground mt-1">Судді, призначення та конфлікти інтересів.</p>
        </div>
        {pendingConflicts.length > 0 && (
          <div className="flex items-center gap-2 bg-destructive/10 text-destructive px-4 py-2 rounded-xl font-bold text-sm">
            <AlertTriangle className="w-4 h-4" />
            {pendingConflicts.length} непрацюючих конфліктів
          </div>
        )}
      </div>

      {/* Hackathon selector + Tabs */}
      <div className="flex items-center gap-4 flex-wrap">
        <select
          value={selectedHackathonId}
          onChange={(e) => setSelectedHackathonId(e.target.value)}
          className="h-10 rounded-xl border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary min-w-56"
        >
          <option value="">Оберіть хакатон...</option>
          {hackathons.map((h: any) => (
            <option key={h.id} value={h.id}>{h.title}</option>
          ))}
        </select>

        <div className="flex items-center gap-1 p-1 bg-muted/50 rounded-xl border">
          {([['judges', 'Судді', Shield], ['conflicts', 'Конфлікти', ShieldX]] as const).map(([tab, label, Icon]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                'flex items-center gap-2 px-4 py-1.5 rounded-lg text-sm font-bold transition-all',
                activeTab === tab
                  ? 'bg-background shadow-sm text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" />
              {label}
              {tab === 'conflicts' && pendingConflicts.length > 0 && (
                <span className="bg-destructive text-destructive-foreground text-[9px] font-black rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingConflicts.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {!selectedHackathonId ? (
        <Card className="p-16 text-center text-muted-foreground flex flex-col items-center gap-3 border-dashed border-2">
          <Shield className="w-12 h-12 opacity-20" />
          <p className="font-bold text-lg">Оберіть хакатон</p>
        </Card>
      ) : activeTab === 'judges' ? (
        /* ─── Judges Tab ─────────────────────────────────────────────────────── */
        <Card className="overflow-hidden border-primary/10 shadow-sm">
          <div className="grid grid-cols-[1fr_200px_120px] gap-4 px-5 py-3 bg-muted/50 text-xs font-bold uppercase tracking-widest text-muted-foreground border-b">
            <span>Суддя</span>
            <span>Трек</span>
            <span className="text-right">Призначено</span>
          </div>
          {judgesLoading ? (
            <div className="divide-y">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="p-4 flex gap-4">
                  <div className="h-5 w-40 bg-muted animate-pulse rounded" />
                </div>
              ))}
            </div>
          ) : judgesList.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <UserCheck className="w-10 h-10 mx-auto mb-2 opacity-20" />
              <p className="font-bold">Суддів не призначено</p>
              <p className="text-sm mt-1">Перейдіть до панелі хакатону щоб призначити суддів.</p>
            </div>
          ) : (
            <div className="divide-y divide-border/40">
              {judgesList.map((j: any) => (
                <div key={j.id} className="grid grid-cols-[1fr_200px_120px] gap-4 px-5 py-4 items-center hover:bg-muted/10">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 text-purple-600 font-black text-sm flex items-center justify-center">
                      {(j.judge?.fullName || '?')[0]}
                    </div>
                    <div>
                      <p className="font-bold">{j.judge?.fullName || 'Невідомо'}</p>
                      <p className="text-xs text-muted-foreground">{j.judge?.username}</p>
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {j.track?.name || <span className="italic">Всі треки</span>}
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    {j.createdAt ? new Date(j.createdAt).toLocaleDateString('uk-UA') : '—'}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      ) : (
        /* ─── Conflicts Tab ──────────────────────────────────────────────────── */
        <div className="space-y-6">
          {pendingConflicts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-widest text-destructive flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" /> Активні конфлікти ({pendingConflicts.length})
              </h3>
              <Card className="overflow-hidden border-destructive/20">
                <div className="divide-y divide-border/40">
                  {pendingConflicts.map((c: any) => (
                    <div key={c.id} className="p-4 flex items-center justify-between hover:bg-muted/5">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm">{c.judge?.fullName || c.judgeId}</p>
                          <span className="text-muted-foreground text-xs">↔</span>
                          <p className="font-bold text-sm">{c.team?.name || c.teamId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-[9px] font-black uppercase text-destructive border-destructive/30">
                            {CONFLICT_TYPE_LABEL[c.type] || c.type}
                          </Badge>
                          {c.reason && <p className="text-xs text-muted-foreground">{c.reason}</p>}
                        </div>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="font-bold gap-2 border-primary/30 text-primary hover:bg-primary/5"
                        onClick={() => { setOverrideTarget(c); setOverrideReason(''); }}
                      >
                        <CheckCircle2 className="w-4 h-4" /> Override
                      </Button>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {resolvedConflicts.length > 0 && (
            <div className="space-y-3">
              <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4" /> Вирішені ({resolvedConflicts.length})
              </h3>
              <Card className="overflow-hidden border-primary/10 opacity-70">
                <div className="divide-y divide-border/40">
                  {resolvedConflicts.map((c: any) => (
                    <div key={c.id} className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-bold text-sm">
                          {c.judge?.fullName} ↔ {c.team?.name}
                        </p>
                        <p className="text-xs text-muted-foreground">{c.overrideReason}</p>
                      </div>
                      <Badge variant="outline" className="text-[9px] uppercase font-black text-green-600 border-green-200 bg-green-50">
                        Overridden
                      </Badge>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          )}

          {conflictsList.length === 0 && !conflictsLoading && (
            <Card className="p-12 text-center text-muted-foreground flex flex-col items-center">
              <CheckCircle2 className="w-12 h-12 opacity-20 mb-3 text-green-500" />
              <p className="font-bold text-lg">Конфліктів немає</p>
              <p className="text-sm">Всі судді призначені коректно.</p>
            </Card>
          )}
        </div>
      )}

      {/* Override Modal */}
      <Dialog open={!!overrideTarget} onOpenChange={() => setOverrideTarget(null)}>
        <DialogContent className="max-w-md p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b">
            <div className="mb-2">
              <Button variant="ghost" size="sm" onClick={() => setOverrideTarget(null)}
                className="text-muted-foreground gap-2 -ml-2">
                ← Повернутися назад
              </Button>
            </div>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-primary" /> Override конфлікту
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Вкажіть обгрунтування чому даний конфлікт інтересів може бути ігнорований.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-6 space-y-4">
            {overrideTarget && (
              <div className="p-4 bg-muted/40 rounded-xl text-sm">
                <p><strong>Суддя:</strong> {overrideTarget.judge?.fullName}</p>
                <p><strong>Команда:</strong> {overrideTarget.team?.name}</p>
                <p><strong>Тип:</strong> {CONFLICT_TYPE_LABEL[overrideTarget.type] || overrideTarget.type}</p>
              </div>
            )}
            <div className="grid gap-2">
              <Label>Обгрунтування overrride *</Label>
              <textarea
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="Вкажіть причину, чому даний конфлікт може бути проігнорований..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm resize-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <DialogFooter className="px-6 pb-6 border-t pt-4 flex justify-between">
            <Button variant="secondary" onClick={() => setOverrideTarget(null)}>Скасувати</Button>
            <Button
              disabled={!overrideReason.trim() || overrideMutation.isPending}
              onClick={() => overrideMutation.mutate({ conflictId: overrideTarget.id, reason: overrideReason })}
              className="font-bold gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {overrideMutation.isPending ? 'Збереження...' : 'Підтвердити Override'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
