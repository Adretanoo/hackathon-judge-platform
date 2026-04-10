/**
 * @file src/schemas/team.schema.ts
 * @description Zod validation schemas for Team Module.
 */

import { z } from 'zod';
import { cuidSchema, paginationSchema } from './common';
import { TeamStatus, TeamMemberRole } from '@prisma/client';

// ─── Params ───────────────────────────────────────────────────────────────────

export const teamParamsSchema = z.object({
  teamId: cuidSchema.describe('Unique identifier for the team'),
});

export const idParamCuidSchema = z.object({
  id: cuidSchema.describe('Unique identifier'),
});

export const hackathonParamsSchema = z.object({
  hackathonId: cuidSchema.describe('Unique identifier for the hackathon'),
});

// ─── Body Schemas ─────────────────────────────────────────────────────────────

/** Body for creating a new team */
export const createTeamSchema = z.object({
  name: z
    .string({ required_error: 'Team name is required' })
    .min(3, 'Team name must be at least 3 characters')
    .max(100, 'Team name must be at most 100 characters')
    .trim(),
  description: z.string().max(1000).optional(),
  logoUrl: z.string().url('Invalid logo URL').optional(),
  trackId: cuidSchema.optional(),
});

/** Body for updating team details */
export const updateTeamSchema = createTeamSchema.partial();

/** Body for generating an invite link */
export const generateInviteSchema = z.object({
  expiresInMinutes: z.number().int().min(1).max(43200).default(1440), // Default 1 day
  maxUses: z.number().int().min(1).max(100).default(1),
});

// ─── Query Schemas ────────────────────────────────────────────────────────────

export const listTeamsQuerySchema = paginationSchema.extend({
  trackId: cuidSchema.optional(),
});

export const freeAgentQuerySchema = paginationSchema.extend({
  skills: z.string().optional().describe('Comma-separated list of skills'),
});

// ─── Response Schemas ─────────────────────────────────────────────────────────

export const teamMemberSchema = z.object({
  id: cuidSchema,
  userId: z.string(),
  role: z.nativeEnum(TeamMemberRole),
  user: z.object({
    username: z.string(),
    fullName: z.string(),
    avatarUrl: z.string().nullable(),
  }),
});

export const teamResponseSchema = z.object({
  id: cuidSchema,
  name: z.string(),
  description: z.string().nullable(),
  logoUrl: z.string().nullable(),
  status: z.nativeEnum(TeamStatus),
  hackathonId: cuidSchema,
  trackId: cuidSchema.nullable(),
  members: z.array(teamMemberSchema).optional(),
});

// ─── Inferred Types ───────────────────────────────────────────────────────────

export type CreateTeamBody = z.infer<typeof createTeamSchema>;
export type UpdateTeamBody = z.infer<typeof updateTeamSchema>;
export type GenerateInviteBody = z.infer<typeof generateInviteSchema>;
export type ListTeamsQuery = z.infer<typeof listTeamsQuerySchema>;
export type FreeAgentQuery = z.infer<typeof freeAgentQuerySchema>;
