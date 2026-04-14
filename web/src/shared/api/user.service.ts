import { authClient } from './auth-client';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: string;
  avatarUrl?: string;
  bio?: string;
  skills?: string[];
  isVerified?: boolean;
  createdAt: string;
}

export const userApi = {
  getMe: async (): Promise<UserProfile> => {
    const res = await authClient.get('/users/me');
    return res.data.data;
  },

  updateMe: async (data: Partial<UserProfile>): Promise<UserProfile> => {
    const res = await authClient.patch(`/users/me`, data);
    return res.data.data;
  },
};
