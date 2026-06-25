import type { UserSummary } from '@features/user';

export type PostType = 'IMAGE' | 'VIDEO' | 'REEL';

export interface MediaItem {
  url: string;
  thumbnailUrl: string | null;
  type: string;
}

export interface MediaResponse {
  id: number;
  url: string;
  thumbnailUrl: string | null;
  type: PostType;
  width: number | null;
  height: number | null;
}

export interface PostResponse {
  id: number;
  caption: string | null;
  type: PostType;
  location: string | null;
  author: UserSummary;
  media: MediaItem[];
  likeCount: number;
  commentCount: number;
  likedByMe: boolean;
  createdAt: string;
}

export interface PostSummary {
  id: number;
  thumbnailUrl: string;
  type: PostType;
}

export interface CreatePostRequest {
  mediaIds: number[];
  caption?: string;
  location?: string;
  type?: PostType;
}

export interface CommentResponse {
  id: number;
  content: string;
  author: UserSummary;
  parentId: number | null;
  createdAt: string;
}

export interface CreateCommentRequest {
  content: string;
  parentId?: number;
}
