import * as React from 'react';
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import type { Hackathon, Stage } from '@/shared/api/hackathon.service';
import { hackathonApi } from '@/shared/api/hackathon.service';
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
  GripVertical, 
  Calendar, 
  Trash2, 
  Edit2, 
  Save,
  Clock
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';

interface StagesTabProps {
  hackathon: Hackathon;
}

export function StagesTab({ hackathon }: StagesTabProps) {
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const deleteMutation = useMutation({
    mutationFn: (stageId: string) => hackathonApi.deleteStage(hackathon.id, stageId),
    onSuccess: () => {
      toast.success('Stage deleted');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id] });
    }
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => hackathonApi.createStage(hackathon.id, data),
    onSuccess: () => {
      toast.success('Stage created');
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id] });
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => hackathonApi.updateStage(hackathon.id, id, data),
    onSuccess: () => {
      toast.success('Stage updated');
      setIsDialogOpen(false);
      setEditingStage(null);
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id] });
    }
  });

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const stages = hackathon.stages || [];
    const oldIndex = stages.findIndex((s) => s.id === active.id);
    const newIndex = stages.findIndex((s) => s.id === over.id);

    const newOrder = arrayMove(stages, oldIndex, newIndex);
    
    // In a real app, we'd send a batch update to the backend here.
    // For now, let's toast and we can implement batch update in the API later.
    toast.info('Reordering stages (Optimistic)...');
    
    // Trigger optimistic update in query cache
    queryClient.setQueryData(['hackathon', hackathon.id], (old: Hackathon) => ({
      ...old,
      stages: newOrder.map((s, i) => ({ ...s, orderIndex: i }))
    }));
  };

  const openForm = (stage?: Stage) => {
    if (stage) setEditingStage(stage);
    else setEditingStage(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Hackathon Stages</h2>
          <p className="text-sm text-muted-foreground">Define the timeline and phases of your competition.</p>
        </div>
        <Button onClick={() => openForm()} size="sm" className="gap-2">
          <Plus className="h-4 w-4" /> Add Stage
        </Button>
      </div>

      <DndContext 
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className="grid gap-4">
          <SortableContext 
            items={hackathon.stages?.map(s => s.id) || []}
            strategy={verticalListSortingStrategy}
          >
            {hackathon.stages?.map((stage) => (
              <SortableStageItem 
                key={stage.id} 
                stage={stage} 
                onEdit={openForm}
                onDelete={(id) => deleteMutation.mutate(id)}
              />
            ))}
          </SortableContext>

          {(!hackathon.stages || hackathon.stages.length === 0) && (
            <div className="h-32 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground italic">
              No stages defined. Start by adding the first one.
            </div>
          )}
        </div>
      </DndContext>

      <StageFormDialog 
        isOpen={isDialogOpen} 
        onClose={() => setIsDialogOpen(false)} 
        stage={editingStage}
        nextOrderIndex={hackathon.stages?.length || 0}
        onSubmit={(data) => {
          if (editingStage) updateMutation.mutate({ id: editingStage.id, data });
          else createMutation.mutate(data);
        }}
        isPending={createMutation.isPending || updateMutation.isPending}
      />
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function SortableStageItem({ stage, onEdit, onDelete }: { 
  stage: Stage, 
  onEdit: (s: Stage) => void,
  onDelete: (id: string) => void 
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: stage.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCurrent = new Date() >= new Date(stage.startDate) && new Date() <= new Date(stage.endDate);

  return (
    <Card 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "group border-primary/5 transition-all duration-300",
        isCurrent ? "ring-2 ring-primary bg-primary/5" : "hover:shadow-lg"
      )}
    >
      <div className="flex items-center p-4 gap-4">
        <div {...attributes} {...listeners} className="cursor-grab hover:text-primary transition-colors">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-bold truncate">{stage.name}</h3>
            {isCurrent && <Badge>Active</Badge>}
            <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">
              Phase {stage.orderIndex + 1}
            </Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="h-3 w-3" />
              {new Date(stage.startDate).toLocaleDateString()} — {new Date(stage.endDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              {Math.ceil((new Date(stage.endDate).getTime() - new Date(stage.startDate).getTime()) / (1000 * 3600 * 24))} days
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="ghost" size="icon" onClick={() => onEdit(stage)} className="h-8 w-8">
            <Edit2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(stage.id)} className="h-8 w-8 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

function StageFormDialog({ isOpen, onClose, stage, nextOrderIndex, onSubmit, isPending }: {
  isOpen: boolean,
  onClose: () => void,
  stage: Stage | null,
  nextOrderIndex: number,
  onSubmit: (data: any) => void,
  isPending: boolean
}) {
  const { register, handleSubmit, reset } = useForm({
    defaultValues: stage || {
      name: '',
      description: '',
      startDate: '',
      endDate: '',
      orderIndex: nextOrderIndex
    }
  });

  // Reset form when stage changes or dialog opens/closes
  React.useEffect(() => {
    if (isOpen) {
      if (stage) {
        // Convert to local datetime string for input
        reset({
          ...stage,
          startDate: new Date(stage.startDate).toISOString().slice(0, 16),
          endDate: new Date(stage.endDate).toISOString().slice(0, 16)
        });
      } else {
        reset({
          name: '',
          description: '',
          startDate: '',
          endDate: '',
          orderIndex: nextOrderIndex
        });
      }
    }
  }, [isOpen, stage, reset, nextOrderIndex]);

  const handleFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString(),
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{stage ? 'Edit Stage' : 'Add New Stage'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Stage Name</Label>
            <Input id="name" {...register('name', { required: true })} placeholder="e.g. Ideation Phase" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Input id="description" {...register('description')} placeholder="Briefly what happens here..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div className="grid gap-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input id="startDate" type="datetime-local" {...register('startDate', { required: true })} />
             </div>
             <div className="grid gap-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input id="endDate" type="datetime-local" {...register('endDate', { required: true })} />
             </div>
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Saving...' : <><Save className="mr-2 h-4 w-4" /> Save Stage</>}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
