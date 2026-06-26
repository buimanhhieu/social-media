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
    'border border-line bg-surface text-stone-800 hover:bg-canvas disabled:opacity-50 dark:border-line-dark dark:bg-surface-dark dark:text-stone-100 dark:hover:bg-stone-800',
  ghost:
    'bg-transparent text-stone-600 hover:bg-canvas disabled:opacity-50 dark:text-stone-300 dark:hover:bg-stone-800',
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
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/50 focus-visible:ring-offset-2 focus-visible:ring-offset-stone-50 dark:focus-visible:ring-offset-stone-950',
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
