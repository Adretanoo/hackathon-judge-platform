import { z } from 'zod';
import { authClient } from './auth-client';

// ─── Response Schemas ─────────────────────────────────────────────────────────

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  fullName: z.string(),
  email: z.string().email(),
  role: z.enum(['GLOBAL_ADMIN', 'ORGANIZER', 'JUDGE', 'MENTOR', 'PARTICIPANT']),
});

export type User = z.infer<typeof UserSchema>;

const AuthResponseSchema = z.object({
  success: z.boolean(),
  data: z.object({
    accessToken: z.string(),
    user: UserSchema,
  }),
});

const MeResponseSchema = z.object({
  success: z.boolean(),
  data: UserSchema,
});

// ─── Service ──────────────────────────────────────────────────────────────────

export const authService = {
  login: async (credentials: z.infer<typeof LoginPayloadSchema>) => {
    const { data } = await authClient.post('/auth/login', credentials);
    return AuthResponseSchema.parse(data);
  },

  register: async (payload: z.infer<typeof RegisterPayloadSchema>) => {
    const { data } = await authClient.post('/auth/register', payload);
    return AuthResponseSchema.parse(data);
  },

  logout: async () => {
    await authClient.post('/auth/logout');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('userData');
  },

  getMe: async () => {
    const { data } = await authClient.get('/users/me');
    return MeResponseSchema.parse(data);
  },
};

// ─── Form Payloads ────────────────────────────────────────────────────────────

export const LoginPayloadSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const RegisterPayloadSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  fullName: z.string().min(2, 'Full name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/.*[a-z].*/, 'Password must contain at least one lowercase letter')
    .regex(/.*[A-Z].*/, 'Password must contain at least one uppercase letter')
    .regex(/.*\d.*/, 'Password must contain at least one number'),
  role: z.enum(['PARTICIPANT', 'ORGANIZER']).default('PARTICIPANT'),
});
