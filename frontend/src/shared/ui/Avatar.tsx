import { cn } from '@shared/lib/cn';

interface AvatarProps {
  src?: string | null;
  name?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-16 w-16 text-xl',
};

export function Avatar({ src, name, size = 'md', className }: AvatarProps) {
  const initial = (name ?? '?').trim().charAt(0).toUpperCase() || '?';
  return src ? (
    <img
      src={src}
      alt={name ?? 'avatar'}
      className={cn('shrink-0 rounded-full object-cover', sizes[size], className)}
    />
  ) : (
    <span
      className={cn(
        'brand-gradient flex shrink-0 items-center justify-center rounded-full font-semibold text-white',
        sizes[size],
        className,
      )}
    >
      {initial}
    </span>
  );
}
