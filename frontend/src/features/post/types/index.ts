import type { UserSummary } from '@features/user';

export type PostType = 'IMAGE' | 'VIDEO' | 'REEL';

export interface PostSummary {
  id: number;
  thumbnailUrl: string;
  type: PostType;
}

export interface PostResponse {
  id: number;
  caption: string | null;
  type: PostType;
  author: UserSummary;
  mediaUrls: string[];
  likeCount: number;
  commentCount: number;
  createdAt: string;
}
