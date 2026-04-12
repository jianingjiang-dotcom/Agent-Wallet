import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardCheck, ChevronRight, AlertTriangle,
  Activity, TrendingUp, PauseCircle,
  BarChart3
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';
import type { AgentTransaction, AgentRiskConfig } from '@/types/wallet';

function computeStats(
  agentTransactions: AgentTransaction[],
  pendingAgentTxCount: number,
  agentRiskConfigs: AgentRiskConfig[]
) {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayTxs = agentTransactions.filter(tx => {
      const created = tx.createdAt instanceof Date ? tx.createdAt : new Date(tx.createdAt);
      return created >= todayStart;
    });
    const todaySettled = todayTxs.filter(tx => tx.status === 'settled');
    const todayTerminal = todayTxs.filter(tx =>
      ['settled', 'failed', 'rejected', 'expired'].includes(tx.status)
    );
    const todayVolume = todaySettled.reduce((s, tx) => s + tx.usdValue, 0);
    const successRate = todayTerminal.length > 0
      ? Math.round((todaySettled.length / todayTerminal.length) * 100)
      : 100;

    const pendingTxs = agentTransactions.filter(tx => tx.status === 'pending_approval');
    const pendingTotalUsd = pendingTxs.reduce((sum, tx) => sum + tx.usdValue, 0);
    const maxRisk = pendingTxs.reduce<'green' | 'yellow' | 'red'>((max, tx) => {
      const score = tx.riskScore || 'green';
      if (score === 'red') return 'red';
      if (score === 'yellow' && max !== 'red') return 'yellow';
      return max;
    }, 'green');

    const failedCount = agentTransactions.filter(tx => tx.status === 'failed').length;
    const processingCount = agentTransactions.filter(
      tx => tx.status === 'broadcasting' || tx.status === 'confirming'
    ).length;
    const pausedWallets = (agentRiskConfigs || []).filter(c => c.isPaused).length;

    return {
      todayProcessed: todayTxs.length,
      todayVolume,
      successRate,
      pendingCount: pendingAgentTxCount,
      pendingTotalUsd,
      maxRisk,
      failedCount,
      processingCount,
      pausedWallets,
    };
  } catch {
    return {
      todayProcessed: 0, todayVolume: 0, successRate: 100,
      pendingCount: 0, pendingTotalUsd: 0, maxRisk: 'green' as const,
      failedCount: 0, processingCount: 0, pausedWallets: 0,
    };
  }
}

export function AgentOperationsCard() {
  const navigate = useNavigate();
  const {
    agentTransactions,
    pendingAgentTxCount,
    agentRiskConfigs,
  } = useWallet();

  const stats = useMemo(
    () => computeStats(agentTransactions, pendingAgentTxCount, agentRiskConfigs),
    [agentTransactions, pendingAgentTxCount, agentRiskConfigs]
  );

  // Don't render if no agent activity at all
  const hasAnyActivity = stats.todayProcessed > 0 || stats.pendingCount > 0
    || stats.failedCount > 0 || stats.processingCount > 0 || stats.pausedWallets > 0;

  if (!hasAnyActivity) return null;

  const riskColors = {
    green: 'text-emerald-600 dark:text-emerald-400',
    yellow: 'text-amber-600 dark:text-amber-400',
    red: 'text-red-600 dark:text-red-400',
  };
  const riskLabels = { green: '低风险', yellow: '中风险', red: '高风险' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="space-y-2"
    >
      {/* Section Header */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-1.5">
          <Activity className="w-3.5 h-3.5 text-accent" />
          <span className="text-xs font-medium text-muted-foreground">Agent 运营</span>
        </div>
        <button
          onClick={() => navigate('/settlement-dashboard')}
          className="flex items-center gap-0.5 text-xs text-accent active:opacity-70"
        >
          <BarChart3 className="w-3 h-3" />
          详细报表
        </button>
      </div>

      {/* Today's Stats */}
      {stats.todayProcessed > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl card-glass"
        >
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">{stats.todayProcessed}</p>
              <p className="text-[10px] text-muted-foreground">今日处理</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground">
                ${stats.todayVolume >= 1000
                  ? `${(stats.todayVolume / 1000).toFixed(1)}k`
                  : stats.todayVolume.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground">今日总额</p>
            </div>
            <div className="text-center">
              <p className={`text-lg font-bold ${stats.successRate >= 90 ? 'text-emerald-600 dark:text-emerald-400' : stats.successRate >= 70 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                {stats.successRate}%
              </p>
              <p className="text-[10px] text-muted-foreground">成功率</p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Pending Approval */}
      {stats.pendingCount > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => navigate('/agent-review')}
          className="w-full p-3 rounded-xl status-glow-info flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-4.5 h-4.5 text-accent" strokeWidth={1.5} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-foreground">
              {stats.pendingCount} 笔交易待审核
            </p>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                ${stats.pendingTotalUsd.toLocaleString()}
              </span>
              {stats.maxRisk !== 'green' && (
                <span className={`text-[10px] font-medium ${riskColors[stats.maxRisk]}`}>
                  {riskLabels[stats.maxRisk]}
                </span>
              )}
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </motion.button>
      )}

      {/* Alerts Row */}
      {(stats.failedCount > 0 || stats.pausedWallets > 0) && (
        <div className="flex gap-2">
          {stats.failedCount > 0 && (
            <motion.button
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => navigate('/agent-review')}
              className="flex-1 p-2.5 rounded-xl status-glow-danger flex items-center gap-2 active:scale-[0.98] transition-transform"
            >
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" strokeWidth={1.5} />
              <div className="text-left min-w-0">
                <p className="text-xs font-medium text-red-700 dark:text-red-400">
                  {stats.failedCount} 笔失败
                </p>
              </div>
            </motion.button>
          )}
          {stats.pausedWallets > 0 && (
            <motion.button
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.12 }}
              onClick={() => navigate('/agent-settings')}
              className="flex-1 p-2.5 rounded-xl status-glow-warning flex items-center gap-2 active:scale-[0.98] transition-transform"
            >
              <PauseCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" strokeWidth={1.5} />
              <div className="text-left min-w-0">
                <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                  {stats.pausedWallets} 个钱包暂停
                </p>
              </div>
            </motion.button>
          )}
        </div>
      )}

      {/* Processing Indicator */}
      {stats.processingCount > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          onClick={() => navigate('/agent-review')}
          className="w-full p-2.5 rounded-xl status-glow-info flex items-center gap-2 active:scale-[0.98] transition-transform"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <TrendingUp className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={1.5} />
          </motion.div>
          <p className="text-xs font-medium text-blue-700 dark:text-blue-400">
            {stats.processingCount} 笔交易链上处理中
          </p>
        </motion.button>
      )}
    </motion.div>
  );
}
