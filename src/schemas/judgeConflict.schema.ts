/**
 * @file src/schemas/judgeConflict.schema.ts
 * @description Zod validation schemas for Judge conflicts.
 */

import { z } from 'zod';

export const overrideConflictSchema = z.object({
  overrideReason: z.string().min(5).max(500),
});

export type OverrideConflictBody = z.infer<typeof overrideConflictSchema>;
