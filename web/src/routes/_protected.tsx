import { createFileRoute } from '@tanstack/react-router';
import { ProtectedRoute } from '@/features/auth/components/route-guards';
import { AppLayout } from '@/widgets/layout/app-layout';

export const Route = createFileRoute('/_protected')({
  component: () => (
    <ProtectedRoute>
      <AppLayout />
    </ProtectedRoute>
  ),
});
