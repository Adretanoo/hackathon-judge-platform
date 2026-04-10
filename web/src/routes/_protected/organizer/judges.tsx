import { createFileRoute, Link } from '@tanstack/react-router';
import { Card } from '@/shared/ui';
import { Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export const Route = createFileRoute('/_protected/organizer/judges')({
  component: OrganizerJudgesProxy,
});

function OrganizerJudgesProxy() {
  return (
    <div className="p-8 max-w-2xl mx-auto text-center space-y-6 mt-12">
      <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
         <Shield className="w-8 h-8" />
      </div>
      <h1 className="text-3xl font-black">Управління суддями</h1>
      <p className="text-muted-foreground text-lg">
         Судді призначаються для кожного хакатону окремо. Щоб додати або налаштувати суддів, оберіть потрібний хакатон.
      </p>
      <Card className="p-6 bg-muted/20 border-primary/20">
         <h3 className="font-bold mb-4">Як це зробити?</h3>
         <ol className="text-left text-sm space-y-2 list-decimal list-inside text-muted-foreground mb-6">
            <li>Перейдіть до списку хакатонів.</li>
            <li>Відкрийте панель управління конкретного заходу.</li>
            <li>Відкрийте вкладку <strong>"Судді" (Judges)</strong>.</li>
            <li>Натисніть "Призначити суддю".</li>
         </ol>
         <Button asChild className="w-full font-bold gap-2" size="lg">
            <Link to="/organizer/hackathons">
               Перейти до Хакатонів <ArrowRight className="w-4 h-4" />
            </Link>
         </Button>
      </Card>
    </div>
  );
}
