import { createFileRoute, Link } from '@tanstack/react-router';
import { Card } from '@/shared/ui';
import { FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/shared/ui/button';

export const Route = createFileRoute('/_protected/organizer/exports')({
   component: OrganizerExportsProxy,
});

function OrganizerExportsProxy() {
   return (
      <div className="p-8 max-w-2xl mx-auto text-center space-y-6 mt-12">
         <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary">
            <FileText className="w-8 h-8" />
         </div>
         <h1 className="text-3xl font-black">Експорт Даних</h1>
         <p className="text-muted-foreground text-lg">
            Генерація сертифікатів та завантаження CSV-звітів здійснюється безпосередньо з панелі управління західом.
         </p>
         <Card className="p-6 bg-muted/20 border-primary/20">
            <Button asChild className="w-full font-bold gap-2" size="lg">
               <Link to="/organizer/hackathons">
                  Перейти до західів <ArrowRight className="w-4 h-4" />
               </Link>
            </Button>
         </Card>
      </div>
   );
}
