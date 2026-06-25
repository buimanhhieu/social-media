import { Link, useNavigate } from 'react-router-dom';
import { RegisterForm } from '@features/auth';
import { AuthLayout } from '@shared/ui/AuthLayout';

export function RegisterPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Tạo tài khoản"
      subtitle="Chúng tôi sẽ gửi mã OTP đến email của bạn để xác thực."
      footer={
        <p className="text-center">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-accent hover:underline">
            Đăng nhập
          </Link>
        </p>
      }
    >
      <RegisterForm
        onSuccess={(email) => navigate(`/verify-email?email=${encodeURIComponent(email)}`)}
      />
    </AuthLayout>
  );
}
