import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '@/shared/api/team.service';
import type { FreeAgent } from '@/shared/api/team.service';
import type { Hackathon } from '@/shared/api/hackathon.service';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter,
  Button,
  Input,
  Label,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge
} from '@/shared/ui';
import { 
  Search, 
  GripVertical, 
  Users, 
  ShieldCheck,
  Layout,
  UserPlus,
  Plus
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

interface CreateTeamModalProps {
  hackathon: Hackathon;
  isOpen: boolean;
  onClose: () => void;
}

export function CreateTeamModal({ hackathon, isOpen, onClose }: CreateTeamModalProps) {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [trackId, setTrackId] = useState<string>('');
  const [search, setSearch] = useState('');
  
  // Dnd State
  const [selectedAgents, setSelectedAgents] = useState<FreeAgent[]>([]);
  const [activeAgent, setActiveAgent] = useState<FreeAgent | null>(null);

  const { data: freeAgentsData } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'free-agents', { search }],
    queryFn: () => teamApi.listFreeAgents(hackathon.id, { limit: 20 }), // We filter locally for this small list
  });

  const availableAgents = (freeAgentsData?.items || []).filter(
    (fa: FreeAgent) => !selectedAgents.find((s: FreeAgent) => s.id === fa.id) &&
    (fa.fullName.toLowerCase().includes(search.toLowerCase()) || fa.username.toLowerCase().includes(search.toLowerCase()))
  );

  const mutation = useMutation({
    mutationFn: (payload: any) => teamApi.create(hackathon.id, payload),
    onSuccess: () => {
      toast.success('Team created successfully!');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id, 'teams'] });
      onClose();
      // Reset
      setName('');
      setDescription('');
      setSelectedAgents([]);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to create team');
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const agent = availableAgents.find((a: FreeAgent) => a.id === active.id) || selectedAgents.find((a: FreeAgent) => a.id === active.id);
    if (agent) setActiveAgent(agent);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveAgent(null);

    if (!over) return;

    // Logic: If dragged from available to selected
    if (active.data.current?.type === 'available' && over.id === 'dropzone-selected') {
      const agent = availableAgents.find((a: FreeAgent) => a.id === active.id);
      if (agent) setSelectedAgents(prev => [...prev, agent]);
    }
  };

  const removeAgent = (id: string) => {
    setSelectedAgents(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = () => {
    if (!name) return toast.error('Team name is required');
    mutation.mutate({ name, description, trackId: trackId || undefined });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden border-primary/10 shadow-2xl">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-6 w-6 text-primary" /> Create New Team
          </DialogTitle>
        </DialogHeader>

        <DndContext 
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex-1 overflow-hidden grid grid-cols-1 lg:grid-cols-2">
            {/* Left: Form & Selection */}
            <div className="p-6 space-y-6 border-r border-primary/5 bg-muted/10">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="teamName" className="text-xs font-bold uppercase text-muted-foreground">Team Name *</Label>
                  <Input 
                    id="teamName" 
                    placeholder="e.g. The Innovators" 
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="bg-background shadow-sm border-primary/10 focus-visible:ring-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="track" className="text-xs font-bold uppercase text-muted-foreground">Preferred Track</Label>
                  <select 
                    id="track"
                    className="flex h-10 w-full rounded-md border border-primary/10 bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={trackId}
                    onChange={(e) => setTrackId(e.target.value)}
                  >
                    <option value="">No Track Selected</option>
                    {hackathon.tracks?.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Roster ({selectedAgents.length + 1})</Label>
                  <div 
                    id="dropzone-selected"
                    className={cn(
                      "min-h-[160px] p-4 rounded-xl border-2 border-dashed transition-all duration-300",
                      "bg-background/50 flex flex-wrap gap-2 content-start",
                      selectedAgents.length === 0 ? "border-primary/10" : "border-primary/30 bg-primary/5"
                    )}
                  >
                    <Badge variant="outline" className="h-10 px-3 bg-primary/10 border-primary/20 text-primary gap-2 pointer-events-none">
                      <ShieldCheck className="h-4 w-4" /> You (Captain)
                    </Badge>
                    
                    {selectedAgents.map(agent => (
                      <Badge 
                        key={agent.id} 
                        variant="secondary" 
                        className="h-10 pl-1 pr-2 bg-background border-primary/10 flex items-center gap-2 group animate-in zoom-in-95 duration-200"
                      >
                        <Avatar className="h-7 w-7">
                          <AvatarImage src={agent.avatarUrl || ''} />
                          <AvatarFallback className="text-[10px]">{agent.fullName.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-xs font-medium">{agent.fullName}</span>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-5 w-5 rounded-full hover:bg-destructive hover:text-white"
                          onClick={() => removeAgent(agent.id)}
                        >
                          <Plus className="h-3 w-3 rotate-45" />
                        </Button>
                      </Badge>
                    ))}

                    {selectedAgents.length === 0 && (
                      <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-40 italic py-4">
                        <Users className="h-8 w-8 mb-1" />
                        <p className="text-xs">Drag free agents here <br/> to invite them</p>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] text-muted-foreground text-center">Drag available users from the right panel into this box</p>
                </div>
              </div>
            </div>

            {/* Right: Agent Search */}
            <div className="p-0 flex flex-col bg-background">
              <div className="p-6 pb-4 border-b border-primary/5">
                <Label className="text-xs font-bold uppercase text-muted-foreground mb-3 block">Discover Participants</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search by name or skill..." 
                    className="pl-10 bg-muted/30 border-none"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto h-[400px]">
                <div className="p-4 space-y-2">
                  <SortableContext items={availableAgents.map((a: FreeAgent) => a.id)} strategy={verticalListSortingStrategy}>
                    {availableAgents.map((agent: FreeAgent) => (
                      <DraggableAgent key={agent.id} agent={agent} onAdd={() => setSelectedAgents(prev => [...prev, agent])} />
                    ))}
                  </SortableContext>
                  
                  {availableAgents.length === 0 && (
                    <div className="py-12 text-center opacity-50 space-y-2">
                      <Layout className="h-10 w-10 mx-auto" />
                      <p className="text-sm">No free agents found</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          <DragOverlay dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}>
            {activeAgent ? (
              <div className="flex items-center gap-3 p-3 bg-primary text-white rounded-lg shadow-2xl w-64 ring-2 ring-white">
                <Avatar className="h-8 w-8 ring-1 ring-white/20">
                  <AvatarImage src={activeAgent.avatarUrl || ''} />
                  <AvatarFallback>{activeAgent.fullName.charAt(0)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <p className="text-xs font-bold truncate">{activeAgent.fullName}</p>
                  <p className="text-[10px] opacity-80 truncate">Ready to join!</p>
                </div>
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>

        <DialogFooter className="p-6 border-t border-primary/5 bg-muted/20">
          <Button variant="ghost" onClick={onClose} disabled={mutation.isPending}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={mutation.isPending || !name}
            className="bg-primary hover:bg-primary/90 text-white min-w-[140px] shadow-lg shadow-primary/20"
          >
            {mutation.isPending ? 'Launching...' : 'Create Team'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function DraggableAgent({ agent, onAdd }: { agent: FreeAgent; onAdd: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({
    id: agent.id,
    data: {
      type: 'available',
      agent
    }
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div 
      ref={setNodeRef}
      style={style}
      className={cn(
        "flex items-center justify-between p-3 rounded-xl border border-primary/5 bg-muted/30 transition-all",
        isDragging ? "opacity-30 cursor-grabbing bg-primary/20" : "hover:bg-muted/50 hover:border-primary/10"
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        <button {...attributes} {...listeners} className="p-1 rounded hover:bg-primary/5 cursor-grab">
           <GripVertical className="h-4 w-4 text-muted-foreground/50" />
        </button>
        <Avatar className="h-9 w-9">
          <AvatarImage src={agent.avatarUrl || ''} />
          <AvatarFallback className="text-xs">{agent.fullName.charAt(0)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <p className="text-xs font-bold truncate leading-tight">{agent.fullName}</p>
          <div className="flex gap-1 mt-0.5">
            {agent.skills.slice(0, 2).map(s => (
              <span key={s} className="text-[9px] text-primary truncate px-1 bg-primary/5 rounded">{s}</span>
            ))}
          </div>
        </div>
      </div>
      
      <Button 
        variant="ghost" 
        size="icon" 
        className="h-8 w-8 text-primary opacity-0 group-hover:opacity-100 lg:opacity-100"
        onClick={(e) => { e.preventDefault(); onAdd(); }}
      >
        <UserPlus className="h-4 w-4" />
      </Button>
    </div>
  );
}
