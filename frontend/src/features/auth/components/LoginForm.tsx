import { useForm } from 'react-hook-form';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { getFriendlyMessage } from '@shared/api/errors';
import { useLogin } from '../api/hooks';
import type { LoginRequest } from '../types';

export function LoginForm({ onSuccess }: { onSuccess?: () => void }) {
  const login = useLogin();
  const { register, handleSubmit, formState } = useForm<LoginRequest>();

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, { onSuccess: () => onSuccess?.() });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input
        type="email"
        placeholder="Email"
        autoComplete="email"
        error={formState.errors.email?.message}
        {...register('email', { required: 'Bắt buộc' })}
      />
      <Input
        type="password"
        placeholder="Mật khẩu"
        autoComplete="current-password"
        error={formState.errors.password?.message}
        {...register('password', { required: 'Bắt buộc' })}
      />
      {login.isError && <p className="text-sm text-red-600">{getFriendlyMessage(login.error)}</p>}
      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </Button>
    </form>
  );
}
