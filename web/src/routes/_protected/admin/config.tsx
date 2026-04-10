import { createFileRoute } from '@tanstack/react-router';
import { Card, Button, Input, Switch, Label } from '@/shared/ui';
import { Settings, Save } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/shared/api/auth-client';
import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { toast } from 'sonner';

export const Route = createFileRoute('/_protected/admin/config')({
  component: AdminConfigPage,
});

function AdminConfigPage() {
  const queryClient = useQueryClient();
  const { data: configs, isLoading } = useQuery({
    queryKey: ['admin', 'config'],
    queryFn: async () => {
      const { data } = await authClient.get('/config');
      return data.data || {};
    }
  });

  const { register, handleSubmit, control, reset } = useForm({
     defaultValues: {
         smtp_host: 'smtp.sendgrid.net',
         from_email: 'no-reply@hackathon-platform.com',
         free_signup: true,
         public_leaderboard: false
     }
  });

  // Sync form with loaded data
  React.useEffect(() => {
     if (configs && Object.keys(configs).length > 0) {
         reset({
             smtp_host: configs['smtp_host'] ?? 'smtp.sendgrid.net',
             from_email: configs['from_email'] ?? 'no-reply@hackathon-platform.com',
             free_signup: configs['free_signup'] !== false,
             public_leaderboard: configs['public_leaderboard'] === true
         });
     }
  }, [configs, reset]);

  const saveMutation = useMutation({
    mutationFn: async (formData: any) => {
        // Convert to Key/Value array for PATCH
        const updateArray = Object.keys(formData).map(key => ({
            key,
            value: formData[key]
        }));
        await authClient.patch('/config', { configs: updateArray });
    },
    onSuccess: () => {
        toast.success('Налаштування системи успішно збережено!');
        queryClient.invalidateQueries({ queryKey: ['admin', 'config'] });
    },
    onError: () => {
        toast.error('Сталася помилка при збереженні налаштувань.');
    }
  });

  if (isLoading) {
      return (
          <div className="p-12 text-center text-muted-foreground italic">
              Завантаження налаштувань...
          </div>
      );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">System Configuration</h1>
          <p className="text-muted-foreground">Global environment settings for the Hackathon platform.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 max-w-2xl gap-6">
        <form onSubmit={handleSubmit((d) => saveMutation.mutate(d))}>
          <Card className="p-6 space-y-6">
            <div className="space-y-4 border-b pb-6">
              <h3 className="font-bold text-lg flex items-center gap-2">
                 <Settings className="h-5 w-5 text-primary" />
                 Поштові сервери (SMTP)
              </h3>
              <div className="grid gap-2">
                 <Label>SMTP Host</Label>
                 <Input {...register('smtp_host')} />
              </div>
              <div className="grid gap-2">
                 <Label>Відправник за замовчуванням (From Email)</Label>
                 <Input {...register('from_email')} />
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-bold text-lg">Глобальні фічі</h3>
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                 <div>
                    <h4 className="font-bold text-sm">Вільна реєстрація (Sign Up)</h4>
                    <p className="text-xs text-muted-foreground">Чи можуть нові користувачі реєструватися самостійно</p>
                 </div>
                 <Controller
                    control={control}
                    name="free_signup"
                    render={({ field }) => (
                      <Switch 
                         checked={field.value} 
                         onCheckedChange={field.onChange} 
                      />
                    )}
                 />
              </div>
              <div className="flex items-center justify-between p-4 bg-muted/40 rounded-xl">
                 <div>
                    <h4 className="font-bold text-sm">Публічний Лідерборд</h4>
                    <p className="text-xs text-muted-foreground">Дозволити перегляд рейтингу гостям</p>
                 </div>
                 <Controller
                    control={control}
                    name="public_leaderboard"
                    render={({ field }) => (
                      <Switch 
                         checked={field.value} 
                         onCheckedChange={field.onChange} 
                      />
                    )}
                 />
              </div>
            </div>

            <div className="pt-4 flex justify-end">
               <Button type="submit" disabled={saveMutation.isPending} className="font-bold gap-2">
                  <Save className="h-4 w-4" /> 
                  {saveMutation.isPending ? 'Збереження...' : 'Save Config'}
               </Button>
            </div>
          </Card>
        </form>
      </div>
    </div>
  );
}
