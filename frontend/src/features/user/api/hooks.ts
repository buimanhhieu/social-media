import { useQuery } from '@tanstack/react-query';
import { tokenStorage } from '@shared/api/axios';
import { userApi } from './endpoints';

export function useCurrentUser() {
  return useQuery({
    queryKey: ['me'],
    queryFn: userApi.me,
    enabled: !!tokenStorage.getAccess(),
    staleTime: 5 * 60_000,
  });
}
