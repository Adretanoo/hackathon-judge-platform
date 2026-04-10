/**
 * @file src/schemas/hackathon.schema.ts
 * @description Zod validation schemas for Hackathons, Stages, Tracks, and Awards.
 */

import { z } from 'zod';
import { HackathonStatus } from '@prisma/client';

// ─── Hackathons ─────────────────────────────────────────────────────────────

export const createHackathonSchema = z.object({
  title: z.string().min(3).max(100),
  subtitle: z.string().max(200).optional(),
  description: z.string().optional(),
  isOnline: z.boolean().default(true),
  location: z.string().optional(),
  bannerUrl: z.string().url().optional(),
  websiteUrl: z.string().url().optional(),
  minTeamSize: z.number().int().min(1).default(1),
  maxTeamSize: z.number().int().min(1).default(5),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  registrationDeadline: z.string().datetime().optional(),
});

export const updateHackathonSchema = createHackathonSchema.partial();

export const changeHackathonStatusSchema = z.object({
  status: z.nativeEnum(HackathonStatus),
});

// ─── Stages ──────────────────────────────────────────────────────────────────

export const createStageSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  orderIndex: z.number().int().min(0),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const updateStageSchema = createStageSchema.partial();

// ─── Tracks ──────────────────────────────────────────────────────────────────

export const createTrackSchema = z.object({
  name: z.string().min(2).max(100),
  description: z.string().optional(),
  maxTeams: z.number().int().min(1).optional(),
});

export const updateTrackSchema = createTrackSchema.partial();

// ─── Awards ──────────────────────────────────────────────────────────────────

export const createAwardSchema = z.object({
  title: z.string().min(2).max(100),
  description: z.string().optional(),
  prize: z.string().optional(),
  rank: z.number().int().min(1).optional(),
});

export const updateAwardSchema = createAwardSchema.partial();

// ─── Inferred Types ─────────────────────────────────────────────────────────

export type CreateHackathonBody = z.infer<typeof createHackathonSchema>;
export type UpdateHackathonBody = z.infer<typeof updateHackathonSchema>;
export type ChangeHackathonStatusBody = z.infer<typeof changeHackathonStatusSchema>;

export type CreateStageBody = z.infer<typeof createStageSchema>;
export type UpdateStageBody = z.infer<typeof updateStageSchema>;

export type CreateTrackBody = z.infer<typeof createTrackSchema>;
export type UpdateTrackBody = z.infer<typeof updateTrackSchema>;

export type CreateAwardBody = z.infer<typeof createAwardSchema>;
export type UpdateAwardBody = z.infer<typeof updateAwardSchema>;
