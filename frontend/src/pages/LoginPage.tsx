import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '@features/auth';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold">Đăng nhập</h1>

        <LoginForm
          onSuccess={() => navigate('/')}
          onEmailNotVerified={(email) =>
            navigate(`/verify-email?email=${encodeURIComponent(email)}`)
          }
        />

        <div className="mt-4 flex flex-col gap-1 text-center text-sm">
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Quên mật khẩu?
          </Link>
          <span className="text-zinc-600">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-blue-600 hover:underline">
              Đăng ký
            </Link>
          </span>
        </div>
      </div>
    </main>
  );
}
