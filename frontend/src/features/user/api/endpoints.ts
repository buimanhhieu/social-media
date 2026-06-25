import { apiClient } from '@shared/api/axios';
import type { UpdateProfileRequest, UserProfile } from '../types';

interface UploadedMedia {
  id: number;
  url: string;
}

export const userApi = {
  me: () => apiClient.get<UserProfile>('/api/users/me').then((r) => r.data),

  updateProfile: (body: UpdateProfileRequest) =>
    apiClient.patch<UserProfile>('/api/users/me', body).then((r) => r.data),

  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    form.append('context', 'AVATAR');
    return apiClient.post<UploadedMedia>('/api/media', form).then((r) => r.data);
  },
};
