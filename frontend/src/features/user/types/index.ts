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
  followerCount: number;
  followingCount: number;
  postCount: number;
}
