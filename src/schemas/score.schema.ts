/**
 * @file src/schemas/score.schema.ts
 * @description Zod schemas for scoring / judging endpoints.
 */

import { z } from 'zod';
import { uuidSchema } from './common';

// ─── Submit score ─────────────────────────────────────────────────────────────

export const submitScoreBodySchema = z.object({
  projectId: uuidSchema,
  criteriaId: uuidSchema,
  value: z
    .number({ required_error: 'Score value is required' })
    .min(0, 'Score must be >= 0')
    .max(10, 'Score must be <= 10'),
  comment: z.string().max(1000).trim().optional(),
});

// ─── Create criteria ──────────────────────────────────────────────────────────

export const createCriteriaBodySchema = z.object({
  hackathonId: uuidSchema,
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).trim().optional(),
  maxScore: z.number().min(1).max(100).default(10),
  weight: z.number().min(0).max(1).default(1),
});

export const updateCriteriaBodySchema = createCriteriaBodySchema
  .omit({ hackathonId: true })
  .partial();

// ─── Inferred types ───────────────────────────────────────────────────────────

export type SubmitScoreBody = z.infer<typeof submitScoreBodySchema>;
export type CreateCriteriaBody = z.infer<typeof createCriteriaBodySchema>;
export type UpdateCriteriaBody = z.infer<typeof updateCriteriaBodySchema>;
