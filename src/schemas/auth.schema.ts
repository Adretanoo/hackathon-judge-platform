/**
 * @file src/schemas/auth.schema.ts
 * @description Zod schemas for authentication endpoints.
 */

import { z } from 'zod';
import { UserRole } from '../types';

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerBodySchema = z.object({
  name: z
    .string({ required_error: 'Name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .trim(),
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase()
    .trim(),
  password: z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    ),
  role: z.nativeEnum(UserRole).default(UserRole.PARTICIPANT),
});

// ─── Login ────────────────────────────────────────────────────────────────────

export const loginBodySchema = z.object({
  email: z
    .string({ required_error: 'Email is required' })
    .email('Must be a valid email address')
    .toLowerCase()
    .trim(),
  password: z.string({ required_error: 'Password is required' }),
});

// ─── Refresh token ────────────────────────────────────────────────────────────

export const refreshTokenBodySchema = z.object({
  refreshToken: z
    .string({ required_error: 'Refresh token is required' })
    .min(1),
});

// ─── Response schemas ─────────────────────────────────────────────────────────

export const authResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    accessToken: z.string(),
    refreshToken: z.string(),
    user: z.object({
      id: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
      role: z.nativeEnum(UserRole),
    }),
  }),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
export type RefreshTokenBody = z.infer<typeof refreshTokenBodySchema>;
