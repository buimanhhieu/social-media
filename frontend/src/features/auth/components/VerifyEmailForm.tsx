import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { getFriendlyMessage } from '@shared/api/errors';
import { useResendRegisterOtp, useVerifyEmail } from '../api/hooks';

const RESEND_COOLDOWN_SECONDS = 30;

interface VerifyEmailFormProps {
  email: string;
  onSuccess?: () => void;
}

interface FormValues {
  otp: string;
}

export function VerifyEmailForm({ email, onSuccess }: VerifyEmailFormProps) {
  const verify = useVerifyEmail();
  const resend = useResendRegisterOtp();
  const [cooldown, setCooldown] = useState(0);
  const { register, handleSubmit, formState } = useForm<FormValues>();

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  const onSubmit = handleSubmit((values) => {
    verify.mutate({ email, otp: values.otp }, { onSuccess: () => onSuccess?.() });
  });

  const onResend = () => {
    resend.mutate(
      { email },
      { onSuccess: () => setCooldown(RESEND_COOLDOWN_SECONDS) },
    );
  };

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600">
        Mã OTP đã được gửi đến <strong>{email}</strong>.
      </p>

      <Input
        inputMode="numeric"
        maxLength={6}
        placeholder="Nhập mã OTP 6 chữ số"
        autoComplete="one-time-code"
        error={formState.errors.otp?.message}
        {...register('otp', {
          required: 'Bắt buộc',
          pattern: { value: /^\d{6}$/, message: 'OTP phải gồm 6 chữ số' },
        })}
      />

      {verify.isError && (
        <p className="text-sm text-red-600">{getFriendlyMessage(verify.error)}</p>
      )}
      {resend.isSuccess && cooldown > 0 && (
        <p className="text-sm text-green-600">Đã gửi lại OTP. Vui lòng kiểm tra hộp thư.</p>
      )}
      {resend.isError && (
        <p className="text-sm text-red-600">{getFriendlyMessage(resend.error)}</p>
      )}

      <Button type="submit" disabled={verify.isPending}>
        {verify.isPending ? 'Đang xác thực…' : 'Xác thực'}
      </Button>

      <button
        type="button"
        onClick={onResend}
        disabled={resend.isPending || cooldown > 0}
        className="text-sm text-blue-600 hover:underline disabled:cursor-not-allowed disabled:text-zinc-400"
      >
        {cooldown > 0 ? `Gửi lại OTP sau ${cooldown}s` : 'Gửi lại OTP'}
      </button>
    </form>
  );
}
