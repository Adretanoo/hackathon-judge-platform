import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';
import { cuidSchema, paginationSchema } from './common';

export const projectResourceSchema = z.object({
  label: z.string().min(1).max(50),
  url: z.string().url().max(255),
});

export const createProjectSchema = z.object({
  teamId: cuidSchema,
  title: z.string().min(3).max(100),
  description: z.string().max(2000).optional(),
  repoUrl: z.string().url().max(255).optional().or(z.literal('')),
  demoUrl: z.string().url().max(255).optional().or(z.literal('')),
  videoUrl: z.string().url().max(255).optional().or(z.literal('')),
  techStack: z.array(z.string()).max(20).optional(),
  resources: z.array(projectResourceSchema).max(10).optional(),
});
export type CreateProjectPayload = z.infer<typeof createProjectSchema>;

export const updateProjectSchema = z.object({
  title: z.string().min(3).max(100).optional(),
  description: z.string().max(2000).optional(),
  repoUrl: z.string().url().max(255).optional().or(z.literal('')),
  demoUrl: z.string().url().max(255).optional().or(z.literal('')),
  videoUrl: z.string().url().max(255).optional().or(z.literal('')),
  techStack: z.array(z.string()).max(20).optional(),
  resources: z.array(projectResourceSchema).max(10).optional(),
});
export type UpdateProjectPayload = z.infer<typeof updateProjectSchema>;

export const changeProjectStatusSchema = z.object({
  status: z.nativeEnum(ProjectStatus),
});
export type ChangeProjectStatusPayload = z.infer<typeof changeProjectStatusSchema>;

export const listProjectsSchema = z.object({
  querystring: paginationSchema.extend({
    teamId: cuidSchema.optional(),
    hackathonId: cuidSchema.optional(),
    status: z.nativeEnum(ProjectStatus).optional(),
  }),
});
