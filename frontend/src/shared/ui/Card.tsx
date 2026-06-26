import { type ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

/** Khung nền (surface) bao nội dung để không bị trôi trên nền trơn. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'card-elev rounded-2xl bg-surface p-6 ring-1 ring-stone-900/[0.04] dark:bg-surface-dark dark:ring-white/[0.06] sm:p-7',
        className,
      )}
    >
      {children}
    </div>
  );
}
