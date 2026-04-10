import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Hackathon, Track } from '@/shared/api/hackathon.service';
import { hackathonApi } from '@/shared/api/hackathon.service';
import { cn } from '@/shared/lib/utils';
import { 
  Card, 
  Button,
  Badge,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
  Label
} from '@/shared/ui';
import { 
  Plus, 
  Layout, 
  Settings2, 
  Trash2, 
  GripVertical, 
  ChevronRight,
  ChevronDown,
  Award,
  Percent,
  Star
} from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface TracksTabProps {
  hackathon: Hackathon;
}

export function TracksTab({ hackathon }: TracksTabProps) {
  const queryClient = useQueryClient();
  const [expandedTrackId, setExpandedTrackId] = useState<string | null>(null);
  const [isTrackDialogOpen, setIsTrackDialogOpen] = useState(false);
  const [isCriteriaDialogOpen, setIsCriteriaDialogOpen] = useState(false);
  const [editingTrack, setEditingTrack] = useState<Track | null>(null);

  const { data: criteriaList } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'criteria'],
    queryFn: () => hackathonApi.listCriteria(hackathon.id),
  });

  const deleteTrackMutation = useMutation({
    mutationFn: (trackId: string) => hackathonApi.deleteTrack(hackathon.id, trackId),
    onSuccess: () => {
      toast.success('Track removed');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id] });
    }
  });

  const trackMutation = useMutation({
    mutationFn: (data: any) => editingTrack 
      ? hackathonApi.updateTrack(hackathon.id, editingTrack.id, data)
      : hackathonApi.createTrack(hackathon.id, data),
    onSuccess: () => {
      toast.success(editingTrack ? 'Track updated' : 'Track created');
      setIsTrackDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id] });
    }
  });

  const criteriaMutation = useMutation({
    mutationFn: (data: any) => hackathonApi.createCriteria(hackathon.id, data),
    onSuccess: () => {
      toast.success('Criteria added');
      setIsCriteriaDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id, 'criteria'] });
    }
  });

  const toggleTrack = (id: string) => {
    setExpandedTrackId(expandedTrackId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tracks & Judging Criteria</h2>
          <p className="text-sm text-muted-foreground">Manage competition tracks and how they are evaluated.</p>
        </div>
        <Button onClick={() => { setEditingTrack(null); setIsTrackDialogOpen(true); }} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Track
        </Button>
      </div>

      <div className="grid gap-4">
        {hackathon.tracks?.map((track) => (
          <TrackItem 
            key={track.id} 
            track={track} 
            isExpanded={expandedTrackId === track.id}
            onToggle={() => toggleTrack(track.id)}
            onEdit={() => { setEditingTrack(track); setIsTrackDialogOpen(true); }}
            onDelete={() => deleteTrackMutation.mutate(track.id)}
            criteria={criteriaList?.filter((c: any) => c.trackId === track.id) || []}
            onAddCriteria={() => { setIsCriteriaDialogOpen(true); setExpandedTrackId(track.id); }}
          />
        ))}

        {(!hackathon.tracks || hackathon.tracks.length === 0) && (
          <div className="h-32 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground italic">
            No tracks defined. Add a track to begin setting up criteria.
          </div>
        )}
      </div>

      {/* Track Dialog */}
      <TrackDialog 
        isOpen={isTrackDialogOpen}
        onClose={() => setIsTrackDialogOpen(false)}
        track={editingTrack}
        onSubmit={(data: any) => trackMutation.mutate(data)}
        isPending={trackMutation.isPending}
      />

      {/* Criteria Dialog */}
      <CriteriaDialog
        isOpen={isCriteriaDialogOpen}
        onClose={() => setIsCriteriaDialogOpen(false)}
        trackId={expandedTrackId || ''}
        onSubmit={(data: any) => criteriaMutation.mutate(data)}
        isPending={criteriaMutation.isPending}
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function TrackItem({ track, isExpanded, onToggle, onEdit, onDelete, criteria, onAddCriteria }: any) {
  return (
    <Card className={cn(
      "border-primary/5 overflow-hidden transition-all duration-300",
      isExpanded ? "ring-1 ring-primary shadow-lg" : "hover:bg-muted/30"
    )}>
      <div 
        className="flex items-center p-4 cursor-pointer gap-4"
        onClick={onToggle}
      >
        <div className="p-2 rounded-lg bg-primary/10">
          <Layout className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold">{track.name}</h3>
          <p className="text-xs text-muted-foreground truncate">{track.description || 'No description'}</p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="gap-1">
             <Star className="h-3 w-3" /> {criteria.length} Criteria
          </Badge>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onEdit(); }} className="h-8 w-8">
              <Settings2 className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); onDelete(); }} className="h-8 w-8 text-destructive">
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {isExpanded ? <ChevronDown className="h-5 w-5 text-muted-foreground" /> : <ChevronRight className="h-5 w-5 text-muted-foreground" />}
        </div>
      </div>

      {isExpanded && (
        <div className="bg-muted/30 p-4 border-t space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center justify-between">
             <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Evaluation Builder</h4>
             <Button variant="outline" className="h-7 text-[10px] px-2" onClick={onAddCriteria}>
                <Plus className="h-3 w-3 mr-1" /> Add Criterion
             </Button>
          </div>

          <div className="space-y-2">
            {criteria.map((c: any) => (
              <div key={c.id} className="flex items-center p-3 bg-background rounded-lg border border-primary/5 group">
                <GripVertical className="h-4 w-4 text-muted-foreground mr-3 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="flex-1">
                   <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{c.name}</span>
                      <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-secondary-foreground">Weight {c.weight}</span>
                   </div>
                   <p className="text-xs text-muted-foreground line-clamp-1">{c.description}</p>
                </div>
                <div className="flex items-center gap-4 text-xs">
                   <div className="flex flex-col items-end">
                      <span className="text-muted-foreground uppercase text-[8px] font-bold">Max Points</span>
                      <span className="font-bold">{c.maxScore}</span>
                   </div>
                   <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100">
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                   </Button>
                </div>
              </div>
            ))}

            {criteria.length === 0 && (
              <p className="text-center py-4 text-sm text-muted-foreground italic">No criteria added yet. Judging will be impossible for this track.</p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}

function TrackDialog({ isOpen, onClose, track, onSubmit, isPending }: any) {
  const { register, handleSubmit, reset } = useForm();

  React.useEffect(() => {
    if (isOpen) reset(track || { name: '', description: '', maxTeams: '' });
  }, [isOpen, track, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{track ? 'Edit Track' : 'Create New Track'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="t-name">Name</Label>
            <Input id="t-name" {...register('name', { required: true })} placeholder="e.g. AI Innovation" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-desc">Description</Label>
            <Input id="t-desc" {...register('description')} placeholder="Specific challenge focus..." />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="t-max">Max Teams (Optional)</Label>
            <Input id="t-max" type="number" {...register('maxTeams', { valueAsNumber: true })} />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Saving...' : 'Save Track'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function CriteriaDialog({ isOpen, onClose, trackId, onSubmit, isPending }: any) {
  const { register, handleSubmit, reset } = useForm();

  React.useEffect(() => {
    if (isOpen) reset({ name: '', description: '', weight: 1, maxScore: 10, trackId });
  }, [isOpen, trackId, reset]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Criterion</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="c-name">Name</Label>
            <Input id="c-name" {...register('name', { required: true })} placeholder="e.g. Technical Complexity" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="c-desc">Description</Label>
            <Input id="c-desc" {...register('description')} placeholder="What should judges look for?" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="c-weight">Weight (Importance)</Label>
              <div className="flex items-center gap-2">
                 <Percent className="h-4 w-4 text-muted-foreground" />
                 <Input id="c-weight" type="number" step="0.1" {...register('weight', { required: true, valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="c-max">Max Score</Label>
              <div className="flex items-center gap-2">
                 <Award className="h-4 w-4 text-muted-foreground" />
                 <Input id="c-max" type="number" {...register('maxScore', { required: true, valueAsNumber: true })} />
              </div>
            </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>{isPending ? 'Adding...' : 'Add Criteria'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
