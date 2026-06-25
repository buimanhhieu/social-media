import { Link, useNavigate } from 'react-router-dom';
import { LoginForm } from '@features/auth';
import { AuthLayout } from '@shared/ui/AuthLayout';

export function LoginPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Đăng nhập"
      subtitle="Chào mừng trở lại. Nhập thông tin để tiếp tục."
      footer={
        <div className="flex flex-col items-center gap-2 text-center">
          <Link to="/forgot-password" className="font-medium text-accent hover:underline">
            Quên mật khẩu?
          </Link>
          <span>
            Chưa có tài khoản?{' '}
            <Link to="/register" className="font-semibold text-accent hover:underline">
              Đăng ký
            </Link>
          </span>
        </div>
      }
    >
      <LoginForm
        onSuccess={() => navigate('/')}
        onEmailNotVerified={(email) =>
          navigate(`/verify-email?email=${encodeURIComponent(email)}`)
        }
      />
    </AuthLayout>
  );
}
