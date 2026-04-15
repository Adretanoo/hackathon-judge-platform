import { useState } from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { teamApi } from '@/shared/api/team.service';
import type { TeamMember } from '@/shared/api/team.service';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  CardDescription,
  Button,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator,
  Label,
  Dialog,
  DialogContent,
  DialogTrigger,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input
} from '@/shared/ui';
import { 
  Users, 
  Shield, 
  Copy, 
  Trash2, 
  LogOut, 
  Settings, 
  ChevronLeft,
  Crown,
  Share2,
  Check,
  ExternalLink,
  Rocket,
  Edit3,
  Plus,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { projectApi } from '@/shared/api/project.service';
import { ProjectSubmissionForm } from '@/shared/components/projects/project-submission-form';
import { toast } from 'sonner';

export const Route = createFileRoute('/_protected/teams/$teamId' as any)({
  component: TeamDetailPage,
});

function TeamDetailPage() {
  const { teamId } = Route.useParams() as any;
  const queryClient = useQueryClient();
  const [isCopied, setIsCopied] = useState(false);
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false);
  
  // Edit Team state
  const [isEditTeamOpen, setIsEditTeamOpen] = useState(false);
  const [editTeamName, setEditTeamName] = useState('');
  const [editTeamDesc, setEditTeamDesc] = useState('');

  const { data: team, isLoading } = useQuery({
    queryKey: ['team', teamId],
    queryFn: () => teamApi.getById(teamId),
  });

  const { data: project, isLoading: isProjectLoading } = useQuery({
    queryKey: ['team-project', teamId],
    queryFn: () => projectApi.list({ teamId }).then(res => res.items[0]),
    enabled: !!teamId,
  });

  const inviteMutation = useMutation({
    mutationFn: () => teamApi.generateInvite(teamId),
    onSuccess: (data) => {
      const inviteUrl = `${window.location.origin}/invite/${data.token}`;
      navigator.clipboard.writeText(inviteUrl);
      setIsCopied(true);
      toast.success('Invite link generated and copied!');
      setTimeout(() => setIsCopied(false), 2000);
    }
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => teamApi.removeMember(teamId, userId),
    onSuccess: () => {
      toast.success('Member removed');
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to remove member');
    }
  });

  const updateTeamMutation = useMutation({
    mutationFn: (payload: any) => teamApi.update(teamId, payload),
    onSuccess: () => {
      toast.success('Team updated successfully');
      queryClient.invalidateQueries({ queryKey: ['team', teamId] });
      setIsEditTeamOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Failed to update team');
    }
  });

  if (isLoading) {
    return <div className="p-12 text-center animate-pulse">Loading team data...</div>;
  }

  if (!team) {
    return <div className="p-12 text-center">Team not found.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link to={"/organizer/hackathons/$hackathonId" as any} params={{ hackathonId: team.hackathonId } as any}>
            <ChevronLeft className="h-4 w-4 mr-1" /> Back to Hackathon
          </Link>
        </Button>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-bold text-4xl uppercase ring-1 ring-primary/20 shadow-xl">
             {team.logoUrl ? <img src={team.logoUrl} className="w-full h-full object-cover rounded-2xl" /> : team.name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center gap-3 mb-2">
               <h1 className="text-4xl font-extrabold tracking-tight">{team.name}</h1>
               <Badge className="bg-emerald-500 text-white border-none shadow-sm">{team.status}</Badge>
            </div>
            <p className="text-muted-foreground text-lg max-w-xl">{team.description || 'No description provided for this team.'}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
           <Dialog open={isEditTeamOpen} onOpenChange={setIsEditTeamOpen}>
              <DialogTrigger asChild>
                 <Button 
                   variant="outline" 
                   className="gap-2 shadow-sm"
                   onClick={() => {
                     setEditTeamName(team.name);
                     setEditTeamDesc(team.description || '');
                   }}
                 >
                    <Settings className="h-4 w-4" /> Edit Team
                 </Button>
              </DialogTrigger>
              <DialogContent className="border-primary/10 shadow-2xl">
                 <DialogHeader>
                    <DialogTitle>Edit Team Details</DialogTitle>
                 </DialogHeader>
                 <div className="space-y-4 py-4">
                    <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase text-muted-foreground">Team Name</Label>
                       <Input 
                         value={editTeamName} 
                         onChange={(e) => setEditTeamName(e.target.value)} 
                         placeholder="Awesome Team"
                         className="bg-transparent border-primary/20"
                       />
                    </div>
                    <div className="space-y-2">
                       <Label className="text-xs font-bold uppercase text-muted-foreground">Description</Label>
                       <textarea 
                         value={editTeamDesc} 
                         onChange={(e) => setEditTeamDesc(e.target.value)} 
                         placeholder="A brief explanation of your team..."
                         className="min-h-[100px] w-full rounded-md border border-primary/20 bg-transparent px-3 py-2 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                       />
                    </div>
                 </div>
                 <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsEditTeamOpen(false)}>Cancel</Button>
                    <Button 
                      onClick={() => updateTeamMutation.mutate({ name: editTeamName, description: editTeamDesc })}
                      disabled={!editTeamName || updateTeamMutation.isPending}
                    >
                      {updateTeamMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                 </DialogFooter>
              </DialogContent>
           </Dialog>
           <Button variant="outline" className="gap-2 text-destructive border-destructive/20 hover:bg-destructive hover:text-white">
              <LogOut className="h-4 w-4" /> Leave Team
           </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Members List */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-primary/5 shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" /> Members
                </CardTitle>
                <CardDescription>People currently in the team</CardDescription>
              </div>
              <Badge variant="secondary">{team.members?.length || 0} Members</Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              {team.members?.map((member: TeamMember) => (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-primary/5 group">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/5">
                      <AvatarImage src={member.user.avatarUrl || ''} />
                      <AvatarFallback>{member.user.fullName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{member.user.fullName}</span>
                        {member.role === 'CAPTAIN' && (
                          <Badge className="h-5 text-[9px] bg-amber-500 hover:bg-amber-500 text-white border-none gap-1">
                            <Crown className="h-2 w-2" /> Captain
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">@{member.user.username}</p>
                    </div>
                  </div>
                  
                  {member.role !== 'CAPTAIN' && (
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all"
                      onClick={() => removeMemberMutation.mutate(member.userId)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Project Section */}
          <Card className="border-primary/5 shadow-xl overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-primary/5 bg-muted/10">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5 text-primary" /> Team Project
                </CardTitle>
                <CardDescription>Your hackathon submission</CardDescription>
              </div>
              
              <Dialog open={isProjectFormOpen} onOpenChange={setIsProjectFormOpen}>
                <DialogTrigger asChild>
                   <Button size="sm" className="gap-2">
                      {project ? <Edit3 className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                      {project ? 'Edit Project' : 'Submit Project'}
                   </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0 border-none bg-transparent shadow-none">
                   <DialogHeader className="sr-only">
                      <DialogTitle>Project Form</DialogTitle>
                   </DialogHeader>
                   <div className="p-1">
                      <ProjectSubmissionForm 
                        teamId={teamId} 
                        initialData={project} 
                        onSuccess={() => {
                          setIsProjectFormOpen(false);
                          queryClient.invalidateQueries({ queryKey: ['team-project', teamId] });
                        }} 
                      />
                   </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent className="p-8">
              {isProjectLoading ? (
                <div className="h-24 animate-pulse bg-muted rounded-xl" />
              ) : project ? (
                <div className="space-y-6">
                   <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                         <h3 className="text-2xl font-bold tracking-tight text-primary">{project.title}</h3>
                         <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1.5"><Calendar className="h-4 w-4" /> {new Date(project.createdAt).toLocaleDateString()}</span>
                            <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10">{project.status}</Badge>
                         </div>
                      </div>
                      <Button variant="outline" asChild className="gap-2 border-primary/10 hover:bg-primary/5">
                         <Link to={"/projects/$projectId" as any} params={{ projectId: project.id } as any}>
                            View Page <ChevronRight className="h-4 w-4" />
                         </Link>
                      </Button>
                   </div>
                   
                   <p className="text-muted-foreground line-clamp-3 leading-relaxed">
                     {project.description || 'No description provided.'}
                   </p>

                   <div className="flex flex-wrap gap-2">
                      {project.techStack.map((t: string) => (
                        <Badge key={t} variant="secondary" className="bg-muted text-muted-foreground border-none">
                          {t}
                        </Badge>
                      ))}
                   </div>
                </div>
              ) : (
                <div className="py-12 flex flex-col items-center justify-center text-center space-y-4 bg-primary/[0.02] border-2 border-dashed border-primary/10 rounded-2xl">
                   <div className="h-16 w-16 rounded-full bg-primary/5 flex items-center justify-center text-primary/30">
                      <Rocket className="h-8 w-8" />
                   </div>
                   <div className="space-y-1">
                      <h4 className="font-bold text-lg">No project submitted yet</h4>
                      <p className="text-sm text-muted-foreground max-w-xs">
                        Share your hard work with the judges! Start by Clicking the "Submit Project" button.
                      </p>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar Actions */}
        <div className="space-y-6">
           <Card className="border-primary/10 shadow-lg bg-primary/5">
              <CardHeader>
                <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                   <Share2 className="h-4 w-4" /> Recruit Members
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <p className="text-xs text-muted-foreground">
                    Generate an invitation link to share with potential teammates. 
                    Anyone with this link can join your team immediately.
                 </p>
                 <div className="space-y-2">
                    <Button 
                      className="w-full gap-2 shadow-md shadow-primary/20" 
                      onClick={() => inviteMutation.mutate()}
                      disabled={inviteMutation.isPending}
                    >
                      {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {isCopied ? 'Copied Link!' : 'Generate & Copy Link'}
                    </Button>
                 </div>
              </CardContent>
           </Card>

           <Card className="border-primary/5 shadow-md">
              <CardHeader>
                 <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                    <Shield className="h-4 w-4" /> Team Info
                 </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                 <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Hackathon</Label>
                    <p className="text-sm font-medium">EcoHack 2026</p>
                 </div>
                 <div className="space-y-1">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground">Track</Label>
                    <Badge variant="secondary" className="bg-primary/5 text-primary">AI for Environment</Badge>
                 </div>
                 <Separator className="bg-primary/5" />
                 <Button variant="ghost" className="w-full justify-start text-xs p-0 h-auto hover:bg-transparent text-primary hover:underline">
                    View Public Profile <ExternalLink className="h-3 w-3 ml-2" />
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
