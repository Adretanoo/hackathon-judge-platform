import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '@/shared/api/admin.service';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { toast } from 'sonner';
import { Trophy, Save, ArrowLeft } from 'lucide-react';

interface CreateHackathonModalProps {
  isOpen: boolean;
  onClose: () => void;
  editHackathon?: any;
}

export function CreateHackathonModal({ isOpen, onClose, editHackathon }: CreateHackathonModalProps) {
  const queryClient = useQueryClient();
  const isEditing = !!editHackathon;

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    defaultValues: {
      title: '',
      subtitle: '',
      description: '',
      startDate: '',
      endDate: '',
      registrationDeadline: '',
      minTeamSize: 1,
      maxTeamSize: 5,
      isOnline: true,
      location: '',
      websiteUrl: '',
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (isEditing && editHackathon) {
        reset({
          title: editHackathon.title || '',
          subtitle: editHackathon.subtitle || '',
          description: editHackathon.description || '',
          startDate: editHackathon.startDate?.slice(0, 16) || '',
          endDate: editHackathon.endDate?.slice(0, 16) || '',
          registrationDeadline: editHackathon.registrationDeadline?.slice(0, 16) || '',
          minTeamSize: editHackathon.minTeamSize ?? 1,
          maxTeamSize: editHackathon.maxTeamSize ?? 5,
          isOnline: editHackathon.isOnline ?? true,
          location: editHackathon.location || '',
          websiteUrl: editHackathon.websiteUrl || '',
        });
      } else {
        reset({
          title: '',
          subtitle: '',
          description: '',
          startDate: '',
          endDate: '',
          registrationDeadline: '',
          minTeamSize: 1,
          maxTeamSize: 5,
          isOnline: true,
          location: '',
          websiteUrl: '',
        });
      }
    }
  }, [isOpen, isEditing, editHackathon, reset]);

  const mutation = useMutation({
    mutationFn: (formData: any) => {
      // Strip empty optional strings that would fail URL validation
      const payload: any = {
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        description: formData.description || undefined,
        isOnline: formData.isOnline,
        location: formData.location || undefined,
        minTeamSize: Number(formData.minTeamSize),
        maxTeamSize: Number(formData.maxTeamSize),
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
      };

      // Only include URL fields if non-empty
      if (formData.websiteUrl?.trim()) {
        payload.websiteUrl = formData.websiteUrl.trim();
      }
      if (formData.registrationDeadline?.trim()) {
        payload.registrationDeadline = new Date(formData.registrationDeadline).toISOString();
      }

      return isEditing
        ? adminApi.updateHackathon(editHackathon.id, payload)
        : adminApi.createHackathon(payload);
    },
    onSuccess: () => {
      toast.success(isEditing ? 'Захід оновлено!' : 'Захід успішно створено!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'hackathons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'stats'] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Помилка при збереженні';
      toast.error(msg);
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={onClose} className="gap-2 text-muted-foreground -ml-2">
              <ArrowLeft className="w-4 h-4" /> Повернутися назад
            </Button>
          </div>
          <DialogTitle className="text-2xl font-black flex items-center gap-2 mt-2">
            <Trophy className="w-6 h-6 text-primary" />
            {isEditing ? 'Редагувати захід' : 'Створити новий захід'}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-sm">
            {isEditing
              ? 'Оновіть деталі західу. Натисніть «Зберегти зміни» коли завершите.'
              : 'Заповніть форму для створення нового західу на платформі.'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="px-6 py-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Основна інформація</h3>
            <div className="grid gap-2">
              <Label>Назва західу *</Label>
              <Input
                {...register('title', { required: "Обов'язкове поле" })}
                placeholder="Global AI Summit 2026"
                className={errors.title ? 'border-destructive' : ''}
              />
              {errors.title && <p className="text-xs text-destructive">{errors.title.message as string}</p>}
            </div>
            <div className="grid gap-2">
              <Label>Підзаголовок</Label>
              <Input {...register('subtitle')} placeholder="Короткий слоган події" />
            </div>
            <div className="grid gap-2">
              <Label>Опис</Label>
              <textarea
                {...register('description')}
                placeholder="Детальний опис та мета західу..."
                className="flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Дати проведення</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Початок *</Label>
                <Input
                  type="datetime-local"
                  {...register('startDate', { required: "Обов'язкове поле" })}
                  className={errors.startDate ? 'border-destructive' : ''}
                />
              </div>
              <div className="grid gap-2">
                <Label>Кінець *</Label>
                <Input
                  type="datetime-local"
                  {...register('endDate', { required: "Обов'язкове поле" })}
                  className={errors.endDate ? 'border-destructive' : ''}
                />
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Дедлайн реєстрації <span className="text-muted-foreground">(необов'язково)</span></Label>
              <Input type="datetime-local" {...register('registrationDeadline')} />
            </div>
          </div>

          {/* Team size + Location */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground">Команди та локація</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Мін. розмір команди</Label>
                <Input type="number" min={1} max={10} {...register('minTeamSize')} />
              </div>
              <div className="grid gap-2">
                <Label>Макс. розмір команди</Label>
                <Input type="number" min={1} max={20} {...register('maxTeamSize')} />
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
              <div>
                <h4 className="font-bold text-sm">Онлайн-формат</h4>
                <p className="text-xs text-muted-foreground">захід проводиться дистанційно</p>
              </div>
              <Controller
                control={control}
                name="isOnline"
                render={({ field }) => <Switch checked={field.value} onCheckedChange={field.onChange} />}
              />
            </div>

            <div className="grid gap-2">
              <Label>Локація <span className="text-muted-foreground">(якщо не онлайн)</span></Label>
              <Input {...register('location')} placeholder="Київ, вул. Хрещатик 1" />
            </div>
            <div className="grid gap-2">
              <Label>Сайт події <span className="text-muted-foreground">(необов'язково)</span></Label>
              <Input {...register('websiteUrl')} placeholder="https://hackathon.example.com" />
            </div>
          </div>
        </form>

        <DialogFooter className="px-6 pb-6 flex justify-between border-t pt-4">
          <Button variant="secondary" onClick={onClose}>Скасувати</Button>
          <Button
            onClick={handleSubmit((d) => mutation.mutate(d))}
            disabled={mutation.isPending}
            className="font-bold gap-2"
          >
            <Save className="w-4 h-4" />
            {mutation.isPending ? 'Збереження...' : isEditing ? 'Зберегти зміни' : 'Створити захід'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
