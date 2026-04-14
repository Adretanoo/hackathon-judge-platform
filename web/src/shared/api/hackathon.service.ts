import { authClient } from './auth-client';

export const HackathonStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  REGISTRATION_OPEN: 'REGISTRATION_OPEN',
  REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
  IN_PROGRESS: 'IN_PROGRESS',
  JUDGING: 'JUDGING',
  COMPLETED: 'COMPLETED',
  ARCHIVED: 'ARCHIVED',
} as const;

export type HackathonStatus = typeof HackathonStatus[keyof typeof HackathonStatus];

export interface Hackathon {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  status: HackathonStatus;
  startDate: string;
  endDate: string;
  bannerUrl?: string;
  minTeamSize: number;
  maxTeamSize: number;
  location?: string;
  isOnline: boolean;
  registrationDeadline?: string;
  websiteUrl?: string;
  stages?: Stage[];
  tracks?: Track[];
}

export interface Stage {
  id: string;
  name: string;
  description?: string;
  orderIndex: number;
  startDate: string;
  endDate: string;
  hackathonId: string;
}

export interface Track {
  id: string;
  name: string;
  description?: string;
  maxTeams?: number;
}

export interface Criteria {
  id: string;
  name: string;
  description?: string;
  weight: number;
  maxScore: number;
  trackId: string;
}

export interface JudgeAssignment {
  id: string;
  judge: {
    id: string;
    fullName: string;
    avatarUrl?: string;
    username: string;
  };
  trackId?: string;
}

const API_BASE = '/hackathons';

export const hackathonApi = {
  // ─── Hackathons ─────────────────────────────────────────────────────────────
  list: async (params?: { page?: number; limit?: number }) => {
    const { data } = await authClient.get(API_BASE, { params });
    return data.data; // { items, total, page, limit }
  },

  getById: async (id: string) => {
    const { data } = await authClient.get(`${API_BASE}/${id}`);
    return data.data;
  },

  create: async (payload: any) => {
    const { data } = await authClient.post(API_BASE, payload);
    return data.data;
  },

  update: async (id: string, payload: any) => {
    const { data } = await authClient.put(`${API_BASE}/${id}`, payload);
    return data.data;
  },

  changeStatus: async (id: string, status: HackathonStatus) => {
    const { data } = await authClient.patch(`${API_BASE}/${id}/status`, { status });
    return data.data;
  },

  // ─── Stages ──────────────────────────────────────────────────────────────────
  createStage: async (id: string, payload: any) => {
    const { data } = await authClient.post(`${API_BASE}/${id}/stages`, payload);
    return data.data;
  },

  updateStage: async (id: string, stageId: string, payload: any) => {
    const { data } = await authClient.put(`${API_BASE}/${id}/stages/${stageId}`, payload);
    return data.data;
  },

  deleteStage: async (id: string, stageId: string) => {
    const { data } = await authClient.delete(`${API_BASE}/${id}/stages/${stageId}`);
    return data.data;
  },

  reorderStages: async (hackathonId: string, stages: Array<{ id: string; orderIndex: number }>) => {
    // No dedicated reorder endpoint — update each stage's orderIndex individually in parallel
    await Promise.all(
      stages.map((s) =>
        authClient.put(`${API_BASE}/${hackathonId}/stages/${s.id}`, { orderIndex: s.orderIndex })
      )
    );
  },

  // ─── Tracks ──────────────────────────────────────────────────────────────────
  createTrack: async (id: string, payload: any) => {
    const { data } = await authClient.post(`${API_BASE}/${id}/tracks`, payload);
    return data.data;
  },

  updateTrack: async (id: string, trackId: string, payload: any) => {
    const { data } = await authClient.put(`${API_BASE}/${id}/tracks/${trackId}`, payload);
    return data.data;
  },

  deleteTrack: async (id: string, trackId: string) => {
    const { data } = await authClient.delete(`${API_BASE}/${id}/tracks/${trackId}`);
    return data.data;
  },

  getTracks: async (id: string) => {
    const { data } = await authClient.get(`${API_BASE}/${id}/tracks`);
    return data.data ?? [];
  },

  // ─── Criteria ────────────────────────────────────────────────────────────────
  listCriteria: async (id: string) => {
    const { data } = await authClient.get(`${API_BASE}/${id}/criteria`);
    return data.data;
  },

  getCriteria: async (id: string) => {
    const { data } = await authClient.get(`${API_BASE}/${id}/criteria`);
    return data.data ?? [];
  },

  createCriteria: async (id: string, payload: any) => {
    const { data } = await authClient.post(`${API_BASE}/${id}/criteria`, payload);
    return data.data;
  },

  deleteCriteria: async (hackathonId: string, criterionId: string) => {
    const { data } = await authClient.delete(`${API_BASE}/${hackathonId}/criteria/${criterionId}`);
    return data.data;
  },

  updateCriteria: async (
    hackathonId: string,
    criterionId: string,
    payload: { name?: string; description?: string; weight?: number; maxScore?: number }
  ) => {
    const { data } = await authClient.patch(`${API_BASE}/${hackathonId}/criteria/${criterionId}`, payload);
    return data.data;
  },

  // ─── Judges ──────────────────────────────────────────────────────────────────
  listJudges: async (id: string) => {
    const { data } = await authClient.get(`${API_BASE}/${id}/judges`);
    return data.data;
  },

  assignJudge: async (id: string, payload: { userId: string; trackId?: string; allowConflictOverride?: boolean }) => {
    const { data } = await authClient.post(`${API_BASE}/${id}/judges/assign`, payload);
    return data.data;
  },

  removeJudge: async (id: string, userId: string) => {
    const { data } = await authClient.delete(`${API_BASE}/${id}/judges/${userId}`);
    return data.data;
  },

  // ─── Leaderboard ─────────────────────────────────────────────────────────────
  getLeaderboard: async (id: string, trackId?: string) => {
    const { data } = await authClient.get(`${API_BASE}/${id}/leaderboard`, { params: { trackId } });
    return data.data;
  },

  // ─── Export ──────────────────────────────────────────────────────────────────
  getExportUrl: (id: string, type: 'csv' | 'pdf') => {
    // Returns full URL for direct download or browser navigation
    const baseURL = authClient.defaults.baseURL || '';
    return `${baseURL}${API_BASE}/${id}/export/${type}`;
  }
};
