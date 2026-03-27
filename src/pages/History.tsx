import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, TrendingDown, CheckCircle2, XCircle, X, ChevronRight, ChevronDown, Clock, Loader2, Bot, Search, ListFilter } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ProfileSidebar } from '@/components/ProfileSidebar';
import { SearchInput } from '@/components/ui/search-input';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { getChainIconUrl } from '@/lib/crypto-icons';
import { Transaction, SUPPORTED_CHAINS, ChainId, AgentTransferRequest, isAgentLinked } from '@/types/wallet';
import { PullToRefresh } from '@/components/PullToRefresh';
import { ChainIcon } from '@/components/ChainIcon';
import { toast } from '@/lib/toast';
import { TransactionListSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/EmptyState';
import { EmptyIcon } from '@/components/icons/EmptyIcon';
import { AgentTxCard } from '@/components/AgentTxCard';
import { useInfiniteScroll } from '@/hooks/useInfiniteScroll';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Drawer, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
import type { AgentTransaction } from '@/types/wallet';

type SourceFilter = 'all' | 'manual' | 'agent' | 'requests';
type FilterType = 'all' | 'send' | 'receive';
type TimeFilter = 'all' | '7d' | '30d' | '3m';
type TxTypeFilter = 'all' | 'transfer' | 'contract';

export default function HistoryPage() {
  const navigate = useNavigate();
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>('all');
  const [filter, setFilter] = useState<FilterType>('all');
  const [chainFilter, setChainFilter] = useState<ChainId>('all');
  const [isLoading, setIsLoading] = useState(true);
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('all');
  const [chainDrawerOpen, setChainDrawerOpen] = useState(false);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [txTypeFilter, setTxTypeFilter] = useState<TxTypeFilter>('all');
  const {
    transactions,
    agentTransactions,
    agentTransferRequests,
    currentWallet,
  } = useWallet();
  const isAgent = isAgentLinked(currentWallet);

  // Search bar always visible at top

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
        leftAction={
          <>
            <motion.button
              className="flex items-center justify-center"
              whileTap={{ scale: 0.95 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => setChainDrawerOpen(true)}
            >
              {chainFilter === 'all' ? (
                <img src="/networks.svg" alt="网络筛选" className="w-6 h-6" />
              ) : (
                <ChainIcon chainId={SUPPORTED_CHAINS.find(c => c.id === chainFilter)?.icon || chainFilter} size="md" className="shrink-0 !w-6 !h-6" />
              )}
            </motion.button>
          </>
        }
        rightAction={
          <>
            <motion.button
              className="relative flex items-center justify-center w-6 h-6"
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              onClick={() => setFilterDrawerOpen(true)}
            >
              <img src="/funnel.svg" alt="筛选" className="w-5 h-5" />
              {(filter !== 'all' || txTypeFilter !== 'all') && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#E74E5A', boxShadow: '0 0 0 1.5px white' }} />
              )}
            </motion.button>
            {/* Chain selector full page rendered via portal below */}
            <Drawer open={filterDrawerOpen} onOpenChange={setFilterDrawerOpen}>
              <DrawerContent className="px-0 pb-0">
                <div>
                  <div className="flex items-center h-6 px-4 mt-4" style={{ fontSize: '16px', lineHeight: '24px', color: '#73798B' }}>资金方向</div>
                  <div className="px-4 mt-3">
                    <div className="flex gap-3 w-full">
                      {([
                        { id: 'all' as FilterType, label: '全部' },
                        { id: 'receive' as FilterType, label: '转入' },
                        { id: 'send' as FilterType, label: '转出' },
                      ]).map(item => (
                        <button
                          key={item.id}
                          onClick={() => setFilter(item.id)}
                          className={cn(
                            "flex-1 px-4 py-[10px] rounded-[12px] text-base font-medium transition-colors leading-6"
                          )}
                          style={{ backgroundColor: filter === item.id ? 'rgba(31,50,214,0.05)' : '#F8F9FC', color: '#1c1c1c', boxShadow: filter === item.id ? 'inset 0 0 0 1px #1F32D6' : 'none' }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="px-4 mt-6" style={{ paddingBottom: '58px' }}>
                    <div className="mb-3" style={{ fontSize: '16px', lineHeight: '24px', color: '#73798B' }}>交易类型</div>
                    <div className="flex gap-3 w-full">
                      {([
                        { id: 'all' as TxTypeFilter, label: '全部' },
                        { id: 'transfer' as TxTypeFilter, label: '转账' },
                        { id: 'contract' as TxTypeFilter, label: '合约调用' },
                      ]).map(item => (
                        <button
                          key={item.id}
                          onClick={() => setTxTypeFilter(item.id)}
                          className={cn(
                            "flex-1 px-4 py-[10px] rounded-[12px] text-base font-medium transition-colors leading-6"
                          )}
                          style={{ backgroundColor: txTypeFilter === item.id ? 'rgba(31,50,214,0.05)' : '#F8F9FC', color: '#1c1c1c', boxShadow: txTypeFilter === item.id ? 'inset 0 0 0 1px #1F32D6' : 'none' }}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </>
        }
      >
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 pb-4">

          {isLoading ? <TransactionListSkeleton count={5} showSearchBar showTabs /> : <>
              {/* Search bar */}
              <div className="sticky top-0 z-10 pt-2 pb-2 bg-page -mx-4 px-4">
                <SearchInput
                  placeholder="搜索交易..."
                  value={searchQuery}
                  onChange={setSearchQuery}
                  className="h-10 bg-[#F7F8FA] border-0 rounded-full pl-10 focus-visible:ring-0 focus-visible:ring-offset-0"
                  wrapperClassName="w-full"
                />
              </div>
            </>}

          {/* Transactions List */}
          {!isLoading && <div className="space-y-6 py-4">
              {/* Manual transactions grouped by date */}
              {sourceFilter !== 'agent' && (() => {
                const grouped = displayedTransactions.reduce<Record<string, typeof displayedTransactions>>((acc, tx) => {
                  const dateKey = new Date(tx.timestamp).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
                  if (!acc[dateKey]) acc[dateKey] = [];
                  acc[dateKey].push(tx);
                  return acc;
                }, {});
                let globalIndex = 0;
                return Object.entries(grouped).map(([dateLabel, txs]) => (
                  <div key={dateLabel}>
                    <h3 className="text-muted-foreground mb-3" style={{ fontSize: '14px', lineHeight: '20px' }}>{dateLabel}</h3>
                    <div>
                      {txs.map((tx) => {
                        const idx = globalIndex++;
                        return <motion.button key={tx.id} initial={{
                          opacity: 0,
                          x: -20
                        }} animate={{
                          opacity: 1,
                          x: 0
                        }} transition={{
                          delay: 0.05 * Math.min(idx, 10)
                        }} onClick={() => navigate(`/transaction/${tx.id}`)} className={cn("w-full py-3 px-0 flex items-center justify-between text-left transition-all", "active:scale-[0.98] active:bg-muted/50")}>
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 relative">
                              <ChainIcon chainId={tx.symbol.toLowerCase()} size="lg" className="!w-9 !h-9" />
                              <img src={getChainIconUrl(tx.network)} alt={tx.network} className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium text-foreground" style={{ fontSize: '16px', lineHeight: '24px' }}>
                                  {tx.type === 'receive' ? '转入' : '转出'}
                                </p>
                              </div>
                              <p style={{ fontSize: '12px', lineHeight: '16px', color: '#73798B' }}>
                                {tx.type === 'receive' ? '发送方 ' : '收款方 '}{tx.counterpartyLabel || (tx.counterparty ? `${tx.counterparty.slice(0, 6)}...${tx.counterparty.slice(-4)}` : '')}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn('font-medium', tx.type === 'receive' ? 'text-success' : 'text-foreground')} style={{ fontSize: '16px', lineHeight: '24px' }}>
                              {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.symbol}
                            </p>
                            <p className="text-xs" style={{ color: tx.status === 'pending' ? undefined : tx.status === 'confirmed' ? '#73798B' : undefined }}>
                              <span className={tx.status === 'pending' ? 'text-warning' : tx.status === 'failed' ? 'text-destructive' : ''} style={tx.status === 'confirmed' ? { color: '#73798B' } : undefined}>
                                {tx.status === 'pending' ? '进行中' : tx.status === 'confirmed' ? '已完成' : '失败'}
                              </span>
                            </p>
                          </div>
                        </motion.button>;
                      })}
                    </div>
                  </div>
                ));
              })()}


              {totalCount === 0 && <div className="flex-1 flex items-center justify-center" style={{ minHeight: 'calc(100vh - 280px)' }}><div style={{ marginTop: '-15vh' }}><EmptyState customIcon={<EmptyIcon />} title={sourceFilter === 'agent' ? '暂无 Agent 交易' : sourceFilter === 'requests' ? '暂无请求记录' : '无任何交易记录'} /></div></div>}

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

    {/* Chain selector full page */}
    <AnimatePresence>
      {chainDrawerOpen && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'tween', duration: 0.3, ease: 'easeOut' }}
          className="absolute inset-0 z-[200] bg-white flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between h-[44px] px-4 shrink-0">
            <button onClick={() => setChainDrawerOpen(false)} className="flex items-center justify-center w-6 h-6">
              <X className="w-6 h-6" strokeWidth={1.5} style={{ color: '#1c1c1c' }} />
            </button>
            <span className="font-semibold text-foreground" style={{ fontSize: '18px', lineHeight: '28px' }}>选择网络</span>
            <div className="w-6 h-6" />
          </div>
          {/* List */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-0 pt-2">
              {SUPPORTED_CHAINS.map(chain => (
                <button
                  key={chain.id}
                  onClick={() => { setChainFilter(chain.id); setChainDrawerOpen(false); }}
                  className={cn(
                    "flex items-center gap-3 w-full py-4 px-4 rounded-none text-base leading-6 transition-colors",
                    chainFilter === chain.id ? "font-medium" : "font-medium text-foreground"
                  )}
                  style={chainFilter === chain.id ? { backgroundColor: '#F8F9FC' } : undefined}
                >
                  {chain.id === 'all' ? (
                    <img src="/networks.svg" alt="全部网络" className="w-9 h-9" />
                  ) : (
                    <ChainIcon chainId={chain.icon} size="lg" className="shrink-0 !w-9 !h-9" />
                  )}
                  <span className="flex-1 text-left text-base leading-6 font-medium">{chain.name}</span>
                  {chainFilter === chain.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1F32D6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="M20 6 9 17l-5-5"/></svg>
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>

    </ProfileSidebar>;
}