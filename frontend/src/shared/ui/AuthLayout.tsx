import { type ReactNode } from 'react';
import { Logo } from './Logo';

interface AuthLayoutProps {
  title: string;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <main className="grid min-h-dvh grid-cols-1 lg:grid-cols-2">
      {/* Brand panel — desktop only */}
      <aside className="brand-gradient relative hidden flex-col justify-between overflow-hidden p-12 lg:flex">
        <Logo tone="white" className="text-4xl" />

        <div className="relative z-10 max-w-md">
          <h2 className="text-4xl font-bold leading-tight tracking-tight text-white">
            Chia sẻ khoảnh khắc.
            <br />
            Kết nối thế giới.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/80">
            Đăng ảnh, theo dõi bạn bè và khám phá những câu chuyện mới mỗi ngày.
          </p>
        </div>

        <p className="relative z-10 text-sm text-white/60">© 2026 Viper Chat</p>

        {/* soft light overlays for depth */}
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-black/10 blur-3xl" />
      </aside>

      {/* Form column */}
      <section className="relative flex min-h-dvh flex-col items-center justify-center overflow-hidden bg-zinc-50 px-6 py-10 dark:bg-zinc-950">
        {/* ambient brand wash so the panel reads composed, not empty */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-72 w-72 rounded-full bg-accent/10 blur-3xl dark:bg-accent/20" />
        <div className="pointer-events-none absolute -bottom-24 left-0 h-72 w-72 rounded-full bg-orange-400/10 blur-3xl" />

        <div className="animate-rise relative z-10 w-full max-w-md">
          <div className="mb-6 flex justify-center lg:hidden">
            <Logo className="text-3xl" />
          </div>

          <div className="rounded-2xl border border-zinc-200/80 bg-white/90 p-8 shadow-xl shadow-zinc-900/5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/80">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
            )}

            <div className="mt-8">{children}</div>

            {footer && (
              <div className="mt-6 border-t border-zinc-100 pt-5 text-sm text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
                {footer}
              </div>
            )}
          </div>

          <p className="mt-6 text-center text-xs leading-relaxed text-zinc-400 dark:text-zinc-600">
            Bằng việc tiếp tục, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của Viper Chat.
          </p>
        </div>
      </section>
    </main>
  );
}
