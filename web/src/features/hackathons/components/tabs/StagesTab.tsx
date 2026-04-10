
import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { cn } from '@/shared/lib/utils';
import type { Hackathon, Stage } from '@/shared/api/hackathon.service';
import { hackathonApi } from '@/shared/api/hackathon.service';
import { Card, Button, Badge } from '@/shared/ui';
import { Plus, GripVertical, Calendar, Trash2, Edit2, Clock } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, type DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { toast } from 'sonner';
import { StageModal } from '../modals/StageModal';

export function StagesTab({ hackathon }: { hackathon: Hackathon }) {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<Stage | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const deleteMutation = useMutation({
    mutationFn: (stageId: string) => hackathonApi.deleteStage(hackathon.id, stageId),
    onSuccess: () => {
      toast.success('Етап видалено');
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
    
    toast.info('Оновлення порядку (Оптимістично)...');
    queryClient.setQueryData(['hackathon', hackathon.id], (old: Hackathon) => ({
      ...old,
      stages: newOrder.map((s, i) => ({ ...s, orderIndex: i }))
    }));
  };

  const openForm = (stage?: Stage) => {
    setEditingStage(stage || null);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Етапи хакатону</h2>
          <p className="text-sm text-muted-foreground">Налаштуйте часові фази змагання.</p>
        </div>
        <Button onClick={() => openForm()} size="lg" className="gap-2 font-bold shadow-sm">
          <Plus className="h-5 w-5" /> Додати етап
        </Button>
      </div>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="grid gap-4">
          <SortableContext items={hackathon.stages?.map(s => s.id) || []} strategy={verticalListSortingStrategy}>
            {hackathon.stages?.map((stage) => (
              <SortableStageItem 
                key={stage.id} 
                stage={stage} 
                onEdit={openForm}
                onDelete={(id: string) => deleteMutation.mutate(id)}
              />
            ))}
          </SortableContext>
          {(!hackathon.stages || hackathon.stages.length === 0) && (
            <div className="h-32 border-2 border-dashed rounded-xl flex items-center justify-center text-muted-foreground italic">
              Етапи ще не створено. Натисніть "Додати етап".
            </div>
          )}
        </div>
      </DndContext>

      {isModalOpen && (
        <StageModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          hackathonId={hackathon.id}
          stage={editingStage}
          nextOrderIndex={hackathon.stages?.length || 0}
        />
      )}
    </div>
  );
}

function SortableStageItem({ stage, onEdit, onDelete }: any) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stage.id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  const isCurrent = new Date() >= new Date(stage.startDate) && new Date() <= new Date(stage.endDate);

  return (
    <Card ref={setNodeRef} style={style} className={cn("group border-primary/5 transition-all duration-300", isCurrent ? "ring-2 ring-primary bg-primary/5 shadow-md" : "hover:shadow-lg")}>
      <div className="flex items-center p-4 gap-4">
        <div {...attributes} {...listeners} className="cursor-grab hover:text-primary transition-colors p-2">
          <GripVertical className="h-5 w-5 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <h3 className="font-bold truncate text-lg">{stage.name}</h3>
            {isCurrent && <Badge className="bg-emerald-500">Активний</Badge>}
            <Badge variant="outline" className="text-[10px] uppercase font-bold text-muted-foreground">Фаза {stage.orderIndex + 1}</Badge>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5 font-medium">
              <Calendar className="h-4 w-4" /> {new Date(stage.startDate).toLocaleDateString()} — {new Date(stage.endDate).toLocaleDateString()}
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" /> {Math.ceil((new Date(stage.endDate).getTime() - new Date(stage.startDate).getTime()) / (1000 * 3600 * 24))} днів
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" onClick={() => onEdit(stage)} className="gap-2">
            <Edit2 className="h-4 w-4" /> Редагувати
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(stage.id)} className="h-10 w-10 text-destructive hover:bg-destructive/10">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
