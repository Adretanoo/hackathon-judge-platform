import { createFileRoute, useNavigate, Link } from '@tanstack/react-router';
import { useMutation } from '@tanstack/react-query';
import { teamApi } from '@/shared/api/team.service';
import { Button, Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '@/shared/ui';
import { toast } from 'sonner';
import { CheckCircle2, Ticket, AlertTriangle, ArrowRight } from 'lucide-react';

export const Route = createFileRoute('/join/$token')({
  component: JoinPrivateHackathonPage,
});

function JoinPrivateHackathonPage() {
  const { token } = Route.useParams();
  const navigate = useNavigate();

  const mutation = useMutation({
    mutationFn: () => teamApi.join(token),
    onSuccess: (data: any) => {
      toast.success('Ви успішно приєдналися до команди події!');
      navigate({ to: `/organizer/hackathons/${data.hackathonId}` });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error?.message || err.response?.data?.message || 'Не вдалося приєднатися. Можливо, посилання недійсне.');
    }
  });

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="max-w-md w-full shadow-2xl border-primary/20 animate-in fade-in zoom-in duration-500">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center">
            <Ticket className="w-8 h-8 text-primary" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Приватне Запрошення</CardTitle>
            <CardDescription className="text-base mt-2">
              Ви отримали запрошення на участь у приватному події оцінювання проєктів. Натисніть кнопку нижче, щоб прийняти його та отримати доступ.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent>
          <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 p-4 rounded-xl flex gap-3 text-amber-800 dark:text-amber-300 text-sm">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p>
              Якщо ви ще не авторизовані, будь ласка, увійдіть у свій акаунт або зареєструйтесь (виберіть роль Учасник або Суддя), а потім знову перейдіть за цим посиланням.
            </p>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-3">
          <Button 
            className="w-full text-lg h-12" 
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? 'Приєднання...' : 'Прийняти запрошення'}
            <CheckCircle2 className="w-5 h-5 ml-2" />
          </Button>
          <Button variant="ghost" className="w-full" asChild>
            <Link to="/">
              Повернутися на головну <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
