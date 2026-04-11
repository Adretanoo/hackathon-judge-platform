import { useState } from 'react';
import { cn } from '@/shared/lib/utils';
import { type JudgingProject, type JudgeStats } from '@/shared/api/judging.service';
import { Card, CardContent, Badge, Button } from '@/shared/ui';
import { 
  CheckCircle2, 
  Clock, 
  Layout, 
  ClipboardCheck,
  Code2,
  Users
} from 'lucide-react';
import { ScoreSheetModal } from './score-sheet-modal';

interface JudgingKanbanProps {
  projects: JudgingProject[];
  judgeStats?: JudgeStats;
  conflicts?: any[];
}

export function JudgingKanban({ projects, judgeStats, conflicts = [] }: JudgingKanbanProps) {
  const [selectedProject, setSelectedProject] = useState<JudgingProject | null>(null);

  // Divide projects into Pending and Scored based on isScored flag
  const pendingProjects = projects.filter(p => !p.isScored && !p.hasConflict);
  const scoredProjects = projects.filter(p => p.isScored);

  const columns = [
    { 
        id: 'pending', 
        title: 'Pending Evaluation', 
        icon: Clock, 
        items: pendingProjects,
        color: 'text-amber-500',
        bgColor: 'bg-amber-500/5',
        borderColor: 'border-amber-500/10'
    },
    { 
        id: 'scored', 
        title: 'Evaluated', 
        icon: CheckCircle2, 
        items: scoredProjects,
        color: 'text-emerald-500',
        bgColor: 'bg-emerald-500/5',
        borderColor: 'border-emerald-500/10'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 h-full min-h-[600px]">
      {columns.map(col => (
        <div key={col.id} className={cn("flex flex-col rounded-3xl border p-4 shadow-sm", col.bgColor, col.borderColor)}>
          <div className="flex items-center justify-between mb-6 px-2">
             <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-xl bg-white shadow-sm border border-black/5", col.color)}>
                   <col.icon className="h-5 w-5" />
                </div>
                <div>
                   <h3 className="font-bold text-foreground">{col.title}</h3>
                   <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{col.items.length} Projects</p>
                </div>
             </div>
             <Layout className="h-4 w-4 text-muted-foreground opacity-20" />
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto max-h-[70vh] pr-2 custom-scrollbar">
            {col.items.map(project => {
                const isConflicted = conflicts.some(c => c.teamId === project.team?.name);
                return (
                    <Card key={project.id} className="group border-primary/5 hover:border-primary/20 transition-all hover:shadow-lg hover:shadow-primary/5 cursor-pointer bg-white overflow-hidden relative" onClick={() => setSelectedProject(project)}>
                        <CardContent className="p-5 space-y-4">
                            {isConflicted && (
                                <Badge variant="destructive" className="absolute top-2 right-2 text-[8px] h-4">Conflict</Badge>
                            )}
                            <div className="space-y-1">
                                <h4 className="font-bold text-lg leading-tight group-hover:text-primary transition-colors">{project.title}</h4>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    <span>{project.team?.name ?? '—'}</span>
                                </div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                {project.description || 'No description provided.'}
                            </p>

                            <div className="flex items-center justify-between pt-2">
                                <div className="flex items-center gap-3">
                                   {project.isScored ? (
                                       <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/10 hover:bg-emerald-500/20 text-[10px] font-bold h-6 gap-1">
                                          <ClipboardCheck className="h-3 w-3" /> Scored
                                       </Badge>
                                   ) : (
                                       <Badge variant="secondary" className="text-[10px] font-bold h-6 gap-1">
                                          <Clock className="h-3 w-3" /> Pending
                                       </Badge>
                                   )}
                                </div>
                                
                                <Button size="sm" variant="ghost" className="h-8 rounded-lg group-hover:bg-primary group-hover:text-white transition-all text-xs border border-transparent group-hover:border-primary">
                                    {project.isScored ? 'Edit Score' : 'Evaluate'}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
            {col.items.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center py-20 opacity-30 italic text-sm text-center px-10">
                    <Code2 className="h-10 w-10 mb-2 opacity-20" />
                    No projects in this column.
                </div>
            )}
          </div>
        </div>
      ))}

      {selectedProject && (
        <ScoreSheetModal 
          isOpen={!!selectedProject}
          onClose={() => setSelectedProject(null)}
          projectId={selectedProject.id}
          projectTitle={selectedProject.title}
          judgeStats={judgeStats}
          existingScores={[]}
          conflicts={conflicts}
        />
      )}
    </div>
  );
}
