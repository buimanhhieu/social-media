import { cn } from '@shared/lib/cn';

interface LogoProps {
  /** 'gradient' for light surfaces, 'white' for the brand panel. */
  tone?: 'gradient' | 'white';
  className?: string;
}

export function Logo({ tone = 'gradient', className }: LogoProps) {
  return (
    <span
      className={cn(
        'font-display leading-none',
        tone === 'white' ? 'text-white' : 'brand-text-gradient',
        className,
      )}
    >
      Viper Study
    </span>
  );
}
