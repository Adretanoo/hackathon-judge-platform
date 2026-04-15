import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hackathonApi } from '@/shared/api/hackathon.service';
import { Card, CardHeader, CardTitle, CardContent, Button } from '@/shared/ui';
import { Badge } from '@/shared/ui/badge';
import { Plus, Trash2, Award, Percent, Tag, ChevronDown, ChevronRight, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { CriteriaModal } from '@/features/hackathons/components/modals/CriteriaModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/shared/ui/alert-dialog';
import type { Hackathon } from '@/shared/api/hackathon.service';

interface Criterion {
  id: string;
  name: string;
  description?: string;
  weight: number;
  maxScore: number;
  trackId: string;
}

interface ModalState {
  open: boolean;
  trackId: string;
  criterion: Criterion | null;
}

interface CriteriaTabProps {
  hackathon: Hackathon;
}

export function CriteriaTab({ hackathon }: CriteriaTabProps) {
  const queryClient = useQueryClient();

  const [modalState, setModalState] = useState<ModalState>({
    open: false,
    trackId: '',
    criterion: null,
  });

  const [deleteTarget, setDeleteTarget] = useState<Criterion | null>(null);
  const [expandedTrack, setExpandedTrack] = useState<string | null>(null);

  const tracks = hackathon.tracks ?? [];

  const { data: allCriteria = [] } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'criteria'],
    queryFn: () => hackathonApi.listCriteria(hackathon.id),
  });

  const deleteMutation = useMutation({
    mutationFn: (criterionId: string) =>
      hackathonApi.deleteCriteria(hackathon.id, criterionId),
    onSuccess: () => {
      toast.success('Критерій видалено');
      setDeleteTarget(null);
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id, 'criteria'] });
    },
    onError: () => toast.error('Помилка при видаленні критерію'),
  });

  const openCreate = (trackId: string) =>
    setModalState({ open: true, trackId, criterion: null });

  const openEdit = (criterion: Criterion) =>
    setModalState({ open: true, trackId: criterion.trackId, criterion });

  const closeModal = () =>
    setModalState({ open: false, trackId: '', criterion: null });

  const getCriteriaForTrack = (trackId: string): Criterion[] => {
    const arr = Array.isArray(allCriteria) ? allCriteria : ((allCriteria as any).items || []);
    return arr.filter((c: Criterion) => c.trackId === trackId);
  };

  const totalWeight = (criteria: Criterion[]) =>
    criteria.reduce((sum, c) => sum + Number(c.weight || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-black tracking-tight">Критерії оцінювання</h2>
          <p className="text-muted-foreground text-sm mt-1">
            Налаштуйте критерії для кожного треку. Судді будуть оцінювати проєкти за цими критеріями.
          </p>
        </div>
      </div>

      {/* No Tracks Warning */}
      {tracks.length === 0 && (
        <Card className="border-dashed border-2 border-amber-300/50 bg-amber-50/30 dark:bg-amber-900/10">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center gap-3">
            <Tag className="h-10 w-10 text-amber-500" />
            <h3 className="font-bold text-lg">Немає треків</h3>
            <p className="text-sm text-muted-foreground max-w-sm">
              Спочатку створіть хоча б один трек у вкладці «Треки», щоб потім додавати критерії.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Track Criteria Sections */}
      {tracks.map((track: any) => {
        const criteria = getCriteriaForTrack(track.id);
        const isExpanded = expandedTrack === track.id || expandedTrack === null;
        const weight = totalWeight(criteria);
        const weightOk = Math.abs(weight - 1) < 0.01;

        return (
          <Card key={track.id} className="overflow-hidden shadow-sm border-primary/10">
            {/* Track header */}
            <CardHeader
              className="cursor-pointer select-none hover:bg-muted/30 transition-colors"
              onClick={() => setExpandedTrack(expandedTrack === track.id ? null : track.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 flex-wrap">
                  {expandedTrack === track.id ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}
                  <CardTitle className="text-base font-black">{track.name}</CardTitle>
                  <Badge variant="outline" className="text-[10px] font-bold uppercase">
                    {criteria.length} критеріїв
                  </Badge>
                  <Badge
                    variant={weightOk ? 'default' : 'secondary'}
                    className={`text-[10px] font-bold ${weightOk ? 'bg-emerald-500/10 text-emerald-700 border-emerald-200' : 'bg-amber-500/10 text-amber-700 border-amber-200'}`}
                  >
                    Σ ваги: {weight.toFixed(2)}
                    {weightOk ? ' ✓' : ' ⚠'}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-2 font-bold rounded-xl shrink-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    openCreate(track.id);
                  }}
                >
                  <Plus className="h-4 w-4" /> Додати критерій
                </Button>
              </div>
              {track.description && (
                <p className="text-xs text-muted-foreground pl-7">{track.description}</p>
              )}
            </CardHeader>

            {/* Criteria list */}
            {isExpanded && (
              <CardContent className="pt-0">
                {criteria.length === 0 ? (
                  <div className="py-8 text-center text-muted-foreground">
                    <Award className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Критеріїв ще немає. Натисніть «Додати критерій».</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border/50">
                    {criteria.map((criterion) => (
                      <div
                        key={criterion.id}
                        className="flex items-center justify-between py-3 px-1 hover:bg-muted/10 transition-colors group"
                      >
                        <div className="space-y-0.5 flex-1 min-w-0 pr-4">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm">{criterion.name}</span>
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Percent className="h-2.5 w-2.5" />
                              Вага: {criterion.weight}
                            </Badge>
                            <Badge variant="outline" className="text-[10px] gap-1">
                              <Award className="h-2.5 w-2.5" />
                              Макс: {criterion.maxScore}
                            </Badge>
                          </div>
                          {criterion.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {criterion.description}
                            </p>
                          )}
                        </div>

                        {/* Action buttons — visible on hover */}
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            title="Редагувати критерій"
                            onClick={() => openEdit(criterion)}
                          >
                            <Edit2 className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:bg-destructive/10"
                            title="Видалити критерій"
                            onClick={() => setDeleteTarget(criterion)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        );
      })}

      {/* Create / Edit Modal */}
      <CriteriaModal
        isOpen={modalState.open}
        onClose={closeModal}
        hackathonId={hackathon.id}
        trackId={modalState.trackId}
        criterion={modalState.criterion}
      />

      {/* Delete Confirmation AlertDialog */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Видалити критерій?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ви збираєтесь видалити критерій{' '}
              <strong className="text-foreground">«{deleteTarget?.name}»</strong>.{' '}
              Всі оцінки суддів за цим критерієм також будуть видалені. Цю дію не можна відмінити.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Скасувати</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
            >
              {deleteMutation.isPending ? 'Видалення...' : 'Так, видалити'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
