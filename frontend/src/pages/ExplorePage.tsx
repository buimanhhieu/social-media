import { Link, Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@shared/ui/AppShell';
import { Avatar } from '@shared/ui/Avatar';
import { Button } from '@shared/ui/Button';
import { useAuthStore, useLogout } from '@features/auth';
import { useCurrentUser, useFollow, useSuggestions } from '@features/user';

export function ExplorePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: me } = useCurrentUser();
  const { data: suggestions, isLoading } = useSuggestions();
  const follow = useFollow();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const items = suggestions ?? [];

  return (
    <AppShell
      user={me}
      loggingOut={logout.isPending}
      onLogout={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}
    >
      <h1 className="mb-4 text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
        Gợi ý theo dõi
      </h1>

      {isLoading ? (
        <p className="py-12 text-center text-sm text-zinc-500">Đang tải…</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-zinc-500">
          Chưa có gợi ý nào — bạn đã theo dõi hết mọi người rồi.
        </p>
      ) : (
        <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
          {items.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-4 py-3">
              <Link to={`/u/${u.username}`}>
                <Avatar src={u.avatarUrl} name={u.displayName ?? u.username} size="md" />
              </Link>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/u/${u.username}`}
                  className="block truncate text-sm font-semibold text-zinc-900 hover:underline dark:text-white"
                >
                  {u.username}
                </Link>
                {u.displayName && <p className="truncate text-xs text-zinc-500">{u.displayName}</p>}
              </div>
              <Button size="sm" onClick={() => follow.mutate(u.id)} disabled={follow.isPending}>
                Theo dõi
              </Button>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
