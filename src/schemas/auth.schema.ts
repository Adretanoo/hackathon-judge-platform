/**
 * @file src/schemas/auth.schema.ts
 * @description Zod schemas for authentication endpoints.
 */

import { z } from 'zod';
import { RoleName } from '@prisma/client';

// ─── Register ─────────────────────────────────────────────────────────────────

export const registerBodySchema = z.object({
  username: z
    .string({ required_error: 'Username is required' })
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .trim(),
  fullName: z
    .string({ required_error: 'Full name is required' })
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters')
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
  role: z.nativeEnum(RoleName).default(RoleName.PARTICIPANT),
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

// ─── Response schemas ─────────────────────────────────────────────────────────

export const authResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    accessToken: z.string(),
    user: z.object({
      id: z.string().uuid(),
      username: z.string(),
      fullName: z.string(),
      email: z.string().email(),
      role: z.nativeEnum(RoleName).optional(),
    }),
  }),
});

export const logoutResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
  }),
});


// ─── Inferred types ───────────────────────────────────────────────────────────

export type RegisterBody = z.infer<typeof registerBodySchema>;
export type LoginBody = z.infer<typeof loginBodySchema>;
