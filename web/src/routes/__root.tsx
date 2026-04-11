import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { QueryClient } from '@tanstack/react-query';
import { AuthProvider } from '@/app/providers/auth-provider';
import { ThemeProvider } from '@/app/providers/theme-provider';
import { SocketProvider } from '@/app/providers/socket-provider';

interface MyRouterContext {
  queryClient: QueryClient;
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  component: RootLayout,
});

function RootLayout() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="hackathon-theme">
      <AuthProvider>
        <SocketProvider>
          <div className="min-h-screen bg-background text-foreground">
            <Outlet />
          </div>
          {process.env.NODE_ENV === 'development' && (
            <TanStackRouterDevtools position="bottom-right" />
          )}
        </SocketProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
