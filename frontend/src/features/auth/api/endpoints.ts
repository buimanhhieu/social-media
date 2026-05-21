import { apiClient } from '@shared/api/axios';
import type {
  AuthTokens,
  ForgotPasswordRequest,
  ForgotPasswordResetRequest,
  ForgotPasswordVerifyRequest,
  LoginRequest,
  MessageResponse,
  RegisterRequest,
  ResendOtpRequest,
  ResetTokenResponse,
  VerifyEmailRequest,
} from '../types';

export const authApi = {
  register: (body: RegisterRequest) =>
    apiClient.post<MessageResponse>('/api/auth/register', body).then((r) => r.data),

  resendRegisterOtp: (body: ResendOtpRequest) =>
    apiClient.post<MessageResponse>('/api/auth/register/resend-otp', body).then((r) => r.data),

  verifyEmail: (body: VerifyEmailRequest) =>
    apiClient.post<AuthTokens>('/api/auth/register/verify-email', body).then((r) => r.data),

  login: (body: LoginRequest) =>
    apiClient.post<AuthTokens>('/api/auth/login', body).then((r) => r.data),

  logout: (refreshToken: string) =>
    apiClient.post<void>('/api/auth/logout', { refreshToken }).then((r) => r.data),

  forgotPasswordRequestOtp: (body: ForgotPasswordRequest) =>
    apiClient
      .post<MessageResponse>('/api/auth/forgot-password/request-otp', body)
      .then((r) => r.data),

  forgotPasswordVerifyOtp: (body: ForgotPasswordVerifyRequest) =>
    apiClient
      .post<ResetTokenResponse>('/api/auth/forgot-password/verify-otp', body)
      .then((r) => r.data),

  forgotPasswordReset: (body: ForgotPasswordResetRequest) =>
    apiClient.post<MessageResponse>('/api/auth/forgot-password/reset', body).then((r) => r.data),
};
