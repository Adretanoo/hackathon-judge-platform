import { createFileRoute } from '@tanstack/react-router';
import { useAuth } from '@/app/providers/auth-provider';
import { 
  Rocket, 
  Users, 
  ClipboardCheck, 
  Trophy, 
  Activity, 
  Award, 
  TrendingUp, 
  MessageSquare, 
  Clock, 
  Shield 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';

export const Route = createFileRoute('/_protected/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const { user } = useAuth();
  const role = user?.role || 'PARTICIPANT';

  const renderRoleDashboard = () => {
    switch (role) {
      case 'ORGANIZER':
        return <OrganizerDashboard />;
      case 'JUDGE':
        return <JudgeDashboard />;
      case 'GLOBAL_ADMIN':
        return <AdminDashboard />;
      default:
        return <ParticipantDashboard />;
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl">
          Welcome back, {user?.fullName?.split(' ')[0]}!
        </h1>
        <p className="text-muted-foreground text-lg">
          Here is your <span className="text-primary font-bold uppercase tracking-wider">{role.replace('_', ' ')}</span> overview for today.
        </p>
      </div>

      {renderRoleDashboard()}
    </div>
  );
}

// ─── Sub-Dashboards ──────────────────────────────────────────────────────────

function ParticipantDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard 
          icon={<Users className="w-5 h-5" />} 
          title="Team Status" 
          value="Joined" 
          description="EcoHack Team Alpha"
          color="text-blue-500"
        />
        <StatsCard 
          icon={<Rocket className="w-5 h-5" />} 
          title="Project" 
          value="In Progress" 
          description="75% complete"
          color="text-sky-500"
        />
        <StatsCard 
          icon={<MessageSquare className="w-5 h-5" />} 
          title="Mentors" 
          value="2 Active" 
          description="Available for chat"
          color="text-green-500"
        />
        <StatsCard 
          icon={<Clock className="w-5 h-5" />} 
          title="Deadline" 
          value="14h 20m" 
          description="Until submission"
          color="text-orange-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">
        <Card className="shadow-lg border-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Latest Announcements
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnnouncementItem 
              title="Submission deadline extended" 
              time="2 hours ago" 
              type="Important" 
            />
            <AnnouncementItem 
              title="New mentor available for AI" 
              time="5 hours ago" 
              type="Update" 
            />
          </CardContent>
        </Card>

        <Card className="shadow-lg border-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Your Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
             <div className="h-[200px] flex items-center justify-center bg-muted/20 rounded-xl border border-dashed text-muted-foreground italic">
                Progress charts will appear here as you submit project milestones.
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function OrganizerDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatsCard 
        icon={<Trophy className="w-5 h-5" />} 
        title="Active Hackathons" 
        value="3" 
        description="Global AI Summit..."
        color="text-yellow-500"
      />
      <StatsCard 
        icon={<Users className="w-5 h-5" />} 
        title="Total Participants" 
        value="1,248" 
        description="+12% from last week"
        color="text-blue-500"
      />
      <StatsCard 
        icon={<TrendingUp className="w-5 h-5" />} 
        title="Avg. Performance" 
        value="84.5" 
        description="Project health score"
        color="text-green-500"
      />
      <StatsCard 
        icon={<Activity className="w-5 h-5" />} 
        title="System Status" 
        value="Healthy" 
        description="All services online"
        color="text-emerald-500"
      />
    </div>
  );
}

function JudgeDashboard() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <StatsCard 
        icon={<ClipboardCheck className="w-5 h-5" />} 
        title="Pending Scores" 
        value="12" 
        description="Projects waiting"
        color="text-orange-500"
      />
      <StatsCard 
        icon={<TrendingUp className="w-5 h-5" />} 
        title="Avg. Time/Project" 
        value="8m 30s" 
        description="Effort tracking"
        color="text-blue-500"
      />
      <StatsCard 
        icon={<Users className="w-5 h-5" />} 
        title="Judge Groups" 
        value="Tech & UI/UX" 
        description="Assigned categories"
        color="text-sky-500"
      />
    </div>
  );
}

function AdminDashboard() {
  return (
     <Card className="border-primary/20 bg-primary/5">
       <CardContent className="p-12 text-center flex flex-col items-center gap-4">
          <Shield className="w-16 h-16 text-primary" />
          <h2 className="text-2xl font-bold">Admin Control Center</h2>
          <p className="max-w-md text-muted-foreground">
            You have full access to platform metrics, logs, and user management. Use the sidebar to navigate to specific sections.
          </p>
       </CardContent>
     </Card>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function StatsCard({ icon, title, value, description, color }: { 
  icon: React.ReactNode, 
  title: string, 
  value: string, 
  description: string,
  color?: string
}) {
  return (
    <Card className="group hover:scale-[1.02] transition-all duration-300 shadow-sm hover:shadow-xl border-primary/5">
      <CardContent className="p-6 flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">{title}</p>
          <p className="text-3xl font-bold tracking-tight">{value}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className={cn("p-3 rounded-2xl bg-muted/50 transition-colors group-hover:bg-primary/10", color)}>
          {icon}
        </div>
      </CardContent>
    </Card>
  );
}

function AnnouncementItem({ title, time, type }: { title: string, time: string, type: string }) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors border-l-4 border-primary/20">
      <div className="space-y-1">
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{time}</p>
      </div>
      <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold uppercase tracking-tighter">
        {type}
      </span>
    </div>
  );
}
