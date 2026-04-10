/**
 * @file src/schemas/config.schema.ts
 * @description Zod schemas for System Config endpoints (Global Admin).
 */

import { z } from 'zod';

export const updateConfigSchema = z.object({
  configs: z.array(z.object({
    key: z.string(),
    value: z.any()
  }))
});

export type UpdateConfigBody = z.infer<typeof updateConfigSchema>;
