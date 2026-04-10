import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Hackathon } from '@/shared/api/hackathon.service';
import { hackathonApi } from '@/shared/api/hackathon.service';
import { authClient } from '@/shared/api/auth-client';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription,
  Button,
  Badge,
  Input,
  Label,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/shared/ui';
import { 
  Search, 
  UserPlus, 
  ShieldAlert, 
  Trash2, 
  UserCheck, 
  Info,
  ShieldCheck,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface JudgesTabProps {
  hackathon: Hackathon;
}

export function JudgesTab({ hackathon }: JudgesTabProps) {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrackId, setSelectedTrackId] = useState<string>('all');
  const [conflictJudge, setConflictJudge] = useState<any>(null);

  const { data: judges, isLoading: isLoadingJudges } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'judges'],
    queryFn: () => hackathonApi.listJudges(hackathon.id),
  });

  const { data: searchResults, isLoading: isSearching } = useQuery({
    queryKey: ['users', 'search', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const { data } = await authClient.get('/users', { params: { search: searchQuery, limit: 10 } });
      return data.data.items;
    },
    enabled: searchQuery.length >= 2,
  });

  const assignMutation = useMutation({
    mutationFn: (payload: { userId: string, trackId?: string, allowConflictOverride?: boolean }) => 
      hackathonApi.assignJudge(hackathon.id, payload),
    onSuccess: () => {
      toast.success('Judge assigned successfully');
      setConflictJudge(null);
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id, 'judges'] });
    },
    onError: (error: any) => {
      if (error.response?.status === 409) {
        // Conflict detected
        setConflictJudge({
          userId: error.response.config.data ? JSON.parse(error.response.config.data).userId : null,
          message: error.response.data?.error?.message || 'Conflict detected',
          details: error.response.data?.error?.details
        });
      } else {
        toast.error(error.response?.data?.error?.message || 'Failed to assign judge');
      }
    }
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => hackathonApi.removeJudge(hackathon.id, userId),
    onSuccess: () => {
      toast.success('Judge removed');
      queryClient.invalidateQueries({ queryKey: ['hackathon', hackathon.id, 'judges'] });
    }
  });

  const handleAssign = (userId: string) => {
    assignMutation.mutate({ 
      userId, 
      trackId: selectedTrackId === 'all' ? undefined : selectedTrackId 
    });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-primary/5 shadow-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
               <UserCheck className="h-5 w-5 text-primary" />
               Current Judges
            </CardTitle>
            <CardDescription>People currently assigned to evaluate projects.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingJudges ? (
              <div className="h-32 flex items-center justify-center italic text-muted-foreground">Loading judges...</div>
            ) : !judges?.length ? (
              <div className="h-32 border border-dashed rounded-xl flex flex-col items-center justify-center gap-2 text-muted-foreground">
                <AlertCircle className="h-8 w-8 opacity-20" />
                No judges assigned yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {judges.map((j: any) => (
                  <div key={j.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 border border-primary/5 hover:border-primary/20 transition-all group">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 border-2 border-background shadow-sm">
                        <AvatarImage src={j.judge.avatarUrl} />
                        <AvatarFallback className="bg-primary/10 text-primary font-bold">
                          {j.judge.fullName.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <p className="text-sm font-bold truncate">{j.judge.fullName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">@{j.judge.username}</p>
                        {j.trackId ? (
                           <Badge variant="outline" className="mt-1 bg-primary/5 text-primary border-primary/20 text-[10px] py-0">
                              {hackathon.tracks?.find((t: any) => t.id === j.trackId)?.name || 'Track Assigned'}
                           </Badge>
                        ) : (
                           <Badge variant="outline" className="mt-1 bg-emerald-50 text-emerald-600 border-emerald-100 text-[10px] py-0">
                              Global Judge
                           </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => removeMutation.mutate(j.judge.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/10">
          <CardHeader>
             <CardTitle className="text-sm flex items-center gap-2">
                <Info className="h-4 w-4 text-primary" />
                Judge Compensation & Access
             </CardTitle>
          </CardHeader>
          <CardContent className="text-xs text-muted-foreground space-y-2">
             <p>• Judges assigned to a <b>Track</b> only see projects belonging to that track.</p>
             <p>• <b>Global Judges</b> have access to all submitted projects across all tracks.</p>
             <p>• Automatic conflict detection prevents judges from scoring teams they have mentored.</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-lg">Invite Judges</CardTitle>
            <CardDescription>Search for users to assign them as judges.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Target Track (Optional)</Label>
              <Select value={selectedTrackId} onValueChange={setSelectedTrackId}>
                <SelectTrigger>
                  <SelectValue placeholder="All Tracks" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Assign Globally</SelectItem>
                  {hackathon.tracks?.map((t) => (
                    <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search by name or email..." 
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="space-y-2 pt-2">
              {isSearching ? (
                <div className="text-center py-4 text-xs text-muted-foreground italic">Searching users...</div>
              ) : searchResults?.map((u: any) => (
                <div key={u.id} className="flex items-center justify-between p-2 rounded-lg border border-transparent hover:border-primary/20 hover:bg-primary/5 transition-all group">
                   <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={u.avatarUrl} />
                        <AvatarFallback className="text-[10px]">{u.fullName[0]}</AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                         <p className="text-xs font-bold truncate">{u.fullName}</p>
                         <p className="text-[10px] text-muted-foreground truncate">{u.email}</p>
                      </div>
                   </div>
                   <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8"
                    onClick={() => handleAssign(u.id)}
                    disabled={judges?.some((j: any) => j.judge.id === u.id)}
                   >
                     {judges?.some((j: any) => j.judge.id === u.id) ? (
                        <ShieldCheck className="h-4 w-4 text-emerald-500" />
                     ) : (
                        <UserPlus className="h-4 w-4 text-primary" />
                     )}
                   </Button>
                </div>
              ))}
              {searchQuery.length >=2 && searchResults?.length === 0 && (
                <div className="text-center py-4 text-xs text-muted-foreground">No users found.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-amber-500/20 bg-amber-50/50 dark:bg-amber-950/10">
           <CardHeader className="pb-2">
              <CardTitle className="text-sm flex items-center gap-2 text-amber-600 dark:text-amber-500">
                 <ShieldAlert className="h-4 w-4" />
                 Conflicts of Interest
              </CardTitle>
           </CardHeader>
           <CardContent className="text-[10px] text-amber-700 dark:text-amber-600/80">
              Judges cannot be assigned to tracks where they have participated in teams or provided extensive mentoring.
           </CardContent>
        </Card>
      </div>

      {/* Conflict Override Dialog */}
      <Dialog open={!!conflictJudge} onOpenChange={() => setConflictJudge(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
               <ShieldAlert className="h-5 w-5" />
               Judging Conflict Detected
            </DialogTitle>
            <DialogDescription className="pt-2">
              The system detected a potential conflict of interest for this user.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-4 bg-destructive/5 rounded-xl border border-destructive/10 space-y-3">
             <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
                <div className="space-y-1">
                   <p className="text-sm font-bold text-destructive">Mentoring Conflict</p>
                   <p className="text-xs text-muted-foreground italic">
                      {conflictJudge?.message}
                   </p>
                </div>
             </div>
             <div className="text-[10px] text-muted-foreground leading-relaxed pt-2 border-t">
                Assigning this judge may result in biased scoring. It is recommended to assign them to a different track or remove their mentoring roles first.
             </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="ghost" onClick={() => setConflictJudge(null)}>Cancel</Button>
            <Button 
               variant="destructive"
               onClick={() => assignMutation.mutate({ 
                 userId: conflictJudge.userId, 
                 trackId: selectedTrackId === 'all' ? undefined : selectedTrackId,
                 allowConflictOverride: true 
               })}
               disabled={assignMutation.isPending}
            >
               {assignMutation.isPending ? 'Overriding...' : 'Override & Assign Anyway'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
