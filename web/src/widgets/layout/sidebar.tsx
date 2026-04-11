import { Link } from '@tanstack/react-router';
import { useAuth } from '@/app/providers/auth-provider';
import { cn } from '@/shared/lib/utils';
import { 
  LayoutDashboard, 
  Users, 
  Rocket, 
  Settings, 
  Trophy, 
  Shield, 
  ClipboardCheck, 
  FileText,
  PlusCircle,
  BarChart3,
  ShieldX,
  Users2,
  Globe
} from 'lucide-react';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {}

const navItems = {
  PARTICIPANT: [
    { label: 'Dashboard',   icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Хакатони',   icon: Globe,            href: '/hackathons' },
    { label: 'Мої Команди', icon: Users,            href: '/teams' },
  ],
  ORGANIZER: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Manage Hackathons', icon: Trophy, href: '/organizer/hackathons' },
    { label: 'Create Hackathon', icon: PlusCircle, href: '/organizer/hackathons/create' },
    { label: 'Judge Management', icon: Shield, href: '/organizer/judges' },
    { label: 'Exports', icon: FileText, href: '/organizer/exports' },
  ],
  JUDGE: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
    { label: 'Evaluation Queue', icon: ClipboardCheck, href: '/judging' },
    { label: 'Leaderboard', icon: BarChart3, href: '/leaderboard' },
  ],
  GLOBAL_ADMIN: [
    { label: 'Dashboard',          icon: LayoutDashboard,  href: '/admin' },
    { label: 'Hackathons',         icon: Trophy,            href: '/admin/hackathons' },
    { label: 'Users',              icon: Users,             href: '/admin/users' },
    { label: 'Teams',              icon: Users2,            href: '/admin/teams' },
    { label: 'Projects',           icon: Rocket,            href: '/admin/projects' },
    { label: 'Judges & Conflicts', icon: ShieldX,           href: '/admin/judges' },
    { label: 'Leaderboard',        icon: BarChart3,         href: '/admin/leaderboard' },
    { label: 'System Config',      icon: Settings,          href: '/admin/config' },
  ],
  MENTOR: [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
  ]
};

export function Sidebar({ className }: SidebarProps) {
  const { user } = useAuth();
  const role = user?.role || 'PARTICIPANT';
  const roleItems = navItems[role as keyof typeof navItems] || navItems.PARTICIPANT;

  return (
    <div className={cn("pb-12 h-full flex flex-col border-r bg-card", className)}>
      <div className="space-y-4 py-4 flex-1">
        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Menu
          </h2>
          <div className="space-y-1">
            {roleItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                activeProps={{ className: "bg-primary text-primary-foreground font-semibold shadow-md" }}
                inactiveProps={{ className: "text-muted-foreground hover:bg-accent hover:text-accent-foreground" }}
                className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all duration-200"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="px-3 py-2">
          <h2 className="mb-2 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Settings
          </h2>
          <div className="space-y-1">
            <Link
              to="/dashboard"
              inactiveProps={{ className: "text-muted-foreground hover:bg-accent hover:text-accent-foreground" }}
              className="flex items-center gap-3 rounded-lg px-3 py-2 transition-all"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
          </div>
        </div>
      </div>

      <div className="px-3 py-2 mt-auto border-t pt-4">
        <div className="rounded-xl p-4 bg-muted/50 border">
          <p className="text-xs font-bold text-primary uppercase mb-1">Current Role</p>
          <p className="text-sm font-semibold truncate uppercase">{role.replace('_', ' ')}</p>
        </div>
      </div>
    </div>
  );
}
