import { create } from 'zustand';
import { tokenStorage } from '@shared/api/axios';

interface AuthState {
  accessToken: string | null;
  setAccessToken: (accessToken: string | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  accessToken: tokenStorage.getAccess(),
  setAccessToken: (accessToken) => set({ accessToken }),
  clear: () => set({ accessToken: null }),
}));
