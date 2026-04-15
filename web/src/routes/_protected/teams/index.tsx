
import { createFileRoute, Link } from '@tanstack/react-router';
import { Card, Button } from '@/shared/ui';
import { Users, Globe } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { authClient } from '@/shared/api/auth-client';

export const Route = createFileRoute('/_protected/teams/')({
  component: TeamsDashboardPage,
});

function TeamsDashboardPage() {

  const { data: teams, isLoading } = useQuery({
    queryKey: ['participant', 'teams'],
    queryFn: async () => {
      const { data } = await authClient.get('/participant/teams');
      return data.data || [];
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Мої Команди</h1>
          <p className="text-muted-foreground">Керуйте командами та шукайте нових учасників.</p>
        </div>
        <Button asChild className="gap-2 font-bold">
          <Link to="/hackathons">
            <Globe className="w-4 h-4" /> Перейти до західів
          </Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center text-muted-foreground">Завантаження...</div>
      ) : teams && teams.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((t: any) => (
            <Card key={t.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                  <Users className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-xl">{t.name}</h3>
              </div>
              <p className="text-muted-foreground text-sm line-clamp-2 mb-4">{t.description || 'Без опису'}</p>
              {t.hackathon && (
                <div className="mb-4">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">захід: {t.hackathon.title}</span>
                </div>
              )}
              <Button variant="outline" asChild className="w-full">
                <Link to="/hackathons/$hackathonId" params={{ hackathonId: t.hackathonId }}>Відкрити профіль команди</Link>
              </Button>
            </Card>
          ))}
        </div>
      ) : (
        <div className="p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center space-y-4 text-muted-foreground">
          <Users className="w-12 h-12 opacity-20" />
          <div>
            <p className="font-bold text-foreground">Ви ще не у команді</p>
            <p className="text-sm">Щоб створити нову команду, перейдіть до робочого простору вашого західу.</p>
          </div>
          <Button asChild>
            <Link to="/hackathons">Перейти до списку західів</Link>
          </Button>
        </div>
      )}
    </div>
  );
}
