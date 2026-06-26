import { apiClient } from '@shared/api/axios';
import type { PageResponse } from '@shared/api/types';
import type {
  CommentResponse,
  CreateCommentRequest,
  CreatePostRequest,
  MediaResponse,
  MusicTrack,
  PostResponse,
  PostSummary,
} from '../types';

export const postApi = {
  feed: (page = 0, size = 10) =>
    apiClient
      .get<PageResponse<PostResponse>>('/api/feed', { params: { page, size } })
      .then((r) => r.data),

  explore: (page = 0, size = 24) =>
    apiClient
      .get<PageResponse<PostSummary>>('/api/posts/explore', { params: { page, size } })
      .then((r) => r.data),

  getById: (id: number) =>
    apiClient.get<PostResponse>(`/api/posts/${id}`).then((r) => r.data),

  create: (body: CreatePostRequest) =>
    apiClient.post<PostResponse>('/api/posts', body).then((r) => r.data),

  remove: (id: number) => apiClient.delete<void>(`/api/posts/${id}`).then((r) => r.data),

  like: (id: number) =>
    apiClient.post<PostResponse>(`/api/posts/${id}/like`).then((r) => r.data),

  unlike: (id: number) =>
    apiClient.delete<PostResponse>(`/api/posts/${id}/like`).then((r) => r.data),

  userPosts: (userId: number, page = 0, size = 12) =>
    apiClient
      .get<PageResponse<PostSummary>>(`/api/users/${userId}/posts`, { params: { page, size } })
      .then((r) => r.data),
};

export const mediaApi = {
  upload: (file: File, context = 'POST') => {
    const form = new FormData();
    form.append('file', file);
    form.append('context', context);
    return apiClient.post<MediaResponse>('/api/media', form).then((r) => r.data);
  },
};

export const musicApi = {
  explore: (q?: string) =>
    apiClient.get<MusicTrack[]>('/api/music', { params: q ? { q } : {} }).then((r) => r.data),

  suggested: () => apiClient.get<MusicTrack[]>('/api/music/suggested').then((r) => r.data),

  saved: () => apiClient.get<MusicTrack[]>('/api/music/saved').then((r) => r.data),

  save: (id: number) => apiClient.post<void>(`/api/music/${id}/save`).then((r) => r.data),

  unsave: (id: number) => apiClient.delete<void>(`/api/music/${id}/save`).then((r) => r.data),

  upload: (file: File, name: string) => {
    const form = new FormData();
    form.append('file', file);
    form.append('name', name);
    return apiClient.post<MusicTrack>('/api/music', form).then((r) => r.data);
  },
};

export const commentApi = {
  list: (postId: number, page = 0, size = 50) =>
    apiClient
      .get<PageResponse<CommentResponse>>(`/api/posts/${postId}/comments`, { params: { page, size } })
      .then((r) => r.data),

  add: (postId: number, body: CreateCommentRequest) =>
    apiClient
      .post<CommentResponse>(`/api/posts/${postId}/comments`, body)
      .then((r) => r.data),

  remove: (commentId: number) =>
    apiClient.delete<void>(`/api/comments/${commentId}`).then((r) => r.data),
};
