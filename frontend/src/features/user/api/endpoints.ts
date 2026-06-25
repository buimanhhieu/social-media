import { apiClient } from '@shared/api/axios';
import type { UserSummary } from '../types';

export const userApi = {
  me: () => apiClient.get<UserSummary>('/api/users/me').then((r) => r.data),
};
