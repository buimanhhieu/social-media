import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { commentApi, mediaApi, musicApi, postApi } from './endpoints';
import type { CreateCommentRequest, CreatePostRequest } from '../types';

const FEED_SIZE = 10;

export function useUserPosts(userId: number | undefined) {
  return useQuery({
    queryKey: ['userPosts', userId],
    queryFn: () => postApi.userPosts(userId!, 0, 30),
    enabled: !!userId,
  });
}

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => postApi.feed(pageParam, FEED_SIZE),
    getNextPageParam: (last) => (last.last ? undefined : last.page + 1),
  });
}

export function useExplore() {
  return useInfiniteQuery({
    queryKey: ['explore'],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => postApi.explore(pageParam, 24),
    getNextPageParam: (last) => (last.last ? undefined : last.page + 1),
  });
}

export function usePost(id: number) {
  return useQuery({
    queryKey: ['post', id],
    queryFn: () => postApi.getById(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}

export function useUploadMedia() {
  return useMutation({ mutationFn: (file: File) => mediaApi.upload(file) });
}

export function useMusicList() {
  return useQuery({ queryKey: ['music'], queryFn: musicApi.list });
}

export function useUploadMusic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ file, name }: { file: File; name: string }) => musicApi.upload(file, name),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['music'] }),
  });
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
  return useInfiniteQuery({
    queryKey: ['comments', postId],
    initialPageParam: 0,
    queryFn: ({ pageParam }) => commentApi.list(postId, pageParam, 20),
    getNextPageParam: (last) => (last.last ? undefined : last.page + 1),
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
