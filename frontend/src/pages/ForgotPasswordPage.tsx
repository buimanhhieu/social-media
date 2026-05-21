import { Link, useNavigate } from 'react-router-dom';
import { ForgotPasswordFlow } from '@features/auth';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold">Quên mật khẩu</h1>

        <ForgotPasswordFlow onDone={() => setTimeout(() => navigate('/login'), 1500)} />

        <div className="mt-4 text-center text-sm text-zinc-600">
          <Link to="/login" className="text-blue-600 hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </main>
  );
}
