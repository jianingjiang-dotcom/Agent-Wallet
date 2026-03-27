import { ArrowUpDown, FileCode, MapPin, Coins, Link, ChevronUp, ChevronDown } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { PolicyEffectBadge } from '@/components/PolicyEffectBadge';
import { AgentPolicy, PolicyType } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface PolicyCardProps {
  policy: AgentPolicy;
  index: number;
  isFirst: boolean;
  isLast: boolean;
  onToggleEnabled: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onClick: () => void;
}

const POLICY_ICONS: Record<PolicyType, typeof ArrowUpDown> = {
  transfer_rules: ArrowUpDown,
  contract_call_rules: FileCode,
  address_rules: MapPin,
  token_rules: Coins,
  chain_rules: Link,
};

const POLICY_LABELS: Record<PolicyType, string> = {
  transfer_rules: '转账规则',
  contract_call_rules: '合约调用规则',
  address_rules: '地址规则',
  token_rules: '代币规则',
  chain_rules: '链规则',
};

function getPolicySummary(policy: AgentPolicy): string {
  switch (policy.type) {
    case 'transfer_rules': {
      const c = policy.config;
      const parts: string[] = [];
      if (c.maxValuePerTx) parts.push(`单笔 ≤ $${c.maxValuePerTx.toLocaleString()}`);
      if (c.maxValuePerDay) parts.push(`日限 $${c.maxValuePerDay.toLocaleString()}`);
      if (c.maxValuePerMonth) parts.push(`月限 $${c.maxValuePerMonth.toLocaleString()}`);
      if (c.maxCountPerDay) parts.push(`${c.maxCountPerDay} 笔/日`);
      return parts.join(' · ') || '无限制';
    }
    case 'contract_call_rules': {
      const c = policy.config;
      const count = c.contracts.length;
      return count > 0 ? `${count} 个合约` : '无合约限制';
    }
    case 'address_rules': {
      const c = policy.config;
      return `${c.addresses.length} 个地址`;
    }
    case 'token_rules': {
      const c = policy.config;
      if (c.tokens.length === 0) return '无代币';
      return c.tokens.map(t => t.symbol).join(', ');
    }
    case 'chain_rules': {
      const c = policy.config;
      if (c.chains.length === 0) return '无链';
      const chainLabels: Record<string, string> = {
        ethereum: 'ETH', bsc: 'BSC', tron: 'TRON', solana: 'SOL',
      };
      return c.chains.map(ch => chainLabels[ch] || ch).join(', ');
    }
    default:
      return '';
  }
}

export function PolicyCard({
  policy, index, isFirst, isLast,
  onToggleEnabled, onMoveUp, onMoveDown, onClick,
}: PolicyCardProps) {
  const Icon = POLICY_ICONS[policy.type];
  const typeLabel = POLICY_LABELS[policy.type];

  return (
    <div
      className={cn(
        'card-elevated p-3 transition-all',
        !policy.enabled && 'opacity-50',
      )}
    >
      {/* Main clickable area */}
      <button
        className="w-full text-left"
        onClick={onClick}
      >
        <div className="flex items-start gap-2.5">
          {/* Priority number */}
          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-[10px] font-bold text-muted-foreground">{index + 1}</span>
          </div>

          {/* Icon */}
          <div className="w-7 h-7 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
            <Icon className="w-3.5 h-3.5 text-accent" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium truncate">{policy.name}</span>
              <PolicyEffectBadge effect={policy.effect} />
            </div>
            <p className="text-xs text-muted-foreground mt-0.5 truncate">
              {typeLabel} · {getPolicySummary(policy)}
            </p>
          </div>
        </div>
      </button>

      {/* Controls row */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-border/50">
        <div className="flex items-center gap-2">
          <Switch
            checked={policy.enabled}
            onCheckedChange={onToggleEnabled}
            className="scale-75 origin-left"
          />
          <span className="text-[10px] text-muted-foreground">
            {policy.enabled ? '启用中' : '已禁用'}
          </span>
        </div>

        <div className="flex items-center gap-0.5">
          <button
            onClick={(e) => { e.stopPropagation(); onMoveUp(); }}
            disabled={isFirst}
            className={cn(
              'p-1 rounded transition-colors',
              isFirst && 'opacity-30 cursor-not-allowed',
            )}
          >
            <ChevronUp className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onMoveDown(); }}
            disabled={isLast}
            className={cn(
              'p-1 rounded transition-colors',
              isLast && 'opacity-30 cursor-not-allowed',
            )}
          >
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
