import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '@/shared/api/team.service';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription,
  CardFooter,
  Button,
  Badge
} from '@/shared/ui';
import { 
  UserPlus, 
  ArrowRight, 
  ShieldCheck,
  ChevronRight
} from 'lucide-react';
import { toast } from 'sonner';

export const Route = createFileRoute('/invite/$token' as any)({
  component: InviteJoinPage,
});

function InviteJoinPage() {
  const { token } = Route.useParams() as any;
  const navigate = useNavigate();

  // In a real app, we might have a dedicated endpoint to get invite info by token
  const queryClient = useQueryClient();

  const joinMutation = useMutation({
    mutationFn: () => teamApi.join(token),
    onSuccess: async (data: any) => {
      await queryClient.invalidateQueries();
      toast.success('Successfully joined the team!');
      // Force a hard reload to completely clear any stale client-side state
      window.location.href = `/hackathons/${data.hackathonId}`;
    },
    onError: (error: any) => {
      const status = error.response?.status;
      if (status === 401) {
        toast.error('Please login to join the team');
        navigate({ to: '/login', search: { redirect: window.location.pathname } });
      } else {
        toast.error(error.response?.data?.error?.message || 'Failed to join team. Token may be expired.');
      }
    }
  });

  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-primary/10 shadow-2xl animate-in zoom-in-95 duration-500">
        <div className="absolute -top-12 left-1/2 -translate-x-1/2 w-24 h-24 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 ring-4 ring-white">
           <UserPlus className="h-12 w-12 text-white" />
        </div>

        <CardHeader className="pt-16 text-center">
          <Badge variant="outline" className="w-fit mx-auto mb-2 bg-primary/5 text-primary border-primary/20">
            Team Invitation
          </Badge>
          <CardTitle className="text-3xl font-extrabold tracking-tight">You're Invited!</CardTitle>
          <CardDescription className="text-base mt-2">
            A team is looking for new members to compete in their hackathon track.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
           <div className="p-4 rounded-xl bg-muted flex items-center justify-between border border-primary/5">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary font-bold">
                    T
                 </div>
                 <div className="text-left">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Team Name</p>
                    <p className="font-bold">Pending Join...</p>
                 </div>
              </div>
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
           </div>

           <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Team Perks</h4>
              <ul className="space-y-2">
                 {[
                   'Collaborate with passionate hackers',
                   'Build innovative solutions together',
                   'Compete for exciting prizes'
                 ].map((perk, i) => (
                   <li key={i} className="flex items-center gap-3 text-sm font-medium p-2 rounded-lg hover:bg-white/50 transition-colors">
                      <div className="h-5 w-5 rounded-full bg-emerald-500/10 flex items-center justify-center">
                         <ChevronRight className="h-3 w-3 text-emerald-500" />
                      </div>
                      {perk}
                   </li>
                 ))}
              </ul>
           </div>
        </CardContent>

        <CardFooter className="flex-col gap-3 pb-8">
           <Button 
            className="w-full h-12 text-lg font-bold gap-2 shadow-xl shadow-primary/20" 
            onClick={() => joinMutation.mutate()}
            disabled={joinMutation.isPending}
           >
             {joinMutation.isPending ? 'Joining...' : 'Accept & Join Team'}
             <ArrowRight className="h-5 w-5" />
           </Button>
           <p className="text-[10px] text-muted-foreground text-center">
             By joining, you agree to the team's internal collaboration rules and the hackathon's code of conduct.
           </p>
        </CardFooter>
      </Card>
    </div>
  );
}
