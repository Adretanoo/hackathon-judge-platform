/**
 * @file src/schemas/user.schema.ts
 * @description Zod schemas for User Management endpoints (Admin/Organizer).
 */

import { z } from 'zod';
import { RoleName } from '@prisma/client';
import { paginationSchema, cuidSchema } from './common';

// ─── List Users ───────────────────────────────────────────────────────────────

export const listUsersQuerySchema = paginationSchema.extend({
  role: z.nativeEnum(RoleName).optional(),
  skills: z.string().optional(), // Search for a specific skill
});

// ─── Update User Profile (Admin) ───────────────────────────────────────────────

export const updateUserAdminSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  avatarUrl: z.string().url().optional().nullable(),
  bio: z.string().max(500).optional().nullable(),
  skills: z.array(z.string()).optional(),
  isActive: z.boolean().optional(),
  isVerified: z.boolean().optional(),
});

// ─── Assign Role ──────────────────────────────────────────────────────────────

export const assignRoleSchema = z.object({
  role: z.nativeEnum(RoleName),
  hackathonId: cuidSchema.optional().nullable(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserAdminBody = z.infer<typeof updateUserAdminSchema>;
export type AssignRoleBody = z.infer<typeof assignRoleSchema>;
