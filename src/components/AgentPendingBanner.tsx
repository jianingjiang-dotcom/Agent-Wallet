import { motion } from 'framer-motion';
import { ClipboardCheck, ChevronRight, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';

export function AgentPendingBanner() {
  const navigate = useNavigate();
  const { pendingAgentTxCount, agentTransactions } = useWallet();

  const failedCount = agentTransactions.filter(tx => tx.status === 'failed').length;

  if (pendingAgentTxCount === 0 && failedCount === 0) return null;

  const totalUsd = agentTransactions
    .filter(tx => tx.status === 'pending_approval')
    .reduce((sum, tx) => sum + tx.usdValue, 0);

  return (
    <div className="space-y-2">
      {pendingAgentTxCount > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/agent-review')}
          className="w-full p-3 rounded-xl bg-accent/10 border border-accent/20 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center shrink-0">
            <ClipboardCheck className="w-4.5 h-4.5 text-accent" strokeWidth={1.5} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-foreground">
              {pendingAgentTxCount} 笔 Agent 交易待审核
            </p>
            <p className="text-xs text-muted-foreground">
              总金额 ${totalUsd.toLocaleString()}
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
        </motion.button>
      )}

      {failedCount > 0 && (
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          onClick={() => navigate('/agent-review')}
          className="w-full p-3 rounded-xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-red-100 dark:bg-red-900/40 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-red-600 dark:text-red-400" strokeWidth={1.5} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-red-700 dark:text-red-400">
              {failedCount} 笔交易执行失败
            </p>
            <p className="text-xs text-red-500/70 dark:text-red-400/60">
              需要处理：重试或作废
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-red-400 shrink-0" />
        </motion.button>
      )}
    </div>
  );
}
