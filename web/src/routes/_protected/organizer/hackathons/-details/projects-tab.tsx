import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { projectApi } from '@/shared/api/project.service';
import type { Project } from '@/shared/api/project.service';
import { ProjectCard } from '@/shared/components/projects/project-card';
import { 
  Search, 
  LayoutGrid, 
  Table as TableIcon,
  Code2,
} from 'lucide-react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui';

interface ProjectsTabProps {
  hackathonId: string;
}

export function ProjectsTab({ hackathonId }: ProjectsTabProps) {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('all');

  const { data, isLoading } = useQuery({
    queryKey: ['hackathon-projects', hackathonId, { status }],
    queryFn: () => projectApi.list({ 
      hackathonId, 
      status: status === 'all' ? undefined : status as any 
    }),
  });

  const filteredProjects = (data?.items || []).filter((p: Project) => 
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-muted/30 p-4 rounded-xl border border-primary/5">
        <div className="flex-1 flex flex-col md:flex-row items-center gap-3">
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search projects..." 
              className="pl-9 bg-background border-primary/10"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <Select value={status} onValueChange={setStatus}>
            <SelectTrigger className="w-full md:w-56 bg-background border-primary/10">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="SUBMITTED">Submitted</SelectItem>
              <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
              <SelectItem value="REVIEWED">Reviewed</SelectItem>
              <SelectItem value="WINNER">Winner</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center gap-2 p-1 bg-background rounded-lg border border-primary/5">
           <Button variant="ghost" size="icon" className="h-8 w-8 bg-primary/10 text-primary">
              <LayoutGrid className="h-4 w-4" />
           </Button>
           <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
              <TableIcon className="h-4 w-4" />
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 bg-muted animate-pulse rounded-2xl" />
          ))
        ) : filteredProjects.length > 0 ? (
          filteredProjects.map((project: Project) => (
            <ProjectCard key={project.id} project={project} />
          ))
        ) : (
          <div className="col-span-full py-20 flex flex-col items-center justify-center text-center opacity-60 border-2 border-dashed border-primary/10 rounded-2xl">
             <Code2 className="h-12 w-12 text-muted-foreground/30 mb-4" />
             <h3 className="text-xl font-bold">No projects found</h3>
             <p className="text-sm">No submissions match the current filters or no projects submitted yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
