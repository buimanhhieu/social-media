import { Link } from 'react-router-dom';
import { Button } from '@shared/ui/Button';

export function NotFoundPage() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-6 bg-canvas px-6 text-center dark:bg-canvas-dark">
      <p className="brand-text-gradient text-7xl font-extrabold tracking-tight">404</p>
      <div className="space-y-1">
        <h1 className="text-xl font-semibold text-stone-900 dark:text-white">
          Không tìm thấy trang
        </h1>
        <p className="text-sm text-stone-500 dark:text-stone-400">
          Trang bạn tìm không tồn tại hoặc đã được di chuyển.
        </p>
      </div>
      <Link to="/">
        <Button>Về trang chủ</Button>
      </Link>
    </main>
  );
}
