import { authClient } from './auth-client';

export type TeamStatus = 'FORMING' | 'COMPLETE' | 'SUBMITTED' | 'DISQUALIFIED';
export type TeamMemberRole = 'CAPTAIN' | 'MEMBER';

export interface TeamMember {
  id: string;
  userId: string;
  role: TeamMemberRole;
  user: {
    username: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  logoUrl: string | null;
  status: TeamStatus;
  hackathonId: string;
  trackId: string | null;
  members?: TeamMember[];
}

export interface FreeAgent {
  id: string;
  username: string;
  fullName: string;
  avatarUrl: string | null;
  skills: string[];
  bio: string | null;
}

export const teamApi = {
  // ─── Hackathon Scoped ───────────────────────────────────────────────────────
  list: async (hackathonId: string, params?: { trackId?: string; page?: number; limit?: number }) => {
    const { data } = await authClient.get(`/hackathons/${hackathonId}/teams`, { params });
    return Array.isArray(data.data) ? { items: data.data, ...(data.meta || {}) } : data.data;
  },

  create: async (hackathonId: string, payload: { name: string; description?: string; trackId?: string; logoUrl?: string }) => {
    const { data } = await authClient.post(`/hackathons/${hackathonId}/teams`, payload);
    return data.data;
  },

  listFreeAgents: async (hackathonId: string, params?: { skills?: string; page?: number; limit?: number }) => {
    const { data } = await authClient.get(`/hackathons/${hackathonId}/free-agents`, { params });
    return Array.isArray(data.data) ? { items: data.data, ...(data.meta || {}) } : data.data;
  },

  // ─── Team Specific ──────────────────────────────────────────────────────────
  getById: async (teamId: string) => {
    const { data } = await authClient.get(`/teams/${teamId}`);
    return data.data;
  },

  update: async (teamId: string, payload: Partial<{ name: string; description: string; trackId: string; logoUrl: string }>) => {
    const { data } = await authClient.patch(`/teams/${teamId}`, payload);
    return data.data;
  },

  generateInvite: async (teamId: string, payload?: { expiresInMinutes?: number; maxUses?: number }) => {
    const { data } = await authClient.post(`/teams/${teamId}/invite`, payload || {});
    return data.data; // { token, expiresAt }
  },

  join: async (token: string) => {
    const { data } = await authClient.post(`/teams/join/${token}`);
    return data.data;
  },

  removeMember: async (teamId: string, userId: string) => {
    const { data } = await authClient.delete(`/teams/${teamId}/members/${userId}`);
    return data.data;
  },

  leave: async (teamId: string) => {
    const { data } = await authClient.post(`/teams/${teamId}/leave`);
    return data.data;
  },

  transferCaptaincy: async (teamId: string, newCaptainId: string) => {
    const { data } = await authClient.post(`/teams/${teamId}/transfer-captain`, { newCaptainId });
    return data.data;
  },

  /**
   * Disqualify a team (organizer only).
   * Sets team.status = DISQUALIFIED.
   */
  disqualify: async (teamId: string) => {
    const { data } = await authClient.patch(`/teams/${teamId}/disqualify`);
    return data.data;
  },
};
