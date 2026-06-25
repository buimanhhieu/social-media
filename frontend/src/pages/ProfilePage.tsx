import { Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@shared/ui/AppShell';
import { Avatar } from '@shared/ui/Avatar';
import { useAuthStore, useLogout } from '@features/auth';
import { useCurrentUser } from '@features/user';
import { useUserPosts } from '@features/post';

export function ProfilePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: user } = useCurrentUser();
  const { data: posts } = useUserPosts(user?.id);

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const items = posts?.content ?? [];

  return (
    <AppShell
      user={user}
      loggingOut={logout.isPending}
      onLogout={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}
    >
      <section className="flex flex-col items-center gap-3 py-6 text-center">
        <Avatar src={user?.avatarUrl} name={user?.displayName ?? user?.username} size="lg" />
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
            {user?.username ?? '…'}
          </h1>
          {user?.displayName && <p className="text-sm text-zinc-500">{user.displayName}</p>}
        </div>
        <p className="text-sm text-zinc-500">
          <strong className="text-zinc-900 dark:text-white">{posts?.totalElements ?? 0}</strong> bài viết
        </p>
      </section>

      <div className="border-t border-zinc-200 pt-4 dark:border-zinc-800">
        {items.length > 0 ? (
          <div className="grid grid-cols-3 gap-1 sm:gap-2">
            {items.map((p) => (
              <div
                key={p.id}
                className="aspect-square overflow-hidden rounded-lg bg-zinc-100 dark:bg-zinc-800"
              >
                <img src={p.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <p className="py-12 text-center text-sm text-zinc-500">Chưa có bài viết nào.</p>
        )}
      </div>
    </AppShell>
  );
}
