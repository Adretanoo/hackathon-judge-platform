import { z } from 'zod';
import { cuidSchema } from './common';

export const scoreItemSchema = z.object({
  criteriaId: cuidSchema,
  scoreValue: z.number().min(0),
  comment: z.string().max(2000).optional(),
});

export const submitScoresSchema = z.object({
  scores: z.array(scoreItemSchema).min(1),
});
export type SubmitScoresPayload = z.infer<typeof submitScoresSchema>;
