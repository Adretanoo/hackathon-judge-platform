import { Link } from '@tanstack/react-router';
import { Button, Card, CardContent } from '@/shared/ui';
import { AlertCircle, FileQuestion, MoveLeft, RefreshCw } from 'lucide-react';
import { Skeleton } from '@/shared/ui/skeleton';

export function NotFoundFallback() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-primary/10 shadow-2xl">
        <CardContent className="pt-12 pb-10 text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-muted rounded-full flex items-center justify-center">
            <FileQuestion className="h-10 w-10 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Page Not Found</h1>
            <p className="text-muted-foreground">The resource you're looking for doesn't exist, has been moved, or you don't have access to it.</p>
          </div>
          <Button asChild className="mt-4 rounded-xl gap-2 font-bold h-11" variant="default">
            <Link to="/">
              <MoveLeft className="h-4 w-4" />
              Return Home
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export function ErrorFallback({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border-destructive/20 shadow-xl shadow-destructive/5">
        <CardContent className="pt-10 pb-8 space-y-6">
          <div className="flex items-center gap-4 text-destructive">
            <AlertCircle className="h-10 w-10" />
            <h2 className="text-2xl font-black">Something went wrong</h2>
          </div>
          <div className="p-4 bg-muted rounded-xl text-sm font-mono break-words text-muted-foreground border border-black/5 overflow-auto max-h-40">
            {error.message}
          </div>
          <div className="flex justify-end pt-2">
            <Button onClick={reset} variant="default" className="rounded-xl gap-2 font-bold">
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="min-h-screen p-6 lg:p-10 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="space-y-2">
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-6 w-[450px]" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Skeleton className="h-[120px] rounded-2xl" />
        <Skeleton className="h-[120px] rounded-2xl" />
        <Skeleton className="h-[120px] rounded-2xl" />
      </div>
      <Skeleton className="h-[400px] w-full rounded-3xl" />
    </div>
  );
}
