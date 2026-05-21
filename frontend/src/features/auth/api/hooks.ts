import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@shared/api/axios';
import { authApi } from './endpoints';
import { useAuthStore } from '../stores/auth.store';

export const authKeys = {
  me: ['auth', 'me'] as const,
};

export function useCurrentUser() {
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: authKeys.me,
    queryFn: authApi.me,
    enabled: !!accessToken,
    staleTime: 5 * 60_000,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      tokenStorage.set(data.accessToken, data.refreshToken);
      setAuth(data.accessToken, data.user);
      qc.setQueryData(authKeys.me, data.user);
    },
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const clear = useAuthStore((s) => s.clear);

  return useMutation({
    mutationFn: authApi.logout,
    onSettled: () => {
      tokenStorage.clear();
      clear();
      qc.clear();
    },
  });
}
