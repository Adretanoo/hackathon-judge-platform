
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Hackathon, Track } from '@/shared/api/hackathon.service';
import { hackathonApi } from '@/shared/api/hackathon.service';
import { cn } from '@/shared/lib/utils';
import { Card, Button, Badge } from '@/shared/ui';
import { Plus, Layout, Settings2, Trash2, GripVertical, ChevronRight, ChevronDown, Star } from 'lucide-react';
import { toast } from 'sonner';
import { TrackModal } from '../modals/TrackModal';
import { CriteriaModal } from '../modals/CriteriaModal';

export function TracksTab({ hackathon }: { hackathon: Hackathon }) {
  const queryClient = useQueryClient();
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);

  const [isTrackModalOpen, setIsTrackModalOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);

  const [isCriteriaModalOpen, setIsCriteriaModalOpen] = useState(false);
  const [activeTrackForCriteria, setActiveTrackForCriteria] = useState<string>('');

  const { data: criteriaList } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'criteria'],
    queryFn: () => hackathonApi.listCriteria(hackathon.id),
  });

  const deleteTrackMutation = useMutation({
    mutationFn: (trackId: string) => hackathonApi.deleteTrack(hackathon.id, trackId),
    onSuccess: () => {
      toast.success('Трек успішно видалено');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id] });
    }
  });

  const toggleTrack = (id: string) => {
    setExpandedTrackId(expandedTrackId === id ? null : id);
  };

  const openTrackForm = (track?: Track) => {
    setEditingTrack(track || null);
    setIsTrackModalOpen(true);
  };

  const openCriteriaForm = (trackId: string) => {
    setActiveTrackForCriteria(trackId);
    setExpandedTrackId(trackId); // Ensure it's expanded to see the result
    setIsCriteriaModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Напрямки (Треки) та Критерії</h2>
          <p className="text-sm text-muted-foreground">Керуйте викликами західу та тим, як судді їх оцінюють.</p>
        </div>
        <Button onClick={() => openTrackForm()} size="lg" className="gap-2 font-bold shadow-sm">
          <Plus className="h-5 w-5" /> Створити трек
        </Button>
      </div>

      <div className="grid gap-4">
        {hackathon.tracks?.map((track) => (
          <TrackItem
            key={track.id}
            track={track}
            isExpanded={expandedTrackId === track.id}
            onToggle={() => toggleTrack(track.id)}
            onEdit={() => openTrackForm(track)}
            onDelete={() => deleteTrackMutation.mutate(track.id)}
            criteria={criteriaList?.filter((c: any) => c.trackId === track.id) || []}
            onAddCriteria={() => openCriteriaForm(track.id)}
          />
        ))}

        {(!hackathon.tracks || hackathon.tracks.length === 0) && (
          <div className="h-32 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground italic">
            Треки ще не створено. Натисніть "Створити трек" щоб почати формувати оцінювання.
          </div>
        )}
      </div>

      <TrackModal
        isOpen={isTrackModalOpen}
        onClose={() => setIsTrackModalOpen(false)}
        hackathonId={hackathon.id}
        track={editingTrack}
      />

      {isCriteriaModalOpen && (
        <CriteriaModal
          isOpen={isCriteriaModalOpen}
          onClose={() => setIsCriteriaModalOpen(false)}
          hackathonId={hackathon.id}
          trackId={activeTrackForCriteria}
        />
      )}
    </div>
  );
}

function TrackItem({ track, isExpanded, onToggle, onEdit, onDelete, criteria, onAddCriteria }: any) {
  return (
    <Card className={cn("border-primary/5 overflow-hidden transition-all duration-300", isExpanded ? "ring-2 ring-primary shadow-lg" : "hover:shadow-md")}>
      <div className="flex items-center p-4 cursor-pointer gap-4 group" onClick={onToggle}>
        <div className="p-3 rounded-xl bg-primary/10">
          <Layout className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-lg">{track.name}</h3>
          <p className="text-sm text-muted-foreground truncate">{track.description || 'Немає опису'}</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="gap-1 px-3 py-1 text-sm bg-primary/5 text-primary">
            <Star className="h-4 w-4" /> {criteria.length} Критеріїв
          </Badge>
          <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => e.stopPropagation()}>
            <Button variant="secondary" onClick={onEdit} className="gap-2">
              <Settings2 className="h-4 w-4" /> Налаштувати
            </Button>
            <Button variant="ghost" size="icon" onClick={onDelete} className="h-10 w-10 text-destructive hover:bg-destructive/10">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-2">
            {isExpanded ? <ChevronDown className="h-6 w-6 text-muted-foreground" /> : <ChevronRight className="h-6 w-6 text-muted-foreground" />}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="bg-muted/20 p-6 border-t space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Формула оцінювання цього треку</h4>
            <Button variant="outline" size="sm" onClick={onAddCriteria} className="gap-2 font-bold">
              <Plus className="h-4 w-4" /> Додати критерій
            </Button>
          </div>

          <div className="space-y-3">
            {criteria.map((c: any) => (
              <div key={c.id} className="flex items-center p-4 bg-background rounded-xl border border-primary/10 shadow-sm group">
                <GripVertical className="h-5 w-5 text-muted-foreground mr-4 cursor-grab opacity-30 hover:opacity-100 transition-opacity" />
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-base">{c.name}</span>
                    <span className="text-xs font-bold uppercase tracking-wider text-primary border border-primary/20 px-2 py-0.5 rounded-full bg-primary/5">Вага x{c.weight}</span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{c.description}</p>
                </div>
                <div className="flex items-center gap-6">
                  <div className="flex flex-col items-end">
                    <span className="text-muted-foreground uppercase text-[10px] font-bold">Макс Балів</span>
                    <span className="font-black text-xl">{c.maxScore}</span>
                  </div>
                  <Button variant="ghost" size="icon" className="h-10 w-10 opacity-0 group-hover:opacity-100 hover:bg-destructive/10">
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}

            {criteria.length === 0 && (
              <div className="p-6 text-center border-2 border-dashed rounded-xl border-destructive/20 bg-destructive/5 text-destructive font-medium">
                Не додано жодного критерію! Судді не зможуть оцінювати проєкти.
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
