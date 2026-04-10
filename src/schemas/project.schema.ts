/**
 * @file src/schemas/project.schema.ts
 * @description Zod schemas for Project submission endpoints.
 */

import { z } from 'zod';
import { ProjectStatus } from '../types';
import { paginationSchema, uuidSchema } from './common';

// ─── Create ───────────────────────────────────────────────────────────────────

export const createProjectBodySchema = z.object({
  hackathonId: uuidSchema,
  title: z
    .string({ required_error: 'Title is required' })
    .min(3)
    .max(200)
    .trim(),
  description: z.string().max(10_000).trim().optional(),
  repoUrl: z.string().url('Must be a valid URL').optional(),
  demoUrl: z.string().url('Must be a valid URL').optional(),
  techStack: z.array(z.string().trim()).max(20).default([]),
  teamName: z.string().max(100).trim().optional(),
});

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateProjectBodySchema = createProjectBodySchema
  .omit({ hackathonId: true })
  .partial();

// ─── List query ───────────────────────────────────────────────────────────────

export const listProjectsQuerySchema = paginationSchema.extend({
  hackathonId: uuidSchema.optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  teamName: z.string().trim().optional(),
});

// ─── Inferred types ───────────────────────────────────────────────────────────

export type CreateProjectBody = z.infer<typeof createProjectBodySchema>;
export type UpdateProjectBody = z.infer<typeof updateProjectBodySchema>;
export type ListProjectsQuery = z.infer<typeof listProjectsQuerySchema>;
