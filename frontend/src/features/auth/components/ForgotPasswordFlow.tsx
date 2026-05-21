import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@shared/ui/Button';
import { Input } from '@shared/ui/Input';
import { getFriendlyMessage } from '@shared/api/errors';
import {
  useForgotPasswordRequestOtp,
  useForgotPasswordReset,
  useForgotPasswordVerifyOtp,
} from '../api/hooks';

const PASSWORD_RE = /^(?=.*[A-Za-z])(?=.*\d).+$/;

type Step =
  | { kind: 'request' }
  | { kind: 'verify'; email: string }
  | { kind: 'reset'; resetToken: string }
  | { kind: 'done' };

export function ForgotPasswordFlow({ onDone }: { onDone?: () => void }) {
  const [step, setStep] = useState<Step>({ kind: 'request' });

  switch (step.kind) {
    case 'request':
      return <RequestStep onNext={(email) => setStep({ kind: 'verify', email })} />;
    case 'verify':
      return (
        <VerifyStep
          email={step.email}
          onNext={(resetToken) => setStep({ kind: 'reset', resetToken })}
          onBack={() => setStep({ kind: 'request' })}
        />
      );
    case 'reset':
      return (
        <ResetStep
          resetToken={step.resetToken}
          onDone={() => {
            setStep({ kind: 'done' });
            onDone?.();
          }}
        />
      );
    case 'done':
      return (
        <p className="text-sm text-green-600">
          Mật khẩu đã được cập nhật. Bạn có thể đăng nhập lại.
        </p>
      );
  }
}

function RequestStep({ onNext }: { onNext: (email: string) => void }) {
  const request = useForgotPasswordRequestOtp();
  const { register, handleSubmit, formState } = useForm<{ email: string }>();

  const onSubmit = handleSubmit((values) => {
    request.mutate(values, { onSuccess: () => onNext(values.email) });
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600">
        Nhập email tài khoản — nếu tồn tại, chúng tôi sẽ gửi mã OTP.
      </p>
      <Input
        type="email"
        placeholder="Email"
        autoComplete="email"
        error={formState.errors.email?.message}
        {...register('email', { required: 'Bắt buộc' })}
      />
      {request.isError && (
        <p className="text-sm text-red-600">{getFriendlyMessage(request.error)}</p>
      )}
      <Button type="submit" disabled={request.isPending}>
        {request.isPending ? 'Đang gửi…' : 'Gửi OTP'}
      </Button>
    </form>
  );
}

function VerifyStep({
  email,
  onNext,
  onBack,
}: {
  email: string;
  onNext: (resetToken: string) => void;
  onBack: () => void;
}) {
  const verify = useForgotPasswordVerifyOtp();
  const { register, handleSubmit, formState } = useForm<{ otp: string }>();

  const onSubmit = handleSubmit((values) => {
    verify.mutate(
      { email, otp: values.otp },
      { onSuccess: (data) => onNext(data.resetToken) },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600">
        Mã OTP đã gửi đến <strong>{email}</strong>.
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
      <Button type="submit" disabled={verify.isPending}>
        {verify.isPending ? 'Đang xác thực…' : 'Xác thực'}
      </Button>
      <button
        type="button"
        onClick={onBack}
        className="text-sm text-blue-600 hover:underline"
      >
        ← Đổi email
      </button>
    </form>
  );
}

function ResetStep({
  resetToken,
  onDone,
}: {
  resetToken: string;
  onDone: () => void;
}) {
  const reset = useForgotPasswordReset();
  const { register, handleSubmit, formState, watch } = useForm<{
    newPassword: string;
    confirm: string;
  }>();

  const onSubmit = handleSubmit((values) => {
    reset.mutate(
      { resetToken, newPassword: values.newPassword },
      { onSuccess: () => onDone() },
    );
  });

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-3">
      <Input
        type="password"
        placeholder="Mật khẩu mới"
        autoComplete="new-password"
        error={formState.errors.newPassword?.message}
        {...register('newPassword', {
          required: 'Bắt buộc',
          minLength: { value: 8, message: 'Tối thiểu 8 ký tự' },
          pattern: { value: PASSWORD_RE, message: 'Phải có ít nhất 1 chữ và 1 số' },
        })}
      />
      <Input
        type="password"
        placeholder="Xác nhận mật khẩu"
        autoComplete="new-password"
        error={formState.errors.confirm?.message}
        {...register('confirm', {
          required: 'Bắt buộc',
          validate: (v) => v === watch('newPassword') || 'Mật khẩu xác nhận không khớp',
        })}
      />
      {reset.isError && (
        <p className="text-sm text-red-600">{getFriendlyMessage(reset.error)}</p>
      )}
      <Button type="submit" disabled={reset.isPending}>
        {reset.isPending ? 'Đang cập nhật…' : 'Đặt lại mật khẩu'}
      </Button>
    </form>
  );
}
