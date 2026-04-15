import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { projectApi } from '@/shared/api/project.service';
import type { Project } from '@/shared/api/project.service';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  Button,
  Input,
  Label,
  Badge
} from '@/shared/ui';
import { 
  Trash2, 
  GripVertical, 
  Link as LinkIcon, 
  Save, 
  Send,
  X,
  PlusCircle,
  FileText,
  Terminal
} from 'lucide-react';
import { 
  DndContext, 
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

interface Resource {
  id: string; // Temporary ID for DND
  label: string;
  url: string;
}

interface ProjectSubmissionFormProps {
  teamId: string;
  initialData?: Project;
  onSuccess?: () => void;
}

export function ProjectSubmissionForm({ teamId, initialData, onSuccess }: ProjectSubmissionFormProps) {
  const queryClient = useQueryClient();
  const [title, setTitle] = useState(initialData?.title || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [repoUrl, setRepoUrl] = useState(initialData?.repoUrl || '');
  const [demoUrl, setDemoUrl] = useState(initialData?.demoUrl || '');
  const [techStack, setTechStack] = useState<string[]>(initialData?.techStack || []);
  const [newTech, setNewTech] = useState('');
  
  const [resources, setResources] = useState<Resource[]>(
    initialData?.resources?.map(r => ({ ...r, id: r.id })) || []
  );

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || '');
      setDescription(initialData.description || '');
      setRepoUrl(initialData.repoUrl || '');
      setDemoUrl(initialData.demoUrl || '');
      setTechStack(initialData.techStack || []);
      setResources(initialData.resources?.map(r => ({ ...r, id: r.id })) || []);
    }
  }, [initialData]);

  const mutation = useMutation({
    mutationFn: (payload: any) => 
      initialData 
        ? projectApi.update(initialData.id, payload)
        : projectApi.create({ ...payload, teamId }),
    onSuccess: () => {
      toast.success(initialData ? 'Project updated' : 'Project created');
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      if (onSuccess) onSuccess();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to save project');
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: any) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setResources((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addResource = () => {
    setResources([...resources, { id: Math.random().toString(36).substr(2, 9), label: '', url: '' }]);
  };

  const removeResource = (id: string) => {
    setResources(resources.filter(r => r.id !== id));
  };

  const updateResource = (id: string, field: keyof Resource, value: string) => {
    setResources(resources.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const addTech = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const val = newTech.trim();
      if (val && !techStack.includes(val)) {
        setTechStack(prev => [...prev, val]);
      }
      setNewTech('');
    }
  };

  const handleTechChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val.endsWith(',')) {
      const newTag = val.slice(0, -1).trim();
      if (newTag && !techStack.includes(newTag)) {
        setTechStack(prev => [...prev, newTag]);
      }
      setNewTech('');
    } else {
      setNewTech(val);
    }
  };

  const removeTech = (tech: string) => {
    setTechStack(techStack.filter(t => t !== tech));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return toast.error('Title is required');
    
    mutation.mutate({
      title,
      description,
      repoUrl,
      demoUrl,
      techStack,
      resources: resources
        .filter(r => r.label && r.url)
        .map(({ label, url }) => ({ label, url }))
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <Card className="border-primary/10 shadow-xl overflow-hidden bg-gradient-to-br from-white to-primary/5 dark:from-slate-900 dark:to-slate-800/50">
        <CardHeader className="border-b border-primary/5 bg-white/50 dark:bg-slate-800/50">
           <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-primary/10 text-primary">
                 <FileText className="h-6 w-6" />
              </div>
              <div>
                 <CardTitle className="text-2xl font-bold tracking-tight">Project Details</CardTitle>
                 <CardDescription>Tell the judges about your amazing creation</CardDescription>
              </div>
           </div>
        </CardHeader>
        <CardContent className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="title" className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                Project Title <span className="text-destructive">*</span>
              </Label>
              <Input 
                id="title" 
                placeholder="Ex: EcoTracker AI" 
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-transparent border-primary/20 shadow-sm focus-visible:ring-primary h-12 text-lg font-medium"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="description" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</Label>
              <textarea 
                id="description" 
                placeholder="What does your project do? What problem does it solve?" 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[160px] w-full rounded-md border border-primary/20 bg-transparent px-3 py-2 text-base shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="repoUrl" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Repository URL (GitHub/GitLab)</Label>
              <div className="relative">
                 <Terminal className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                 <Input 
                  id="repoUrl" 
                  placeholder="https://github.com/..." 
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  className="pl-10 bg-transparent border-primary/20 shadow-sm focus-visible:ring-primary"
                 />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="demoUrl" className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Live Demo URL</Label>
              <div className="relative">
                 <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                 <Input 
                  id="demoUrl" 
                  placeholder="https://my-app.vercel.app" 
                  value={demoUrl}
                  onChange={(e) => setDemoUrl(e.target.value)}
                  className="pl-10 bg-transparent border-primary/20 shadow-sm focus-visible:ring-primary"
                 />
              </div>
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Tech Stack (Press Enter to add)</Label>
              <div className="space-y-3">
                 <Input 
                  placeholder="e.g. React, Node.js, TensorFlow" 
                  value={newTech}
                  onChange={handleTechChange}
                  onKeyDown={addTech}
                  className="bg-transparent border-primary/20 shadow-sm focus-visible:ring-primary"
                 />
                 <div className="flex flex-wrap gap-2">
                    {techStack.map(t => (
                      <Badge key={t} className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-3 py-1 gap-1.5 transition-all animate-in zoom-in-95">
                        {t}
                        <X className="h-3 w-3 cursor-pointer hover:text-destructive" onClick={() => removeTech(t)} />
                      </Badge>
                    ))}
                    {techStack.length === 0 && <span className="text-xs text-muted-foreground italic">No tech tags added yet.</span>}
                 </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-primary/10 shadow-xl overflow-hidden bg-white/50 dark:bg-slate-800/50">
        <CardHeader className="border-b border-primary/5">
           <div className="flex items-center justify-between">
              <div>
                 <CardTitle className="text-xl font-bold">Project Resources</CardTitle>
                 <CardDescription>Links to documentation, video pitches, or extra materials</CardDescription>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={addResource} className="gap-2 border-primary/20 text-primary hover:bg-primary/5">
                 <PlusCircle className="h-4 w-4" /> Add Link
              </Button>
           </div>
        </CardHeader>
        <CardContent className="p-0">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="divide-y divide-primary/5">
              <SortableContext 
                items={resources.map(r => r.id)}
                strategy={verticalListSortingStrategy}
              >
                {resources.map((resource) => (
                  <SortableResource 
                    key={resource.id} 
                    resource={resource} 
                    onUpdate={updateResource}
                    onRemove={removeResource}
                  />
                ))}
              </SortableContext>
            </div>
            {resources.length === 0 && (
              <div className="p-12 text-center opacity-40 italic flex flex-col items-center gap-3">
                 <LinkIcon className="h-10 w-10 text-muted-foreground/30" />
                 <p className="text-sm">No extra resources added yet.</p>
              </div>
            )}
          </DndContext>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-4 pb-10">
         <Button type="button" variant="ghost" className="text-muted-foreground hover:text-foreground">
            Discard Changes
         </Button>
         <Button 
            type="submit" 
            disabled={mutation.isPending}
            className="bg-primary text-white hover:bg-primary/90 px-8 h-12 gap-2 shadow-xl shadow-primary/20 transition-all active:scale-95"
         >
            {mutation.isPending ? 'Saving...' : (initialData ? 'Update Project' : 'Submit Project')}
            {initialData ? <Save className="h-5 w-5" /> : <Send className="h-5 w-5" />}
         </Button>
      </div>
    </form>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

interface SortableResourceProps {
  resource: Resource;
  onUpdate: (id: string, field: keyof Resource, value: string) => void;
  onRemove: (id: string) => void;
}

function SortableResource({ resource, onUpdate, onRemove }: SortableResourceProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: resource.id });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={cn(
        "flex items-center gap-4 p-4 transition-all",
        isDragging ? "bg-primary/10 shadow-2xl relative z-50" : "bg-transparent dark:hover:bg-slate-800 hover:bg-primary/[0.01]"
      )}
    >
      <button {...attributes} {...listeners} className="p-1 rounded hover:bg-muted cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5 text-muted-foreground/50" />
      </button>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
        <Input 
          placeholder="Resource Label (e.g. Documentation)" 
          value={resource.label}
          onChange={(e) => onUpdate(resource.id, 'label', e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          className="bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
        />
        <Input 
          placeholder="URL (https://...)" 
          value={resource.url}
          onChange={(e) => onUpdate(resource.id, 'url', e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') e.preventDefault(); }}
          className="bg-muted/30 border-none shadow-none focus-visible:ring-1 focus-visible:ring-primary/20"
        />
      </div>

      <Button 
        type="button" 
        variant="ghost" 
        size="icon" 
        className="text-muted-foreground hover:text-destructive transition-colors"
        onClick={() => onRemove(resource.id)}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
