import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, type User } from '@/shared/api/auth.service';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('userData');
    return saved ? JSON.parse(saved) : null;
  });

  // Query to get current user info and verify token
  const { data: meData, isLoading, error: meError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    retry: false,
    enabled: !!localStorage.getItem('accessToken'),
  });

  // Side effect for sync user state (replacing onSuccess/onError in v5)
  useEffect(() => {
    if (meData) {
      const fullUser = {
        id: meData.data.id,
        email: meData.data.email,
        role: meData.data.role,
        username: meData.data.username || user?.username || '',
        fullName: meData.data.fullName || user?.fullName || '',
      };
      setUser(fullUser);
      localStorage.setItem('userData', JSON.stringify(fullUser));
    }
  }, [meData]);

  useEffect(() => {
    if (meError) {
      logout();
    }
  }, [meError]);

  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (response) => {
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('userData', JSON.stringify(response.data.user));
      setUser(response.data.user);
      queryClient.setQueryData(['auth', 'me'], { data: response.data.user });
      toast.success('Welcome back!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Login failed');
    },
  });

  const registerMutation = useMutation({
    mutationFn: authService.register,
    onSuccess: () => {
      // We don't necessarily log in automatically, or we could
      toast.success('Registration successful! Please login.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Registration failed');
    },
  });

  const logout = () => {
    authService.logout().catch(() => {}); // Fire and forget
    setUser(null);
    queryClient.clear();
    toast.message('You have been logged out');
  };

  // Listen for unauthorized events from axios interceptor
  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading: isLoading && !!localStorage.getItem('accessToken'),
        login: async (data) => {
          await loginMutation.mutateAsync(data);
        },
        register: async (data) => {
          await registerMutation.mutateAsync(data);
        },
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
