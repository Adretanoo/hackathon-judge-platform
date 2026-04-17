import * as React from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authClient } from '@/shared/api/auth-client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Input,
  Label,
  Textarea,
} from '@/shared/ui';
import { ArrowLeft, Save, Code2, ExternalLink, GitBranch, Video } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectSubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  teamId: string;
  projectId?: string;   // If editing an existing project
  initialData?: any;
}

export function ProjectSubmissionModal({
  isOpen,
  onClose,
  teamId,
  projectId,
  initialData,
}: ProjectSubmissionModalProps) {
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset } = useForm({
    defaultValues: initialData || {
      // Backend field names: title, repoUrl, demoUrl, videoUrl, description
      title: '',
      description: '',
      repoUrl: '',
      demoUrl: '',
      videoUrl: '',
    },
  });

  React.useEffect(() => {
    if (isOpen) {
      reset(
        initialData || {
          title: '',
          description: '',
          repoUrl: '',
          demoUrl: '',
          videoUrl: '',
        }
      );
    }
  }, [isOpen, initialData, reset]);

  const submitMutation = useMutation({
    mutationFn: (data: any) => {
      // Clean empty strings to avoid backend URL validation errors
      const payload: any = { ...data };
      if (!payload.repoUrl?.trim()) delete payload.repoUrl;
      if (!payload.demoUrl?.trim()) delete payload.demoUrl;
      if (!payload.videoUrl?.trim()) delete payload.videoUrl;

      return projectId
        ? authClient.put(`/projects/${projectId}`, payload)
        : authClient.post(`/projects`, { ...payload, teamId });
    },
    onSuccess: () => {
      toast.success(projectId ? 'Проєкт оновлено!' : 'Проєкт успішно подано!');
      queryClient.invalidateQueries({ queryKey: ['team', teamId, 'project'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || 'Не вдалося зберегти проєкт');
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl p-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              <Code2 className="h-5 w-5 text-primary" />
              {projectId ? 'Редагувати проєкт' : 'Подати проєкт'}
            </DialogTitle>
          </div>
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Повернутися назад
          </Button>
        </DialogHeader>

        <form
          onSubmit={handleSubmit((d) => submitMutation.mutate(d))}
          className="px-6 py-6 space-y-8 max-h-[70vh] overflow-y-auto"
        >
          {/* ── Basic Info ── */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground border-b pb-2">
              Основна інформація
            </h3>
            <div className="grid gap-2">
              <Label>Назва проєкту *</Label>
              <Input
                {...register('title', { required: true })}
                placeholder="Назва вашого неймовірного продукту"
                className="font-bold text-lg"
              />
            </div>
            <div className="grid gap-2">
              <Label>Опис рішення</Label>
              <Textarea
                {...register('description')}
                placeholder="Детально опишіть проблему, яку ви вирішуєте, та як саме працює ваше рішення..."
                rows={5}
              />
            </div>
          </div>

          {/* ── Links ── */}
          <div className="space-y-4">
            <h3 className="font-bold text-sm uppercase tracking-widest text-muted-foreground border-b pb-2">
              Посилання (Матеріали)
            </h3>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <GitBranch className="h-4 w-4" /> Github Repository
                </Label>
                {/* Backend field: repoUrl */}
                <Input
                  {...register('repoUrl')}
                  placeholder="https://github.com/..."
                  type="url"
                />
              </div>
              <div className="grid gap-2">
                <Label className="flex items-center gap-2">
                  <ExternalLink className="h-4 w-4" /> Live Demo URL
                </Label>
                <Input {...register('demoUrl')} placeholder="https://..." type="url" />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label className="flex items-center gap-2">
                  <Video className="h-4 w-4" /> Demo Video URL (YouTube / Loom)
                </Label>
                {/* Backend field: videoUrl */}
                <Input
                  {...register('videoUrl')}
                  placeholder="https://youtube.com/..."
                  type="url"
                />
              </div>
            </div>
          </div>
        </form>

        <DialogFooter className="px-6 py-4 border-t sticky bottom-0 bg-background z-10 flex-row justify-between w-full sm:justify-between shrink-0">
          <Button type="button" variant="secondary" onClick={onClose} className="px-8">
            Скасувати
          </Button>
          <Button
            onClick={handleSubmit((d) => submitMutation.mutate(d))}
            disabled={submitMutation.isPending}
            className="font-bold px-8 gap-2"
          >
            {submitMutation.isPending ? (
              'Збереження...'
            ) : (
              <>
                <Save className="h-4 w-4" />
                {projectId ? 'Зберегти зміни' : 'Подати проєкт'}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
