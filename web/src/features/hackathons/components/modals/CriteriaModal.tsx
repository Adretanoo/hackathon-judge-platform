import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hackathonApi } from '@/shared/api/hackathon.service';
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
import { ArrowLeft, Save, Percent, Award } from 'lucide-react';
import { toast } from 'sonner';

interface CriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: string;
  trackId: string;
}

export function CriteriaModal({ isOpen, onClose, hackathonId, trackId }: CriteriaModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm({
    defaultValues: {
      name: '',
      description: '',
      weight: 1,
      maxScore: 10
    }
  });

  React.useEffect(() => {
    if (isOpen) {
      reset({ name: '', description: '', weight: 1, maxScore: 10 });
    }
  }, [isOpen, reset]);

  const criteriaMutation = useMutation({
    mutationFn: (data: any) => hackathonApi.createCriteria(hackathonId, { ...data, trackId }),
    onSuccess: () => {
      toast.success('Критерій успішно додано');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathonId, 'criteria'] });
      onClose();
    }
  });

  const onSubmit = (data: any) => {
    criteriaMutation.mutate({
      ...data,
      weight: Number(data.weight),
      maxScore: Number(data.maxScore)
    });
  };

  const isPending = criteriaMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black">
              Додати критерій оцінювання
            </DialogTitle>
          </div>
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Повернутися назад
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Назва критерію</Label>
              <Input {...register('name', { required: true })} placeholder="Наприклад: Технічна складність, Бізнес-цінність" />
            </div>
            <div className="grid gap-2">
              <Label>Опис (Що саме оцінюємо?)</Label>
              <Textarea {...register('description')} placeholder="Опишіть, на що саме судді мають звертати увагу..." rows={2} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Питома вага (Коефіцієнт)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="number" step="0.1" {...register('weight', { required: true })} className="pl-9" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Максимальний бал</Label>
                <div className="relative">
                  <Award className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input type="number" {...register('maxScore', { required: true })} className="pl-9" />
                </div>
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
                  <Save className="h-4 w-4" /> Додати критерій
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
