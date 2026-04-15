import { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { authService, type User } from '@/shared/api/auth.service';
import { toast } from 'sonner';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (data: any) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();

  // Seed user from localStorage immediately so routes never see a null user on initial load
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem('userData');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Track whether we are still verifying the token with the backend
  const hasToken = !!localStorage.getItem('accessToken');

  const { data: meData, isLoading: meIsLoading, error: meError } = useQuery({
    queryKey: ['auth', 'me'],
    queryFn: authService.getMe,
    retry: false,
    enabled: hasToken,
    staleTime: 5 * 60 * 1000, // 5 min – avoid re-fetching on every navigation
  });

  // Sync verified user from backend
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

  // Only logout on backend error if we actually had a token
  useEffect(() => {
    if (meError && hasToken) {
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
      toast.success('Registration successful!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error?.message || 'Registration failed');
    },
  });

  const logout = () => {
    authService.logout().catch(() => {});
    setUser(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
    queryClient.clear();
    toast.message('You have been logged out');
  };

  useEffect(() => {
    const handleUnauthorized = () => logout();
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // isLoading is true only when we have a token AND are waiting for verification
  // This prevents flickering on navigation between already-authenticated pages
  const isLoading = hasToken && meIsLoading;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login: (data) => loginMutation.mutateAsync(data),
        register: (data) => registerMutation.mutateAsync(data),
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
