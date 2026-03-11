import { useState, useCallback, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, TrendingDown, CheckCircle2, XCircle, ChevronRight, Clock, ChevronDown, Loader2, Bot } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { SearchInput } from '@/components/ui/search-input';
import { FilterPills, type FilterPillItem } from '@/components/ui/filter-pills';
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

export default function HistoryPage() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [filter, setFilter] = useState<FilterType>('all');
  const [chainFilter, setChainFilter] = useState<ChainId>('all');
  const [isLoading, setIsLoading] = useState(true);
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

  // Filter manual transactions
  const filteredTransactions = useMemo(() => {
    if (sourceFilter === 'agent') return [];
    return transactions.filter(tx => {
      if (chainFilter !== 'all' && tx.network !== chainFilter) return false;
      if (filter === 'send' && tx.type !== 'send') return false;
      if (filter === 'receive' && tx.type !== 'receive') return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return tx.counterparty.toLowerCase().includes(query) || tx.counterpartyLabel?.toLowerCase().includes(query) || tx.txHash.toLowerCase().includes(query) || tx.symbol.toLowerCase().includes(query);
      }
      return true;
    });
  }, [transactions, filter, chainFilter, searchQuery, sourceFilter]);

  // Filter agent transactions
  const filteredAgentTransactions = useMemo(() => {
    if (sourceFilter === 'manual') return [];
    return (agentTransactions || []).filter(tx => {
      if (chainFilter !== 'all' && tx.network !== chainFilter) return false;
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        return tx.agentName.toLowerCase().includes(query) || tx.toAddress.toLowerCase().includes(query) || tx.toLabel?.toLowerCase().includes(query) || tx.symbol.toLowerCase().includes(query);
      }
      return true;
    });
  }, [agentTransactions, chainFilter, searchQuery, sourceFilter]);

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

  return <AppLayout title="交易" showNav pageBg="bg-page">
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 py-4">

          {isLoading ? <TransactionListSkeleton count={5} showSearchBar showTabs /> : <>
              {/* Source Filter Tabs — top level */}
              <FilterPills
                variant="tab"
                items={[
                  { id: 'all' as SourceFilter, label: '全部' },
                  { id: 'manual' as SourceFilter, label: '手动' },
                  { id: 'agent' as SourceFilter, label: 'Agent', icon: <Bot className="w-3.5 h-3.5" />, badge: agentTxCount },
                  ...(isAgent ? [{ id: 'requests' as SourceFilter, label: '请求', badge: requestCount }] : []),
                ]}
                value={sourceFilter}
                onChange={(v) => { setSourceFilter(v); setFilter('all'); }}
                className="mb-3"
              />

              {/* Search + Chain Filter */}
              <div className="flex gap-2 mb-3">
                <SearchInput
                  placeholder="搜索交易..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="h-10"
                  wrapperClassName="flex-1"
                />

                {/* Chain Filter Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="h-10 px-3 gap-1.5 shrink-0">
                      <ChainIcon chainId={chainFilter} size="sm" />
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 bg-popover border border-border shadow-xl z-50 max-h-[60vh] overflow-y-auto" container={document.getElementById('phone-frame-container') || undefined}>
                    {SUPPORTED_CHAINS.map(chain => {
                      const isSelected = chainFilter === chain.id;
                      return <DropdownMenuItem key={chain.id} onClick={() => setChainFilter(chain.id)} className={cn("flex items-center gap-3 py-2.5 px-3 cursor-pointer hover:bg-muted/50 focus:bg-muted/50", isSelected && "bg-muted/50")}>
                        <ChainIcon chainId={chain.icon} size="md" className="shrink-0" />
                        <span className="font-medium text-sm text-foreground">
                          {chain.name}
                        </span>
                      </DropdownMenuItem>;
                    })}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>

              {/* Type sub-filter tabs — only for manual/all views */}
              {sourceFilter !== 'agent' && (
                <div className="border-b border-border mb-4">
                  <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                    {([
                      { value: 'all' as const, label: '全部' },
                      { value: 'send' as const, label: '转出' },
                      { value: 'receive' as const, label: '收入' },
                    ]).map(tab => (
                      <button key={tab.value} onClick={() => setFilter(tab.value)} className={cn("px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative", filter === tab.value ? "text-accent" : "text-muted-foreground hover:text-foreground")}>
                        {tab.label}
                        {filter === tab.value && <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-accent rounded-full" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}
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
                  <h3 className="text-sm font-medium text-muted-foreground mb-3">
                    {date}
                  </h3>
                  <div className="space-y-1.5">
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
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>
                    {sourceFilter === 'all' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent font-medium">Agent</span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {txs.map(tx => (
                      <AgentTxCard key={tx.id} tx={tx} onClick={() => navigate(`/agent-review/${tx.id}`)} />
                    ))}
                  </div>
                </motion.div>
              ))}

              {/* Agent transfer requests (shown in 'all' and 'requests' modes for agent_linked wallets) */}
              {(sourceFilter === 'all' || sourceFilter === 'requests') && Object.entries(groupedAgentRequests).map(([date, reqs]) => (
                <motion.div key={`r-${date}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="text-sm font-medium text-muted-foreground">{date}</h3>
                    {sourceFilter === 'all' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 font-medium">请求</span>
                    )}
                  </div>
                  <div className="space-y-1.5">
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
    </AppLayout>;
}