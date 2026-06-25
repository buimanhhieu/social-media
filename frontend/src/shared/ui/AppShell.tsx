import { type ReactNode, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LogOut, PlusSquare, User } from 'lucide-react';
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
  { to: '/create', label: 'Tạo bài viết', icon: PlusSquare },
];

export function AppShell({ children, user, onLogout, loggingOut }: AppShellProps) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      {/* Rail dọc bên trái — desktop */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-zinc-200 bg-white px-3 py-5 lg:flex dark:border-zinc-800 dark:bg-zinc-900">
        <Link to="/" aria-label="Trang chủ" className="mb-8 px-3">
          <Logo className="text-3xl" />
        </Link>
        <nav className="flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              className={cn(
                'flex items-center gap-4 rounded-xl px-3 py-2.5 text-[15px] transition-colors',
                pathname === to
                  ? 'font-semibold text-accent'
                  : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800',
              )}
            >
              <Icon className="h-6 w-6" strokeWidth={pathname === to ? 2.4 : 2} />
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Vùng nội dung */}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex h-16 items-center justify-between px-4">
            {/* Mobile: logo + nav (rail bị ẩn) */}
            <div className="flex items-center gap-1 lg:hidden">
              <Link to="/" aria-label="Trang chủ" className="mr-2">
                <Logo className="text-2xl" />
              </Link>
              {NAV.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  aria-label={label}
                  className={cn(
                    'rounded-xl p-2 transition-colors',
                    pathname === to
                      ? 'text-accent'
                      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800',
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </Link>
              ))}
            </div>
            <div className="hidden lg:block" />

            {/* Chỉ nút trang cá nhân (avatar + dropdown) */}
            <ProfileMenu user={user} onLogout={onLogout} loggingOut={loggingOut} />
          </div>
        </header>

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
            className="fixed inset-0 z-30 cursor-default"
          />
          <div className="absolute right-0 z-40 mt-2 w-60 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl shadow-zinc-900/10 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex items-center gap-3 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
              <Avatar src={user?.avatarUrl} name={name} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-white">
                  {user?.username ?? '…'}
                </p>
                {user?.displayName && (
                  <p className="truncate text-xs text-zinc-500">{user.displayName}</p>
                )}
              </div>
            </div>

            <Link
              to="/profile"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              <User className="h-4 w-4" strokeWidth={2} />
              Trang cá nhân
            </Link>

            <button
              type="button"
              onClick={onLogout}
              disabled={loggingOut}
              className="flex w-full items-center gap-3 border-t border-zinc-100 px-4 py-2.5 text-left text-sm text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50 dark:border-zinc-800 dark:text-red-400 dark:hover:bg-red-950/40"
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
