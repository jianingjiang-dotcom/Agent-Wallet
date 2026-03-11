import { useMemo } from 'react';
import {
  Wallet, ArrowUpDown, Shield, QrCode, Send, Lock,
  AlertCircle, PiggyBank, Clock, HelpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

interface QuickActionsProps {
  onAction: (text: string) => void;
}

interface ActionItem {
  label: string;
  message: string;
  icon: LucideIcon;
  priority: number; // lower = higher priority
}

// Static fallback actions
const STATIC_ACTIONS: ActionItem[] = [
  { label: '查余额', message: '查看我的各币种余额', icon: Wallet, priority: 10 },
  { label: '最近交易', message: '最近的交易记录有哪些', icon: ArrowUpDown, priority: 11 },
  { label: '资金风控', message: '查看资金风控状态', icon: Shield, priority: 12 },
  { label: '如何收款', message: '如何使用收款功能', icon: QrCode, priority: 20 },
  { label: '如何转账', message: '如何发起转账', icon: Send, priority: 21 },
  { label: '如何保护资产', message: '如何保护我的钱包资产安全', icon: Lock, priority: 22 },
];

export function QuickActions({ onAction }: QuickActionsProps) {
  const { assets, transactions, pendingAgentTxCount } = useWallet();

  const actions = useMemo(() => {
    const dynamic: ActionItem[] = [];

    // Context-aware suggestions
    if (pendingAgentTxCount > 0) {
      dynamic.push({
        label: `${pendingAgentTxCount}笔待审核`,
        message: '查看待审核的Agent交易',
        icon: AlertCircle,
        priority: 1,
      });
    }

    const totalUsd = assets.reduce((sum, a) => sum + a.usdValue, 0);
    if (totalUsd === 0) {
      dynamic.push({
        label: '如何充值',
        message: '我的钱包余额为零，如何充值',
        icon: PiggyBank,
        priority: 2,
      });
    }

    // Check for recent transactions (within last hour)
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const recentTx = transactions.find(tx => tx.timestamp > oneHourAgo && tx.type === 'send');
    if (recentTx) {
      dynamic.push({
        label: '查转账状态',
        message: `查看最近一笔转账 ${recentTx.amount} ${recentTx.symbol} 的状态`,
        icon: Clock,
        priority: 3,
      });
    }

    // Merge dynamic + static, sort by priority, take top 6
    const merged = [...dynamic, ...STATIC_ACTIONS];
    merged.sort((a, b) => a.priority - b.priority);
    return merged.slice(0, 6);
  }, [assets, transactions, pendingAgentTxCount]);

  // Split into two rows
  const row1 = actions.slice(0, 3);
  const row2 = actions.slice(3, 6);

  return (
    <div className="space-y-2 px-4 py-2">
      <div className="flex flex-wrap gap-2">
        {row1.map(a => (
          <button
            key={a.label}
            onClick={() => onAction(a.message)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors"
          >
            <a.icon className="w-3 h-3 text-accent" />
            {a.label}
          </button>
        ))}
      </div>
      {row2.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {row2.map(a => (
            <button
              key={a.label}
              onClick={() => onAction(a.message)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-full border border-border bg-card text-foreground hover:bg-muted transition-colors"
            >
              <a.icon className="w-3 h-3 text-accent" />
              {a.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
