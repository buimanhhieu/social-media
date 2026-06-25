import { Link } from 'react-router-dom';
import { Button } from '@shared/ui/Button';
import { Logo } from '@shared/ui/Logo';
import { useAuthStore, useLogout } from '@features/auth';

export function HomePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useLogout();

  return (
    <main className="flex min-h-dvh items-center justify-center bg-zinc-50 px-6 dark:bg-zinc-950">
      <div className="animate-rise w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <Logo className="text-4xl" />

        {accessToken ? (
          <>
            <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
              Bạn đã đăng nhập.
            </p>
            <Button
              variant="secondary"
              fullWidth
              className="mt-6"
              disabled={logout.isPending}
              onClick={() => logout.mutate()}
            >
              {logout.isPending ? 'Đang đăng xuất…' : 'Đăng xuất'}
            </Button>
          </>
        ) : (
          <>
            <p className="mt-6 text-sm text-zinc-500 dark:text-zinc-400">
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
          </>
        )}
      </div>
    </main>
  );
}
