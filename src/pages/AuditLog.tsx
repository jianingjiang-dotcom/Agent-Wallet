import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, Shield, Key, AlertTriangle,
  PauseCircle, PlayCircle, Pencil, FileText, Clock,
  ChevronDown, Download
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';

type AuditAction =
  | 'tx_approved'
  | 'tx_rejected'
  | 'tx_modified'
  | 'tx_auto_approved'
  | 'risk_config_changed'
  | 'api_key_created'
  | 'api_key_revoked'
  | 'wallet_paused'
  | 'wallet_resumed'
  | 'whitelist_added'
  | 'whitelist_removed';

type AuditFilterType = 'all' | 'approval' | 'config' | 'api_key';

interface AuditEntry {
  id: string;
  action: AuditAction;
  actor: string;
  timestamp: Date;
  details: string;
  metadata?: Record<string, string>;
}

const actionConfig: Record<AuditAction, { label: string; icon: typeof CheckCircle2; color: string }> = {
  tx_approved: { label: '交易批准', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
  tx_rejected: { label: '交易拒绝', icon: XCircle, color: 'text-red-600 dark:text-red-400' },
  tx_modified: { label: '交易修改', icon: Pencil, color: 'text-blue-600 dark:text-blue-400' },
  tx_auto_approved: { label: '自动放行', icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
  risk_config_changed: { label: '风控变更', icon: Shield, color: 'text-amber-600 dark:text-amber-400' },
  api_key_created: { label: 'API Key 创建', icon: Key, color: 'text-blue-600 dark:text-blue-400' },
  api_key_revoked: { label: 'API Key 撤销', icon: Key, color: 'text-red-600 dark:text-red-400' },
  wallet_paused: { label: '钱包暂停', icon: PauseCircle, color: 'text-amber-600 dark:text-amber-400' },
  wallet_resumed: { label: '钱包恢复', icon: PlayCircle, color: 'text-emerald-600 dark:text-emerald-400' },
  whitelist_added: { label: '白名单添加', icon: Shield, color: 'text-emerald-600 dark:text-emerald-400' },
  whitelist_removed: { label: '白名单移除', icon: AlertTriangle, color: 'text-amber-600 dark:text-amber-400' },
};

const filterTabs: { value: AuditFilterType; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'approval', label: '审批' },
  { value: 'config', label: '配置' },
  { value: 'api_key', label: 'API Key' },
];

const filterMap: Record<AuditFilterType, AuditAction[]> = {
  all: [],
  approval: ['tx_approved', 'tx_rejected', 'tx_modified', 'tx_auto_approved'],
  config: ['risk_config_changed', 'wallet_paused', 'wallet_resumed', 'whitelist_added', 'whitelist_removed'],
  api_key: ['api_key_created', 'api_key_revoked'],
};

// Mock audit data
const mockAuditEntries: AuditEntry[] = [
  { id: '1', action: 'tx_approved', actor: 'Sarah Chen', timestamp: new Date(Date.now() - 300000), details: '批准 Trading Bot 交易 2,500 USDT → Binance Hot Wallet', metadata: { amount: '2,500 USDT', risk: '低风险' } },
  { id: '2', action: 'tx_rejected', actor: 'Sarah Chen', timestamp: new Date(Date.now() - 1800000), details: '拒绝 Payment Agent 交易 15,000 USDC → 可疑地址', metadata: { amount: '15,000 USDC', reason: '高危地址' } },
  { id: '3', action: 'tx_auto_approved', actor: '系统', timestamp: new Date(Date.now() - 3600000), details: '自动放行 Trading Bot 交易 150 USDT（低于阈值 $500）', metadata: { amount: '150 USDT', rule: '金额 < $500' } },
  { id: '4', action: 'risk_config_changed', actor: 'Sarah Chen', timestamp: new Date(Date.now() - 7200000), details: '修改我的钱包自动放行阈值: $200 → $500' },
  { id: '5', action: 'tx_modified', actor: 'Sarah Chen', timestamp: new Date(Date.now() - 10800000), details: '修改 Trading Bot 交易金额: 1,200 ETH → 1,000 ETH' },
  { id: '6', action: 'whitelist_added', actor: 'Sarah Chen', timestamp: new Date(Date.now() - 14400000), details: '添加 Binance Deposit 到我的钱包白名单' },
  { id: '7', action: 'api_key_created', actor: 'Sarah Chen', timestamp: new Date(Date.now() - 86400000), details: '创建 API Key: Trading Bot Key', metadata: { permissions: 'balance_read, tx_send' } },
  { id: '8', action: 'tx_approved', actor: 'Sarah Chen', timestamp: new Date(Date.now() - 86400000 - 3600000), details: '批准 Payment Agent 交易 750 USDT → 结算地址' },
  { id: '9', action: 'wallet_paused', actor: 'Sarah Chen', timestamp: new Date(Date.now() - 172800000), details: '紧急暂停 Trading Wallet 的 Agent 交易' },
  { id: '10', action: 'wallet_resumed', actor: 'Sarah Chen', timestamp: new Date(Date.now() - 172800000 + 7200000), details: '恢复 Trading Wallet 的 Agent 交易' },
  { id: '11', action: 'api_key_revoked', actor: 'Sarah Chen', timestamp: new Date(Date.now() - 259200000), details: '撤销 API Key: Old Payment Key', metadata: { reason: '已过期' } },
  { id: '12', action: 'tx_auto_approved', actor: '系统', timestamp: new Date(Date.now() - 259200000 - 1800000), details: '自动放行 Trading Bot 交易 80 USDT（低于阈值）' },
  { id: '13', action: 'whitelist_removed', actor: 'Sarah Chen', timestamp: new Date(Date.now() - 345600000), details: '从 Trading Wallet 白名单移除可疑地址 0xSusp...' },
  { id: '14', action: 'risk_config_changed', actor: 'Sarah Chen', timestamp: new Date(Date.now() - 345600000 - 3600000), details: '切换 Trading Wallet 控制模式: 手动 → 混合' },
];

function formatTime(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  if (diff < 60000) return '刚刚';
  if (diff < 3600000) return `${Math.floor(diff / 60000)} 分钟前`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)} 小时前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }) + ' ' +
    date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
}

