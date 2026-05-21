import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { VerifyEmailForm } from '@features/auth';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get('email');

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  return (
    <main className="flex min-h-full items-center justify-center p-6">
      <div className="w-full max-w-sm rounded-lg border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="mb-2 text-center text-xl font-semibold">Xác thực email</h1>
        <p className="mb-6 text-center text-sm text-zinc-600">
          Nhập mã OTP gồm 6 chữ số mà chúng tôi vừa gửi.
        </p>

        <VerifyEmailForm email={email} onSuccess={() => navigate('/')} />

        <div className="mt-4 text-center text-sm text-zinc-600">
          Sai email?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">
            Đăng ký lại
          </Link>
        </div>
      </div>
    </main>
  );
}
