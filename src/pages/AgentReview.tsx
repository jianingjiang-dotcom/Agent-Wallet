import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardCheck, ChevronDown, ChevronUp, ShieldCheck } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWallet } from '@/contexts/WalletContext';
import { AgentTxCard } from '@/components/AgentTxCard';
import { AgentReviewDrawer } from '@/components/AgentReviewDrawer';
import { cn } from '@/lib/utils';
import { AgentTransaction, AgentTxStatus } from '@/types/wallet';

type TabValue = 'pending' | 'processing' | 'completed' | 'failed';

const tabs: { value: TabValue; label: string; statuses: AgentTxStatus[] }[] = [
  { value: 'pending', label: '待审核', statuses: ['pending_approval'] },
  { value: 'processing', label: '处理中', statuses: ['approved', 'broadcasting', 'confirming'] },
  { value: 'completed', label: '已完成', statuses: ['settled', 'rejected', 'expired'] },
  { value: 'failed', label: '异常', statuses: ['failed'] },
];

export default function AgentReview() {
  const { agentTransactions, approveAgentTx, rejectAgentTx, retryFailedTx, voidFailedTx } = useWallet();
  const [activeTab, setActiveTab] = useState<TabValue>('pending');
  const [selectedTx, setSelectedTx] = useState<AgentTransaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const statuses = tabs.find(t => t.value === activeTab)!.statuses;
    return agentTransactions
      .filter(tx => statuses.includes(tx.status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [agentTransactions, activeTab]);

  // Group pending transactions by Agent
  const groupedPending = useMemo(() => {
    if (activeTab !== 'pending') return [];
    const groups = new Map<string, AgentTransaction[]>();
    for (const tx of filtered) {
      const key = tx.agentName || tx.agentId;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tx);
    }
    return Array.from(groups.entries()).map(([name, txs]) => ({
      name,
      txs,
      totalUsd: txs.reduce((s, tx) => s + tx.usdValue, 0),
      allSafe: txs.every(tx => tx.riskScore === 'green'),
    }));
  }, [filtered, activeTab]);

  const toggleGroupCollapse = (name: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  return (
    <AppLayout title="Agent 审核" showBack showNav showSecurityBanner={false}>
      <div className="px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => {
            const count = agentTransactions.filter(tx => tab.statuses.includes(tx.status)).length;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                className={cn(
                  'flex-1 pb-2 text-sm font-medium transition-colors relative',
                  activeTab === tab.value ? 'text-accent' : 'text-muted-foreground'
                )}
              >
                {tab.label}
                {count > 0 && (tab.value === 'pending' || tab.value === 'processing' || tab.value === 'failed') && (
                  <span className={cn(
                    'ml-1 inline-flex items-center justify-center w-4 h-4 rounded-full text-white text-[10px] font-bold',
                    tab.value === 'pending' ? 'bg-amber-500' : tab.value === 'failed' ? 'bg-red-500' : 'bg-blue-500'
                  )}>
                    {count}
                  </span>
                )}
                {activeTab === tab.value && (
                  <motion.div
                    layoutId="review-tab-indicator"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>

        {/* Transaction list */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-12 text-center"
            >
              <ClipboardCheck className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" />
              <p className="text-sm text-muted-foreground">暂无交易记录</p>
            </motion.div>
          ) : activeTab === 'pending' && groupedPending.length > 0 ? (
            /* Grouped view for pending tab */
            <motion.div
              key="grouped-pending"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              {groupedPending.map((group) => {
                const isCollapsed = collapsedGroups.has(group.name);
                return (
                  <div key={group.name}>
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroupCollapse(group.name)}
                      className="w-full flex items-center gap-2 py-2 text-left"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-foreground truncate">{group.name}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                            {group.txs.length} 笔
                          </span>
                          {group.allSafe && (
                            <span className="flex items-center gap-0.5 text-[10px] text-emerald-600 dark:text-emerald-400">
                              <ShieldCheck className="w-3 h-3" />
                              安全
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          ${group.totalUsd.toLocaleString()}
                        </span>
                      </div>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>

                    {/* Group transactions */}
                    <AnimatePresence>
                      {!isCollapsed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="space-y-2 overflow-hidden"
                        >
                          {group.txs.map((tx, i) => (
                            <motion.div
                              key={tx.id}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.03 }}
                            >
                              <AgentTxCard
                                tx={tx}
                                onClick={() => {
                                  setSelectedTx(tx);
                                  setDrawerOpen(true);
                                }}
                              />
                            </motion.div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </motion.div>
          ) : (
            /* Flat list for other tabs */
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filtered.map((tx, i) => (
                <motion.div
                  key={tx.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <AgentTxCard
                    tx={tx}
                    onClick={() => { setSelectedTx(tx); setDrawerOpen(true); }}
                  />
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <AgentReviewDrawer
        tx={selectedTx}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onApprove={approveAgentTx}
        onReject={rejectAgentTx}
        onRetry={retryFailedTx}
        onVoid={voidFailedTx}
      />
    </AppLayout>
  );
}
