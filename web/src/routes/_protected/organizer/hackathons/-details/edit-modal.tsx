import * as React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { hackathonApi } from '@/shared/api/hackathon.service';
import type { Hackathon, HackathonStatus } from '@/shared/api/hackathon.service';
import { useForm, Controller } from 'react-hook-form';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui';
import { Textarea } from '@/shared/ui/textarea';
import { Switch } from '@/shared/ui/switch';
import {
  Save,
  ArrowLeft,
  Globe,
  MapPin,
  Calendar,
  Users,
  Link as LinkIcon,
  FileText,
} from 'lucide-react';
import { toast } from 'sonner';

interface EditHackathonModalProps {
  isOpen: boolean;
  onClose: () => void;
  hackathon: Hackathon;
}

const STATUS_OPTIONS: { value: HackathonStatus; label: string; color: string }[] = [
  { value: 'DRAFT', label: 'Draft', color: 'bg-slate-100 text-slate-700' },
  { value: 'REGISTRATION_OPEN', label: 'Registration Open', color: 'bg-blue-100 text-blue-700' },
  { value: 'REGISTRATION_CLOSED', label: 'Registration Closed', color: 'bg-orange-100 text-orange-700' },
  { value: 'ONGOING', label: 'Ongoing', color: 'bg-green-100 text-green-700' },
  { value: 'JUDGING', label: 'Judging', color: 'bg-cyan-100 text-cyan-700' },
  { value: 'COMPLETED', label: 'Completed', color: 'bg-emerald-100 text-emerald-700' },
  { value: 'ARCHIVED', label: 'Archived', color: 'bg-zinc-100 text-zinc-600' },
];

