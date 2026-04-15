import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/shared/ui/button';
import { Layers, Zap, ShieldCheck, BarChart3, Sun, Moon, Monitor, ArrowRight } from 'lucide-react';
import { useAuth } from '@/app/providers/auth-provider';
import { useTheme } from '@/app/providers/theme-provider';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/shared/ui';

export const Route = createLazyFileRoute('/')({
  component: LandingPage,
});

function LandingPage() {
  const { isAuthenticated, user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  
  const destPath = user?.role === 'GLOBAL_ADMIN' ? '/admin' : '/dashboard';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-primary/30">
      
      {/* ─── HEADER ─── */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Layers className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-extrabold text-xl tracking-tight">Evalix</span>
          </div>

          <nav className="hidden md:flex gap-8 text-sm font-medium text-muted-foreground hover:[&>a]:text-foreground transition-colors">
            <a href="#features">Features</a>
          </nav>

          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="w-9 h-9 mr-1">
                  {theme === 'light' && <Sun className="h-4 w-4" />}
                  {theme === 'dark' && <Moon className="h-4 w-4" />}
                  {theme === 'system' && <Monitor className="h-4 w-4" />}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTheme('light')}>
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Light</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')}>
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Dark</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')}>
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>System</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {isAuthenticated && (
              <>
                <Link to={destPath}>
                  <Button variant="default" size="sm" className="font-semibold shadow-sm">
                    Dashboard
                  </Button>
                </Link>
                <Button variant="outline" size="sm" onClick={() => logout()}>
                  Logout
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <main className="flex-1 flex flex-col items-center">
        <section className="w-full py-24 md:py-32 lg:py-40 px-4 text-center max-w-5xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000">
          <div className="inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-sm font-medium text-primary mb-8">
            <Zap className="mr-2 h-4 w-4" />
            Next-gen evaluation platform is live
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight lg:text-8xl mb-6">
            Automated <span className="bg-gradient-to-br from-primary to-blue-500 bg-clip-text text-transparent">Project Judging</span>
          </h1>
          <p className="mx-auto max-w-2xl text-xl text-muted-foreground font-medium mb-10 leading-relaxed">
            Evalix is a <strong>100% free</strong> and open-source platform that streamlines the submission, evaluation, and scoring of complex projects. Perfect for universities, enterprises, and competitions.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {isAuthenticated ? (
              <Link to={destPath}>
                <Button size="lg" className="rounded-full px-8 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300">
                  Go to Dashboard <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/register">
                  <Button size="lg" className="rounded-full px-10 h-14 text-lg font-bold shadow-xl shadow-primary/20 hover:scale-105 transition-transform duration-300">
                    Register
                  </Button>
                </Link>
                <Link to="/login">
                  <Button size="lg" variant="outline" className="rounded-full px-10 h-14 text-lg font-bold border-2">
                    Login
                  </Button>
                </Link>
              </>
            )}
          </div>
        </section>

        {/* ─── FEATURES GRID ─── */}
        <section id="features" className="w-full py-20 px-4 bg-muted/30 border-y">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">Everything you need to run evaluations</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard 
                icon={<BarChart3 />}
                title="Dynamic Custom Criteria"
                description="Easily build and customize grading rubrics. Assign specific weights and categories to measure exactly what matters."
              />
              <FeatureCard 
                icon={<ShieldCheck />}
                title="Secure Role Management"
                description="Invite users as Admins, Judges, Mentors or Participants. Fine-grained permissions keep your review data secure."
              />
              <FeatureCard 
                icon={<Layers />}
                title="Real-Time Analytics"
                description="Leaderboards update instantly as judges submit scores. Export full PDF reports and automated certificates with one click."
              />
            </div>
          </div>
        </section>
      </main>

      {/* ─── FOOTER ─── */}
      <footer className="w-full border-t bg-background pt-16 pb-8 px-4 md:px-6">
        <div className="container mx-auto max-w-6xl grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          
          <div className="col-span-2 md:col-span-1 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-foreground flex items-center justify-center">
                <Layers className="w-3 h-3 text-background" />
              </div>
              <span className="font-bold text-lg">Evalix</span>
            </div>
            <p className="text-sm text-muted-foreground mr-4">
              The modern SaaS platform for automated project evaluation, seamless judging, and real-time leaderboards.
            </p>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Quick Links</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/login" className="hover:text-foreground transition-colors">Login</Link></li>
              <li><Link to="/register" className="hover:text-foreground transition-colors">Register</Link></li>
            </ul>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold">Project</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub Repository</a></li>
            </ul>
          </div>

        </div>
        
        <div className="container mx-auto max-w-6xl border-t pt-8 flex flex-col md:flex-row items-center justify-between text-sm text-muted-foreground">
          <p>© 2026 Evalix. All rights reserved.</p>
          <div className="flex items-center gap-4 mt-4 md:mt-0 font-medium">
            <a href="#" className="hover:text-foreground transition-colors">GitHub</a>
          </div>
        </div>
      </footer>

    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group p-8 rounded-3xl border bg-card/40 backdrop-blur-sm hover:bg-card hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 text-left space-y-4">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
        {icon}
      </div>
      <h3 className="text-xl font-bold tracking-tight">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
