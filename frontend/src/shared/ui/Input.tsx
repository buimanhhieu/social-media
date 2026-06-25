import { type InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '@shared/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, label, hint, error, id, ...props },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        ref={ref}
        aria-invalid={error ? true : undefined}
        className={cn(
          'h-11 w-full rounded-xl border bg-white px-3.5 text-sm text-zinc-900 transition-colors',
          'placeholder:text-zinc-400',
          'focus-visible:border-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40',
          'dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder:text-zinc-500',
          error
            ? 'border-red-500 dark:border-red-500/70'
            : 'border-zinc-300 dark:border-zinc-700',
          className,
        )}
        {...props}
      />
      {hint && !error && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      )}
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
});
