import { Link } from 'react-router-dom';
import { Button } from '@shared/ui/Button';
import { useAuthStore, useLogout } from '@features/auth';

export function HomePage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useLogout();

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-6 p-8">
      <h1 className="text-2xl font-semibold">Instagram Clone</h1>

      {accessToken ? (
        <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-white p-4">
          <span className="text-sm">Đã đăng nhập</span>
          <Button variant="secondary" size="sm" onClick={() => logout.mutate()}>
            Đăng xuất
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-2 rounded-md border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-700">Bạn chưa đăng nhập.</p>
          <div className="flex gap-2">
            <Link to="/login">
              <Button>Đăng nhập</Button>
            </Link>
            <Link to="/register">
              <Button variant="secondary">Đăng ký</Button>
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
