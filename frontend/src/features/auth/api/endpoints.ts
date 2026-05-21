import { apiClient } from '@shared/api/axios';
import type { AuthUser, LoginRequest, LoginResponse, RegisterRequest } from '../types';

export const authApi = {
  login: (body: LoginRequest) =>
    apiClient.post<LoginResponse>('/api/auth/login', body).then((r) => r.data),

  register: (body: RegisterRequest) =>
    apiClient.post<LoginResponse>('/api/auth/register', body).then((r) => r.data),

  logout: () => apiClient.post<void>('/api/auth/logout').then((r) => r.data),

  me: () => apiClient.get<AuthUser>('/api/auth/me').then((r) => r.data),
};
