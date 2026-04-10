import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { teamApi } from '@/shared/api/team.service';
import type { FreeAgent } from '@/shared/api/team.service';
import type { Hackathon } from '@/shared/api/hackathon.service';
import { 
  Card, 
  CardContent, 
  Button,
  Badge,
  Input,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Separator
} from '@/shared/ui';
import { 
  Search, 
  UserPlus, 
  Code2, 
  Sparkles, 
  Filter,
  X
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';

interface FreeAgentsTabProps {
  hackathon: Hackathon;
}

const COMMON_SKILLS = [
  'React', 'Node.js', 'Python', 'Solidity', 'Design', 'Frontend', 'Backend', 'Fullstack', 'AI/ML'
];

export function FreeAgentsTab({ hackathon }: FreeAgentsTabProps) {
  const [search, setSearch] = useState('');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);

  const { data, isLoading } = useQuery({
    queryKey: ['hackathon', hackathon.id, 'free-agents', { skills: selectedSkills.join(','), search }],
    queryFn: () => teamApi.listFreeAgents(hackathon.id, { 
      skills: selectedSkills.join(',') || undefined 
    }),
  });

  const toggleSkill = (skill: string) => {
    setSelectedSkills(prev => 
      prev.includes(skill) ? prev.filter(s => s !== skill) : [...prev, skill]
    );
  };

  const freeAgents = data?.items?.filter((fa: FreeAgent) => 
    fa.fullName.toLowerCase().includes(search.toLowerCase()) ||
    fa.username.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar Filters */}
        <aside className="w-full lg:w-64 space-y-6">
          <Card className="border-primary/5 bg-muted/20">
            <CardContent className="p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                  <Filter className="h-3.5 w-3.5" /> Filters
                </h3>
                {selectedSkills.length > 0 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-6 text-[10px] px-2"
                    onClick={() => setSelectedSkills([])}
                  >
                    Clear All
                  </Button>
                )}
              </div>
              
              <div className="space-y-2">
                <label className="text-xs text-muted-foreground font-medium">Search by name</label>
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input 
                    placeholder="Search agents..." 
                    className="pl-8 h-8 text-xs bg-background/50"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>

              <Separator className="bg-primary/5" />

              <div className="space-y-3">
                <label className="text-xs text-muted-foreground font-medium">Popular Skills</label>
                <div className="flex flex-wrap gap-1.5">
                  {COMMON_SKILLS.map(skill => (
                    <Badge 
                      key={skill}
                      variant={selectedSkills.includes(skill) ? 'default' : 'outline'}
                      className={cn(
                        "cursor-pointer transition-all h-6 text-[10px]",
                        !selectedSkills.includes(skill) && "hover:bg-primary/10 hover:border-primary/20"
                      )}
                      onClick={() => toggleSkill(skill)}
                    >
                      {selectedSkills.includes(skill) && <X className="h-2 w-2 mr-1" />}
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-primary/5 bg-primary/5">
             <CardContent className="p-4 flex flex-col items-center text-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h3 className="text-sm font-bold">LFG?</h3>
                <p className="text-[10px] text-muted-foreground">Make sure your "Looking for team" status is active in your profile.</p>
                <Button size="sm" variant="outline" className="w-full h-8 text-xs mt-1">Edit Profile</Button>
             </CardContent>
          </Card>
        </aside>

        {/* Agents Grid */}
        <div className="flex-1 space-y-4">
           {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse bg-muted h-64 border-none" />
                ))}
             </div>
           ) : freeAgents.length > 0 ? (
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {freeAgents.map((agent: FreeAgent) => (
                  <Card key={agent.id} className="group border-primary/5 hover:border-primary/20 hover:shadow-lg transition-all duration-300">
                    <CardContent className="p-6 flex flex-col h-full">
                      <div className="flex items-center gap-4 mb-4">
                        <Avatar className="h-14 w-14 ring-2 ring-primary/10 ring-offset-2">
                          <AvatarImage src={agent.avatarUrl || ''} />
                          <AvatarFallback className="bg-primary/5 text-primary text-lg font-bold">
                            {agent.fullName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <h3 className="font-bold truncate text-base leading-tight">{agent.fullName}</h3>
                          <p className="text-xs text-muted-foreground truncate">@{agent.username}</p>
                        </div>
                      </div>

                      <p className="text-xs text-muted-foreground line-clamp-3 h-12 mb-4 italic">
                        {agent.bio || 'This participant hasn\'t added a bio yet.'}
                      </p>

                      <div className="flex flex-wrap gap-1 mb-6 mt-auto">
                        {agent.skills.slice(0, 4).map(skill => (
                          <Badge key={skill} variant="secondary" className="h-5 text-[9px] bg-primary/5 text-primary-foreground/70 font-medium">
                            {skill}
                          </Badge>
                        ))}
                        {agent.skills.length > 4 && (
                          <Badge variant="secondary" className="h-5 text-[9px]">
                            +{agent.skills.length - 4} more
                          </Badge>
                        )}
                      </div>

                      <Button 
                        size="sm" 
                        className="w-full gap-2 text-xs h-9 bg-primary/10 hover:bg-primary text-primary hover:text-white transition-all shadow-none"
                        onClick={() => {
                          toast.promise(Promise.resolve(), {
                            loading: 'Sending invitation...',
                            success: `Interest sent to ${agent.fullName}!`,
                            error: 'Failed to send invitation'
                          });
                        }}
                      >
                        <UserPlus className="h-3.5 w-3.5" /> Invite to Team
                      </Button>
                    </CardContent>
                  </Card>
                ))}
             </div>
           ) : (
             <div className="py-24 flex flex-col items-center justify-center text-center gap-4 border-2 border-dashed border-primary/10 rounded-2xl bg-muted/5">
                <Code2 className="h-16 w-16 text-muted-foreground/20" />
                <div className="space-y-1">
                   <h3 className="text-xl font-bold">No free agents match your search</h3>
                   <p className="text-muted-foreground text-sm max-w-xs mx-auto">Try clearing some filters or check back later as new participants register.</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { setSelectedSkills([]); setSearch(''); }}>
                  Reset All Filters
                </Button>
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
