import { type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, LogOut, PlusSquare } from 'lucide-react';
import { Logo } from './Logo';
import { cn } from '@shared/lib/cn';

interface AppShellProps {
  children: ReactNode;
  onLogout: () => void;
  loggingOut?: boolean;
}

export function AppShell({ children, onLogout, loggingOut }: AppShellProps) {
  const { pathname } = useLocation();

  return (
    <div className="min-h-dvh bg-zinc-50 dark:bg-zinc-950">
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/80 backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
        <div className="mx-auto flex h-16 max-w-2xl items-center justify-between px-4">
          <Link to="/" aria-label="Trang chủ">
            <Logo className="text-2xl" />
          </Link>
          <nav className="flex items-center gap-1">
            <NavIcon to="/" active={pathname === '/'} label="Trang chủ">
              <Home className="h-5 w-5" strokeWidth={2} />
            </NavIcon>
            <NavIcon to="/create" active={pathname === '/create'} label="Tạo bài">
              <PlusSquare className="h-5 w-5" strokeWidth={2} />
            </NavIcon>
            <button
              type="button"
              aria-label="Đăng xuất"
              disabled={loggingOut}
              onClick={onLogout}
              className="rounded-xl p-2 text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              <LogOut className="h-5 w-5" strokeWidth={2} />
            </button>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-6">{children}</main>
    </div>
  );
}

function NavIcon({
  to,
  active,
  label,
  children,
}: {
  to: string;
  active: boolean;
  label: string;
  children: ReactNode;
}) {
  return (
    <Link
      to={to}
      aria-label={label}
      className={cn(
        'rounded-xl p-2 transition-colors',
        active
          ? 'text-accent'
          : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-300 dark:hover:bg-zinc-800 dark:hover:text-white',
      )}
    >
      {children}
    </Link>
  );
}
