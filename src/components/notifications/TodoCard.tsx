import { useNavigate } from 'react-router-dom';
import { Shield, Key, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { CryptoIconWithChain } from '@/components/CryptoIconWithChain';
import type { TodoItem, ExcessApprovalMeta, TssSigningMeta, PactApprovalMeta, StatusVariant } from '@/types/notification';
import type { ChainId } from '@/types/wallet';

interface TodoCardProps {
  item: TodoItem;
}

// ── txType → tag label ──
const txTypeTagLabels: Record<string, string> = {
  transfer: '转账',
  contract_interaction: '合约交易',
  message_signing: '消息签名',
};

// ── Format amount ──
function formatAmount(amount: number, symbol: string): string {
  const formatted = amount % 1 === 0
    ? amount.toLocaleString()
    : parseFloat(amount.toFixed(6)).toLocaleString(undefined, { maximumFractionDigits: 6 });
  return `${formatted} ${symbol}`;
}

// ── Status badge per type ──
function getStatusBadge(item: TodoItem): { label: string; variant: StatusVariant } {
  if (item.type === 'tss_signing') {
    if (item.status === 'pending') return { label: '待签名', variant: 'warning' };
    if (item.status === 'approved') return { label: '已签名', variant: 'success' };
    if (item.status === 'failed') return { label: '签名失败', variant: 'error' };
    return { label: '已拒绝', variant: 'error' };
  }
  if (item.status === 'pending') return { label: '待审批', variant: 'warning' };
  if (item.status === 'approved') return { label: '已通过', variant: 'success' };
  if (item.status === 'failed') return { label: '失败', variant: 'error' };
  return { label: '已拒绝', variant: 'error' };
}

// ── Derive display fields per type ──
function deriveFields(item: TodoItem) {
  const meta = item.metadata;

  if (meta.type === 'tss_signing') {
    const m = meta as TssSigningMeta;
    return {
      title: '交易签名',
      tag: txTypeTagLabels[m.txType] || m.txType,
      subtitle: m.eip712?.domain.name || m.toAddress || '',
      amount: m.amount && m.symbol ? formatAmount(m.amount, m.symbol) : null,
    };
  }

  if (meta.type === 'pact_approval') {
    const m = meta as PactApprovalMeta;
    return {
      title: 'Pact 创建',
      tag: m.txType ? (txTypeTagLabels[m.txType] || m.txType) : null,
      subtitle: m.intent,
      amount: null,
    };
  }

  // excess_approval
  const m = meta as ExcessApprovalMeta;
  return {
    title: 'Pact 交易',
    tag: txTypeTagLabels[m.txType] || m.txType,
    subtitle: m.pactName,
    amount: formatAmount(m.amount, m.symbol),
  };
}

export function TodoCard({ item }: TodoCardProps) {
  const navigate = useNavigate();
  const meta = item.metadata;
  const { title, tag, subtitle, amount } = deriveFields(item);
  const statusBadge = getStatusBadge(item);

  // Render icon based on todo type
  const renderIcon = () => {
    if (meta.type === 'excess_approval') {
      const m = meta as ExcessApprovalMeta;
      return <CryptoIconWithChain symbol={m.symbol} chainId={m.chainId as ChainId} size="lg" />;
    }
    if (meta.type === 'tss_signing') {
      const m = meta as TssSigningMeta;
      if (m.txType === 'message_signing') {
        return (
          <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
          </div>
        );
      }
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

  return (
    <button
      onClick={() => navigate(item.route)}
      className="w-full p-3 rounded-xl border border-border bg-card transition-colors active:bg-muted/50 text-left"
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 pt-0.5">
          {renderIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Row 1: title + tag ... amount */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0 truncate">
              <span className="text-sm font-normal text-foreground">{title}</span>
              {tag && (
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-muted/60 text-muted-foreground shrink-0">
                  {tag}
                </span>
              )}
            </div>
            {amount && (
              <span className="text-sm font-normal text-foreground whitespace-nowrap flex-shrink-0">
                {amount}
              </span>
            )}
          </div>

          {/* Row 2: subtitle ... status badge */}
          <div className="flex items-center justify-between gap-2 mt-0.5">
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
            <div className="flex-shrink-0">
              <StatusBadge label={statusBadge.label} variant={statusBadge.variant} />
            </div>
          </div>
        </div>
      </div>
    </button>
  );
}
