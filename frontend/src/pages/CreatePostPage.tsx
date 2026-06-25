import { Navigate, useNavigate } from 'react-router-dom';
import { AppShell } from '@shared/ui/AppShell';
import { CreatePostForm } from '@features/post';
import { useAuthStore, useLogout } from '@features/auth';
import { useCurrentUser } from '@features/user';

export function CreatePostPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const navigate = useNavigate();
  const logout = useLogout();
  const { data: user } = useCurrentUser();

  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }

  return (
    <AppShell
      user={user}
      loggingOut={logout.isPending}
      onLogout={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}
    >
      <CreatePostForm onCreated={() => navigate('/')} />
    </AppShell>
  );
}
