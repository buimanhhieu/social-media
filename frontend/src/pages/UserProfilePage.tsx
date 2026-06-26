import { type ReactNode } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { BadgeCheck, Grid3x3, Settings } from 'lucide-react';
import { AppShell } from '@shared/ui/AppShell';
import { Avatar } from '@shared/ui/Avatar';
import { Button } from '@shared/ui/Button';
import { useAuthStore, useLogout } from '@features/auth';
import { useCurrentUser, useFollow, useUnfollow, useUserProfile } from '@features/user';
import { useUserPosts } from '@features/post';

function Stat({ n, label }: { n: number; label: string }) {
  return (
    <div className="text-sm">
      <span className="font-semibold text-zinc-900 dark:text-white">{n.toLocaleString('vi-VN')}</span>{' '}
      <span className="text-zinc-600 dark:text-zinc-400">{label}</span>
    </div>
  );
}

const prettyUrl = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '');
const withHttp = (url: string) => (/^https?:\/\//.test(url) ? url : `https://${url}`);

export function UserProfilePage() {
  const { username } = useParams();
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: me } = useCurrentUser();
  const { data: profile, isLoading, isError } = useUserProfile(username);
  const { data: posts } = useUserPosts(profile?.id);
  const follow = useFollow();
  const unfollow = useUnfollow();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const shell = (children: ReactNode) => (
    <AppShell
      user={me}
      loggingOut={logout.isPending}
      onLogout={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}
    >
      {children}
    </AppShell>
  );

  if (isLoading) {
    return shell(<p className="py-16 text-center text-sm text-zinc-500">Đang tải…</p>);
  }
  if (isError || !profile) {
    return shell(
      <p className="py-16 text-center text-sm text-zinc-500">Không tìm thấy người dùng @{username}.</p>,
    );
  }

  const isMe = me?.username === profile.username;
  const items = posts?.content ?? [];
  const postCount = posts?.totalElements ?? 0;
  const toggleFollow = () => (profile.isFollowing ? unfollow : follow).mutate(profile.id);
  const followBusy = follow.isPending || unfollow.isPending;

  return shell(
    <section className="py-4">
      <div className="flex flex-col items-center gap-5 text-center sm:flex-row sm:items-start sm:gap-10 sm:text-left">
        <Avatar src={profile.avatarUrl} name={profile.displayName ?? profile.username} size="xl" />

        <div className="flex-1">
          <div className="flex flex-col items-center gap-3 sm:flex-row sm:flex-wrap">
            <h1 className="flex items-center gap-1.5 text-2xl font-light text-zinc-900 dark:text-white">
              {profile.username}
              {profile.isVerified && <BadgeCheck className="h-5 w-5 fill-accent text-white" />}
            </h1>

            {isMe ? (
              <div className="flex gap-2">
                <Link to="/settings">
                  <Button variant="secondary" size="sm">
                    Chỉnh sửa trang cá nhân
                  </Button>
                </Link>
                <Link to="/settings" aria-label="Cài đặt">
                  <Button variant="secondary" size="sm">
                    <Settings className="h-4 w-4" strokeWidth={2} />
                  </Button>
                </Link>
              </div>
            ) : (
              <Button
                size="sm"
                variant={profile.isFollowing ? 'secondary' : 'primary'}
                onClick={toggleFollow}
                disabled={followBusy}
              >
                {profile.isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
              </Button>
            )}
          </div>

          <div className="mt-4 flex justify-center gap-8 sm:justify-start">
            <Stat n={postCount} label="bài viết" />
            <Stat n={profile.followersCount} label="người theo dõi" />
            <Stat n={profile.followingCount} label="đang theo dõi" />
          </div>

          <div className="mt-4">
            {profile.displayName && (
              <p className="font-semibold text-zinc-900 dark:text-white">{profile.displayName}</p>
            )}
            {profile.bio && (
              <p className="mt-0.5 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">
                {profile.bio}
              </p>
            )}
            {profile.websiteUrl && (
              <a
                href={withHttp(profile.websiteUrl)}
                target="_blank"
                rel="noreferrer"
                className="mt-0.5 inline-block text-sm font-medium text-accent hover:underline"
              >
                {prettyUrl(profile.websiteUrl)}
              </a>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-center border-t border-zinc-200 dark:border-zinc-800">
        <span className="-mt-px flex items-center gap-1.5 border-t border-zinc-900 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-900 dark:border-white dark:text-white">
          <Grid3x3 className="h-4 w-4" /> Bài viết
        </span>
      </div>

      {items.length > 0 ? (
        <div className="mt-1 grid grid-cols-3 gap-1 sm:gap-2">
          {items.map((p) => (
            <Link
              key={p.id}
              to={`/p/${p.id}`}
              className="aspect-square overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800"
            >
              <img src={p.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
            </Link>
          ))}
        </div>
      ) : (
        <p className="py-12 text-center text-sm text-zinc-500">Chưa có bài viết nào.</p>
      )}
    </section>,
  );
}
