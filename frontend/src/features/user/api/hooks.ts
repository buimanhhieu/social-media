import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { tokenStorage } from '@shared/api/axios';
import { userApi } from './endpoints';
import type { UpdateProfileRequest } from '../types';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: userApi.me,
    enabled: !!tokenStorage.getAccess(),
    staleTime: 5 * 60_000,
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateProfileRequest) => userApi.updateProfile(body),
    onSuccess: (profile) => qc.setQueryData(['me'], profile),
  });
}

export function useUploadAvatar() {
  return useMutation({ mutationFn: (file: File) => userApi.uploadAvatar(file) });
}
