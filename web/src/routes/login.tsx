import { createFileRoute, useNavigate, Navigate } from '@tanstack/react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { LoginPayloadSchema } from '@/shared/api/auth.service';
import { useAuth } from '@/app/providers/auth-provider';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Label } from '@/shared/ui';
import { cn } from '@/shared/lib/utils';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

import { z } from 'zod';

const loginSearchSchema = z.object({
  redirect: z.string().optional().catch(''),
});

export const Route = createFileRoute('/login')({
  component: LoginPage,
  validateSearch: loginSearchSchema,
});

function LoginPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { login, isAuthenticated, user } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // If already authenticated, redirect to appropriate panel
  if (isAuthenticated && user) {
    const dest = user.role === 'GLOBAL_ADMIN' ? '/admin' : '/dashboard';
    return <Navigate to={dest} replace />;
  }

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(LoginPayloadSchema),
  });

  const onSubmit = async (data: any) => {
    try {
      const response = await login(data);
      if (search.redirect) {
        navigate({ to: search.redirect as any });
      } else {
        const role = response.data.user.role;
        if (role === 'GLOBAL_ADMIN') {
          navigate({ to: '/admin' });
        } else {
          navigate({ to: '/dashboard' });
        }
      }
    } catch (error: any) {
      const respData = error.response?.data;
      let errMsg = 'Login failed';
      
      // If backend returns an array of Zod errors
      if (typeof respData?.message === 'string' && respData.message.startsWith('[')) {
        try {
          const parsed = JSON.parse(respData.message);
          if (Array.isArray(parsed) && parsed.length > 0 && parsed[0].message) {
            errMsg = parsed[0].message;
          }
        } catch(e) {}
      } else if (Array.isArray(respData?.message) && respData.message.length > 0) {
        errMsg = respData.message[0].message || respData.message[0];
      } else if (respData?.message) {
        errMsg = respData.message;
      }
      
      toast.error(errMsg);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md shadow-2xl border-primary/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold tracking-tight text-center">Login</CardTitle>
          <CardDescription className="text-center">
            Enter your email to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                {...register('email')}
                className={errors.email ? 'border-destructive' : ''}
              />
              {errors.email && (
                <p className="text-xs text-destructive font-medium">{errors.email.message as string}</p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  {...register('password')}
                  className={cn("pr-10", errors.password ? 'border-destructive' : '')}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-destructive font-medium">{errors.password.message as string}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Don't have an account?{' '}
              <a href="/register" className="text-primary hover:underline font-medium">
                Register
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
