import { apiClient } from '@shared/api/axios';
import type { UpdateProfileRequest, UserProfile, UserSummary } from '../types';

interface UploadedMedia {
  id: number;
  url: string;
}

export const userApi = {
  me: () => apiClient.get<UserProfile>('/api/users/me').then((r) => r.data),

  byUsername: (username: string) =>
    apiClient.get<UserProfile>(`/api/users/${username}`).then((r) => r.data),

  suggestions: () =>
    apiClient.get<UserSummary[]>('/api/users/suggestions').then((r) => r.data),

  search: (q: string) =>
    apiClient.get<UserSummary[]>('/api/users/search', { params: { q } }).then((r) => r.data),

  follow: (userId: number) => apiClient.post<void>(`/api/users/${userId}/follow`).then((r) => r.data),

  unfollow: (userId: number) =>
    apiClient.delete<void>(`/api/users/${userId}/follow`).then((r) => r.data),

  updateProfile: (body: UpdateProfileRequest) =>
    apiClient.patch<UserProfile>('/api/users/me', body).then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('context', 'AVATAR');
    return apiClient.post<UploadedMedia>('/api/media', form).then((r) => r.data);
  },
};
