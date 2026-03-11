import { motion } from 'framer-motion';
import { CheckCircle2, Loader2, XCircle, Circle, Clock, Radio, Copy } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import { AgentTransaction, CHAIN_CONFIRMATIONS } from '@/types/wallet';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/lib/toast';

interface SettlementTimelineProps {
  tx: AgentTransaction;
}

type StepStatus = 'completed' | 'active' | 'failed' | 'pending';

interface TimelineStep {
  label: string;
  status: StepStatus;
  timestamp?: Date;
  detail?: React.ReactNode;
  activeVariant?: 'spinning' | 'waiting';
}

function formatTime(date: Date | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function truncateHash(hash: string): string {
  if (!hash || hash.length <= 14) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-4)}`;
}

function deriveSteps(tx: AgentTransaction): TimelineStep[] {
  const { status, failedAt, failureReason } = tx;
  const requiredConfirmations = tx.requiredConfirmations ?? CHAIN_CONFIRMATIONS[tx.network] ?? 12;
  const confirmations = tx.confirmations ?? 0;

  // Determine which step failed (if any)
  // failed status can occur at broadcasting or confirming stage
  const failedAtBroadcast = status === 'failed' && !tx.broadcastAt;
  const failedAtConfirming = status === 'failed' && !!tx.broadcastAt && !tx.settledAt;

  // Step 1: 审核通过
  const step1: TimelineStep = {
    label: '审核通过',
    status: 'completed',
    timestamp: tx.reviewedAt,
  };

  // Step 2: 链上广播
  const step2: TimelineStep = (() => {
    if (failedAtBroadcast) {
      return {
        label: '链上广播',
        status: 'failed' as StepStatus,
        timestamp: failedAt ? new Date(failedAt) : undefined,
        detail: failureReason ? (
          <span className="text-xs text-red-500 dark:text-red-400 mt-1 block">{failureReason}</span>
        ) : null,
      };
    }
    if (tx.broadcastAt) {
      return {
        label: '链上广播',
        status: 'completed' as StepStatus,
        timestamp: tx.broadcastAt,
        detail: tx.txHash ? (
          <CopyableHash hash={tx.txHash} />
        ) : null,
      };
    }
    if (status === 'broadcasting') {
      return {
        label: '链上广播',
        status: 'active' as StepStatus,
        activeVariant: 'spinning' as const,
        detail: tx.retryCount && tx.retryCount > 0 ? (
          <span className="text-xs text-muted-foreground mt-1 block">重试 {tx.retryCount} 次</span>
        ) : null,
      };
    }
    // Approved but not yet broadcasting
    if (status === 'approved' && tx.executedAt) {
      return {
        label: '链上广播',
        status: 'active' as StepStatus,
        activeVariant: 'waiting' as const,
      };
    }
    return {
      label: '链上广播',
      status: 'pending' as StepStatus,
    };
  })();

  // Step 3: 等待确认
  const step3: TimelineStep = (() => {
    if (failedAtConfirming) {
      return {
        label: '等待确认',
        status: 'failed' as StepStatus,
        timestamp: failedAt ? new Date(failedAt) : undefined,
        detail: (
          <div className="mt-1.5 space-y-1.5">
            {failureReason && (
              <span className="text-xs text-red-500 dark:text-red-400 block">{failureReason}</span>
            )}
            <div className="flex items-center gap-2">
              <Progress value={(confirmations / requiredConfirmations) * 100} className="h-1.5 flex-1" />
              <span className="text-[11px] text-red-500 dark:text-red-400 shrink-0 font-mono">
                {confirmations}/{requiredConfirmations} 确认
              </span>
            </div>
          </div>
        ),
      };
    }
    if (tx.settledAt) {
      return {
        label: '等待确认',
        status: 'completed' as StepStatus,
        detail: (
          <span className="text-xs text-muted-foreground mt-1 block">
            {requiredConfirmations}/{requiredConfirmations} 确认
          </span>
        ),
      };
    }
    if (status === 'confirming') {
      return {
        label: '等待确认',
        status: 'active' as StepStatus,
        activeVariant: 'spinning' as const,
        detail: (
          <div className="mt-1.5 space-y-1.5">
            <div className="flex items-center gap-2">
              <Progress value={(confirmations / requiredConfirmations) * 100} className="h-1.5 flex-1" />
              <span className="text-[11px] text-muted-foreground shrink-0 font-mono">
                {confirmations}/{requiredConfirmations} 确认
              </span>
            </div>
          </div>
        ),
      };
    }
    return {
      label: '等待确认',
      status: 'pending' as StepStatus,
    };
  })();

  // Step 4: 最终结算
  const step4: TimelineStep = (() => {
    if (status === 'settled' && tx.settledAt) {
      return {
        label: '最终结算',
        status: 'completed' as StepStatus,
        timestamp: tx.settledAt,
        detail: (
          <div className="mt-1 space-y-0.5">
            {tx.gasFee != null && (
              <span className="text-xs text-muted-foreground block">
                Gas 费用: ${tx.gasFee.toFixed(4)}
              </span>
            )}
            {tx.blockNumber != null && (
              <span className="text-xs text-muted-foreground block font-mono">
                区块 #{tx.blockNumber.toLocaleString()}
              </span>
            )}
          </div>
        ),
      };
    }
    // If failed at any prior step, step 4 is just pending
    if (status === 'failed') {
      return {
        label: '最终结算',
        status: 'pending' as StepStatus,
      };
    }
    return {
      label: '最终结算',
      status: 'pending' as StepStatus,
    };
  })();

  return [step1, step2, step3, step4];
}

function CopyableHash({ hash }: { hash: string }) {
  const handleCopy = async () => {
    const ok = await copyToClipboard(hash);
    if (ok) {
      toast.success('已复制');
    } else {
      toast.error('复制失败');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1 mt-1 group cursor-pointer"
    >
      <span className="text-xs text-muted-foreground font-mono group-hover:text-foreground transition-colors">
        {truncateHash(hash)}
      </span>
      <Copy className="w-3 h-3 text-muted-foreground group-hover:text-foreground transition-colors" />
    </button>
  );
}

function StepIcon({ status, activeVariant }: { status: StepStatus; activeVariant?: 'spinning' | 'waiting' }) {
  switch (status) {
    case 'completed':
      return <CheckCircle2 className="w-5 h-5 text-emerald-500 dark:text-emerald-400 shrink-0" />;
    case 'active':
      if (activeVariant === 'waiting') {
        return <Clock className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />;
      }
      return <Loader2 className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0 animate-spin" />;
    case 'failed':
      return <XCircle className="w-5 h-5 text-red-500 dark:text-red-400 shrink-0" />;
    case 'pending':
    default:
      return <Circle className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" />;
  }
}

function ConnectorLine({ fromStatus, toStatus }: { fromStatus: StepStatus; toStatus: StepStatus }) {
  // Completed -> anything: green solid
  // Active step connector (from completed to active): blue dashed
  // Otherwise: gray
  const isCompleted = fromStatus === 'completed' && toStatus === 'completed';
  const isActive = fromStatus === 'completed' && (toStatus === 'active' || toStatus === 'failed');
  const isFailed = toStatus === 'failed';

  return (
    <div
      className={cn(
        'w-0.5 ml-[9px] min-h-[24px] flex-1',
        isCompleted && 'bg-emerald-500 dark:bg-emerald-400',
        isActive && !isFailed && 'border-l-2 border-dashed border-blue-400 dark:border-blue-500 bg-transparent',
        isActive && isFailed && 'border-l-2 border-dashed border-red-400 dark:border-red-500 bg-transparent',
        !isCompleted && !isActive && 'bg-gray-200 dark:bg-gray-700',
      )}
    />
  );
}

function shouldShowTimeline(tx: AgentTransaction): boolean {
  const onChainStatuses = ['broadcasting', 'confirming', 'settled', 'failed'];
  if (onChainStatuses.includes(tx.status)) return true;
  if (tx.status === 'approved' && tx.executedAt) return true;
  return false;
}

export function SettlementTimeline({ tx }: SettlementTimelineProps) {
  if (!shouldShowTimeline(tx)) return null;

  const steps = deriveSteps(tx);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className="rounded-xl bg-card border border-border p-4"
    >
      <h3 className="text-sm font-semibold text-foreground mb-4">链上结算进度</h3>

      <div className="flex flex-col">
        {steps.map((step, index) => (
          <div key={step.label}>
            {/* Step row */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, delay: index * 0.08 }}
              className="flex items-start gap-3"
            >
              <StepIcon status={step.status} activeVariant={step.activeVariant} />

              <div className="flex-1 min-w-0 pb-1">
                <span
                  className={cn(
                    'text-sm font-medium',
                    step.status === 'completed' && 'text-foreground',
                    step.status === 'active' && 'text-blue-600 dark:text-blue-400',
                    step.status === 'failed' && 'text-red-600 dark:text-red-400',
                    step.status === 'pending' && 'text-muted-foreground',
                  )}
                >
                  {step.label}
                </span>

                {step.timestamp && step.status !== 'failed' && (
                  <span className="text-xs text-muted-foreground ml-2">
                    {formatTime(step.timestamp)}
                  </span>
                )}

                {step.timestamp && step.status === 'failed' && (
                  <span className="text-xs text-red-500 dark:text-red-400 ml-2">
                    {formatTime(step.timestamp)}
                  </span>
                )}

                {step.detail}
              </div>
            </motion.div>

            {/* Connector line between steps */}
            {index < steps.length - 1 && (
              <ConnectorLine fromStatus={step.status} toStatus={steps[index + 1].status} />
            )}
          </div>
        ))}
      </div>
    </motion.div>
  );
}
