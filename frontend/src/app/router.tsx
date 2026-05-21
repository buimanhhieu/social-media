import { Route, Routes } from 'react-router-dom';
import { HomePage } from '@pages/HomePage';
import { LoginPage } from '@pages/LoginPage';
import { NotFoundPage } from '@pages/NotFoundPage';
import { authRoutes } from '@features/auth';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />
      {authRoutes}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
