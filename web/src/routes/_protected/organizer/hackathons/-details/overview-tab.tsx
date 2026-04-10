import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent, 
  Button
} from '@/shared/ui';
import { 
  Users, 
  Calendar, 
  Globe, 
  MapPin, 
  Link as LinkIcon,
  MessageSquare,
  Rocket,
  ArrowRight
} from 'lucide-react';
import type { Hackathon } from '@/shared/api/hackathon.service';

interface OverviewTabProps {
  hackathon: Hackathon;
}

export function OverviewTab({ hackathon }: OverviewTabProps) {

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card className="border-primary/5 shadow-md">
          <CardHeader>
            <CardTitle>About this Hackathon</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="prose prose-sm dark:prose-invert max-w-none">
              <p className="whitespace-pre-wrap">{hackathon.description || 'No description provided.'}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Event Duration</p>
                  <p className="text-sm font-medium">
                    {new Date(hackathon.startDate).toLocaleDateString()} — {new Date(hackathon.endDate).toLocaleDateString()}
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  {hackathon.isOnline ? <Globe className="h-4 w-4 text-primary" /> : <MapPin className="h-4 w-4 text-primary" />}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Location</p>
                  <p className="text-sm font-medium">{hackathon.isOnline ? 'Fully Online' : hackathon.location || 'Not specified'}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Users className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Team Size</p>
                  <p className="text-sm font-medium">{hackathon.minTeamSize} - {hackathon.maxTeamSize} members</p>
                </div>
              </div>

              {hackathon.websiteUrl && (
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <LinkIcon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">Website</p>
                    <a href={hackathon.websiteUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline truncate block max-w-[200px]">
                      {hackathon.websiteUrl.replace(/^https?:\/\//, '')}
                    </a>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
           <Card className="bg-primary/5 border-primary/10">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                 <Rocket className="h-8 w-8 text-primary" />
                 <h3 className="font-bold">Participant Dashboard</h3>
                 <p className="text-xs text-muted-foreground">View what participants see and test registration flows.</p>
                 <Button variant="outline" size="sm" className="w-full mt-2">
                    Preview UI <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
              </CardContent>
           </Card>
           <Card className="bg-secondary/20 border-secondary/30">
              <CardContent className="p-6 flex flex-col items-center text-center gap-3">
                 <MessageSquare className="h-8 w-8 text-secondary-foreground" />
                 <h3 className="font-bold">Announcements</h3>
                 <p className="text-xs text-muted-foreground">Send push notifications and emails to all participants.</p>
                 <Button variant="outline" size="sm" className="w-full mt-2">
                    Manage News <ArrowRight className="ml-2 h-4 w-4" />
                 </Button>
              </CardContent>
           </Card>
        </div>
      </div>

      <div className="space-y-6">
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest text-muted-foreground">Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-between items-end border-b pb-4">
              <span className="text-sm text-muted-foreground font-medium">Participants</span>
              <span className="text-2xl font-bold tracking-tight">0</span>
            </div>
            <div className="flex justify-between items-end border-b pb-4">
              <span className="text-sm text-muted-foreground font-medium">Teams</span>
              <span className="text-2xl font-bold tracking-tight">0</span>
            </div>
            <div className="flex justify-between items-end border-b pb-4">
              <span className="text-sm text-muted-foreground font-medium">Projects</span>
              <span className="text-2xl font-bold tracking-tight">0</span>
            </div>
            <div className="flex justify-between items-end">
              <span className="text-sm text-muted-foreground font-medium">Judges</span>
              <span className="text-2xl font-bold tracking-tight">0</span>
            </div>
          </CardContent>
        </Card>
        
        {hackathon.bannerUrl && (
          <Card className="overflow-hidden shadow-xl border-none">
            <img src={hackathon.bannerUrl} alt="Hackathon Banner" className="w-full h-48 object-cover hover:scale-105 transition-transform duration-700" />
            <div className="p-3 bg-card border-t text-center">
               <p className="text-[10px] text-muted-foreground uppercase font-bold">Event Banner</p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
