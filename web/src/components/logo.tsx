import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
};

export const Logo = ({ className }: LogoProps) => (
  <div
    className={cn(
      'inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 font-display text-sm uppercase tracking-[0.2em] text-primary',
      className
    )}
  >
    <span>SI</span>
    <span className="text-foreground/70">News AI</span>
  </div>
);

