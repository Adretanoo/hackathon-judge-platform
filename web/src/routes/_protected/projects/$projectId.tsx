import { createFileRoute } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/app/providers/auth-provider';
import { projectApi } from '@/shared/api/project.service';
import { adminApi } from '@/shared/api/admin.service';
import type { ProjectStatus } from '@/shared/api/project.service';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button,
  Badge,
} from '@/shared/ui';
import { 
  Terminal, 
  ExternalLink, 
  ChevronLeft, 
  Code2, 
  FileText, 
  Share2,
  Calendar,
  Users,
  Trophy,
  AlertCircle,
  Settings,
  CircleCheck,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/lib/utils';

export const Route = createFileRoute('/_protected/projects/$projectId' as any)({
  component: ProjectDetailPage,
});

const statusColors: Record<string, string> = {
  DRAFT: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/50 dark:text-slate-400 dark:border-slate-800',
  SUBMITTED: 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-500/20 dark:border-blue-500/30',
  UNDER_REVIEW: 'bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/20 dark:border-amber-500/30',
  ACCEPTED: 'bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-500/20 dark:border-emerald-500/30',
  WINNER: 'bg-gradient-to-r from-yellow-400 to-amber-600 text-white border-none shadow-lg shadow-yellow-400/20',
  ARCHIVED: 'bg-zinc-100 text-zinc-500 border-zinc-200 dark:bg-zinc-800/50 dark:text-zinc-400 dark:border-zinc-800',
};

function ProjectScoreBreakdown({ projectId }: { projectId: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'project-scores', projectId],
    queryFn: () => adminApi.getProjectScoresDetails(projectId),
  });

  if (isLoading) return <div className="text-sm text-muted-foreground animate-pulse mt-4">Завантаження оцінок...</div>;
  
  const scores = data?.scores || [];
  if (scores.length === 0) return <div className="text-sm text-muted-foreground italic mt-4 border-t pt-4">Ще немає оцінок від суддів.</div>;

  // Group by judge
  const byJudge = scores.reduce((acc: any, s: any) => {
    const jId = s.judgeId;
    if (!acc[jId]) acc[jId] = { judge: s.judge, scores: [], total: 0 };
    acc[jId].scores.push(s);
    acc[jId].total += Number(s.scoreValue);
    return acc;
  }, {});

  return (
    <Card className="border-primary/10 shadow-xl bg-gradient-to-br from-primary/5 to-transparent mt-6">
      <CardHeader>
        <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
           <AlertCircle className="h-4 w-4" /> Оцінки суддів ({Object.keys(byJudge).length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {Object.values(byJudge).map((j: any) => (
          <div key={j.judge.id} className="p-4 rounded-xl border bg-background space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-sm">{j.judge?.fullName || 'Невідомий суддя'}</p>
                <p className="text-xs text-muted-foreground">{j.judge?.email}</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-black text-primary">{j.total}</span>
                <span className="text-xs text-muted-foreground ml-1">балів</span>
              </div>
            </div>
            
            <div className="text-xs grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
              {j.scores.map((s: any) => (
                <div key={s.criteriaId} className="flex items-center justify-between bg-muted/20 p-2 rounded border">
                  <span className="truncate mr-2 font-medium" title={s.criteria?.name}>{s.criteria?.name}</span>
                  <span className="font-black">{s.scoreValue} <span className="text-muted-foreground font-normal">/ {s.criteria?.maxScore}</span></span>
                </div>
              ))}
            </div>
            
            {j.scores.some((s: any) => s.comment) && (
              <div className="mt-3 p-3 bg-primary/5 text-sm rounded-lg border border-primary/10">
                <p className="text-[10px] uppercase font-bold text-primary/60 mb-1">Коментар судді</p>
                <p className="italic text-muted-foreground leading-relaxed">
                  "{j.scores.find((s: any) => s.comment)?.comment}"
                </p>
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function ProjectDetailPage() {
  const { projectId } = Route.useParams() as any;
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  const isOrganizerOrAdmin = user?.role === 'GLOBAL_ADMIN' || user?.role === 'ORGANIZER';

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => projectApi.getById(projectId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: ProjectStatus) => projectApi.changeStatus(projectId, status),
    onSuccess: () => {
      toast.success('Status updated');
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update status');
    }
  });

  if (isLoading) {
    return <div className="p-12 text-center animate-pulse">Loading project details...</div>;
  }

  if (!project) {
    return <div className="p-12 text-center">Project not found.</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-700">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => window.history.back()} className="-ml-2 hover:bg-primary/5 text-muted-foreground hover:text-primary">
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start gap-8">
        <div className="flex-1 space-y-6">
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
               <Badge variant="outline" className={cn("text-xs font-bold uppercase tracking-widest px-3 py-1", statusColors[project.status])}>
                 {project.status.replace('_', ' ')}
               </Badge>
               {project.status === 'WINNER' && (
                 <Badge className="bg-gradient-to-r from-yellow-400 to-amber-600 text-white border-none gap-2 px-3 py-1 animate-pulse">
                    <Trophy className="h-3 w-3" /> Winner
                 </Badge>
               )}
            </div>
            
            <h1 className="text-5xl font-extrabold tracking-tight underline decoration-primary/20 underline-offset-8">
              {project.title}
            </h1>
            
            <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground pt-2">
               <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/5 flex items-center justify-center text-primary">
                     <Users className="h-4 w-4" />
                  </div>
                  <span className="font-bold text-foreground">{project.team?.name}</span>
               </div>
               <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>Submitted {project.submittedAt ? new Date(project.submittedAt).toLocaleDateString() : 'is Draft'}</span>
               </div>
            </div>
          </div>

          <Card className="border-0 shadow-2xl bg-white dark:bg-slate-900 overflow-hidden ring-1 ring-primary/10">
            <CardContent className="p-8 space-y-8">
               <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                     <FileText className="h-4 w-4" /> Description
                  </h3>
                  <div className="text-lg leading-relaxed text-foreground font-medium whitespace-pre-wrap">
                    {project.description || 'No description provided.'}
                  </div>
               </div>

               <div className="space-y-4">
                  <h3 className="text-sm font-black uppercase tracking-[0.2em] text-primary flex items-center gap-2">
                     <Code2 className="h-4 w-4" /> Tech Stack
                  </h3>
                  <div className="flex flex-wrap gap-2">
                     {project.techStack.map(tech => (
                       <Badge key={tech} variant="secondary" className="px-4 py-1.5 bg-primary/5 text-primary border-primary/10 text-sm font-medium">
                          {tech}
                       </Badge>
                     ))}
                     {project.techStack.length === 0 && <span className="text-sm italic text-muted-foreground">No tech stack specified.</span>}
                  </div>
               </div>
            </CardContent>
          </Card>
        </div>

        <div className="w-full lg:w-80 space-y-6">
           {/* Sidebar Links */}
           <Card className="border-primary/10 shadow-xl bg-gradient-to-br from-primary/5 to-transparent">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                   <Share2 className="h-4 w-4" /> Project Links
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                 {project.repoUrl && (
                   <Button variant="outline" className="w-full justify-start gap-3 h-12 border-primary/10 hover:bg-primary/5 group" asChild>
                      <a href={project.repoUrl} target="_blank" rel="noreferrer">
                         <Terminal className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                         <span className="font-medium">Repository</span>
                         <ExternalLink className="h-3 w-3 ml-auto opacity-30" />
                      </a>
                   </Button>
                 )}
                 {project.demoUrl && (
                   <Button variant="outline" className="w-full justify-start gap-3 h-12 border-primary/10 hover:bg-primary/5 group" asChild>
                      <a href={project.demoUrl} target="_blank" rel="noreferrer">
                         <ExternalLink className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                         <span className="font-medium">Live Demo</span>
                         <ExternalLink className="h-3 w-3 ml-auto opacity-30" />
                      </a>
                   </Button>
                 )}
                 {!project.repoUrl && !project.demoUrl && (
                   <div className="text-center py-6 opacity-30 italic text-sm">No links provided</div>
                 )}
              </CardContent>
           </Card>

           {/* Resources */}
           <Card className="border-primary/5 shadow-lg">
              <CardHeader>
                 <CardTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" /> Resources
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                 {project.resources?.map((res, i) => (
                   <a 
                    key={i} 
                    href={res.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-muted/50 transition-all border border-transparent hover:border-primary/10 group"
                   >
                     <div className="flex items-center gap-3">
                        <div className="h-2 w-2 rounded-full bg-primary" />
                        <span className="text-sm font-medium">{res.label}</span>
                     </div>
                     <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                   </a>
                 ))}
                 {(!project.resources || project.resources.length === 0) && (
                   <div className="text-center py-4 opacity-30 italic text-sm">No extra resources</div>
                 )}
              </CardContent>
           </Card>

           {/* Admin Actions */}
           {isOrganizerOrAdmin && (
             <Card className="border-0 bg-gradient-to-br from-indigo-500 text-white shadow-2xl shadow-indigo-500/30 dark:from-indigo-600 dark:to-violet-700">
                <CardHeader>
                   <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-indigo-100">
                      <Settings className="h-4 w-4 text-white" /> Status Management
                   </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                   {project.status === 'UNDER_REVIEW' && (
                     <Button 
                      className="w-full rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20 gap-2"
                      onClick={() => statusMutation.mutate('ACCEPTED' as any)}
                      disabled={statusMutation.isPending}
                     >
                       <CheckCircle2 className="h-4 w-4" /> Mark Reviewed
                     </Button>
                   )}
                   {project.status === 'SUBMITTED' && (
                     <Button 
                      className="w-full rounded-xl bg-white text-indigo-600 hover:bg-white/90 hover:scale-[1.02] transition-all font-bold shadow-md shadow-black/10 gap-2"
                      onClick={() => statusMutation.mutate('UNDER_REVIEW')}
                      disabled={statusMutation.isPending}
                     >
                       <CircleCheck className="h-5 w-5" /> Start Review
                     </Button>
                   )}
                   <div className="p-3 rounded-lg bg-black/10 flex items-start gap-3 mt-4 backdrop-blur-sm">
                      <Lock className="h-4 w-4 text-indigo-100 mt-0.5" />
                      <p className="text-[10px] text-indigo-50 leading-tight">
                         Only organizers and judges can perform status changes during the hackathon lifecycle.
                      </p>
                   </div>
                 </CardContent>
              </Card>
           )}

           {/* Detailed scores visible only to admins and organizers */}
           {isOrganizerOrAdmin && <ProjectScoreBreakdown projectId={projectId} />}
        </div>
      </div>
    </div>
  );
}
