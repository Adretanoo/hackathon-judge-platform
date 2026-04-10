import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { hackathonApi } from '@/shared/api/hackathon.service';
import type { Hackathon } from '@/shared/api/hackathon.service';
import { authClient } from '@/shared/api/auth-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Avatar,
  AvatarImage,
  AvatarFallback,
} from '@/shared/ui';
import { ArrowLeft, UserPlus, Search, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface JudgeAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathon: Hackathon;
}

export function JudgeAssignModal({ isOpen, onClose, hackathon }: JudgeAssignModalProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('all');
  const [conflictMsg, setConflictMsg] = useState<{ userId: string; msg: string } | null>(null);

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['users', 'search', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const { data } = await authClient.get('/users', { params: { search: searchQuery, limit: 10 } });
      return data.data.items;
    },
    enabled: searchQuery.length >= 2,
  });

  const assignMutation = useMutation({
    mutationFn: ({ userId, allowConflictOverride }: { userId: string, allowConflictOverride?: boolean }) => 
      hackathonApi.assignJudge(hackathon.id, { 
        userId, 
        trackId: selectedTrackId === 'all' ? undefined : selectedTrackId,
        allowConflictOverride
      }),
    onSuccess: () => {
      toast.success('Суддю успішно призначено');
      setConflictMsg(null);
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id, 'judges'] });
      onClose();
    },
    onError: (error: any, variables: any) => {
      if (error.response?.status === 409) {
        setConflictMsg({
          userId: variables.userId,
          msg: error.response.data?.error?.message || 'Потенційний конфлікт інтересів'
        });
      } else {
        toast.error(error.response?.data?.error?.message || 'Не вдалося призначити суддю');
      }
    }
  });

  const handleAssign = (userId: string) => {
    setConflictMsg(null);
    assignMutation.mutate({ userId });
  };

  const handleOverride = () => {
    if (conflictMsg) {
      assignMutation.mutate({ userId: conflictMsg.userId, allowConflictOverride: true });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0 min-h-[60vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black">
              Запросити суддю
            </DialogTitle>
          </div>
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Повернутися назад
          </Button>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6 flex-1 overflow-y-auto">
          {conflictMsg && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl space-y-3">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-destructive mt-0.5" />
                <div>
                  <h4 className="font-bold text-destructive">Виявлено конфлікт інтересів!</h4>
                  <p className="text-sm text-destructive/80 mt-1">{conflictMsg.msg}</p>
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button variant="destructive" size="sm" onClick={handleOverride} disabled={assignMutation.isPending}>
                  {assignMutation.isPending ? 'Завантаження...' : 'Ігнорувати та призначити'}
                </Button>
              </div>
            </div>
          )}

          <div className="grid gap-4">
            <div className="space-y-2">
              <Label>Цільовий Трек (Опціонально)</Label>
              <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
                <SelectTrigger>
                  <SelectValue placeholder="Всі треки (Глобальний суддя)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Глобально на всі треки</SelectItem>
                  {hackathon.tracks?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Пошук користувача</Label>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Введіть ім'я або email для пошуку..." 
                  className="pl-9"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="pt-4 space-y-2">
              {isSearching ? (
                <div className="text-center py-8 text-sm text-muted-foreground italic">Пошук користувачів...</div>
              ) : searchResults?.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-3 rounded-xl border border-primary/10 hover:border-primary/30 transition-all bg-card">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={u.avatarUrl} />
                      <AvatarFallback>{u.fullName[0]}</AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-bold truncate">{u.fullName}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="gap-2"
                    onClick={() => handleAssign(u.id)}
                    disabled={assignMutation.isPending}
                  >
                    <UserPlus className="h-4 w-4" /> Призначити
                  </Button>
                </div>
              ))}
              
              {searchQuery.length >= 2 && searchResults?.length === 0 && (
                <div className="text-center py-8 text-sm text-muted-foreground">Користувачів не знайдено.</div>
              )}

              {searchQuery.length < 2 && (
                <div className="text-center py-12 text-sm text-muted-foreground">
                  <Search className="h-8 w-8 text-muted-foreground/30 mx-auto mb-3" />
                  Почніть вводити ім'я або email для пошуку кандидатів у судді
                </div>
              )}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background z-10 flex-row justify-between w-full sm:justify-between">
          <Button type="button" variant="secondary" onClick={onClose}>
            Скасувати
          </Button>
          {/* Main action is performed per-row above, so no global save button here */}
          <div /> 
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
