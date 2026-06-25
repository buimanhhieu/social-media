import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query';
import { commentApi, mediaApi, postApi } from './endpoints';
import type { CreateCommentRequest, CreatePostRequest } from '../types';

const FEED_SIZE = 10;

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => postApi.feed(pageParam, FEED_SIZE),
    getNextPageParam: (last) => (last.last ? undefined : last.page + 1),
  });
}

export function useUploadMedia() {
  return useMutation({ mutationFn: (file: File) => mediaApi.upload(file) });
}

export function useCreatePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreatePostRequest) => postApi.create(body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feed'] }),
  });
}

export function useLikePost() {
  return useMutation({ mutationFn: (id: number) => postApi.like(id) });
}

export function useUnlikePost() {
  return useMutation({ mutationFn: (id: number) => postApi.unlike(id) });
}

export function usePostComments(postId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['comments', postId],
    queryFn: () => commentApi.list(postId),
    enabled,
  });
}

export function useAddComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: CreateCommentRequest) => commentApi.add(postId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}

export function useDeleteComment(postId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (commentId: number) => commentApi.remove(commentId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['comments', postId] });
      qc.invalidateQueries({ queryKey: ['feed'] });
    },
  });
}
