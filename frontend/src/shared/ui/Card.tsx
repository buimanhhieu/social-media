import { type ReactNode } from 'react';
import { cn } from '@shared/lib/cn';

/** Khung nền (surface) bao nội dung để không bị trôi trên nền trơn. */
export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-line bg-surface p-5 shadow-sm shadow-stone-900/5 dark:border-line-dark dark:bg-surface-dark sm:p-6',
        className,
      )}
    >
      {children}
    </div>
  );
}
