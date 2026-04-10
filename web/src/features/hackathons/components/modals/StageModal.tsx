import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hackathonApi } from '@/shared/api/hackathon.service';
import type { Stage } from '@/shared/api/hackathon.service';
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
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';

interface StageModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: string;
  stage: Stage | null;
  nextOrderIndex: number;
}

export function StageModal({ isOpen, onClose, hackathonId, stage, nextOrderIndex }: StageModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      orderIndex: nextOrderIndex
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      if (stage) {
        reset({
          ...stage,
          startDate: new Date(stage.startDate).toISOString().slice(0, 16),
          endDate: new Date(stage.endDate).toISOString().slice(0, 16)
        });
      } else {
        reset({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          orderIndex: nextOrderIndex
        });
      }
    }
  }, [isOpen, stage, reset, nextOrderIndex]);

  const createMutation = useMutation({
    mutationFn: (data: any) => hackathonApi.createStage(hackathonId, data),
    onSuccess: () => {
      toast.success('Етап успішно створено');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathonId] });
      onClose();
    }
  });

  const updateMutation = useMutation({
    mutationFn: (data: any) => hackathonApi.updateStage(hackathonId, stage!.id, data),
    onSuccess: () => {
      toast.success('Етап успішно оновлено');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathonId] });
      onClose();
    }
  });

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    };
    if (stage) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black">
              {stage ? 'Редагувати етап' : 'Створити новий етап'}
            </DialogTitle>
          </div>
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Повернутися назад
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Назва етапу</Label>
              <Input {...register('name', { required: true })} placeholder="Наприклад: Реєстрація, Ідеація, Кодінг" />
            </div>
            <div className="grid gap-2">
              <Label>Опис (Необов'язково)</Label>
              <Input {...register('description')} placeholder="Короткий опис того, що відбувається на цьому етапі" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Дата початку</Label>
                <Input type="datetime-local" {...register('startDate', { required: true })} />
              </div>
              <div className="grid gap-2">
                <Label>Дата завершення</Label>
                <Input type="datetime-local" {...register('endDate', { required: true })} />
              </div>
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
                  {stage ? 'Зберегти зміни' : 'Створити етап'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
