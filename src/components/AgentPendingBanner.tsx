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
          className="w-full p-3 rounded-xl bg-destructive/8 border border-destructive/20 flex items-center gap-3 active:scale-[0.98] transition-transform"
        >
          <div className="w-9 h-9 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4.5 h-4.5 text-destructive" strokeWidth={1.5} />
          </div>
          <div className="flex-1 text-left min-w-0">
            <p className="text-sm font-medium text-destructive">
              {failedCount} 笔交易执行失败
            </p>
            <p className="text-xs text-destructive/70/60">
              需要处理：重试或作废
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-destructive shrink-0" />
        </motion.button>
      )}
    </div>
  );
}
