/**
 * @file participant.service.ts
 * @description API client for the Participant Panel (registration, my hackathons, status).
 */
import { authClient } from './auth-client';
import type { Hackathon } from './hackathon.service';

export interface ParticipationStatus {
  registered: boolean;
  role: 'CAPTAIN' | 'MEMBER' | null;
  team: {
    id: string;
    name: string;
    description: string | null;
    hackathonId: string;
    trackId: string | null;
    members: Array<{
      id: string;
      role: 'CAPTAIN' | 'MEMBER';
      userId: string;
      user: { id: string; fullName: string; username: string; avatarUrl: string | null };
    }>;
    project: {
      id: string;
      title: string;
      description: string | null;
      repoUrl: string | null;
      demoUrl: string | null;
      status: string;
    } | null;
  } | null;
  project: {
    id: string;
    title: string;
    status: string;
    repoUrl: string | null;
    demoUrl: string | null;
  } | null;
}

export const participantApi = {
  /** List hackathons where the current user is registered as PARTICIPANT */
  myHackathons: async (): Promise<Hackathon[]> => {
    const { data } = await authClient.get('/participant/hackathons');
    return data.data ?? [];
  },

  /** Get full participation context (team, project) for one hackathon */
  getStatus: async (hackathonId: string): Promise<ParticipationStatus> => {
    const { data } = await authClient.get(`/participant/hackathons/${hackathonId}/status`);
    return data.data ?? { registered: false, team: null, project: null };
  },

  leave: async (hackathonId: string) => {
    const { data } = await authClient.post(`/participant/hackathons/${hackathonId}/leave`);
    return data;
  },

  /** Register the current user as a participant */
  register: async (hackathonId: string): Promise<void> => {
    await authClient.post(`/hackathons/${hackathonId}/register`);
  },
};
