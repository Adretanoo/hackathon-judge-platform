import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ProtectedRoute } from '@/features/auth/components/route-guards';

// Layout route for all /organizer/* routes
export const Route = createFileRoute('/_protected/organizer' as any)({
  component: OrganizerLayout,
});

function OrganizerLayout() {
  return (
    <ProtectedRoute allowedRoles={['GLOBAL_ADMIN', 'ORGANIZER']}>
      <Outlet />
    </ProtectedRoute>
  );
}
