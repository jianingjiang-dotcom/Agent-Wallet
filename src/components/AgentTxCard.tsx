import { motion } from 'framer-motion';
import { Bot, Clock, CheckCircle2, XCircle, AlertTriangle, TimerOff, Radio, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AgentTransaction } from '@/types/wallet';
import { CryptoIcon } from '@/components/CryptoIcon';
import { StatusBadge } from '@/components/ui/status-badge';
import { Progress } from '@/components/ui/progress';

interface AgentTxCardProps {
  tx: AgentTransaction;
  onClick: () => void;
  className?: string;
}

const statusConfig = {
  pending_approval: { label: '待审核', icon: Clock, color: 'text-amber-600 dark:text-amber-400', bg: 'status-glow-warning' },
  approved: { label: '已批准', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-card border border-border' },
  rejected: { label: '已拒绝', icon: XCircle, color: 'text-red-600 dark:text-red-400', bg: 'bg-card border border-border' },
  expired: { label: '已过期', icon: TimerOff, color: 'text-gray-500 dark:text-gray-400', bg: 'bg-card border border-border' },
  broadcasting: { label: '广播中', icon: Radio, color: 'text-blue-600 dark:text-blue-400', bg: 'status-glow-info' },
  confirming: { label: '确认中', icon: Loader2, color: 'text-purple-600 dark:text-purple-400', bg: 'status-glow-info' },
  settled: { label: '已结算', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-card border border-border' },
  failed: { label: '失败', icon: AlertTriangle, color: 'text-red-600 dark:text-red-400', bg: 'status-glow-danger' },
};

const riskConfig = {
  green: { label: '安全', variant: 'success' as const },
  yellow: { label: '可疑', variant: 'warning' as const },
  red: { label: '高危', variant: 'danger' as const },
};

function formatCountdown(expiresAt: Date): string {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return '已过期';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}分钟`;
  const hours = Math.floor(mins / 60);
  return `${hours}小时${mins % 60}分`;
}

export function AgentTxCard({ tx, onClick, className }: AgentTxCardProps) {
  const status = statusConfig[tx.status];
  const risk = riskConfig[tx.riskScore];
  const StatusIcon = status.icon;

  return (
    <motion.button
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-xl text-left transition-all active:scale-[0.98]',
        className || status.bg
      )}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <CryptoIcon symbol={tx.symbol} size="md" />
          <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-primary/30 to-primary/10 ring-2 ring-card flex items-center justify-center">
            <Bot className="w-2.5 h-2.5 text-accent" />
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0">
              <span className="font-medium text-sm truncate">{tx.agentName}</span>
              <StatusBadge variant={risk.variant} size="sm">{risk.label}</StatusBadge>
            </div>
            <div className="text-right shrink-0 ml-2">
              <p className="font-semibold text-sm">{tx.amount.toLocaleString()} {tx.symbol}</p>
              <p className="text-[11px] text-muted-foreground">${tx.usdValue.toLocaleString()}</p>
            </div>
          </div>

          <p className="text-xs text-muted-foreground mt-1 truncate font-mono">
            → {tx.toLabel || `${tx.toAddress.slice(0, 10)}...${tx.toAddress.slice(-6)}`}
          </p>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <StatusIcon className={cn('w-3.5 h-3.5', status.color, tx.status === 'confirming' && 'animate-spin', tx.status === 'broadcasting' && 'animate-pulse')} />
              <span className={cn('text-xs font-medium', status.color)}>{status.label}</span>
            </div>
            {tx.status === 'pending_approval' && (
              <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                剩余 {formatCountdown(tx.expiresAt)}
              </span>
            )}
            {tx.reviewedBy && (
              <span className="text-[11px] text-muted-foreground">{tx.reviewedBy}</span>
            )}
          </div>

          {tx.status === 'confirming' && tx.confirmations != null && tx.requiredConfirmations && (
            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-purple-600 dark:text-purple-400 font-medium">确认进度</span>
                <span className="text-muted-foreground">{tx.confirmations}/{tx.requiredConfirmations}</span>
              </div>
              <Progress value={(tx.confirmations / tx.requiredConfirmations) * 100} className="h-1.5" />
            </div>
          )}

          {tx.status === 'failed' && tx.failureReason && (
            <p className="text-[11px] text-destructive mt-1 truncate">{tx.failureReason}</p>
          )}
        </div>
      </div>
    </motion.button>
  );
}
