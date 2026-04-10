import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/shared/api/auth-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/ui/dialog';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Switch } from '@/shared/ui/switch';
import { Save, UserCog } from 'lucide-react';
import { toast } from 'sonner';

const ROLES = ['PARTICIPANT', 'MENTOR', 'JUDGE', 'ORGANIZER', 'GLOBAL_ADMIN'] as const;

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
}

export function EditUserModal({ isOpen, onClose, user }: EditUserModalProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, control, reset } = useForm({
    defaultValues: {
      fullName: '',
      isActive: true,
      isVerified: false,
      role: 'PARTICIPANT',
    },
  });

  // Sync form values whenever the modal opens with a user
  useEffect(() => {
    if (isOpen && user) {
      // role is stored in user.roles[0].role (from the API formatUser response)
      const currentRole = user.roles?.[0]?.role ?? user.role ?? 'PARTICIPANT';
      reset({
        fullName: user.fullName || '',
        isActive: user.isActive ?? true,
        isVerified: user.isVerified ?? false,
        role: currentRole,
      });
    }
  }, [isOpen, user, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      // 1. Update profile fields
      await authClient.patch(`/users/${user.id}`, {
        fullName: data.fullName || undefined,
        isActive: data.isActive,
        isVerified: data.isVerified,
      });

      // 2. Assign role via POST /users/:id/roles
      await authClient.post(`/users/${user.id}/roles`, {
        role: data.role,
      });
    },
    onSuccess: () => {
      toast.success('Профіль користувача успішно оновлено!');
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
      onClose();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.response?.data?.message || 'Помилка при оновленні';
      toast.error(msg);
    },
  });

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-xl font-black flex items-center gap-2">
            <UserCog className="h-5 w-5 text-primary" /> Редагувати користувача
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            {user.email} — змінені дані збережуться одразу після натискання кнопки.
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((d) => updateMutation.mutate(d))}
          className="px-6 py-6 space-y-5"
        >
          {/* Name */}
          <div className="grid gap-2">
            <Label>Повне ім'я</Label>
            <Input {...register('fullName')} placeholder="Ім'я та Прізвище" />
          </div>

          {/* Global Role */}
          <div className="grid gap-2">
            <Label>Глобальна роль</Label>
            <select
              {...register('role')}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {ROLES.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Зміна ролі також додає відповідний глобальний запис у системі.
            </p>
          </div>

          {/* Toggles */}
          <div className="space-y-3 pt-2 border-t">
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-sm">Активний акаунт</p>
                <p className="text-xs text-muted-foreground">Знімаючи — блокуєте вхід</p>
              </div>
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
            <div className="flex items-center justify-between py-2">
              <div>
                <p className="font-bold text-sm">Email верифіковано</p>
                <p className="text-xs text-muted-foreground">Підтверджена поштова адреса</p>
              </div>
              <Controller
                control={control}
                name="isVerified"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Скасувати
            </Button>
            <Button type="submit" disabled={updateMutation.isPending} className="font-bold gap-2">
              <Save className="h-4 w-4" />
              {updateMutation.isPending ? 'Збереження...' : 'Зберегти зміни'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
