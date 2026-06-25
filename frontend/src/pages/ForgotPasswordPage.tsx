import { Link, useNavigate } from 'react-router-dom';
import { ForgotPasswordFlow } from '@features/auth';
import { AuthLayout } from '@shared/ui/AuthLayout';

export function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Khôi phục quyền truy cập vào tài khoản của bạn."
      footer={
        <p className="text-center">
          <Link to="/login" className="font-medium text-accent hover:underline">
            ← Quay lại đăng nhập
          </Link>
        </p>
      }
    >
      <ForgotPasswordFlow onDone={() => setTimeout(() => navigate('/login'), 1500)} />
    </AuthLayout>
  );
}
