import { useNavigate } from 'react-router-dom';
import { LoginForm } from '@features/auth';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold">Đăng nhập</h1>
        <LoginForm onSuccess={() => navigate('/')} />
      </div>
    </main>
  );
}
