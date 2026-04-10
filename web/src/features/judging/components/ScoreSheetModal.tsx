
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Button,
  Label,
  Input,
  Badge
} from '@/shared/ui';
import { Textarea } from '@/shared/ui/textarea';
import { ArrowLeft, Save, ShieldAlert, GitBranch, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';

interface ScoreSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function ScoreSheetModal({ isOpen, onClose, projectId }: ScoreSheetModalProps) {
  const queryClient = useQueryClient();
  const { register, handleSubmit } = useForm();
  
  // Stubbing project and criteria data
  const project = {
    id: projectId,
    name: 'Eco AI',
    description: 'Система моніторингу лісів з використанням штучного інтелекту.',
    githubUrl: 'https://github.com/example/eco-ai',
    demoUrl: 'https://eco-ai.demo',
    conflict: false // would be dynamic
  };

  const criteria = [
    { id: '1', name: 'Технічна складність', maxScore: 10, weight: 1.5, description: 'Наскільки складні алгоритми використані?' },
    { id: '2', name: 'Комерційний потенціал', maxScore: 10, weight: 1.0, description: 'Чи є шанс заробити на цьому?' },
    { id: '3', name: 'Дизайн та UX', maxScore: 5, weight: 0.5, description: 'Чи зручно користуватися?' },
  ];

  const submitMutation = useMutation({
    mutationFn: async (data: any) => {
      // Stub submission
      await new Promise(r => setTimeout(r, 1000));
      return data;
    },
    onSuccess: () => {
      toast.success('Оцінку успішно збережено!');
      queryClient.invalidateQueries({ queryKey: ['judge-assignments'] });
      onClose();
    }
  });

  const onSubmit = (data: any) => {
    submitMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl p-0 min-h-[70vh] flex flex-col">
        <DialogHeader className="px-6 pt-6 pb-4 border-b sticky top-0 bg-background z-10 flex flex-row items-center justify-between">
          <div>
            <DialogTitle className="text-xl font-black flex items-center gap-2">
              Оцінювання проєкту: <span className="text-primary">{project.name}</span>
            </DialogTitle>
          </div>
          <Button variant="ghost" onClick={onClose} className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Повернутися назад
          </Button>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto">
            {project.conflict && (
              <div className="mx-6 mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div>
                  <h4 className="font-bold text-destructive">Конфлікт інтересів виявлено</h4>
                  <p className="text-sm text-destructive/80 mt-1">Ви вказані як ментор цієї команди. Переконайтеся, що організатори дозволили вам виставляти оцінки.</p>
                </div>
              </div>
            )}

            <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Project Info Column */}
              <div className="lg:col-span-1 space-y-6">
                <div>
                  <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-xs mb-2">Опис проєкту</h3>
                  <p className="text-sm">{project.description}</p>
                </div>

                <div className="space-y-3">
                  <h3 className="font-bold uppercase tracking-wider text-muted-foreground text-xs">Посилання</h3>
                  <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3 bg-secondary/30">
                    <GitBranch className="h-5 w-5" />
                    <div>
                      <div className="font-bold text-sm text-left">Репозиторій</div>
                      <div className="text-xs text-muted-foreground font-normal">Переглянути код</div>
                    </div>
                  </Button>
                  <Button variant="outline" className="w-full justify-start gap-2 h-auto py-3 bg-secondary/30">
                    <ExternalLink className="h-5 w-5" />
                    <div>
                      <div className="font-bold text-sm text-left">Demo (Deploy)</div>
                      <div className="text-xs text-muted-foreground font-normal">Відкрити живий сайт</div>
                    </div>
                  </Button>
                </div>
              </div>

              {/* Scoring Column */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="font-bold text-lg border-b pb-2">Виставлення балів</h3>
                
                <div className="space-y-6">
                  {criteria.map((c) => (
                    <div key={c.id} className="p-4 border rounded-xl bg-card space-y-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <Label className="text-base font-bold">{c.name}</Label>
                          <p className="text-xs text-muted-foreground mt-1">{c.description}</p>
                        </div>
                        <Badge variant="outline" className="font-mono bg-muted/50">Max: {c.maxScore}</Badge>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <input 
                          type="range" 
                          min="0" 
                          max={c.maxScore} 
                          step="1" 
                          className="flex-1 accent-primary"
                          {...register(`scores.${c.id}`, { required: true, valueAsNumber: true })} 
                        />
                        <Input 
                          type="number" 
                          className="w-20 font-black text-center text-lg h-12"
                          {...register(`scores.${c.id}`, { required: true, valueAsNumber: true })} 
                          max={c.maxScore} 
                          min="0"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4">
                  <Label className="font-bold text-base">Загальний коментар (Зворотний зв'язок)</Label>
                  <Textarea 
                    {...register('comment')} 
                    placeholder="Напишіть ваші враження, слабкі та сильні сторони..." 
                    className="h-32 text-base resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Учасники побачать цей коментар після завершення хакатону.</p>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="px-6 py-4 border-t bg-background flex-row justify-between w-full sm:justify-between shrink-0">
            <Button type="button" variant="secondary" onClick={onClose} className="px-8">
              Скасувати
            </Button>
            <Button type="submit" disabled={submitMutation.isPending} className="font-bold px-8 gap-2">
              {submitMutation.isPending ? 'Збереження...' : (
                <>
                  <Save className="h-4 w-4" />
                  Зберегти оцінку
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
