/**
 * @file src/schemas/team.schema.ts
 * @description Validation schemas for Teams and Team Invites.
 */

import { z } from 'zod';
import { TeamMemberRole } from '@prisma/client';

export const createTeamSchema = z.object({
  hackathonId: z.string().cuid(),
  trackId: z.string().cuid().optional(),
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  logoUrl: z.string().url().optional(),
  isOpen: z.boolean().default(true),
});

export const updateTeamSchema = createTeamSchema.partial();

export const inviteMemberSchema = z.object({
  receiverId: z.string().cuid(),
  message: z.string().optional(),
});

export const processInviteSchema = z.object({
  accept: z.boolean(),
});

export const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(TeamMemberRole),
});

export type CreateTeamBody = z.infer<typeof createTeamSchema>;
export type UpdateTeamBody = z.infer<typeof updateTeamSchema>;
export type InviteMemberBody = z.infer<typeof inviteMemberSchema>;
export type ProcessInviteBody = z.infer<typeof processInviteSchema>;
export type UpdateMemberRoleBody = z.infer<typeof updateMemberRoleSchema>;
