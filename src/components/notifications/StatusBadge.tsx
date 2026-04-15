import { cn } from '@/lib/utils';
import type { StatusVariant } from '@/types/notification';

interface StatusBadgeProps {
  label: string;
  variant: StatusVariant;
  className?: string;
}

const variantStyles: Record<StatusVariant, string> = {
  success: 'bg-success/10 text-success',
  error: 'bg-destructive/10 text-destructive',
  warning: 'bg-warning/10 text-warning',
  info: 'bg-primary/10 text-primary',
  muted: 'bg-muted text-muted-foreground',
};

export function StatusBadge({ label, variant, className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 text-[11px] font-medium rounded-full whitespace-nowrap',
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
