import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { AppShell } from '@shared/ui/AppShell';
import { Avatar } from '@shared/ui/Avatar';
import { Button } from '@shared/ui/Button';
import { useAuthStore, useLogout } from '@features/auth';
import { useCurrentUser, useFollow, useSearchUsers, useSuggestions } from '@features/user';
import { useExplore } from '@features/post';
import type { UserSummary } from '@features/user';

export function ExplorePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: me } = useCurrentUser();

  const [query, setQuery] = useState('');
  const searching = query.trim().length > 0;
  const { data: results, isLoading: searchLoading } = useSearchUsers(query);
  const { data: suggestions } = useSuggestions();
  const explore = useExplore();
  const follow = useFollow();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  const posts = explore.data?.pages.flatMap((p) => p.content) ?? [];

  return (
    <AppShell
      user={me}
      loggingOut={logout.isPending}
      onLogout={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}
    >
      {/* Ô tìm người */}
      <div className="relative mb-6">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm người dùng…"
          className="h-11 w-full rounded-2xl border border-zinc-200 bg-white pl-10 pr-10 text-sm text-zinc-900 transition-colors placeholder:text-zinc-400 focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
        />
        {searching && (
          <button
            type="button"
            onClick={() => setQuery('')}
            aria-label="Xoá"
            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {searching ? (
        <UserList
          users={results ?? []}
          loading={searchLoading}
          emptyText={`Không tìm thấy người dùng cho "${query.trim()}".`}
          onFollow={(id) => follow.mutate(id)}
          followBusy={follow.isPending}
        />
      ) : (
        <>
          {(suggestions?.length ?? 0) > 0 && (
            <section className="mb-8">
              <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Gợi ý theo dõi</h2>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {suggestions!.map((u) => (
                  <div
                    key={u.id}
                    className="flex w-32 shrink-0 flex-col items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-3 text-center dark:border-zinc-800 dark:bg-zinc-900"
                  >
                    <Link to={`/u/${u.username}`}>
                      <Avatar src={u.avatarUrl} name={u.displayName ?? u.username} size="lg" />
                    </Link>
                    <Link
                      to={`/u/${u.username}`}
                      className="w-full truncate text-xs font-semibold text-zinc-900 hover:underline dark:text-white"
                    >
                      {u.username}
                    </Link>
                    <Button size="sm" fullWidth onClick={() => follow.mutate(u.id)} disabled={follow.isPending}>
                      Theo dõi
                    </Button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section>
            <h2 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-white">Khám phá</h2>
            {explore.isLoading ? (
              <div className="grid grid-cols-3 gap-1 sm:gap-2">
                {Array.from({ length: 9 }).map((_, i) => (
                  <div key={i} className="aspect-square animate-pulse rounded-md bg-zinc-100 dark:bg-zinc-800" />
                ))}
              </div>
            ) : posts.length === 0 ? (
              <p className="py-12 text-center text-sm text-zinc-500">Chưa có bài viết nào để khám phá.</p>
            ) : (
              <>
                <div className="grid grid-cols-3 gap-1 sm:gap-2">
                  {posts.map((p) => (
                    <Link
                      key={p.id}
                      to={`/p/${p.id}`}
                      className="aspect-square overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800"
                    >
                      <img src={p.thumbnailUrl} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </Link>
                  ))}
                </div>
                {explore.hasNextPage && (
                  <div className="flex justify-center pt-4">
                    <Button
                      variant="secondary"
                      onClick={() => explore.fetchNextPage()}
                      disabled={explore.isFetchingNextPage}
                    >
                      {explore.isFetchingNextPage ? 'Đang tải…' : 'Tải thêm'}
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        </>
      )}
    </AppShell>
  );
}

function UserList({
  users,
  loading,
  emptyText,
  onFollow,
  followBusy,
}: {
  users: UserSummary[];
  loading: boolean;
  emptyText: string;
  onFollow: (id: number) => void;
  followBusy: boolean;
}) {
  if (loading) {
    return <p className="py-12 text-center text-sm text-zinc-500">Đang tìm…</p>;
  }
  if (users.length === 0) {
    return <p className="py-12 text-center text-sm text-zinc-500">{emptyText}</p>;
  }
  return (
    <ul className="divide-y divide-zinc-100 overflow-hidden rounded-2xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
      {users.map((u) => (
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
          <Button size="sm" onClick={() => onFollow(u.id)} disabled={followBusy}>
            Theo dõi
          </Button>
        </li>
      ))}
    </ul>
  );
}
