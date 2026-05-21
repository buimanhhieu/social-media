import { create } from 'zustand';
import { tokenStorage } from '@shared/api/axios';
import type { AuthUser } from '../types';

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setAuth: (accessToken: string, user: AuthUser) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: tokenStorage.getAccess(),
  user: null,
  setAuth: (accessToken, user) => set({ accessToken, user }),
  clear: () => set({ accessToken: null, user: null }),
}));
