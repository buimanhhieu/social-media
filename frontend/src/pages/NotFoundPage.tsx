import { Link } from 'react-router-dom';

export function NotFoundPage() {
  return (
    <main className="flex min-h-full flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-4xl font-semibold">404</h1>
      <p className="text-sm text-zinc-600">Trang bạn tìm không tồn tại.</p>
      <Link to="/" className="text-sm text-blue-600 hover:underline">
        Quay về trang chủ
      </Link>
    </main>
  );
}
