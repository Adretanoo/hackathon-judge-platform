import { useState } from 'react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
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
  CardFooter
} from '@/shared/ui';
import { ChevronRight, ChevronLeft, Save, Rocket, Calendar as CalendarIcon, MapPin, Settings, Globe } from 'lucide-react';
import { toast } from 'sonner';

const createHackathonSchema = z.object({
  title: z.string().min(3, 'Title is too short'),
  subtitle: z.string().max(200).optional(),
  description: z.string().optional(),
  isOnline: z.boolean().default(true),
  location: z.string().optional(),
  bannerUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  minTeamSize: z.number().int().min(1).default(1),
  maxTeamSize: z.number().int().min(1).default(5),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  registrationDeadline: z.string().optional().or(z.literal('')),
});

type FormData = z.infer<typeof createHackathonSchema>;

export const Route = createFileRoute('/_protected/organizer/hackathons/create')({
  component: HackathonCreatePage,
});

function HackathonCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createHackathonSchema) as any,
    defaultValues: {
      isOnline: true,
      minTeamSize: 1,
      maxTeamSize: 5,
    }
  });

  const mutation = useMutation({
    mutationFn: (data: FormData) => {
      // Convert dates to ISO string before sending
      const payload = {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: new Date(data.endDate).toISOString(),
        registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline).toISOString() : undefined,
      };
      return hackathonApi.create(payload);
    },
    onSuccess: (newHackathon) => {
      toast.success('Hackathon created successfully!');
      queryClient.invalidateQueries({ queryKey: ['hackathons'] });
      navigate({ 
        to: '/organizer/hackathons/$hackathonId', 
        params: { hackathonId: newHackathon.id } 
      } as any);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create hackathon');
    }
  });

  const onSubmit = (data: FormData) => {
    mutation.mutate(data);
  };

  const isOnline = watch('isOnline');

  const nextStep = () => setStep(s => s + 1);
  const prevStep = () => setStep(s => s - 1);

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight">Create Hackathon</h1>
        <p className="text-muted-foreground text-lg">Set up a new competition and define the rules.</p>
      </div>

      <div className="flex items-center gap-4 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-colors",
              step === s ? "bg-primary text-primary-foreground shadow-lg" : 
              step > s ? "bg-emerald-500 text-white" : "bg-muted text-muted-foreground"
            )}>
              {s}
            </div>
            <span className={cn(
              "text-sm font-medium",
              step === s ? "text-primary" : "text-muted-foreground"
            )}>
              {s === 1 ? 'Basics' : s === 2 ? 'Logistics' : 'Rules'}
            </span>
            {s < 3 && <div className="w-8 h-px bg-muted" />}
          </div>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit as any)}>
        {step === 1 && (
          <Card className="border-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="h-5 w-5 text-primary" />
                Basic Information
              </CardTitle>
              <CardDescription>Give your hackathon a name and a compelling description.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input id="title" {...register('title')} placeholder="e.g. AI for Good 2026" />
                {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input id="subtitle" {...register('subtitle')} placeholder="e.g. Scaling climate solutions with LLMs" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description (optional)</Label>
                <textarea 
                  id="description" 
                  {...register('description')}
                  className="flex min-h-[120px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="Describe the challenge, goals and what you expect from participants..."
                />
              </div>
            </CardContent>
            <CardFooter>
              <Button type="button" onClick={nextStep} className="ml-auto">
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 2 && (
          <Card className="border-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarIcon className="h-5 w-5 text-primary" />
                Time & Place
              </CardTitle>
              <CardDescription>When and where will the event take place?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date *</Label>
                  <Input id="startDate" type="datetime-local" {...register('startDate')} />
                  {errors.startDate && <p className="text-xs text-destructive">{errors.startDate.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date *</Label>
                  <Input id="endDate" type="datetime-local" {...register('endDate')} />
                  {errors.endDate && <p className="text-xs text-destructive">{errors.endDate.message}</p>}
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
                    <Globe className="mr-2 h-4 w-4" /> Online
                  </Button>
                  <Button 
                    type="button" 
                    variant={!isOnline ? 'default' : 'outline'}
                    onClick={() => setValue('isOnline', false)}
                    className="flex-1"
                  >
                    <MapPin className="mr-2 h-4 w-4" /> On-site
                  </Button>
                </div>

                {!isOnline && (
                  <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-300">
                    <Label htmlFor="location">Venue Address / Location</Label>
                    <Input id="location" {...register('location')} placeholder="e.g. Tech Hub, Main Street 12, Kyiv" />
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="ghost" onClick={prevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button type="button" onClick={nextStep}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}

        {step === 3 && (
          <Card className="border-primary/5 shadow-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-primary" />
                Participation Rules
              </CardTitle>
              <CardDescription>Finalize team sizes and external links.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="minTeamSize">Min Team Size</Label>
                  <Input id="minTeamSize" type="number" {...register('minTeamSize', { valueAsNumber: true })} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxTeamSize">Max Team Size</Label>
                  <Input id="maxTeamSize" type="number" {...register('maxTeamSize', { valueAsNumber: true })} />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="registrationDeadline">Registration Deadline (optional)</Label>
                <Input id="registrationDeadline" type="datetime-local" {...register('registrationDeadline')} />
              </div>

              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="bannerUrl">Banner Image URL</Label>
                  <Input id="bannerUrl" {...register('bannerUrl')} placeholder="https://..." />
                  {errors.bannerUrl && <p className="text-xs text-destructive">{errors.bannerUrl.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">External Website</Label>
                  <Input id="websiteUrl" {...register('websiteUrl')} placeholder="https://..." />
                  {errors.websiteUrl && <p className="text-xs text-destructive">{errors.websiteUrl.message}</p>}
                </div>
              </div>
            </CardContent>
            <CardFooter className="justify-between">
              <Button type="button" variant="ghost" onClick={prevStep}>
                <ChevronLeft className="mr-2 h-4 w-4" /> Back
              </Button>
              <Button 
                type="submit" 
                disabled={mutation.isPending}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {mutation.isPending ? 'Creating...' : 'Launch Hackathon'}
                <Save className="ml-2 h-4 w-4" />
              </Button>
            </CardFooter>
          </Card>
        )}
      </form>
    </div>
  );
}
