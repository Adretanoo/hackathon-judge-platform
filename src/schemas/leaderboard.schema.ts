/**
 * @file src/schemas/leaderboard.schema.ts
 * @description Zod schemas for the leaderboard responses.
 */

import { z } from 'zod';
import { cuidSchema } from './common';

export const projectLeaderboardEntrySchema = z.object({
  projectId: cuidSchema,
  projectTitle: z.string(),
  teamName: z.string(),
  totalRawScore: z.number(),
  averageRawScore: z.number(),
  normalizedScore: z.number(),
  rank: z.number(),
});

export const leaderboardResponseSchema = z.object({
  hackathonId: cuidSchema,
  trackId: cuidSchema.optional(),
  lastUpdated: z.string().datetime(),
  entries: z.array(projectLeaderboardEntrySchema),
});

export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;
export type ProjectLeaderboardEntry = z.infer<typeof projectLeaderboardEntrySchema>;
