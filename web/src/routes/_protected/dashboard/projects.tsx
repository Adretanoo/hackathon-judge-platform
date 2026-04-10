import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/shared/api/project.service';
import type { Project } from '@/shared/api/project.service';
import { ProjectCard } from '@/shared/components/projects/project-card';
import { 
  Rocket, 
  Plus,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/shared/ui';

export const Route = createFileRoute('/_protected/dashboard/projects' as any)({
  component: MyProjectsPage,
});

function MyProjectsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['my-projects'],
    queryFn: () => projectApi.list(), // List projects for user's teams (handled by backend filters usually)
  });

  const projects = data?.items || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="space-y-1">
           <h1 className="text-4xl font-extrabold tracking-tight">My Projects</h1>
           <p className="text-muted-foreground text-lg">Manage your hackathon submissions across all teams.</p>
        </div>
        
        <Button asChild className="gap-2 shadow-lg shadow-primary/20">
           <Link to={"/organizer/hackathons" as any}>
              <Plus className="h-4 w-4" /> Find Hackathon
           </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
          ))
        ) : projects.length > 0 ? (
          projects.map((project: Project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        ) : (
          <div className="col-span-full py-24 flex flex-col items-center justify-center text-center bg-muted/20 border-2 border-dashed border-primary/10 rounded-3xl space-y-6">
            <div className="h-20 w-20 rounded-full bg-primary/5 flex items-center justify-center text-primary/30">
               <Rocket className="h-10 w-10" />
            </div>
            <div className="space-y-2 max-w-sm">
               <h3 className="text-2xl font-bold">No projects yet</h3>
               <p className="text-muted-foreground">
                 You haven't submitted any projects. Join a team and start building to see them here!
               </p>
            </div>
            <Button variant="outline" asChild className="gap-2">
               <Link to={"/organizer/hackathons" as any}>
                 Explore Hackathons <ArrowRight className="h-4 w-4" />
               </Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
