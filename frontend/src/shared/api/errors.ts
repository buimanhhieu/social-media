import { AxiosError } from 'axios';
import type { ApiError } from './types';

export function getApiError(error: unknown): ApiError | null {
  if (error instanceof AxiosError && error.response?.data) {
    const data = error.response.data as Partial<ApiError>;
    if (typeof data.code === 'string' && typeof data.message === 'string') {
      return {
        status: data.status ?? error.response.status,
        code: data.code,
        message: data.message,
        fieldErrors: data.fieldErrors,
      };
    }
  }
  return null;
}

const FRIENDLY_MESSAGES: Record<string, string> = {
  INVALID_CREDENTIALS: 'Email hoặc mật khẩu không đúng.',
  EMAIL_NOT_VERIFIED: 'Email chưa được xác thực. Vui lòng kiểm tra hộp thư hoặc gửi lại OTP.',
  EMAIL_OR_USERNAME_TAKEN: 'Email hoặc username đã được sử dụng.',
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
