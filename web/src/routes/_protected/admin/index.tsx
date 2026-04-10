import React from 'react';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '@/shared/api/admin.service';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import {
  Trophy,
  Users,
  Rocket,
  Activity,
  Shield,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { cn } from '@/shared/lib/utils';

export const Route = createFileRoute('/_protected/admin/')({
  component: AdminDashboardPage,
});

const STATUS_COLOR: Record<string, string> = {
  DRAFT: 'bg-muted text-muted-foreground',
  PUBLISHED: 'bg-blue-500/10 text-blue-600',
  REGISTRATION_OPEN: 'bg-green-500/10 text-green-700',
  REGISTRATION_CLOSED: 'bg-orange-500/10 text-orange-600',
  IN_PROGRESS: 'bg-primary/10 text-primary',
  JUDGING: 'bg-purple-500/10 text-purple-600',
  COMPLETED: 'bg-gray-500/10 text-gray-600',
  ARCHIVED: 'bg-gray-300/10 text-gray-400',
};

function AdminDashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['admin', 'stats'],
    queryFn: adminApi.getStats,
    refetchInterval: 60_000,
  });

  const { data: hackathonsData, isLoading: hackathonsLoading } = useQuery({
    queryKey: ['admin', 'hackathons', 'recent'],
    queryFn: () => adminApi.listHackathons({ limit: 6 }),
  });

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users', 'recent'],
    queryFn: async () => {
      const authClient = (await import('@/shared/api/auth-client')).authClient;
      const { data } = await authClient.get('/users', { params: { limit: 5, sortBy: 'createdAt', sortOrder: 'desc' } });
      return data.data;
    },
  });

  const hackathons: any[] = hackathonsData?.items || [];
  const users: any[] = usersData?.items || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Shield className="w-6 h-6" />
            </div>
            <Badge className="bg-primary/10 text-primary border-none font-bold uppercase tracking-widest">
              Global Admin
            </Badge>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Control Center</h1>
          <p className="text-muted-foreground mt-1 text-lg">
            Full platform oversight — users, hackathons, and system health.
          </p>
        </div>
        <Button asChild size="lg" className="font-bold gap-2 shadow-lg">
          <Link to="/admin/hackathons">
            <Trophy className="w-5 h-5" />
            Manage Hackathons
          </Link>
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Trophy className="w-6 h-6" />}
          label="Total Hackathons"
          value={statsLoading ? '...' : String(stats?.hackathons.total ?? 0)}
          sub={statsLoading ? '' : `${stats?.hackathons.active ?? 0} active`}
          color="text-yellow-500"
          href="/admin/hackathons"
        />
        <StatCard
          icon={<Users className="w-6 h-6" />}
          label="Registered Users"
          value={statsLoading ? '...' : String(stats?.users.total ?? 0)}
          sub="All roles"
          color="text-blue-500"
          href="/admin/users"
        />
        <StatCard
          icon={<Rocket className="w-6 h-6" />}
          label="Projects"
          value={statsLoading ? '...' : String(stats?.projects.total ?? 0)}
          sub="All statuses"
          color="text-purple-500"
          href="/admin/projects"
        />
        <StatCard
          icon={<Activity className="w-6 h-6" />}
          label="System Status"
          value="Healthy"
          sub="All services online"
          color="text-emerald-500"
          href="/admin/config"
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hackathons */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Trophy className="w-5 h-5 text-primary" /> Recent Hackathons
            </h2>
            <Button variant="ghost" asChild className="gap-1 text-primary font-bold">
              <Link to="/admin/hackathons">View all <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>

          <Card className="overflow-hidden border-primary/10 shadow-sm">
            {hackathonsLoading ? (
              <div className="divide-y">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="p-4 flex items-center gap-4">
                    <div className="h-10 w-64 rounded-lg bg-muted animate-pulse" />
                    <div className="h-6 w-20 rounded-full bg-muted animate-pulse ml-auto" />
                  </div>
                ))}
              </div>
            ) : hackathons.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p className="font-bold">No hackathons yet</p>
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {hackathons.map((h: any) => (
                  <div key={h.id} className="p-4 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    <div>
                      <p className="font-bold">{h.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(h.startDate).toLocaleDateString()} — {new Date(h.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={cn('text-[10px] font-black uppercase px-2 py-1 rounded-full', STATUS_COLOR[h.status] || 'bg-muted text-muted-foreground')}>
                        {h.status.replace(/_/g, ' ')}
                      </span>
                      <Button variant="ghost" size="sm" asChild>
                        <Link to="/organizer/hackathons/$hackathonId" params={{ hackathonId: h.id }}>
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Recent Users */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> Recent Users
            </h2>
            <Button variant="ghost" asChild className="gap-1 text-primary font-bold">
              <Link to="/admin/users">View all <ArrowRight className="w-4 h-4" /></Link>
            </Button>
          </div>

          <Card className="overflow-hidden border-primary/10 shadow-sm">
            {usersLoading ? (
              <div className="divide-y">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="p-4">
                    <div className="h-4 w-32 rounded bg-muted animate-pulse mb-2" />
                    <div className="h-3 w-48 rounded bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="divide-y divide-border/50">
                {users.map((u: any) => (
                  <div key={u.id} className="p-4 flex items-center gap-3 hover:bg-muted/10 transition-colors">
                    <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-black text-sm flex-shrink-0">
                      {(u.fullName || u.username || '?')[0].toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{u.fullName || u.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <Badge variant="outline" className="ml-auto text-[9px] uppercase font-black shrink-0">
                      {u.roles?.[0]?.roleName || 'USER'}
                    </Badge>
                  </div>
                ))}
                {users.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground text-sm">No users found</div>
                )}
              </div>
            )}
          </Card>

          {/* Quick Actions */}
          <Card className="p-4 border-primary/10 bg-primary/5">
            <h3 className="font-bold text-sm mb-3">Quick Actions</h3>
            <div className="space-y-2">
              <Button asChild variant="outline" className="w-full justify-start gap-2 bg-background/80">
                <Link to="/admin/hackathons"><Trophy className="w-4 h-4 text-yellow-500" /> Create Hackathon</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2 bg-background/80">
                <Link to="/admin/judges"><Shield className="w-4 h-4 text-purple-500" /> Review Conflicts</Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2 bg-background/80">
                <Link to="/admin/leaderboard"><TrendingUp className="w-4 h-4 text-blue-500" /> Leaderboard</Link>
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({
  icon, label, value, sub, color, href
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  sub: string;
  color: string;
  href: string;
}) {
  return (
    <Link to={href as any}>
      <Card className="group hover:scale-[1.02] hover:shadow-xl transition-all duration-300 border-primary/5 cursor-pointer">
        <CardContent className="p-6 flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</p>
            <p className="text-3xl font-black tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{sub}</p>
          </div>
          <div className={cn('p-3 rounded-2xl bg-muted/50 group-hover:bg-primary/10 transition-colors', color)}>
            {icon}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
