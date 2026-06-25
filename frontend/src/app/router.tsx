import { Route, Routes } from 'react-router-dom';
import { HomePage } from '@pages/HomePage';
import { CreatePostPage } from '@pages/CreatePostPage';
import { ProfilePage } from '@pages/ProfilePage';
import { UserProfilePage } from '@pages/UserProfilePage';
import { ExplorePage } from '@pages/ExplorePage';
import { SettingsPage } from '@pages/SettingsPage';
import { LoginPage } from '@pages/LoginPage';
import { RegisterPage } from '@pages/RegisterPage';
import { VerifyEmailPage } from '@pages/VerifyEmailPage';
import { ForgotPasswordPage } from '@pages/ForgotPasswordPage';
import { NotFoundPage } from '@pages/NotFoundPage';
import { authRoutes } from '@features/auth';

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreatePostPage />} />
      <Route path="/profile" element={<ProfilePage />} />
      <Route path="/u/:username" element={<UserProfilePage />} />
      <Route path="/explore" element={<ExplorePage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/verify-email" element={<VerifyEmailPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      {authRoutes}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
