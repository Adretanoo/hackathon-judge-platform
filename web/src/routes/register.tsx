import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { RegisterPayloadSchema } from '@/shared/api/auth.service';
import { useAuth } from '@/app/providers/auth-provider';
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui';
import { toast } from 'sonner';
import { authService } from '@/shared/api/auth.service';
import { z } from 'zod';
import { cn } from '@/shared/lib/utils';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const registerSearchSchema = z.object({
  redirect: z.string().optional().catch(''),
});

export const Route = createFileRoute('/register')({
  component: RegisterPage,
  validateSearch: registerSearchSchema,
});

function RegisterPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(RegisterPayloadSchema),
    defaultValues: {
      role: 'PARTICIPANT',
    },
  });

  const onSubmit = async (data: any) => {
    try {
      await authService.register(data);
      toast.success('Registration successful! Logging in...');
      
      await login({ email: data.email, password: data.password });
      if (search.redirect) {
        navigate({ to: search.redirect as any });
      } else {
        navigate({ to: '/dashboard' });
      }
    } catch (error: any) {
      const respData = error.response?.data;
      let errMsg = 'Registration failed';
      
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
    <div className="flex items-center justify-center min-h-[80vh] py-12">
      <Card className="w-full max-w-lg shadow-2xl border-primary/10">
        <CardHeader className="space-y-1">
          <CardTitle className="text-3xl font-bold tracking-tight text-center">Create Account</CardTitle>
          <CardDescription className="text-center">
            Join the hackathon platform today
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  placeholder="johndoe"
                  {...register('username')}
                  className={errors.username ? 'border-destructive' : ''}
                />
                {errors.username && (
                  <p className="text-xs text-destructive font-medium">{errors.username.message as string}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  {...register('fullName')}
                  className={errors.fullName ? 'border-destructive' : ''}
                />
                {errors.fullName && (
                  <p className="text-xs text-destructive font-medium">{errors.fullName.message as string}</p>
                )}
              </div>
            </div>

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
              <Label htmlFor="password">Password</Label>
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

            <div className="space-y-2">
              <Label htmlFor="role">Account Type</Label>
              <Controller
                control={control}
                name="role"
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PARTICIPANT">Participant</SelectItem>
                      <SelectItem value="ORGANIZER">Organizer</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.role && (
                <p className="text-xs text-destructive font-medium">{errors.role.message as string}</p>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Creating account...' : 'Create Account'}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Already have an account?{' '}
              <a href="/login" className="text-primary hover:underline font-medium">
                Login
              </a>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
