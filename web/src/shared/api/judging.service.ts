/**
 * @file judging.service.ts
 * @description API client for the Judge Panel (assignments, scores, stats)
 */
import { authClient } from './auth-client';

export interface JudgingHackathon {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
}

export interface JudgingProject {
  id: string;
  title: string;
  status: string;
  team?: { name: string; trackId?: string };
  repoUrl?: string;
  demoUrl?: string;
  description?: string;
  hasConflict?: boolean;
  isScored?: boolean;
  myScore?: number | null;
}

export interface ProjectCriterion {
  id: string;
  name: string;
  description?: string;
  weight: number;
  maxScore: number;
  orderIndex?: number;
}

export interface ScoreItem {
  criteriaId: string;
  scoreValue: number;
  comment?: string;
}

export interface JudgeStats {
  totalAssigned: number;
  totalScored: number;
  pendingCount: number;
  averageScore?: number;
}

export const judgingApi = {
  /** List hackathons where the current user is assigned as a judge */
  listMyHackathons: async (): Promise<JudgingHackathon[]> => {
    const { data } = await authClient.get('/judging/hackathons');
    return data.data ?? [];
  },

  /** List projects assigned to me for a given hackathon */
  listMyProjects: async (hackathonId: string): Promise<{ items: JudgingProject[]; total: number }> => {
    const { data } = await authClient.get('/judging/projects', {
      params: { hackathonId },
    });
    return data.data ?? { items: [], total: 0 };
  },

  /** Get the criteria sheet for a project (derived from team's track) */
  getProjectCriteria: async (projectId: string): Promise<ProjectCriterion[]> => {
    const { data } = await authClient.get(`/projects/${projectId}/criteria`);
    return data.data ?? [];
  },

  /** Get a single project's full details */
  getProjectDetail: async (projectId: string): Promise<any> => {
    const { data } = await authClient.get(`/projects/${projectId}`);
    return data.data;
  },

  /** Get my existing scores for a project */
  getMyScores: async (projectId: string, judgeId: string): Promise<ScoreItem[]> => {
    const { data } = await authClient.get(`/projects/${projectId}/scores`, {
      params: { judgeId },
    });
    // Normalize: return raw score items if present
    return data.data?.scores ?? data.data ?? [];
  },

  /** Submit (or update) scores for a project */
  submitScores: async (projectId: string, scores: ScoreItem[]): Promise<any> => {
    const { data } = await authClient.post(`/projects/${projectId}/scores`, { scores });
    return data.data;
  },

  /** Get judge statistics (total assigned, scored, pending) */
  getStats: async (): Promise<JudgeStats> => {
    const { data } = await authClient.get('/judging/stats');
    return data.data ?? { totalAssigned: 0, totalScored: 0, pendingCount: 0 };
  },
};