export function EditHackathonModal({ isOpen, onClose, hackathon }: EditHackathonModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, control, watch } = useForm({
    defaultValues: {
      title: hackathon.title,
      subtitle: hackathon.subtitle ?? '',
      description: hackathon.description ?? '',
      status: hackathon.status,
      startDate: hackathon.startDate ? new Date(hackathon.startDate).toISOString().slice(0, 16) : '',
      endDate: hackathon.endDate ? new Date(hackathon.endDate).toISOString().slice(0, 16) : '',
      registrationDeadline: hackathon.registrationDeadline
        ? new Date(hackathon.registrationDeadline).toISOString().slice(0, 16)
        : '',
      location: hackathon.location ?? '',
      isOnline: hackathon.isOnline,
      websiteUrl: hackathon.websiteUrl ?? '',
      minTeamSize: hackathon.minTeamSize,
      maxTeamSize: hackathon.maxTeamSize,
    },
  });

  const isOnline = watch('isOnline');

  React.useEffect(() => {
    if (isOpen) {
      reset({
        title: hackathon.title,
        subtitle: hackathon.subtitle ?? '',
        description: hackathon.description ?? '',
        status: hackathon.status,
        startDate: hackathon.startDate ? new Date(hackathon.startDate).toISOString().slice(0, 16) : '',
        endDate: hackathon.endDate ? new Date(hackathon.endDate).toISOString().slice(0, 16) : '',
        registrationDeadline: hackathon.registrationDeadline
          ? new Date(hackathon.registrationDeadline).toISOString().slice(0, 16)
          : '',
        location: hackathon.location ?? '',
        isOnline: hackathon.isOnline,
        websiteUrl: hackathon.websiteUrl ?? '',
        minTeamSize: hackathon.minTeamSize,
        maxTeamSize: hackathon.maxTeamSize,
      });
    }
  }, [isOpen, hackathon, reset]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => hackathonApi.update(hackathon.id, {
      ...data,
      startDate: data.startDate ? new Date(data.startDate).toISOString() : undefined,
      endDate: data.endDate ? new Date(data.endDate).toISOString() : undefined,
      registrationDeadline: data.registrationDeadline ? new Date(data.registrationDeadline).toISOString() : undefined,
      minTeamSize: Number(data.minTeamSize),
      maxTeamSize: Number(data.maxTeamSize),
    }),
    onSuccess: () => {
      toast.success('Hackathon updated!');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id] });
      queryClient.invalidateQueries({ queryKey: ['hackathons'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || 'Update failed');
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="h-8 w-8 rounded-lg -ml-1"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <DialogTitle className="text-xl font-black">Edit Hackathon</DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Update the details for "{hackathon.title}"</p>
              </div>
            </div>
            <Badge variant="outline" className="capitalize">{hackathon.status.replace('_', ' ')}</Badge>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => updateMutation.mutate(d))}>
          <div className="px-6 py-6 space-y-8">

            {/* --- Section: Basic Info --- */}
            <Section title="Basic Information" icon={<FileText className="h-4 w-4" />}>
              <FieldRow>
                <Field label="Title *">
                  <Input {...register('title', { required: true })} placeholder="Hackathon title" />
                </Field>
                <Field label="Subtitle">
                  <Input {...register('subtitle')} placeholder="One-line tagline" />
                </Field>
              </FieldRow>
              <Field label="Description">
                <Textarea
                  {...register('description')}
                  placeholder="Full description of the hackathon..."
                  rows={4}
                  className="resize-none"
                />
              </Field>
            </Section>

            {/* --- Section: Status --- */}
            <Section title="Status" icon={<LinkIcon className="h-4 w-4" />}>
              <Field label="Current Status">
                <Controller
                  control={control}
                  name="status"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((s) => (
                          <SelectItem key={s.value} value={s.value}>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded mr-2 ${s.color}`}>
                              {s.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <p className="text-[11px] text-muted-foreground">
                  Changing status affects participant visibility and registration availability.
                </p>
              </Field>
            </Section>

            {/* --- Section: Dates --- */}
            <Section title="Dates & Deadlines" icon={<Calendar className="h-4 w-4" />}>
              <FieldRow>
                <Field label="Start Date *">
                  <Input type="datetime-local" {...register('startDate', { required: true })} />
                </Field>
                <Field label="End Date *">
                  <Input type="datetime-local" {...register('endDate', { required: true })} />
                </Field>
              </FieldRow>
              <Field label="Registration Deadline">
                <Input type="datetime-local" {...register('registrationDeadline')} />
              </Field>
            </Section>

            {/* --- Section: Location --- */}
            <Section title="Location & Format" icon={isOnline ? <Globe className="h-4 w-4" /> : <MapPin className="h-4 w-4" />}>
              <Field label="Online Event">
                <div className="flex items-center gap-3 pt-1">
                  <Controller
                    control={control}
                    name="isOnline"
                    render={({ field }) => (
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        id="is-online"
                      />
                    )}
                  />
                  <Label htmlFor="is-online" className="cursor-pointer text-sm">
                    {isOnline ? 'Participants join remotely' : 'In-person event'}
                  </Label>
                </div>
              </Field>
              {!isOnline && (
                <Field label="Location">
                  <Input {...register('location')} placeholder="City, venue, address..." />
                </Field>
              )}
              <Field label="Website URL">
                <Input {...register('websiteUrl')} type="url" placeholder="https://..." />
              </Field>
            </Section>

            {/* --- Section: Teams --- */}
            <Section title="Team Configuration" icon={<Users className="h-4 w-4" />}>
              <FieldRow>
                <Field label="Min Team Size">
                  <Input type="number" min={1} max={20} {...register('minTeamSize', { valueAsNumber: true })} />
                </Field>
                <Field label="Max Team Size">
                  <Input type="number" min={1} max={20} {...register('maxTeamSize', { valueAsNumber: true })} />
                </Field>
              </FieldRow>
            </Section>
          </div>

          {/* Footer */}
          <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background z-10 gap-2">
            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={updateMutation.isPending}
              className="rounded-xl gap-2 min-w-[140px] font-bold"
            >
              {updateMutation.isPending ? (
                'Saving...'
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ─── Layout helpers ───────────────────────────────────────────────────────────

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary">{icon}</div>
        <h3 className="font-black text-sm uppercase tracking-widest text-muted-foreground">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
