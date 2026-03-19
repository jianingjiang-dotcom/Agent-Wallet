import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, TrendingDown, CheckCircle2, XCircle, ChevronRight, Clock, Loader2, Bot, Search, Filter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfileSidebar } from '@/components/ProfileSidebar';
import { SearchInput } from '@/components/ui/search-input';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { Transaction, SUPPORTED_CHAINS, ChainId, AgentTransferRequest, isAgentLinked } from '@/types/wallet';
import { PullToRefresh } from '@/components/PullToRefresh';
import { ChainIcon } from '@/components/ChainIcon';
import { toast } from '@/lib/toast';
import { TransactionListSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/EmptyState';
import { AgentTxCard } from '@/components/AgentTxCard';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { AgentTransaction } from '@/types/wallet';

type SourceFilter = 'all' | 'manual' | 'agent' | 'requests';
type FilterType = 'all' | 'send' | 'receive';
type TimeFilter = 'all' | '7d' | '30d' | '3m';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [filter, setFilter] = useState<FilterType>('all');
  const [chainFilter, setChainFilter] = useState<ChainId>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const {
    transactions,
    agentTransactions,
    agentTransferRequests,
    currentWallet,
  } = useWallet();
  const isAgent = isAgentLinked(currentWallet);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const timeFilterCutoff = useMemo(() => {
    if (timeFilter === 'all') return null;
    const now = new Date();
    if (timeFilter === '7d') return new Date(now.getTime() - 7 * 86400000);
    if (timeFilter === '30d') return new Date(now.getTime() - 30 * 86400000);
    return new Date(now.getTime() - 90 * 86400000);
  }, [timeFilter]);

  // Filter manual transactions
  const filteredTransactions = useMemo(() => {
    if (sourceFilter === 'agent') return [];
    return transactions.filter(tx => {
      if (chainFilter !== 'all' && tx.network !== chainFilter) return false;
      if (filter === 'send' && tx.type !== 'send') return false;
      if (filter === 'receive' && tx.type !== 'receive') return false;
      if (timeFilterCutoff && new Date(tx.timestamp) < timeFilterCutoff) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return tx.counterparty.toLowerCase().includes(query) || tx.counterpartyLabel?.toLowerCase().includes(query) || tx.txHash.toLowerCase().includes(query) || tx.symbol.toLowerCase().includes(query);
      }
      return true;
    });
  }, [transactions, filter, chainFilter, searchQuery, sourceFilter, timeFilterCutoff]);

  // Filter agent transactions
  const filteredAgentTransactions = useMemo(() => {
    if (sourceFilter === 'manual') return [];
    return (agentTransactions || []).filter(tx => {
      if (chainFilter !== 'all' && tx.network !== chainFilter) return false;
      if (timeFilterCutoff && new Date(tx.createdAt) < timeFilterCutoff) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return tx.agentName.toLowerCase().includes(query) || tx.toAddress.toLowerCase().includes(query) || tx.toLabel?.toLowerCase().includes(query) || tx.symbol.toLowerCase().includes(query);
      }
      return true;
    });
  }, [agentTransactions, chainFilter, searchQuery, sourceFilter, timeFilterCutoff]);

  // Use infinite scroll hook
  const {
    displayedData: displayedTransactions,
    hasMore,
    isLoadingMore,
    scrollTriggerRef,
    reset: resetInfiniteScroll
  } = useInfiniteScroll({
    data: filteredTransactions,
    pageSize: 10,
    initialCount: 10
  });

  // Reset infinite scroll when filters change
  useEffect(() => {
    resetInfiniteScroll();
  }, [filter, chainFilter, searchQuery, sourceFilter, resetInfiniteScroll]);

  // Group manual transactions by date
  const groupedTransactions = useMemo(() => {
    return displayedTransactions.reduce((groups, tx) => {
      const date = new Date(tx.timestamp).toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
      return groups;
    }, {} as Record<string, Transaction[]>);
  }, [displayedTransactions]);

  // Group agent transactions by date
  const groupedAgentTransactions = useMemo(() => {
    return filteredAgentTransactions.reduce((groups, tx) => {
      const created = tx.createdAt instanceof Date ? tx.createdAt : new Date(tx.createdAt);
      const date = created.toLocaleDateString('zh-CN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(tx);
      return groups;
    }, {} as Record<string, AgentTransaction[]>);
  }, [filteredAgentTransactions]);

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success('已刷新', '交易记录已更新');
  }, []);

  // Filter agent transfer requests (Mode 2: user-initiated)
  const filteredAgentRequests = useMemo(() => {
    if (sourceFilter !== 'all' && sourceFilter !== 'requests') return [];
    return (agentTransferRequests || []).filter(req => {
      if (currentWallet && req.walletId !== currentWallet.id) return false;
      if (chainFilter !== 'all' && req.network !== chainFilter) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return req.toAddress.toLowerCase().includes(q) || req.toLabel?.toLowerCase().includes(q) || req.symbol.toLowerCase().includes(q);
      }
      return true;
    });
  }, [agentTransferRequests, chainFilter, searchQuery, sourceFilter, currentWallet]);

  // Group agent requests by date
  const groupedAgentRequests = useMemo(() => {
    return filteredAgentRequests.reduce((groups, req) => {
      const created = req.createdAt instanceof Date ? req.createdAt : new Date(req.createdAt);
      const date = created.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
      if (!groups[date]) groups[date] = [];
      groups[date].push(req);
      return groups;
    }, {} as Record<string, AgentTransferRequest[]>);
  }, [filteredAgentRequests]);

  // Count of agent transactions for badge
  const agentTxCount = (agentTransactions || []).length;
  const requestCount = filteredAgentRequests.length;

  // Total count for empty state
  const totalCount = sourceFilter === 'agent'
    ? filteredAgentTransactions.length
    : sourceFilter === 'requests'
      ? filteredAgentRequests.length
      : sourceFilter === 'manual'
        ? filteredTransactions.length
        : filteredTransactions.length + filteredAgentTransactions.length + filteredAgentRequests.length;

  return <ProfileSidebar open={showProfileDrawer} onOpenChange={setShowProfileDrawer}>
    <AppLayout
        title="交易记录"
        showNav
        pageBg="bg-page"
        rightAction={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <motion.button
                className="relative flex items-center justify-center w-9 h-9 rounded-full bg-background card-elevated no-card-shadow"
                whileTap={{ scale: 0.9 }}
                transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              >
                <Filter className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
                {(sourceFilter !== 'all' || filter !== 'all' || chainFilter !== 'all' || timeFilter !== 'all') && (
                  <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-accent" />
                )}
              </motion.button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 bg-popover border border-border shadow-xl z-50 max-h-[80vh] overflow-y-auto" container={document.getElementById('phone-frame-container') || undefined}>
              <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">来源</div>
              {([
                { id: 'all' as SourceFilter, label: '全部来源' },
                { id: 'manual' as SourceFilter, label: '手动' },
                { id: 'agent' as SourceFilter, label: 'Agent' },
                ...(isAgent ? [{ id: 'requests' as SourceFilter, label: '请求' }] : []),
              ]).map(item => (
                <DropdownMenuItem key={item.id} onClick={() => { setSourceFilter(item.id); setFilter('all'); }} className={cn("cursor-pointer", sourceFilter === item.id && "bg-muted/50 font-medium")}>
                  {item.label}
                </DropdownMenuItem>
              ))}
              <div className="h-px bg-border my-1" />
              <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">方向</div>
              {([
                { id: 'all' as FilterType, label: '全部方向' },
                { id: 'send' as FilterType, label: '转出' },
                { id: 'receive' as FilterType, label: '收入' },
              ]).map(item => (
                <DropdownMenuItem key={item.id} onClick={() => setFilter(item.id)} className={cn("cursor-pointer", filter === item.id && "bg-muted/50 font-medium")}>
                  {item.label}
                </DropdownMenuItem>
              ))}
              <div className="h-px bg-border my-1" />
              <div className="px-3 py-1.5 text-xs text-muted-foreground font-medium">网络</div>
              {SUPPORTED_CHAINS.map(chain => (
                <DropdownMenuItem key={chain.id} onClick={() => setChainFilter(chain.id)} className={cn("flex items-center gap-2.5 cursor-pointer", chainFilter === chain.id && "bg-muted/50 font-medium")}>
                  <ChainIcon chainId={chain.icon} size="sm" className="shrink-0" />
                  <span>{chain.name}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        }
      >
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 pb-4">

          {isLoading ? <TransactionListSkeleton count={5} showSearchBar showTabs /> : <>
              {/* Search bar */}
              <div className="pt-2 pb-6">
                <SearchInput
                  placeholder="搜索交易..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="h-10"
                  wrapperClassName="w-full"
                />
              </div>
            </>}

          {/* Transactions List */}
          {!isLoading && <div className="space-y-6">
              {/* Manual transactions (shown in 'all' and 'manual' modes) */}
              {sourceFilter !== 'agent' && Object.entries(groupedTransactions).map(([date, txs]) => <motion.div key={`m-${date}`} initial={{
            opacity: 0,
            y: 20
          }} animate={{
            opacity: 1,
            y: 0
          }}>
                  <h3 className="text-[12px] leading-[16px] text-muted-foreground mb-2">
                    {date}
                  </h3>
                  <div className="space-y-2">
                    {txs.map((tx, index) => {
                return <motion.button key={tx.id} initial={{
                  opacity: 0,
                  x: -20
                }} animate={{
                  opacity: 1,
                  x: 0
                }} transition={{
                  delay: 0.05 * index
                }} onClick={() => navigate(`/transaction/${tx.id}`)} className={cn("w-full p-3 rounded-xl flex items-center justify-between text-left transition-all", "hover:bg-muted/30 active:scale-[0.98] active:bg-muted/50", "bg-card border border-border/50")}>
                          <div className="flex items-center gap-2">
                            <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', tx.type === 'receive' ? 'bg-success/10' : 'bg-accent/10')}>
                              {tx.type === 'receive' ? <TrendingDown className="w-4 h-4 text-success rotate-180" /> : <Send className="w-4 h-4 text-accent" />}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-foreground text-sm">
                                  {tx.type === 'receive' ? '转入' : '转出'}
                                </p>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                  {tx.counterpartyLabel || `${tx.counterparty.slice(0, 6)}...${tx.counterparty.slice(-4)}`}
                                </span>
                                <span className="text-xs text-muted-foreground/60">·</span>
                                <span className="text-xs text-muted-foreground">
                                  {SUPPORTED_CHAINS.find(c => c.id === tx.network)?.shortName || tx.network}
                                </span>
                                {tx.status === 'pending' && <span className="text-xs text-warning flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />
                                  </span>}
                                {tx.status === 'confirmed' && <span className="text-xs text-success flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                  </span>}
                                {tx.status === 'failed' && <span className="text-xs text-destructive flex items-center gap-0.5">
                                    <XCircle className="w-3 h-3" />
                                  </span>}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <p className={cn('font-medium text-sm', tx.type === 'receive' ? 'text-success' : 'text-foreground')}>
                                {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.symbol}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${tx.usdValue.toLocaleString()}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </motion.button>;
              })}
                  </div>
                </motion.div>)}

              {/* Agent transactions (shown in 'all' and 'agent' modes) */}
              {sourceFilter !== 'manual' && Object.entries(groupedAgentTransactions).map(([date, txs]) => (
                <motion.div key={`a-${date}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[12px] leading-[16px] text-muted-foreground">{date}</h3>
                    {sourceFilter === 'all' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">Agent</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {txs.map(tx => (
                      <AgentTxCard key={tx.id} tx={tx} onClick={() => navigate(`/agent-review/${tx.id}`)} />
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Agent transfer requests (shown in 'all' and 'requests' modes for agent_linked wallets) */}
              {(sourceFilter === 'all' || sourceFilter === 'requests') && Object.entries(groupedAgentRequests).map(([date, reqs]) => (
                <motion.div key={`r-${date}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-[12px] leading-[16px] text-muted-foreground">{date}</h3>
                    {sourceFilter === 'all' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">请求</span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {reqs.map((req) => {
                      const statusConfig: Record<string, { color: string; label: string }> = {
                        pending: { color: 'text-warning', label: '待处理' },
                        accepted: { color: 'text-accent', label: '已接受' },
                        rejected: { color: 'text-destructive', label: '已拒绝' },
                        executing: { color: 'text-accent', label: '执行中' },
                        completed: { color: 'text-success', label: '已完成' },
                        failed: { color: 'text-destructive', label: '失败' },
                      };
                      const status = statusConfig[req.status] || { color: 'text-muted-foreground', label: req.status };
                      return (
                        <div
                          key={req.id}
                          className="w-full p-3 rounded-xl bg-card border border-border/50 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                              <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-foreground text-sm">请求转账</p>
                                <span className={cn("text-[10px] font-medium", status.color)}>{status.label}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                  {req.toLabel || `${req.toAddress.slice(0, 6)}...${req.toAddress.slice(-4)}`}
                                </span>
                                <span className="text-xs text-muted-foreground/60">·</span>
                                <span className="text-xs text-muted-foreground">
                                  {SUPPORTED_CHAINS.find(c => c.id === req.network)?.shortName || req.network}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-sm text-foreground">
                              -{req.amount} {req.symbol}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ${req.usdValue.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              ))}

              {totalCount === 0 && <EmptyState icon={sourceFilter === 'agent' ? Bot : sourceFilter === 'requests' ? Bot : Send} title={sourceFilter === 'agent' ? '暂无 Agent 交易' : sourceFilter === 'requests' ? '暂无请求记录' : '暂无交易记录'} />}

              {/* Scroll trigger for infinite loading (manual transactions) */}
              {sourceFilter !== 'agent' && filteredTransactions.length > 0 && <>
                  {isLoadingMore && <div className="flex justify-center py-4">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>}

                  {!hasMore && displayedTransactions.length > 0 && <p className="text-center text-sm text-muted-foreground py-4">
                      已加载全部
                    </p>}
                </>}
            </div>}
        </div>
      </PullToRefresh>
    </AppLayout>
    </ProfileSidebar>;
}