function groupByDate(entries: AuditEntry[]): [string, AuditEntry[]][] {
  const groups = new Map<string, AuditEntry[]>();
  for (const entry of entries) {
    const date = entry.timestamp.toLocaleDateString('zh-CN', {
      year: 'numeric', month: 'long', day: 'numeric'
    });
    if (!groups.has(date)) groups.set(date, []);
    groups.get(date)!.push(entry);
  }
  return Array.from(groups.entries());
}

export default function AuditLog() {
  const [filter, setFilter] = useState<AuditFilterType>('all');

  const filtered = useMemo(() => {
    if (filter === 'all') return mockAuditEntries;
    const actions = filterMap[filter];
    return mockAuditEntries.filter(e => actions.includes(e.action));
  }, [filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const handleExport = () => {
    toast.success('导出中', '审计日志 CSV 正在准备...');
  };

  return (
    <AppLayout title="审计日志" showBack showNav showSecurityBanner={false}>
      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{filtered.length} 条记录</span>
          </div>
          <Button variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={handleExport}>
            <Download className="w-3.5 h-3.5" />
            导出 CSV
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-1 p-1 rounded-xl bg-muted/50">
          {filterTabs.map(tab => (
            <button
              key={tab.value}
              onClick={() => setFilter(tab.value)}
              className={cn(
                'flex-1 py-2 text-xs font-medium rounded-lg transition-all',
                filter === tab.value
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Timeline */}
        <div className="space-y-6">
          {grouped.map(([date, entries]) => (
            <div key={date}>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">{date}</h3>
              <div className="space-y-1">
                {entries.map((entry, index) => {
                  const config = actionConfig[entry.action];
                  const Icon = config.icon;
                  return (
                    <motion.div
                      key={entry.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="flex gap-3 p-3 rounded-xl bg-card border border-border/50"
                    >
                      <div className={cn('w-8 h-8 rounded-full flex items-center justify-center shrink-0 bg-muted')}>
                        <Icon className={cn('w-4 h-4', config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={cn('text-xs font-medium', config.color)}>{config.label}</span>
                          <span className="text-[10px] text-muted-foreground shrink-0 flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" />
                            {formatTime(entry.timestamp)}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mt-0.5 leading-relaxed">{entry.details}</p>
                        <p className="text-[11px] text-muted-foreground mt-1">操作人: {entry.actor}</p>
                        {entry.metadata && (
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {Object.entries(entry.metadata).map(([key, value]) => (
                              <span key={key} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                                {value}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
