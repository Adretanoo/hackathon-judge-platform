import { authClient as api } from './auth-client';

export interface JudgingStats {
  mean: number;
  stdDev: number;
  count: number;
}

export interface JudgingProject {
  id: string;
  title: string;
  description: string;
  status: string;
  team: {
    id: string;
    name: string;
    hackathonId: string;
    trackId: string | null;
  };
  scores: Array<{
    id: string;
    scoreValue: number;
    criteriaId: string;
  }>;
}

export const judgingApi = {
  listHackathons: async () => {
    const { data } = await api.get<{ success: boolean; data: any[] }>('/judging/hackathons');
    return data.data;
  },

  listProjects: async (hackathonId: string) => {
    const { data } = await api.get<{ success: boolean; data: { items: JudgingProject[] } }>(
      `/judging/projects?hackathonId=${hackathonId}`
    );
    return data.data.items;
  },

  getStats: async () => {
    const { data } = await api.get<{ success: boolean; data: JudgingStats }>('/judging/stats');
    return data.data;
  },

  submitScores: async (projectId: string, scores: Array<{ criteriaId: string; scoreValue: number; comment?: string }>) => {
    const { data } = await api.post<{ success: boolean; data: any }>(
      `/projects/${projectId}/scores`,
      { scores }
    );
    return data.data;
  },
  
  getConflicts: async (hackathonId: string) => {
    const { data } = await api.get<{ success: boolean; data: any[] }>(`/hackathons/${hackathonId}/conflicts`);
    return data.data;
  }
};
