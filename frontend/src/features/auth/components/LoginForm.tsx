import { useForm } from 'react-hook-form';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { getApiError, getFriendlyMessage } from '@shared/api/errors';
import { useLogin } from '../api/hooks';
import type { LoginRequest } from '../types';

interface LoginFormProps {
  onSuccess?: () => void;
  onEmailNotVerified?: (email: string) => void;
}

export function LoginForm({ onSuccess, onEmailNotVerified }: LoginFormProps) {
  const login = useLogin();
  const { register, handleSubmit, formState, getValues } = useForm<LoginRequest>();

  const onSubmit = handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => onSuccess?.(),
      onError: (error) => {
        if (getApiError(error)?.code === 'EMAIL_NOT_VERIFIED') {
          onEmailNotVerified?.(values.email);
        }
      },
    });
  });

  const apiCode = login.isError ? getApiError(login.error)?.code : undefined;
  const isEmailNotVerified = apiCode === 'EMAIL_NOT_VERIFIED';

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

      {login.isError && (
        <div className="flex flex-col gap-1 text-sm">
          <p className="text-red-600">{getFriendlyMessage(login.error)}</p>
          {isEmailNotVerified && (
            <button
              type="button"
              className="self-start text-blue-600 hover:underline"
              onClick={() => onEmailNotVerified?.(getValues('email'))}
            >
              Đi tới xác thực email →
            </button>
          )}
        </div>
      )}

      <Button type="submit" disabled={login.isPending}>
        {login.isPending ? 'Đang đăng nhập…' : 'Đăng nhập'}
      </Button>
    </form>
  );
}
