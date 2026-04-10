/**
 * @file src/schemas/common.ts
 * @description Shared, reusable Zod schemas for pagination, UUIDs, timestamps, etc.
 */

import { z } from 'zod';

/** UUID v4 string */
export const uuidSchema = z
  .string({ required_error: 'ID is required' })
  .uuid('Must be a valid UUID');

/** CUID string (used by Prisma default) */
export const cuidSchema = z
  .string({ required_error: 'ID is required' })
  .cuid('Must be a valid CUID');

/** Route params with a single :id as UUID */
export const idParamSchema = z.object({
  id: uuidSchema,
});

/** Route params with a single :id as CUID */
export const idParamCuidSchema = z.object({
  id: cuidSchema,
});


/** Pagination query params */
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
});

/** ISO date string */
export const isoDateSchema = z
  .string()
  .datetime({ message: 'Must be a valid ISO 8601 datetime string' });

/** Generic success message response */
export const messageResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    message: z.string(),
  }),
});

export type IdParam = z.infer<typeof idParamSchema>;
export type PaginationQuery = z.infer<typeof paginationSchema>;
