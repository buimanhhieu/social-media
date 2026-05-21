import { Link, useNavigate } from 'react-router-dom';
import { RegisterForm } from '@features/auth';

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-xl font-semibold">Tạo tài khoản</h1>
        <p className="mb-6 text-center text-sm text-zinc-600">
          Chúng tôi sẽ gửi OTP đến email của bạn để xác thực.
        </p>

        <RegisterForm
          onSuccess={(email) => navigate(`/verify-email?email=${encodeURIComponent(email)}`)}
        />

        <div className="mt-4 text-center text-sm text-zinc-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Đăng nhập
          </Link>
        </div>
      </div>
    </main>
  );
}
