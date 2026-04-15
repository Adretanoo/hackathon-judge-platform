import { authClient as api } from './auth-client';

export type ProjectStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'REVIEWED' | 'WINNER' | 'ARCHIVED';

export interface ProjectResource {
  id: string;
  label: string;
  url: string;
}

export interface Project {
  id: string;
  teamId: string;
  title: string;
  description: string | null;
  repoUrl: string | null;
  demoUrl: string | null;
  videoUrl: string | null;
  techStack: string[];
  status: ProjectStatus;
  averageScore: number;
  totalScore: number;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
  team?: {
    id: string;
    name: string;
    hackathonId: string;
    trackId: string | null;
  };
  resources?: ProjectResource[];
}

export interface ListProjectsParams {
  page?: number;
  limit?: number;
  teamId?: string;
  hackathonId?: string;
  status?: ProjectStatus;
  judgeId?: string;
}

export const projectApi = {
  list: async (params: ListProjectsParams = {}) => {
    const response = await api.get('/projects', { params });
    const payload = response.data as any;
    return Array.isArray(payload.data) ? { items: payload.data, ...(payload.meta || {}) } : payload.data;
  },

  getById: async (id: string) => {
    const response = await api.get<{ data: Project }>(`/projects/${id}`);
    return response.data.data;
  },

  create: async (payload: {
    teamId: string;
    title: string;
    description?: string;
    repoUrl?: string;
    demoUrl?: string;
    videoUrl?: string;
    techStack?: string[];
    resources?: { label: string; url: string }[];
  }) => {
    const response = await api.post<{ data: Project }>('/projects', payload);
    return response.data.data;
  },

  update: async (id: string, payload: {
    title?: string;
    description?: string;
    repoUrl?: string;
    demoUrl?: string;
    videoUrl?: string;
    techStack?: string[];
    resources?: { label: string; url: string }[];
  }) => {
    const response = await api.put<{ data: Project }>(`/projects/${id}`, payload);
    return response.data.data;
  },

  changeStatus: async (id: string, status: ProjectStatus) => {
    const response = await api.patch<{ data: Project }>(`/projects/${id}/status`, { status });
    return response.data.data;
  },

  getCriteria: async (projectId: string) => {
    const response = await api.get<{ data: any[] }>(`/projects/${projectId}/criteria`);
    return response.data.data;
  },

  getScores: async (projectId: string) => {
    const response = await api.get<{ data: any }>(`/projects/${projectId}/scores`);
    return response.data.data;
  }
};
