import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hackathonApi } from '@/shared/api/hackathon.service';
import type { Track } from '@/shared/api/hackathon.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label
} from '@/shared/ui';
import { Textarea } from '@/shared/ui/textarea';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

interface TrackModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: string;
  track: Track | null;
}

export function TrackModal({ isOpen, onClose, hackathonId, track }: TrackModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      description: '',
      maxTeams: ''
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(track ? { ...track, maxTeams: track.maxTeams?.toString() || '' } : { name: '', description: '', maxTeams: '' });
    }
  }, [isOpen, track, reset]);

  const trackMutation = useMutation({
    mutationFn: (data: any) => track 
      ? hackathonApi.updateTrack(hackathonId, track.id, data)
      : hackathonApi.createTrack(hackathonId, data),
    onSuccess: () => {
      toast.success(track ? 'Трек успішно оновлено' : 'Трек успішно створено');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathonId] });
      onClose();
    }
  });

  const onSubmit = (data: any) => {
    trackMutation.mutate({
      ...data,
      maxTeams: data.maxTeams ? Number(data.maxTeams) : undefined
    });
  };

  const isPending = trackMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black">
              {track ? 'Редагувати трек' : 'Додати новий трек'}
            </DialogTitle>
          </div>
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Повернутися назад
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Назва треку</Label>
              <Input {...register('name', { required: true })} placeholder="Наприклад: AI Innovation, FinTech" />
            </div>
            <div className="grid gap-2">
              <Label>Опис треку</Label>
              <Textarea {...register('description')} placeholder="Опишіть завдання та виклики цього напрямку" rows={3} />
            </div>
            <div className="grid gap-2">
              <Label>Максимальна кількість команд (Опціонально)</Label>
              <Input type="number" {...register('maxTeams')} min={1} placeholder="Залиште пустим для безліміту" />
            </div>
          </div>

          <DialogFooter className="pt-4 border-t gap-2 flex-row justify-between w-full sm:justify-between">
            <Button type="button" variant="secondary" onClick={onClose}>
              Скасувати
            </Button>
            <Button type="submit" disabled={isPending} className="gap-2">
              {isPending ? 'Збереження...' : (
                <>
                  <Save className="h-4 w-4" />
                  {track ? 'Зберегти зміни' : 'Створити трек'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
