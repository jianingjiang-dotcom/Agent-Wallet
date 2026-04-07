import { useNavigate } from 'react-router-dom';
import { Shield, Key, CheckCircle2, XCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { CryptoIconWithChain } from '@/components/CryptoIconWithChain';
import type { TodoItem, TodoType, ExcessApprovalMeta, TssSigningMeta, PactApprovalMeta, StatusVariant } from '@/types/notification';
import type { ChainId } from '@/types/wallet';

interface TodoCardProps {
  item: TodoItem;
}

function formatAmount(amount: number, symbol: string): string {
  const formatted = amount % 1 === 0 ? amount.toLocaleString() : parseFloat(amount.toFixed(6)).toLocaleString(undefined, { maximumFractionDigits: 6 });
  return `${formatted} ${symbol}`;
}

function getStatusBadge(item: TodoItem): { label: string; variant: StatusVariant } {
  if (item.status === 'pending') return { label: '待处理', variant: 'warning' };
  if (item.status === 'approved') {
    return { label: item.type === 'tss_signing' ? '已签名' : '已通过', variant: 'success' };
  }
  return { label: '已拒绝', variant: 'error' };
}

export function TodoCard({ item }: TodoCardProps) {
  const navigate = useNavigate();
  const meta = item.metadata;

  const handleClick = () => {
    navigate(item.route);
  };

  // Render icon based on todo type
  const renderIcon = () => {
    if (meta.type === 'excess_approval') {
      const m = meta as ExcessApprovalMeta;
      return <CryptoIconWithChain symbol={m.symbol} chainId={m.chainId as ChainId} size="lg" />;
    }
    if (meta.type === 'tss_signing') {
      const m = meta as TssSigningMeta;
      if (m.symbol && m.chainId) {
        return <CryptoIconWithChain symbol={m.symbol} chainId={m.chainId as ChainId} size="lg" />;
      }
      return (
        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <Key className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
        </div>
      );
    }
    // pact_approval
    return (
      <div className="w-10 h-10 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
        <Shield className="w-5 h-5 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
      </div>
    );
  };

  // Right side amount for transaction types
  const renderAmount = () => {
    if (meta.type === 'excess_approval') {
      return formatAmount((meta as ExcessApprovalMeta).amount, (meta as ExcessApprovalMeta).symbol);
    }
    if (meta.type === 'tss_signing') {
      const m = meta as TssSigningMeta;
      if (m.amount && m.symbol) return formatAmount(m.amount, m.symbol);
    }
    return null;
  };

  // Extra info line
  const renderExtraInfo = () => {
    return null;
  };

  const amountStr = renderAmount();
  const extraInfo = renderExtraInfo();
  const statusBadge = getStatusBadge(item);

  return (
    <button
      onClick={handleClick}
      className="w-full p-3 rounded-xl border border-border bg-card transition-colors active:bg-muted/50 text-left"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 pt-0.5">
          {renderIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-normal text-foreground truncate">
              {item.title}
            </p>
            {amountStr && (
              <span className="text-sm font-normal text-foreground whitespace-nowrap flex-shrink-0">
                {amountStr}
              </span>
            )}
          </div>

          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground truncate">
              {item.summary}
            </p>
            <div className="flex-shrink-0">
              <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
            </div>
          </div>

          {extraInfo && (
            <p className="text-xs text-muted-foreground/70 truncate mt-0.5">
              {extraInfo}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
