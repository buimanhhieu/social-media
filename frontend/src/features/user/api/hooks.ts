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

export function useUserProfile(username: string | undefined) {
  return useQuery({
    queryKey: ['profile', username],
    queryFn: () => userApi.byUsername(username!),
    enabled: !!username,
  });
}

export function useSuggestions() {
  return useQuery({
    queryKey: ['suggestions'],
    queryFn: userApi.suggestions,
    enabled: !!tokenStorage.getAccess(),
  });
}

export function useSearchUsers(query: string) {
  const q = query.trim();
  return useQuery({
    queryKey: ['search', q],
    queryFn: () => userApi.search(q),
    enabled: q.length >= 1,
  });
}

function useFollowMutation(action: (userId: number) => Promise<void>) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: action,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['profile'] });
      qc.invalidateQueries({ queryKey: ['suggestions'] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useFollow() {
  return useFollowMutation(userApi.follow);
}

export function useUnfollow() {
  return useFollowMutation(userApi.unfollow);
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
