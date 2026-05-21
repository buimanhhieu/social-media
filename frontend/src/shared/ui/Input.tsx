import { type InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '@shared/lib/cn';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, error, ...props },
  ref,
) {
  return (
    <div className="flex flex-col gap-1">
      <input
        ref={ref}
        className={cn(
          'h-10 rounded-md border bg-white px-3 text-sm',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
          error ? 'border-red-500' : 'border-zinc-300',
          className,
        )}
        {...props}
      />
      {error && <span className="text-xs text-red-600">{error}</span>}
    </div>
  );
});
