import { Route, Routes } from 'react-router-dom';
import { HomePage } from '@pages/HomePage';
import { LoginPage } from '@pages/LoginPage';
import { RegisterPage } from '@pages/RegisterPage';
import { VerifyEmailPage } from '@pages/VerifyEmailPage';
import { NotFoundPage } from '@pages/NotFoundPage';
import { authRoutes } from '@features/auth';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      {authRoutes}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
