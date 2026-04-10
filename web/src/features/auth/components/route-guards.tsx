import { Navigate, Outlet } from '@tanstack/react-router';
import { useAuth } from '@/app/providers/auth-provider';
import type { User } from '@/shared/api/auth.service';

interface ProtectedRouteProps {
  allowedRoles?: User['role'][];
  children?: React.ReactNode;
}

/**
 * Guard component that redirects to login if not authenticated
 * or to home if the user doesn't have the required role.
 */
export function ProtectedRoute({ allowedRoles, children }: ProtectedRouteProps) {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" search={{ redirect: window.location.pathname }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children || <Outlet />}</>;
}

/**
 * Component-level guard for granular UI control.
 */
export function RoleGuard({ 
  allowedRoles, 
  children,
  fallback = null 
}: { 
  allowedRoles: User['role'][], 
  children: React.ReactNode,
  fallback?: React.ReactNode
}) {
  const { user } = useAuth();
  
  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }
  
  return <>{children}</>;
}
