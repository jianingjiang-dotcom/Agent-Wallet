import { CheckCircle2, XCircle } from 'lucide-react';
import { PolicyEffect } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface PolicyEffectBadgeProps {
  effect: PolicyEffect;
  className?: string;
}

const effectConfig: Record<PolicyEffect, {
  label: string;
  color: string;
  bg: string;
  Icon: typeof CheckCircle2;
}> = {
  allow: {
    label: '允许',
    color: 'text-emerald-700 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-900/40',
    Icon: CheckCircle2,
  },
  deny: {
    label: '拒绝',
    color: 'text-red-700 dark:text-red-400',
    bg: 'bg-red-100 dark:bg-red-900/40',
    Icon: XCircle,
  },
};

export function PolicyEffectBadge({ effect, className }: PolicyEffectBadgeProps) {
  const config = effectConfig[effect];
  const { Icon } = config;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium',
        config.color,
        config.bg,
        className,
      )}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}
