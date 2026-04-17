import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { hackathonApi } from '@/shared/api/hackathon.service';
import { cn } from '@/shared/lib/utils';
import {
  Button,
  Input,
  Label,
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/shared/ui';
import {
  ChevronRight,
  ChevronLeft,
  Save,
  Rocket,
  Calendar as CalendarIcon,
  MapPin,
  Settings,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/_protected/organizer/hackathons/create')({
  component: HackathonCreatePage,
});

interface FormData {
  title: string;
  subtitle?: string;
  description?: string;
  isOnline: boolean;
  location?: string;
  bannerUrl?: string;
  websiteUrl?: string;
  minTeamSize: number;
  maxTeamSize: number;
  startDate: string;
  endDate: string;
  registrationDeadline?: string;
}

function HackathonCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [urlErrors, setUrlErrors] = useState<{ bannerUrl?: string; websiteUrl?: string }>({});

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      isOnline: true,
      minTeamSize: 1,
      maxTeamSize: 5,
    },
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      // Validate URL fields manually (they are optional — empty = skip)
      const newUrlErrors: typeof urlErrors = {};
      if (data.bannerUrl?.trim()) {
        try { new URL(data.bannerUrl.trim()); } catch {
          newUrlErrors.bannerUrl = 'Invalid URL format';
        }
      }
      if (data.websiteUrl?.trim()) {
        try { new URL(data.websiteUrl.trim()); } catch {
          newUrlErrors.websiteUrl = 'Invalid URL format';
        }
      }
      if (Object.keys(newUrlErrors).length > 0) {
        setUrlErrors(newUrlErrors);
        throw new Error('Please fix URL validation errors');
      }
      setUrlErrors({});

      // Build clean payload
      const payload: any = {
        title: data.title,
        isOnline: data.isOnline,
        minTeamSize: Number(data.minTeamSize),
        maxTeamSize: Number(data.maxTeamSize),
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
      };

      // Optional text fields — only include if non-empty
      if (data.subtitle?.trim()) payload.subtitle = data.subtitle.trim();
      if (data.description?.trim()) payload.description = data.description.trim();
      if (data.location?.trim()) payload.location = data.location.trim();
      if (data.bannerUrl?.trim()) payload.bannerUrl = data.bannerUrl.trim();
      if (data.websiteUrl?.trim()) payload.websiteUrl = data.websiteUrl.trim();
      if (data.registrationDeadline?.trim()) {
        payload.registrationDeadline = new Date(data.registrationDeadline).toISOString();
      }

      return hackathonApi.create(payload);
    },
    onSuccess: (newHackathon) => {
      toast.success('Захід успішно створено!');
      queryClient.invalidateQueries({ queryKey: ['hackathons'] });
      navigate({
        to: '/organizer/hackathons/$hackathonId',
        params: { hackathonId: newHackathon.id },
      } as any);
    },
    onError: (error: any) => {
      // Don't show toast for client-side URL validation error
      if (error.message === 'Please fix URL validation errors') return;
      toast.error(error.response?.data?.error?.message || 'Не вдалося створити захід');
    },
  });

  const onSubmit = (data: FormData) => {
    // Basic required field check
    if (!data.title?.trim() || data.title.trim().length < 3) {
      toast.error('Назва повинна містити не менше 3 символів');
      setStep(1);
      return;
    }
    if (!data.startDate) {
      toast.error("Будь ласка, вкажіть дату початку");
      setStep(2);
      return;
    }
    if (!data.endDate) {
      toast.error("Будь ласка, вкажіть дату завершення");
      setStep(2);
      return;
    }
    mutation.mutate(data);
  };

  const isOnline = watch('isOnline');

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Створити захід</h1>
        <p className="text-muted-foreground text-lg">
          Налаштуйте новий хакатон та визначте правила.
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors',
                step === s
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : step > s
                  ? 'bg-emerald-500 text-white'
                  : 'bg-muted text-muted-foreground'
              )}
            >
              {s}
            </div>
            <span
              className={cn(
                'text-sm font-medium',
                step === s ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {s === 1 ? 'Основне' : s === 2 ? 'Час і місце' : 'Правила'}
            </span>
            {s < 3 && <div className="w-8 h-px bg-muted" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        {/* ── STEP 1: Basics ── */}
        {step === 1 && (
          <Card className="border-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Основна інформація
              </CardTitle>
              <CardDescription>
                Дайте заходу назву та опис.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Назва *</Label>
                <Input
                  id="title"
                  {...register('title', { required: "Назва обов'язкова", minLength: { value: 3, message: 'Назва занадто коротка' } })}
                  placeholder="наприклад: AI for Good 2026"
                />
                {errors.title && (
                  <p className="text-xs text-destructive">{errors.title.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Підзаголовок</Label>
                <Input
                  id="subtitle"
                  {...register('subtitle')}
                  placeholder="наприклад: Масштабуймо кліматичні рішення з LLM"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Опис (необов'язково)</Label>
                <textarea
                  id="description"
                  {...register('description')}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Опишіть виклик, цілі та очікування від учасників..."
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="button" onClick={nextStep} className="ml-auto">
                Далі <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ── STEP 2: Time & Place ── */}
        {step === 2 && (
          <Card className="border-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Час і місце
              </CardTitle>
              <CardDescription>Коли і де відбудеться захід?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Дата початку *</Label>
                  <Input
                    id="startDate"
                    type="datetime-local"
                    {...register('startDate', { required: "Дата початку обов'язкова" })}
                  />
                  {errors.startDate && (
                    <p className="text-xs text-destructive">{errors.startDate.message}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Дата завершення *</Label>
                  <Input
                    id="endDate"
                    type="datetime-local"
                    {...register('endDate', { required: "Дата завершення обов'язкова" })}
                  />
                  {errors.endDate && (
                    <p className="text-xs text-destructive">{errors.endDate.message}</p>
                  )}
                </div>
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant={isOnline ? 'default' : 'outline'}
                    onClick={() => setValue('isOnline', true)}
                    className="flex-1"
                  >
                    <Globe className="mr-2 h-4 w-4" /> Онлайн
                  </Button>
                  <Button
                    type="button"
                    variant={!isOnline ? 'default' : 'outline'}
                    onClick={() => setValue('isOnline', false)}
                    className="flex-1"
                  >
                    <MapPin className="mr-2 h-4 w-4" /> Офлайн
                  </Button>
                </div>

                {!isOnline && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="location">Адреса / Місце</Label>
                    <Input
                      id="location"
                      {...register('location')}
                      placeholder="наприклад: Tech Hub, вул. Головна 12, Київ"
                    />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="ghost" onClick={prevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Назад
              </Button>
              <Button type="button" onClick={nextStep}>
                Далі <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {/* ── STEP 3: Rules ── */}
        {step === 3 && (
          <Card className="border-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Правила участі
              </CardTitle>
              <CardDescription>
                Визначте розмір команди та додаткові посилання.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minTeamSize">Мін. розмір команди</Label>
                  <Input
                    id="minTeamSize"
                    type="number"
                    min={1}
                    {...register('minTeamSize', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTeamSize">Макс. розмір команди</Label>
                  <Input
                    id="maxTeamSize"
                    type="number"
                    min={1}
                    {...register('maxTeamSize', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">
                  Дедлайн реєстрації{' '}
                  <span className="text-muted-foreground text-xs">(необов'язково)</span>
                </Label>
                <Input
                  id="registrationDeadline"
                  type="datetime-local"
                  {...register('registrationDeadline')}
                />
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="bannerUrl">
                    URL банера{' '}
                    <span className="text-muted-foreground text-xs">(необов'язково)</span>
                  </Label>
                  <Input
                    id="bannerUrl"
                    {...register('bannerUrl')}
                    placeholder="https://example.com/banner.jpg"
                  />
                  {urlErrors.bannerUrl && (
                    <p className="text-xs text-destructive">{urlErrors.bannerUrl}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">
                    Вебсайт заходу{' '}
                    <span className="text-muted-foreground text-xs">(необов'язково)</span>
                  </Label>
                  <Input
                    id="websiteUrl"
                    {...register('websiteUrl')}
                    placeholder="https://myhackathon.com"
                  />
                  {urlErrors.websiteUrl && (
                    <p className="text-xs text-destructive">{urlErrors.websiteUrl}</p>
                  )}
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="ghost" onClick={prevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Назад
              </Button>
              <Button
                type="submit"
                disabled={mutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2"
              >
                {mutation.isPending ? 'Створення...' : 'Запустити захід'}
                <Save className="h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  );
}
