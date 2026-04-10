import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, Button } from '@/shared/ui';
import { Rocket, Plus } from 'lucide-react';
import { ProjectSubmissionModal } from '@/features/projects/components/ProjectSubmissionModal';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/shared/api/auth-client';

export const Route = createFileRoute('/_protected/projects/')({
  component: ProjectsDashboardPage,
});

function ProjectsDashboardPage() {
  const [isSubmitOpen, setIsSubmitOpen] = useState(false);

  const { data: projects, isLoading } = useQuery({
    queryKey: ['user', 'projects'],
    queryFn: async () => {
      const { data } = await authClient.get('/user/projects');
      return data.data || [];
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Мої Проєкти</h1>
          <p className="text-muted-foreground">Керуйте поданими на участь проєктами.</p>
        </div>
        <Button onClick={() => setIsSubmitOpen(true)} className="gap-2 font-bold">
           <Plus className="w-4 h-4" /> Подати проєкт
        </Button>
      </div>

      {isLoading ? (
         <div className="p-12 text-center text-muted-foreground">Завантаження...</div>
      ) : projects && projects.length > 0 ? (
         <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {projects.map((p: any) => (
                <Card key={p.id} className="p-6 hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-primary border-primary/20">
                   <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-primary/10 rounded-lg text-primary">
                          <Rocket className="w-6 h-6" />
                      </div>
                      <h3 className="font-bold text-xl truncate">{p.name}</h3>
                   </div>
                   <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{p.description || 'Немає опису'}</p>
                   <Button variant="outline" asChild className="w-full">
                       <Link to="/projects/$projectId" params={{ projectId: p.id }}>Деталі проєкту</Link>
                   </Button>
                </Card>
            ))}
         </div>
      ) : (
         <div className="p-12 border-2 border-dashed border-primary/20 rounded-xl flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground">
             <Rocket className="w-12 h-12 opacity-20 text-primary" />
             <div>
                <p className="font-bold text-foreground">Ви ще не подали жодного проєкту</p>
                <p className="text-sm">Об'єднайтеся з командою та завантажте ваш код!</p>
             </div>
             <Button onClick={() => setIsSubmitOpen(true)} size="lg" className="font-bold">Подати проєкт</Button>
         </div>
      )}

      {/* For creating a project, you need a Team ID. We will proxy this via Modal. */}
      {isSubmitOpen && (
        <ProjectSubmissionModal 
          isOpen={isSubmitOpen} 
          onClose={() => setIsSubmitOpen(false)} 
          teamId="SELECT_TEAM_ID_LATER" 
        />
      )}
    </div>
  );
}
