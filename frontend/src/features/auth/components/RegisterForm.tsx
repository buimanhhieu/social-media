import { useForm } from 'react-hook-form';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { getFriendlyMessage } from '@shared/api/errors';
import { useRegister } from '../api/hooks';
import type { RegisterRequest } from '../types';

const USERNAME_RE = /^[a-z0-9_.]{3,30}$/;
const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).+$/;

export function RegisterForm({ onSuccess }: { onSuccess?: (email: string) => void }) {
  const registerMutation = useRegister();
  const { register, handleSubmit, formState } = useForm<RegisterRequest>();

  const onSubmit = handleSubmit((values) => {
    const payload: RegisterRequest = {
      email: values.email,
      username: values.username,
      password: values.password,
      displayName: values.displayName?.trim() || undefined,
    };
    registerMutation.mutate(payload, {
      onSuccess: () => onSuccess?.(values.email),
    });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Input
        type="email"
        label="Email"
        placeholder="ban@email.com"
        autoComplete="email"
        error={formState.errors.email?.message}
        {...register('email', { required: 'Bắt buộc' })}
      />
      <Input
        label="Tên người dùng"
        placeholder="ten_nguoi_dung"
        autoComplete="username"
        error={formState.errors.username?.message}
        {...register('username', {
          required: 'Bắt buộc',
          pattern: {
            value: USERNAME_RE,
            message: '3–30 ký tự: chữ thường, số, dấu chấm hoặc gạch dưới',
          },
        })}
      />
      <Input
        label="Tên hiển thị"
        hint="Tuỳ chọn"
        autoComplete="name"
        maxLength={60}
        error={formState.errors.displayName?.message}
        {...register('displayName')}
      />
      <Input
        type="password"
        label="Mật khẩu"
        placeholder="••••••••"
        autoComplete="new-password"
        error={formState.errors.password?.message}
        {...register('password', {
          required: 'Bắt buộc',
          minLength: { value: 8, message: 'Tối thiểu 8 ký tự' },
          pattern: { value: PASSWORD_RE, message: 'Phải có ít nhất 1 chữ và 1 số' },
        })}
      />

      {registerMutation.isError && (
        <p className="text-sm text-red-600 dark:text-red-400">
          {getFriendlyMessage(registerMutation.error)}
        </p>
      )}

      <Button type="submit" fullWidth disabled={registerMutation.isPending}>
        {registerMutation.isPending ? 'Đang tạo tài khoản…' : 'Đăng ký'}
      </Button>
    </form>
  );
}
