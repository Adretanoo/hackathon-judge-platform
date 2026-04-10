/**
 * @file src/schemas/hackathon.schema.ts
 * @description Zod schemas for Hackathon CRUD endpoints.
 */

import { z } from 'zod';
import { HackathonStatus } from '../types';
import { isoDateSchema, paginationSchema } from './common';

// ─── Create ───────────────────────────────────────────────────────────────────

/** Base object (without refinement) — used to derive the update schema */
const hackathonBaseSchema = z.object({
  title: z
    .string({ required_error: 'Title is required' })
    .min(3, 'Title must be at least 3 characters')
    .max(200, 'Title must be at most 200 characters')
    .trim(),
  description: z.string().max(5000).trim().optional(),
  startDate: isoDateSchema,
  endDate: isoDateSchema,
  maxTeamSize: z.coerce.number().int().min(1).max(10).default(4),
  maxProjects: z.coerce.number().int().min(1).optional(),
  isPublic: z.boolean().default(true),
});

/** Create schema with date-range refinement */
export const createHackathonBodySchema = hackathonBaseSchema.refine(
  (data) => new Date(data.endDate) > new Date(data.startDate),
  { message: 'endDate must be after startDate', path: ['endDate'] },
);

// ─── Update ───────────────────────────────────────────────────────────────────

/** Update schema — all fields optional, no cross-field refinement */
export const updateHackathonBodySchema = hackathonBaseSchema.partial();

// ─── Status transition ────────────────────────────────────────────────────────

export const hackathonStatusBodySchema = z.object({
  status: z.nativeEnum(HackathonStatus),
});

// ─── List query ───────────────────────────────────────────────────────────────

export const listHackathonsQuerySchema = paginationSchema.extend({
  status: z.nativeEnum(HackathonStatus).optional(),
  isPublic: z
    .string()
    .transform((v) => v === 'true')
    .optional(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateHackathonBody = z.infer<typeof createHackathonBodySchema>;
export type UpdateHackathonBody = z.infer<typeof updateHackathonBodySchema>;
export type HackathonStatusBody = z.infer<typeof hackathonStatusBodySchema>;
export type ListHackathonsQuery = z.infer<typeof listHackathonsQuerySchema>;
