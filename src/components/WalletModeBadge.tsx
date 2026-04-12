import { ShieldOff, UserCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { WalletControlMode } from '@/types/wallet';

const modeConfig: Record<WalletControlMode, { label: string; icon: typeof ShieldOff; color: string; bg: string }> = {
  block: { label: '拦截', icon: ShieldOff, color: 'text-orange-700 dark:text-orange-400', bg: 'bg-orange-100 dark:bg-orange-900/40' },
  manual_review: { label: '审批', icon: UserCheck, color: 'text-blue-700 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-900/40' },
};

interface WalletModeBadgeProps {
  mode?: WalletControlMode;
  className?: string;
}

export function WalletModeBadge({ mode, className }: WalletModeBadgeProps) {
  if (!mode) return null;
  const config = modeConfig[mode];
  if (!config) return null;
  const Icon = config.icon;

  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium', config.bg, config.color, className)}>
      <Icon className="w-3 h-3" strokeWidth={2} />
      {config.label}
    </span>
  );
}
