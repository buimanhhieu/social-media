import { type ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '@shared/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-white shadow-sm shadow-accent/30 hover:brightness-110 disabled:opacity-50',
  secondary:
    'border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800',
  ghost:
    'bg-transparent text-zinc-600 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-11 px-4 text-sm',
  lg: 'h-12 px-6 text-base',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = 'primary', size = 'md', fullWidth, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-xl font-semibold transition',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-zinc-50 dark:focus-visible:ring-offset-zinc-950',
        'active:scale-[0.98] disabled:cursor-not-allowed disabled:active:scale-100',
        'motion-reduce:transition-none motion-reduce:active:scale-100',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className,
      )}
      {...props}
    />
  );
});
