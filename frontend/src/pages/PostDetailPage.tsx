import { type ReactNode } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { AppShell } from '@shared/ui/AppShell';
import { useAuthStore, useLogout } from '@features/auth';
import { useCurrentUser } from '@features/user';
import { PostCard, usePost } from '@features/post';

export function PostDetailPage() {
  const { id } = useParams();
  const postId = Number(id);
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: me } = useCurrentUser();
  const { data: post, isLoading, isError } = usePost(postId);

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
  if (isError || !post) {
    return shell(<p className="py-16 text-center text-sm text-zinc-500">Không tìm thấy bài viết.</p>);
  }

  return shell(
    <div className="mx-auto max-w-xl">
      <PostCard post={post} />
    </div>,
  );
}
