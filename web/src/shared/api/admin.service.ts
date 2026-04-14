/**
 * @file src/shared/api/admin.service.ts
 * @description Centralized API service for GLOBAL_ADMIN operations.
 */

import { authClient } from './auth-client';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AdminStats {
  hackathons: { total: number; active: number; draft: number };
  users: { total: number; newThisWeek: number };
  teams: { total: number };
  projects: { total: number; submitted: number };
}

export interface AdminHackathon {
  id: string;
  title: string;
  status: string;
  startDate: string;
  endDate: string;
  organizerId: string;
  organizer?: { fullName: string };
  _count?: { teams: number; userRoles: number };
}

export interface AdminTeam {
  id: string;
  name: string;
  description?: string;
  status: string;
  isOpen: boolean;
  hackathonId: string;
  hackathon?: { title: string };
  members?: { id: string; role: string; user: { fullName: string; email: string } }[];
  _count?: { members: number; projects: number };
}

export interface AdminProject {
  id: string;
  title: string;
  description?: string;
  status: string;
  repoUrl?: string;
  demoUrl?: string;
  videoUrl?: string;
  submittedAt?: string;
  averageScore?: number;
  teamId: string;
  team?: { name: string; hackathon?: { title: string } };
}

export interface AdminConflict {
  id: string;
  judgeId: string;
  teamId: string;
  type: string;
  reason?: string;
  overridden: boolean;
  overrideReason?: string;
  judge?: { fullName: string; email: string };
  team?: { name: string };
}

// ─── Admin API ────────────────────────────────────────────────────────────────

export const adminApi = {
  // ─── Dashboard Stats ─────────────────────────────────────────────────────────
  getStats: async (): Promise<AdminStats> => {
    // Parallel queries for all stats
    const [hackathonsRes, usersRes, projectsRes] = await Promise.allSettled([
      authClient.get('/hackathons', { params: { limit: 100, showAll: 'true' } }),
      authClient.get('/users', { params: { limit: 1 } }),
      authClient.get('/projects', { params: { limit: 1 } }),
    ]);

    const hackathonsData = hackathonsRes.status === 'fulfilled' ? hackathonsRes.value.data.data : { total: 0, items: [] };
    const usersData = usersRes.status === 'fulfilled' ? usersRes.value.data.data : { total: 0 };
    const projectsData = projectsRes.status === 'fulfilled' ? projectsRes.value.data.data : { total: 0 };

    const items: any[] = hackathonsData?.items || [];
    const active = items.filter((h: any) => ['IN_PROGRESS', 'JUDGING', 'REGISTRATION_OPEN'].includes(h.status)).length;
    const draft = items.filter((h: any) => h.status === 'DRAFT').length;

    return {
      hackathons: {
        total: hackathonsData?.total || 0,
        active,
        draft,
      },
      users: {
        total: usersData?.total || 0,
        newThisWeek: 0,
      },
      teams: {
        total: 0,
      },
      projects: {
        total: projectsData?.total || 0,
        submitted: 0,
      },
    };
  },

  // ─── Hackathons (Admin) ───────────────────────────────────────────────────────
  listHackathons: async (params?: { page?: number; limit?: number; search?: string }) => {
    const { data } = await authClient.get('/hackathons', {
      params: { ...params, limit: params?.limit ?? 50, showAll: 'true' },
    });
    return data.data;
  },

  createHackathon: async (payload: any) => {
    const { data } = await authClient.post('/hackathons', payload);
    return data.data;
  },

  updateHackathon: async (id: string, payload: any) => {
    const { data } = await authClient.put(`/hackathons/${id}`, payload);
    return data.data;
  },

  deleteHackathon: async (id: string) => {
    const { data } = await authClient.delete(`/hackathons/${id}`);
    return data.data;
  },

  changeHackathonStatus: async (id: string, status: string) => {
    const { data } = await authClient.patch(`/hackathons/${id}/status`, { status });
    return data.data;
  },

  // ─── Teams (Admin) ────────────────────────────────────────────────────────────
  listTeams: async (hackathonId: string, params?: { page?: number }) => {
    const { data } = await authClient.get(`/hackathons/${hackathonId}/teams`, { params });
    return data.data;
  },

  getTeam: async (teamId: string) => {
    const { data } = await authClient.get(`/teams/${teamId}`);
    return data.data;
  },

  updateTeamStatus: async (teamId: string, status: string) => {
    const { data } = await authClient.patch(`/teams/${teamId}`, { status });
    return data.data;
  },

  // ─── Projects (Admin) ─────────────────────────────────────────────────────────
  listProjects: async (params?: { status?: string; page?: number; limit?: number }) => {
    const { data } = await authClient.get('/projects', { params });
    return data.data;
  },

  updateProjectStatus: async (projectId: string, status: string) => {
    const { data } = await authClient.patch(`/projects/${projectId}/status`, { status });
    return data.data;
  },

  // ─── Conflicts (Admin) ────────────────────────────────────────────────────────
  listConflicts: async (hackathonId: string) => {
    const { data } = await authClient.get(`/hackathons/${hackathonId}/conflicts`);
    return data.data;
  },

  overrideConflict: async (hackathonId: string, conflictId: string, overrideReason: string) => {
    const { data } = await authClient.patch(
      `/hackathons/${hackathonId}/conflicts/${conflictId}/override`,
      { overrideReason }
    );
    return data.data;
  },

  // ─── Judges (Admin) ───────────────────────────────────────────────────────────
  listJudges: async (hackathonId: string) => {
    const { data } = await authClient.get(`/hackathons/${hackathonId}/judges`);
    return data.data;
  },

  // ─── Leaderboard (Admin) ─────────────────────────────────────────────────────
  getLeaderboard: async (hackathonId: string, trackId?: string) => {
    const { data } = await authClient.get(`/hackathons/${hackathonId}/leaderboard`, {
      params: trackId ? { trackId } : undefined,
    });
    return data.data;
  },

  // ─── Export (Admin) ───────────────────────────────────────────────────────────
  getExportUrl: (hackathonId: string, type: 'csv' | 'pdf') => {
    const baseURL = authClient.defaults.baseURL || '';
    return `${baseURL}/hackathons/${hackathonId}/export/${type}`;
  },
};
