import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
  Textarea
} from '@/shared/ui';
import { ArrowLeft, Save, Users, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: string;
}

export function CreateTeamModal({ isOpen, onClose, hackathonId }: CreateTeamModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      description: '',
      inviteSecret: Math.random().toString(36).substring(2, 10).toUpperCase()
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({
        name: '',
        description: '',
        inviteSecret: Math.random().toString(36).substring(2, 10).toUpperCase()
      });
    }
  }, [isOpen, reset]);

  const createMutation = useMutation({
    mutationFn: (data: any) => authClient.post(`/hackathons/${hackathonId}/teams`, data),
    onSuccess: () => {
      toast.success('Команду успішно створено!');
      queryClient.invalidateQueries({ queryKey: ['user', 'teams'] });
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathonId, 'teams'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Помилка при створенні команди');
    }
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Створити команду
            </DialogTitle>
          </div>
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Повернутися назад
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className="px-6 py-6 space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Назва команди</Label>
              <Input {...register('name', { required: true })} placeholder="Наприклад: CodeBusters, AI_Enthusiasts" className="font-bold text-lg" />
            </div>
            
            <div className="grid gap-2">
              <Label>Опис команди / Ідея</Label>
              <Textarea 
                {...register('description')} 
                placeholder="Розкажіть трохи про себе або ідею над якою плануєте працювати..." 
                rows={4} 
              />
            </div>

            <div className="p-4 bg-muted/50 rounded-xl border border-border/50">
               <Label className="flex items-center gap-2 text-primary mb-2">
                 <LinkIcon className="h-4 w-4" /> Ваш секретний код запрошення
               </Label>
               <div className="flex items-center gap-3">
                 <Input {...register('inviteSecret')} className="font-mono font-bold tracking-widest text-center" readOnly />
                 <Button type="button" variant="outline" onClick={() => {
                   toast.info("Код скопійовано! Надішліть його друзям щоб вони приєдналися.");
                 }}>Копіювати</Button>
               </div>
               <p className="text-xs text-muted-foreground mt-2">Ви зможете змінити його або згенерувати інвайт-лінки пізніше в налаштуваннях команди.</p>
            </div>
          </div>

          <DialogFooter className="pt-4 border-t flex-row justify-between w-full sm:justify-between shrink-0">
            <Button type="button" variant="secondary" onClick={onClose} className="px-8">
              Скасувати
            </Button>
            <Button type="submit" disabled={createMutation.isPending} className="font-bold px-8 gap-2">
              {createMutation.isPending ? 'Створення...' : (
                <>
                  <Save className="h-4 w-4" />
                  Створити команду
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
