import { createFileRoute, Outlet } from '@tanstack/react-router';
import { ProtectedRoute } from '@/features/auth/components/route-guards';

// Layout route for all /admin/* routes
export const Route = createFileRoute('/_protected/admin' as any)({
  component: AdminLayout,
});

function AdminLayout() {
  return (
    <ProtectedRoute allowedRoles={['GLOBAL_ADMIN']}>
      <Outlet />
    </ProtectedRoute>
  );
}
