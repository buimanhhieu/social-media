import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, Home, LogOut, PlusSquare, Settings, User } from 'lucide-react';
import { Logo } from './Logo';
import { Avatar } from './Avatar';
import { cn } from '@shared/lib/cn';

interface ShellUser {
  username: string;
  displayName: string | null;
  avatarUrl: string | null;
}

interface AppShellProps {
  children: ReactNode;
  user?: ShellUser | null;
  onLogout: () => void;
  loggingOut?: boolean;
}

const NAV = [
  { to: '/', label: 'Trang chủ', icon: Home },
  { to: '/explore', label: 'Khám phá', icon: Compass },
  { to: '/create', label: 'Tạo bài viết', icon: PlusSquare },
];

export function AppShell({ children, user, onLogout, loggingOut }: AppShellProps) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-canvas dark:bg-canvas-dark">
      {/* Top bar full-width — wordmark đứng riêng, không bao giờ bị cắt */}
      <header className="fixed inset-x-0 top-0 z-40 h-16 bg-canvas/80 backdrop-blur dark:bg-canvas-dark/80">
        <div className="flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-1">
            <Link
              to="/"
              aria-label="Trang chủ"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
              <Logo className="text-2xl" />
            </Link>
            {/* Nav icon cho mobile (rail bị ẩn) */}
            <div className="ml-1 flex items-center gap-1 lg:hidden">
              {NAV.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  aria-label={label}
                  className={cn(
                    'rounded-xl p-2 transition-colors',
                    pathname === to
                      ? 'text-accent'
                      : 'text-stone-600 hover:bg-surface dark:text-stone-300 dark:hover:bg-surface-dark',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </Link>
              ))}
            </div>
          </div>

          <ProfileMenu user={user} onLogout={onLogout} loggingOut={loggingOut} />
        </div>
      </header>

      {/* Rail dọc bên trái (dưới top bar) — mặc định chỉ icon, hover mới mở rộng (overlay) */}
      <aside className="group fixed bottom-0 left-0 top-16 z-30 hidden w-18 flex-col overflow-hidden bg-canvas px-2.5 py-4 transition-[width,box-shadow] duration-200 hover:w-60 hover:shadow-xl hover:shadow-stone-900/5 lg:flex dark:bg-canvas-dark">
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              aria-label={label}
              className={cn(
                'flex items-center gap-4 rounded-xl px-3 py-2.5 text-[15px] transition-colors',
                pathname === to
                  ? 'font-semibold text-accent'
                  : 'text-stone-700 hover:bg-surface dark:text-stone-200 dark:hover:bg-surface-dark',
              )}
            >
              <Icon className="h-6 w-6 shrink-0" strokeWidth={pathname === to ? 2.4 : 2} />
              <span className="whitespace-nowrap opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                {label}
              </span>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Vùng nội dung */}
      <div className="pt-16 lg:pl-18">
        <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
      </div>
    </div>
  );
}

function ProfileMenu({ user, onLogout, loggingOut }: Omit<AppShellProps, 'children'>) {
  const [open, setOpen] = useState(false);
  const name = user?.displayName ?? user?.username ?? null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Tài khoản"
        aria-expanded={open}
        className="rounded-full ring-2 ring-transparent transition hover:ring-accent/40"
      >
        <Avatar src={user?.avatarUrl} name={name} size="md" />
      </button>

      {open && (
        <>
          <button
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => setOpen(false)}
            className="fixed inset-0 z-40 cursor-default"
          />
          <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-2xl border border-line bg-surface shadow-xl shadow-stone-900/10 dark:border-line-dark dark:bg-surface-dark">
            <div className="flex items-center gap-3 border-b border-line px-4 py-3 dark:border-line-dark">
              <Avatar src={user?.avatarUrl} name={name} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-stone-900 dark:text-white">
                  {user?.username ?? '…'}
                </p>
                {user?.displayName && (
                  <p className="truncate text-xs text-stone-500">{user.displayName}</p>
                )}
              </div>
            </div>

            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-canvas dark:text-stone-200 dark:hover:bg-canvas-dark"
            >
              <User className="h-4 w-4" strokeWidth={2} />
              Trang cá nhân
            </Link>

            <Link
              to="/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-stone-700 transition-colors hover:bg-canvas dark:text-stone-200 dark:hover:bg-canvas-dark"
            >
              <Settings className="h-4 w-4" strokeWidth={2} />
              Cài đặt
            </Link>

            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 border-t border-line px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-line-dark dark:text-red-400 dark:hover:bg-red-950/40"
            >
              <LogOut className="h-4 w-4" strokeWidth={2} />
              {loggingOut ? 'Đang đăng xuất…' : 'Đăng xuất'}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
