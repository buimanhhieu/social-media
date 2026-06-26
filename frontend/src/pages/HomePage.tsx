import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@shared/ui/Button';
import { Logo } from '@shared/ui/Logo';
import { AppShell } from '@shared/ui/AppShell';
import { Feed } from '@features/post';
import { useAuthStore, useLogout } from '@features/auth';
import { useCurrentUser } from '@features/user';

export function HomePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useLogout();
  const navigate = useNavigate();
  const { data: user } = useCurrentUser();

  if (accessToken) {
    return (
      <AppShell
        user={user}
        loggingOut={logout.isPending}
        onLogout={() => logout.mutate(undefined, { onSettled: () => navigate('/login') })}
      >
        <Feed />
      </AppShell>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-canvas px-6 dark:bg-canvas-dark">
      <div className="animate-rise w-full max-w-md rounded-2xl border border-line bg-surface p-8 text-center shadow-sm dark:border-line-dark dark:bg-surface-dark">
        <Logo className="text-4xl" />
        <p className="mt-6 text-sm text-stone-500 dark:text-stone-400">
          Đăng nhập để xem bảng tin của bạn.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Link to="/login">
            <Button fullWidth>Đăng nhập</Button>
          </Link>
          <Link to="/register">
            <Button variant="secondary" fullWidth>
              Đăng ký
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
