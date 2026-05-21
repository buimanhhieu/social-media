import { useMutation, useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@shared/api/axios';
import { authApi } from './endpoints';
import { useAuthStore } from '../stores/auth.store';
import type { AuthTokens } from '../types';

function storeTokens(tokens: AuthTokens) {
  tokenStorage.set(tokens.accessToken, tokens.refreshToken);
  useAuthStore.getState().setAccessToken(tokens.accessToken);
}

export function useRegister() {
  return useMutation({ mutationFn: authApi.register });
}

export function useResendRegisterOtp() {
  return useMutation({ mutationFn: authApi.resendRegisterOtp });
}

export function useVerifyEmail() {
  return useMutation({
    mutationFn: authApi.verifyEmail,
    onSuccess: storeTokens,
  });
}

export function useLogin() {
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: storeTokens,
  });
}

export function useLogout() {
  const qc = useQueryClient();
  const clear = useAuthStore((s) => s.clear);

  return useMutation({
    mutationFn: async () => {
      const refresh = tokenStorage.getRefresh();
      if (refresh) await authApi.logout(refresh);
    },
    onSettled: () => {
      tokenStorage.clear();
      clear();
      qc.clear();
    },
  });
}

export function useForgotPasswordRequestOtp() {
  return useMutation({ mutationFn: authApi.forgotPasswordRequestOtp });
}

export function useForgotPasswordVerifyOtp() {
  return useMutation({ mutationFn: authApi.forgotPasswordVerifyOtp });
}

export function useForgotPasswordReset() {
  return useMutation({ mutationFn: authApi.forgotPasswordReset });
}
