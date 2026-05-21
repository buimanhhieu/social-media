import { Link } from 'react-router-dom';
import { Button } from '@shared/ui/Button';
import { useAuthStore, useCurrentUser, useLogout } from '@features/auth';

export function HomePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const { data: user } = useCurrentUser();
  const logout = useLogout();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Instagram Clone</h1>

      {accessToken ? (
        <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-4">
          <span className="text-sm">
            Xin chào <strong>{user?.displayName ?? user?.username ?? '…'}</strong>
          </span>
          <Button variant="secondary" size="sm" onClick={() => logout.mutate()}>
            Đăng xuất
          </Button>
        </div>
      ) : (
        <div className="rounded-md border border-zinc-200 bg-white p-4">
          <p className="mb-3 text-sm text-zinc-700">Bạn chưa đăng nhập.</p>
          <Link to="/login">
            <Button>Đăng nhập</Button>
          </Link>
        </div>
      )}

      <p className="text-sm text-zinc-500">
        Đây là trang scaffold. Hãy bắt đầu xây feed bằng cách bổ sung module{' '}
        <code className="rounded bg-zinc-100 px-1 py-0.5">features/post</code>.
      </p>
    </main>
  );
}
