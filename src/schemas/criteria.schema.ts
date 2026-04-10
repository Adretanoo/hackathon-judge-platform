import { z } from 'zod';
import { cuidSchema, paginationSchema } from './common';

export const createCriteriaSchema = z.object({
  trackId: cuidSchema,
  name: z.string().min(3).max(100),
  description: z.string().max(500).optional(),
  weight: z.number().min(0.1).max(10).default(1.0),
  maxScore: z.number().min(1).max(100).default(10),
});
export type CreateCriteriaPayload = z.infer<typeof createCriteriaSchema>;

export const updateCriteriaSchema = z.object({
  name: z.string().min(3).max(100).optional(),
  description: z.string().max(500).optional(),
  weight: z.number().min(0.1).max(10).optional(),
  maxScore: z.number().min(1).max(100).optional(),
});
export type UpdateCriteriaPayload = z.infer<typeof updateCriteriaSchema>;

export const listCriteriaSchema = z.object({
  querystring: paginationSchema.extend({
    trackId: cuidSchema.optional(),
  }),
});
