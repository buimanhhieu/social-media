import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { VerifyEmailForm } from '@features/auth';
import { AuthLayout } from '@shared/ui/AuthLayout';

export function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const email = params.get('email');

  if (!email) {
    return <Navigate to="/register" replace />;
  }

  return (
    <AuthLayout
      title="Xác thực email"
      subtitle="Nhập mã OTP gồm 6 chữ số mà chúng tôi vừa gửi."
      footer={
        <p className="text-center">
          Sai email?{' '}
          <Link to="/register" className="font-semibold text-accent hover:underline">
            Đăng ký lại
          </Link>
        </p>
      }
    >
      <VerifyEmailForm email={email} onSuccess={() => navigate('/')} />
    </AuthLayout>
  );
}
