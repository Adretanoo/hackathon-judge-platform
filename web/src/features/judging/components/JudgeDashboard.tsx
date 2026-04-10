import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/shared/api/auth-client';
import { Card, Badge } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { ScoreSheetModal } from './ScoreSheetModal';
import { ClipboardList, CheckCircle2, ChevronRight, Gavel, ShieldAlert } from 'lucide-react';

export function JudgeDashboard() {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  // Note: in a real app, this data would come from the judge's specific assignment API
  const { data: assignments, isLoading } = useQuery({
    queryKey: ['judge-assignments'],
    queryFn: async () => {
      // Stubbing with standard structure
      const { data } = await authClient.get('/judge/assignments'); 
      return data.data || { pending: [], scored: [] };
    }
  });

  if (isLoading) {
    return (
      <div className="flex h-[400px] items-center justify-center text-muted-foreground italic">
        Завантаження ваших проєктів для оцінювання...
      </div>
    );
  }

  // Fallback for demo purposes if backend isn't ready
  const pending = assignments?.pending || [
    { id: '1', name: 'Eco AI', track: 'AI Innovation', conflict: false },
    { id: '2', name: 'CyberShield', track: 'Security', conflict: true }
  ];
  const scored = assignments?.scored || [
    { id: '3', name: 'FinTech App', track: 'FinTech', score: 85, conflict: false }
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-6xl mx-auto py-8 px-4">
      <div className="space-y-2">
        <h1 className="text-4xl font-black tracking-tight flex items-center gap-3">
          <Gavel className="h-8 w-8 text-primary" />
          Панель Судді
        </h1>
        <p className="text-muted-foreground text-lg">
          Ознайомтеся з проєктами, призначеними вам, та виставте об'єктивні оцінки за заданими критеріями.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pending Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-bold text-xl flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-amber-500" />
              Очікують оцінки
            </h2>
            <Badge variant="secondary" className="bg-amber-100 text-amber-800">{pending.length}</Badge>
          </div>
          <div className="grid gap-3">
            {pending.map((project: any) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => setSelectedProjectId(project.id)} 
              />
            ))}
            {pending.length === 0 && (
              <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                Усі проєкти оцінено!
              </div>
            )}
          </div>
        </div>

        {/* Scored Column */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b pb-2">
            <h2 className="font-bold text-xl flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
              Оцінено
            </h2>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">{scored.length}</Badge>
          </div>
          <div className="grid gap-3 opacity-70">
            {scored.map((project: any) => (
              <ProjectCard 
                key={project.id} 
                project={project} 
                onClick={() => setSelectedProjectId(project.id)} 
              />
            ))}
            {scored.length === 0 && (
              <div className="p-8 text-center text-muted-foreground border-2 border-dashed rounded-xl">
                Ви ще не оцінили жодного проєкту.
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedProjectId && (
        <ScoreSheetModal 
          isOpen={true} 
          onClose={() => setSelectedProjectId(null)} 
          projectId={selectedProjectId}
        />
      )}
    </div>
  );
}

function ProjectCard({ project, onClick }: { project: any; onClick: () => void }) {
  return (
    <Card 
      onClick={onClick}
      className={cn(
        "p-4 cursor-pointer transition-all duration-200 hover:shadow-md border-l-4 group",
        project.conflict ? "border-l-destructive hover:border-destructive" : "border-l-primary hover:border-primary"
      )}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2">
            {project.name}
            {project.conflict && <ShieldAlert className="h-4 w-4 text-destructive" />}
          </h3>
          <p className="text-sm text-muted-foreground">{project.track}</p>
        </div>
        <div className="flex items-center gap-3">
          {project.score !== undefined && (
            <div className="flex flex-col items-end">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">Бал</span>
              <span className="font-black text-emerald-600">{project.score}</span>
            </div>
          )}
          <ChevronRight className="h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
        </div>
      </div>
    </Card>
  );
}
