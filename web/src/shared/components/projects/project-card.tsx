import type { Project } from '@/shared/api/project.service';
import { 
  Card, 
  CardContent, 
  Badge,
  Button
} from '@/shared/ui';
import { 
  Terminal, 
  ExternalLink, 
  Code2, 
  Trophy,
  Users,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { Link } from '@tanstack/react-router';
import { cn } from '@/shared/lib/utils';

interface ProjectCardProps {
  project: Project;
  className?: string;
}

const statusColors: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground border-muted-foreground/20',
  SUBMITTED: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  UNDER_REVIEW: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  REVIEWED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  WINNER: 'bg-gradient-to-r from-yellow-400 to-amber-600 text-white border-none shadow-lg shadow-yellow-400/20',
  ARCHIVED: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
};

export function ProjectCard({ project, className }: ProjectCardProps) {
  return (
    <Card className={cn(
      "group overflow-hidden border-primary/5 hover:border-primary/20 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-b from-white to-primary/[0.02]",
      className
    )}>
      <CardContent className="p-0">
        <div className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
               <div className="flex items-center gap-2 mb-1">
                  <Badge variant="outline" className={cn("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5", statusColors[project.status])}>
                    {project.status.replace('_', ' ')}
                  </Badge>
                  {project.status === 'WINNER' && <Trophy className="h-4 w-4 text-amber-500 animate-bounce" />}
               </div>
               <h3 className="text-xl font-bold tracking-tight group-hover:text-primary transition-colors line-clamp-1">
                 {project.title}
               </h3>
            </div>
            <div className="h-12 w-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary border border-primary/10 shadow-inner">
               <Code2 className="h-6 w-6" />
            </div>
          </div>

          <p className="text-sm text-muted-foreground line-clamp-2 h-10">
            {project.description || 'No description provided for this project.'}
          </p>

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-primary/5">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
               <Users className="h-3.5 w-3.5" />
               <span className="truncate font-medium">{project.team?.name || 'Unknown Team'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end">
               <Calendar className="h-3.5 w-3.5" />
               <span>{new Date(project.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            {project.repoUrl && (
              <a 
                href={project.repoUrl} 
                target="_blank" 
                rel="noreferrer"
                className="p-2 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Terminal className="h-4 w-4" />
              </a>
            )}
            {project.demoUrl && (
              <a 
                href={project.demoUrl} 
                target="_blank" 
                rel="noreferrer"
                className="p-2 rounded-lg bg-muted/50 hover:bg-primary/10 hover:text-primary transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            )}
            <div className="flex-1" />
            <div className="flex gap-1">
               {project.techStack.slice(0, 2).map((tech) => (
                 <Badge key={tech} variant="secondary" className="bg-primary/5 text-primary border-none text-[9px] h-5">
                    {tech}
                 </Badge>
               ))}
            </div>
          </div>
        </div>

        <Button 
          asChild 
          variant="ghost" 
          className="w-full rounded-none border-t border-primary/5 h-12 hover:bg-primary hover:text-white transition-all group-hover:px-8 group-hover:justify-between"
        >
          <Link to={"/_protected/projects/$projectId" as any} params={{ projectId: project.id } as any}>
            <span className="font-bold">View Details</span>
            <ChevronRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
