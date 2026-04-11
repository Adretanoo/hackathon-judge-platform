import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '@/shared/api/team.service';
import { Button } from '@/shared/ui/button';
import { Badge } from '@/shared/ui/badge';
import { Card, CardContent } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Avatar, AvatarFallback } from '@/shared/ui/avatar';
import {
  Users, Plus, Copy, Check, Crown, Link2,
  UserMinus, Rocket, ChevronRight, LogOut, ArrowUpCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import type { ParticipationStatus } from '@/shared/api/participant.service';
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

interface MyTeamTabProps {
  hackathonId: string;
  status: ParticipationStatus | undefined;
  onUpdated: () => void;
  onNavigateToFind: () => void;
}

export function MyTeamTab({ hackathonId, status, onUpdated, onNavigateToFind }: MyTeamTabProps) {
  const [createMode, setCreateMode] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const queryClient = useQueryClient();

  const team = status?.team;
  const myRole = status?.role;

  // ─── Create Team ─────────────────────────────────────────────────────────
  const createMutation = useMutation({
    mutationFn: () => teamApi.create(hackathonId, { name: newTeamName, description: newTeamDesc || undefined }),
    onSuccess: () => {
      toast.success('Команду створено!');
      setCreateMode(false);
      onUpdated();
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message ?? 'Помилка при створенні'),
  });

  // ─── Generate Invite ──────────────────────────────────────────────────────
  const inviteMutation = useMutation({
    mutationFn: () => teamApi.generateInvite(team!.id, { expiresInMinutes: 60 * 24, maxUses: 10 }),
    onSuccess: (data: any) => {
      const token = data.token ?? data;
      const link = `${window.location.origin}/invite/${token}`;
      setInviteLink(link);
      navigator.clipboard.writeText(link).catch(() => {});
      toast.success('Посилання скопійовано!');
    },
    onError: () => toast.error('Не вдалося згенерувати посилання'),
  });

  // ─── Remove Member ────────────────────────────────────────────────────────
  const removeMutation = useMutation({
    mutationFn: (targetUserId: string) => teamApi.removeMember(team!.id, targetUserId),
    onSuccess: () => {
      toast.success('Учасника видалено');
      onUpdated();
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Помилка при видаленні')
  });

  const transferMutation = useMutation({
    mutationFn: (newCaptainId: string) => teamApi.transferCaptaincy(team!.id, newCaptainId),
    onSuccess: () => {
      toast.success('Капітанство успішно передано');
      onUpdated();
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Помилка при передачі')
  });

  const leaveMutation = useMutation({
    mutationFn: () => teamApi.leave(team!.id),
    onSuccess: () => {
      toast.success('Ви покинули команду');
      queryClient.invalidateQueries({ queryKey: ['participant'] });
      onUpdated();
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Помилка при виході')
  });

  const copyInvite = async () => {
    if (!inviteLink) return;
    await navigator.clipboard.writeText(inviteLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ─── No Team State ────────────────────────────────────────────────────────
  if (!team) {
    return (
      <div className="space-y-6">
        {createMode ? (
          <Card className="border">
            <CardContent className="p-6 space-y-4">
              <h3 className="font-black text-lg">Нова команда</h3>
              <div className="space-y-3">
                <Input
                  placeholder="Назва команди *"
                  value={newTeamName}
                  onChange={e => setNewTeamName(e.target.value)}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Опис (необов'язково)"
                  value={newTeamDesc}
                  onChange={e => setNewTeamDesc(e.target.value)}
                  className="rounded-xl"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => createMutation.mutate()}
                  disabled={!newTeamName.trim() || createMutation.isPending}
                  className="rounded-xl font-bold gap-2"
                >
                  {createMutation.isPending ? 'Створення...' : <><Plus className="h-4 w-4" /> Створити</>}
                </Button>
                <Button variant="ghost" onClick={() => setCreateMode(false)} className="rounded-xl">Скасувати</Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <div className="p-8 text-center rounded-2xl border-2 border-dashed space-y-4">
              <div className="p-4 rounded-2xl bg-muted w-fit mx-auto">
                <Users className="h-10 w-10 text-muted-foreground" />
              </div>
              <div>
                <h3 className="font-black text-lg">Ви поки що без команди</h3>
                <p className="text-muted-foreground text-sm mt-1">Створіть нову або знайдіть вже існуючу.</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button onClick={() => setCreateMode(true)} className="rounded-xl gap-2 font-bold">
                  <Plus className="h-4 w-4" /> Створити команду
                </Button>
                <Button variant="outline" onClick={onNavigateToFind} className="rounded-xl gap-2">
                  <ChevronRight className="h-4 w-4" /> Знайти команду
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ─── Has Team View ────────────────────────────────────────────────────────
  const isCaptain = myRole === 'CAPTAIN';

  return (
    <div className="space-y-6">
      {/* Team Header Card */}
      <Card className="border overflow-hidden">
        <div className="h-1 bg-primary" />
        <CardContent className="p-5 flex flex-col sm:flex-row items-start font-sans sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Users className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="font-black text-xl">{team.name}</h2>
              {team.description && <p className="text-sm text-muted-foreground">{team.description}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="capitalize">{myRole === 'CAPTAIN' ? '👑 Капітан' : '👤 Учасник'}</Badge>
              <Badge variant="outline">{team.members?.length ?? 0} учасників</Badge>
            </div>
            
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="sm" className="hidden sm:flex text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30 gap-2">
                  <LogOut className="h-4 w-4" /> Покинути
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="rounded-2xl">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-black text-xl">Покинути команду?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Ви впевнені, що хочете покинути цю команду? 
                    {isCaptain && team.members?.length > 1 && " Оскільки ви капітан, ваше місце автоматично перейде до наступного найстарішого учасника."}
                    {isCaptain && team.members?.length === 1 && " Оскільки ви останній учасник, команду буде БЕЗПОВОРОТНО ВИДАЛЕНО."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="rounded-xl">Скасувати</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={() => leaveMutation.mutate()}
                    className="rounded-xl bg-red-500 hover:bg-red-600 text-white font-bold"
                  >
                    {leaveMutation.isPending ? 'Зачекайте...' : 'Так, покинути команду'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>

      {/* Invite Section (Captain only) */}
      {isCaptain && (
        <Card className="border">
          <CardContent className="p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm flex items-center gap-2"><Link2 className="h-4 w-4 text-primary" /> Запросити учасників</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Надішліть посилання — воно активне 24 години.</p>
              </div>
              <Button
                size="sm"
                onClick={() => inviteMutation.mutate()}
                disabled={inviteMutation.isPending}
                className="rounded-xl gap-2"
              >
                {inviteMutation.isPending ? 'Генерація...' : <><Plus className="h-4 w-4" /> Згенерувати</>}
              </Button>
            </div>

            {inviteLink && (
              <div className="flex gap-2">
                <code className="flex-1 px-3 py-2.5 rounded-xl bg-muted text-xs truncate font-mono">{inviteLink}</code>
                <Button variant="outline" size="sm" className="rounded-xl shrink-0 gap-1.5" onClick={copyInvite}>
                  {copied ? <><Check className="h-3.5 w-3.5 text-emerald-500" /> Скопійовано</> : <><Copy className="h-3.5 w-3.5" /> Копіювати</>}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Members List */}
      <div className="space-y-2">
        <h3 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Учасники ({team.members?.length ?? 0})</h3>
        <div className="space-y-2">
          {(team.members ?? []).map((m: any) => (
            <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl border hover:bg-muted/30 transition-colors">
              <Avatar className="h-9 w-9">
                <AvatarFallback className="bg-primary/10 text-primary font-bold text-sm">
                  {m.user?.fullName?.charAt(0) ?? '?'}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{m.user?.fullName ?? m.user?.username ?? 'Учасник'}</p>
                <p className="text-xs text-muted-foreground">@{m.user?.username ?? '—'}</p>
              </div>
              <div className="flex items-center gap-2">
                {m.role === 'CAPTAIN' && (
                  <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 text-[10px]">
                    <Crown className="h-3 w-3 mr-1" /> Капітан
                  </Badge>
                )}
                {isCaptain && m.role !== 'CAPTAIN' && (
                  <div className="flex items-center gap-1">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-muted-foreground hover:text-amber-600 rounded-lg gap-1.5"
                          title="Зробити капітаном"
                        >
                          <ArrowUpCircle className="h-3.5 w-3.5" /> <span className="text-[10px] uppercase font-bold hidden sm:inline">Капітан</span>
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent className="rounded-2xl">
                        <AlertDialogHeader>
                          <AlertDialogTitle className="font-black">Передати капітанство?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Ви впевнені, що хочете передати права капітана користувачу <b>{m.user?.fullName || m.user?.username}</b>?
                            Ви станете звичайним учасником і втратите можливість керувати командою.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel className="rounded-xl">Скасувати</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => transferMutation.mutate(m.userId)}
                            className="rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold"
                          >
                            Підтвердити
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive rounded-lg"
                      title="Видалити з команди"
                      onClick={() => removeMutation.mutate(m.userId)}
                      disabled={removeMutation.isPending}
                    >
                      <UserMinus className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Quick Link */}
      {team.project && (
        <Card className="border border-primary/20 bg-primary/5 cursor-pointer hover:bg-primary/10 transition-colors">
          <CardContent className="p-4 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Rocket className="h-5 w-5 text-primary" />
              <div>
                <p className="font-bold text-sm">{team.project.title}</p>
                <p className="text-xs text-muted-foreground">Статус: {team.project.status}</p>
              </div>
            </div>
            <ChevronRight className="h-5 w-5 text-primary" />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
