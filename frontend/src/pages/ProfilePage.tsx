import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@features/auth';
import { useCurrentUser } from '@features/user';

/** Trang cá nhân của mình = chuyển hướng tới /u/{username}. */
export function ProfilePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: me, isLoading } = useCurrentUser();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  if (isLoading || !me) {
    return <div className="min-h-dvh bg-canvas dark:bg-canvas-dark" />;
  }
  return <Navigate to={`/u/${me.username}`} replace />;
}
