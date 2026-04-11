import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/shared/api/auth-client';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  CheckCircle2, Clock, FileText, Users, Gavel,
  Trophy, GitBranch, ExternalLink,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import type { ParticipationStatus } from '@/shared/api/participant.service';

interface ProgressTabProps {
  hackathonId: string;
  status: ParticipationStatus | undefined;
  hackathon: any;
}

type Step = { id: string; label: string; description: string; done: boolean; icon: React.ReactNode };

export function ProgressTab({ status, hackathon }: ProgressTabProps) {
  const project = status?.project;
  const team = status?.team;

  const steps: Step[] = [
    {
      id: 'register',
      label: 'Реєстрація',
      description: 'Ви зареєстровані на хакатон.',
      done: !!status?.registered,
      icon: <CheckCircle2 className="h-5 w-5" />,
    },
    {
      id: 'team',
      label: 'Команда',
      description: team ? `Команда «${team.name}»` : 'Знайдіть або створіть команду.',
      done: !!team,
      icon: <Users className="h-5 w-5" />,
    },
    {
      id: 'project',
      label: 'Проєкт',
      description: project ? `«${project.title}»` : 'Заповніть дані проєкту.',
      done: !!project,
      icon: <FileText className="h-5 w-5" />,
    },
    {
      id: 'submit',
      label: 'Подання',
      description: project?.status === 'SUBMITTED' || project?.status === 'UNDER_REVIEW' ? 'Проєкт подано!' : 'Подайте проєкт суддям.',
      done: ['SUBMITTED', 'UNDER_REVIEW', 'REVIEWED', 'WINNER'].includes(project?.status ?? ''),
      icon: <Gavel className="h-5 w-5" />,
    },
  ];

  const doneCount = steps.filter(s => s.done).length;
  const progress = Math.round((doneCount / steps.length) * 100);

  // Scores (if available)
  const { data: scores } = useQuery({
    queryKey: ['project', project?.id, 'scores'],
    queryFn: async () => {
      const meRes = await authClient.get('/auth/me');
      const me = meRes.data?.data;
      const { data } = await authClient.get(`/projects/${project!.id}/scores`, { params: { judgeId: me?.id } });
      return data.data;
    },
    enabled: !!project && ['REVIEWED', 'WINNER'].includes(project.status),
  });

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="border overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-lg">Загальний прогрес</h3>
            <span className="text-2xl font-black text-primary">{progress}%</span>
          </div>
          <div className="h-3 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{doneCount} з {steps.length} кроків виконано</p>
        </CardContent>
      </Card>

      {/* Step Checklist */}
      <div className="space-y-2">
        {steps.map((step, _i) => (
          <div
            key={step.id}
            className={cn(
              'flex items-center gap-4 p-4 rounded-xl border transition-all',
              step.done ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-900/40' : 'bg-muted/20'
            )}
          >
            <div className={cn(
              'h-10 w-10 rounded-xl flex items-center justify-center shrink-0',
              step.done ? 'bg-emerald-500 text-white' : 'bg-muted text-muted-foreground'
            )}>
              {step.done ? <CheckCircle2 className="h-5 w-5" /> : step.icon}
            </div>
            <div className="flex-1 min-w-0">
              <p className={cn('font-bold text-sm', step.done ? 'text-emerald-700 dark:text-emerald-400' : '')}>{step.label}</p>
              <p className="text-xs text-muted-foreground truncate">{step.description}</p>
            </div>
            {step.done && <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />}
            {!step.done && <Clock className="h-4 w-4 text-muted-foreground shrink-0" />}
          </div>
        ))}
      </div>

      {/* Project Detail (if exists) */}
      {project && (
        <Card className="border">
          <CardContent className="p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <FileText className="h-4 w-4 text-primary" /> Ваш проєкт
            </h3>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="font-black text-lg">{project.title}</span>
              <Badge className={cn('text-[10px]',
                project.status === 'WINNER' ? 'bg-yellow-100 text-yellow-800' :
                project.status === 'REVIEWED' ? 'bg-emerald-100 text-emerald-800' :
                project.status === 'SUBMITTED' || project.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800' :
                'bg-muted text-muted-foreground'
              )}>
                {project.status === 'WINNER' ? '🏆 Переможець' : project.status}
              </Badge>
            </div>

            <div className="flex gap-2 flex-wrap">
              {project.repoUrl && (
                <Button variant="outline" size="sm" asChild className="gap-1.5 rounded-xl text-xs">
                  <a href={project.repoUrl} target="_blank" rel="noopener noreferrer">
                    <GitBranch className="h-3.5 w-3.5" /> Repo
                  </a>
                </Button>
              )}
              {project.demoUrl && (
                <Button variant="outline" size="sm" asChild className="gap-1.5 rounded-xl text-xs">
                  <a href={project.demoUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-3.5 w-3.5" /> Demo
                  </a>
                </Button>
              )}
            </div>

            {/* Scores (visible after judging) */}
            {scores && scores.scores?.length > 0 && (
              <div className="pt-3 border-t space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Оцінки</p>
                <div className="text-3xl font-black text-primary">
                  {scores.normalizedScore?.toFixed(1) ?? '—'}
                  <span className="text-lg text-muted-foreground"> / 100</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Hackathon Status */}
      {hackathon.status === 'COMPLETED' && (
        <Card className="border border-yellow-200 bg-yellow-50 dark:bg-yellow-900/10">
          <CardContent className="p-4 flex items-center gap-3">
            <Trophy className="h-8 w-8 text-yellow-500 shrink-0" />
            <div>
              <p className="font-black text-sm">Хакатон завершено</p>
              <p className="text-xs text-muted-foreground">Перевірте лідерборд для повних результатів.</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
