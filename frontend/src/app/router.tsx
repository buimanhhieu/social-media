import { Route, Routes } from 'react-router-dom';
import { HomePage } from '@pages/HomePage';
import { LoginPage } from '@pages/LoginPage';
import { RegisterPage } from '@pages/RegisterPage';
import { NotFoundPage } from '@pages/NotFoundPage';
import { authRoutes } from '@features/auth';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {authRoutes}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
