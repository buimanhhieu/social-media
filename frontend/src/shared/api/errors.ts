import { AxiosError } from 'axios';
import type { ApiError } from './types';

export function getApiError(error: unknown): ApiError | null {
  if (!(error instanceof AxiosError) || !error.response) return null;
  const data = error.response.data as Record<string, unknown> | undefined;
  if (!data || typeof data !== 'object') return null;

  // Shape A — chuẩn (GlobalExceptionHandler): { status, code, message, details? }
  if (typeof data.code === 'string' && typeof data.message === 'string') {
    return {
      status: typeof data.status === 'number' ? data.status : error.response.status,
      code: data.code,
      message: data.message,
      fieldErrors: data.fieldErrors as Record<string, string> | undefined,
    };
  }

  // Shape B — fallback: { success, error, message? } (một số backend wrap response)
  if (typeof data.error === 'string') {
    return {
      status: error.response.status,
      code: data.error,
      message: typeof data.message === 'string' ? data.message : data.error,
    };
  }

  return null;
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  EMAIL_NOT_VERIFIED: 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư hoặc gửi lại OTP.',
  EMAIL_OR_USERNAME_TAKEN: 'Email hoặc username đã được sử dụng.',
  USER_NOT_FOUND: 'Không tìm thấy tài khoản với email này.',
  OTP_INVALID: 'Mã OTP không đúng.',
  OTP_EXPIRED: 'Mã OTP đã hết hạn. Vui lòng gửi lại.',
  OTP_THROTTLED: 'Yêu cầu OTP quá thường xuyên. Vui lòng đợi vài giây.',
  OTP_TOO_MANY_ATTEMPTS: 'Bạn đã nhập sai OTP quá nhiều lần.',
  RESET_TOKEN_INVALID: 'Phiên đặt lại mật khẩu không hợp lệ hoặc đã hết hạn.',
  VALIDATION_FAILED: 'Dữ liệu chưa hợp lệ.',
};

export function getFriendlyMessage(error: unknown, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): string {
  const api = getApiError(error);
  if (!api) return fallback;
  return FRIENDLY_MESSAGES[api.code] ?? api.message ?? fallback;
}
