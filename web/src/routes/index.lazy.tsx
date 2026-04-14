import { createLazyFileRoute, Link } from '@tanstack/react-router';
import { Button } from '@/shared/ui/button';
import { Rocket, Trophy, Users } from 'lucide-react';

export const Route = createLazyFileRoute('/')({
  component: Index,
});

function Index() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] text-center space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      <div className="space-y-4 max-w-2xl">
        <h1 className="text-5xl md:text-7xl font-bold tracking-tighter bg-gradient-to-r from-primary to-sky-400 bg-clip-text text-transparent">
          Hackathon Judge Platform
        </h1>
        <p className="text-xl text-muted-foreground font-medium italic">
          Automated evaluation, real-time leaderboards, and seamless coordination.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl pt-8">
        <FeatureCard 
          icon={<Rocket className="w-8 h-8 text-primary" />}
          title="Fast Submissions"
          description="Submit projects with ease and track their status in real-time."
        />
        <FeatureCard 
          icon={<Trophy className="w-8 h-8 text-primary" />}
          title="Smart Judging"
          description="Criteria-based scoring with automated weight calculations."
        />
        <FeatureCard 
          icon={<Users className="w-8 h-8 text-primary" />}
          title="Team Management"
          description="Find teammates, manage roles, and collaborate effectively."
        />
      </div>

      <div className="flex flex-col sm:flex-row gap-4 pt-8 w-full sm:w-auto px-4">
        <Link to="/register" className="w-full sm:w-auto">
          <Button size="lg" className="w-full sm:w-auto rounded-full px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all font-bold text-lg h-14">
            Get Started Now
          </Button>
        </Link>
        <Link to="/login" className="w-full sm:w-auto">
          <Button size="lg" variant="outline" className="w-full sm:w-auto rounded-full px-8 font-bold text-lg h-14 border-2">
            Sign In
          </Button>
        </Link>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-6 rounded-2xl border bg-card/50 backdrop-blur-sm hover:border-primary/50 transition-colors text-left space-y-3">
      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
        {icon}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-muted-foreground text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
