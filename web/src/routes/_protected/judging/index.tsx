import { createFileRoute } from '@tanstack/react-router';
import { JudgeDashboard } from '@/features/judging/components/JudgeDashboard';

export const Route = createFileRoute('/_protected/judging/')({
  component: JudgeDashboardRoute,
});

function JudgeDashboardRoute() {
  return <JudgeDashboard />;
}
