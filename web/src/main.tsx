import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { Toaster } from 'sonner';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

import './index.css';

// Create a new query client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

import { NotFoundFallback, ErrorFallback, PageSkeleton } from './shared/components/global/fallbacks';

// Create a new router instance
const router = createRouter({ 
  routeTree,
  context: {
    queryClient,
  },
  defaultPreload: 'intent',
  defaultPendingComponent: PageSkeleton,
  defaultErrorComponent: ErrorFallback,
  defaultNotFoundComponent: NotFoundFallback,
});

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors closeButton />
    </QueryClientProvider>
  </React.StrictMode>
);
