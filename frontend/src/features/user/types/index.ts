export interface UserSummary {
  id: number;
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

export interface UserProfile extends UserSummary {
  bio: string | null;
  websiteUrl: string | null;
  isPrivate: boolean;
  isVerified: boolean;
  followersCount: number;
  followingCount: number;
  isFollowing: boolean;
}

export interface UpdateProfileRequest {
  displayName?: string;
  bio?: string;
  websiteUrl?: string;
  avatarUrl?: string;
  isPrivate?: boolean;
}
