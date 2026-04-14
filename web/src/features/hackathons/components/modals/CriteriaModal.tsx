import { useEffect } from 'react';
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
import { DialogDescription } from '@/shared/ui/dialog';
import { Textarea } from '@/shared/ui/textarea';
import { ArrowLeft, Save, Percent, Award, Edit2 } from 'lucide-react';
import { toast } from 'sonner';

interface Criterion {
  id: string;
  name: string;
  description?: string;
  weight: number;
  maxScore: number;
  trackId: string;
}

interface CriteriaModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathonId: string;
  trackId: string;
  /** Pass an existing criterion to enable edit mode */
  criterion?: Criterion | null;
}

export function CriteriaModal({ isOpen, onClose, hackathonId, trackId, criterion }: CriteriaModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!criterion;

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      name: '',
      description: '',
      weight: 1,
      maxScore: 10,
    }
  });

  // Sync form when modal opens or criterion changes
  useEffect(() => {
    if (isOpen) {
      if (criterion) {
        reset({
          name: criterion.name,
          description: criterion.description ?? '',
          weight: criterion.weight,
          maxScore: criterion.maxScore,
        });
      } else {
        reset({ name: '', description: '', weight: 1, maxScore: 10 });
      }
    }
  }, [isOpen, criterion, reset]);

  // CREATE mutation
  const createMutation = useMutation({
    mutationFn: (data: any) =>
      hackathonApi.createCriteria(hackathonId, { ...data, trackId }),
    onSuccess: () => {
      toast.success('Критерій успішно додано');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathonId, 'criteria'] });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error?.message || 'Помилка при створенні критерію'),
  });

  // UPDATE mutation
  const updateMutation = useMutation({
    mutationFn: (data: any) =>
      hackathonApi.updateCriteria(hackathonId, criterion!.id, data),
    onSuccess: () => {
      toast.success('Критерій оновлено');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathonId, 'criteria'] });
      onClose();
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.error?.message || 'Помилка при оновленні критерію'),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (data: any) => {
    const payload = {
      ...data,
      weight: Number(data.weight),
      maxScore: Number(data.maxScore),
    };
    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              {isEditing ? (
                <><Edit2 className="h-5 w-5 text-primary" /> Редагувати критерій</>
              ) : (
                'Додати критерій оцінювання'
              )}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {isEditing
                ? 'Змініть назву, вагу або максимальний бал критерію.'
                : 'Вкажіть назву, вагу та максимальний бал для нового критерію.'}
            </DialogDescription>
          </div>
          <Button variant="ghost" onClick={onClose} className="gap-2 shrink-0">
            <ArrowLeft className="h-4 w-4" /> Назад
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="px-6 py-6 space-y-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label>Назва критерію *</Label>
              <Input
                {...register('name', { required: 'Обов\'язкове поле' })}
                placeholder="Наприклад: Технічна складність, Бізнес-цінність"
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message as string}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label>Опис (що саме оцінюємо?)</Label>
              <Textarea
                {...register('description')}
                placeholder="Опишіть, на що саме судді мають звертати увагу..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Питома вага (0.1 – 10)</Label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    max="10"
                    {...register('weight', { required: true, min: 0.1, max: 10 })}
                    className="pl-9"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Максимальний бал (1 – 100)</Label>
                <div className="relative">
                  <Award className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    min="1"
                    max="100"
                    {...register('maxScore', { required: true, min: 1, max: 100 })}
                    className="pl-9"
                  />
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
                  <Save className="h-4 w-4" />
                  {isEditing ? 'Зберегти зміни' : 'Додати критерій'}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
