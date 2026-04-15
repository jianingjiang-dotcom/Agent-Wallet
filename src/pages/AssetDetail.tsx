import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ChevronLeft, Send, QrCode, TrendingDown,
  CheckCircle2, AlertCircle, ChevronRight, Clock, XCircle, Bot
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useWallet, aggregateByChain } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { AddressDisplay } from '@/components/AddressDisplay';
import { CryptoIconWithChain } from '@/components/CryptoIconWithChain';
import { ChainIcon } from '@/components/ChainIcon';
import { TransactionListSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/EmptyState';
import { SwipeBack } from '@/components/SwipeBack';
import { ChainId, SUPPORTED_CHAINS, Transaction, isAgentLinked } from '@/types/wallet';
import { useRequireRecovery } from '@/hooks/useRequireRecovery';
import { RecoveryRequiredDrawer } from '@/components/RecoveryRequiredDrawer';

export default function AssetDetailPage() {
  const { symbol } = useParams<{ symbol: string }>();
  const [searchParams] = useSearchParams();
  const chainParam = searchParams.get('chain') as ChainId | null;
  const navigate = useNavigate();

  // Address filter: 'all' means show all addresses combined
  const [selectedAddressId, setSelectedAddressId] = useState<string>('all');

  const [isLoading, setIsLoading] = useState(false);
  const { assets, transactions, currentWallet } = useWallet();
  const isAgent = isAgentLinked(currentWallet);
  const { guard, drawerOpen, setDrawerOpen } = useRequireRecovery();

  // Get chain-aggregated asset data
  const chainAssets = useMemo(() => aggregateByChain(assets, currentWallet), [assets, currentWallet]);

  // Find the specific ChainAsset for this symbol + chain
  const assetData = useMemo(() => {
    if (!symbol) return null;
    if (chainParam && chainParam !== 'all') {
      return chainAssets.find(a => a.symbol === symbol && a.network === chainParam) || null;
    }
    // Fallback: find first matching symbol
    return chainAssets.find(a => a.symbol === symbol) || null;
  }, [chainAssets, symbol, chainParam]);

  // Computed display balance based on selected address
  const displayBalance = useMemo(() => {
    if (!assetData) return { balance: 0, usdValue: 0 };
    if (selectedAddressId === 'all') {
      return { balance: assetData.totalBalance, usdValue: assetData.totalUsdValue };
    }
    const addrData = assetData.addresses.find(a => a.addressId === selectedAddressId);
    return addrData ? { balance: addrData.balance, usdValue: addrData.usdValue } : { balance: 0, usdValue: 0 };
  }, [assetData, selectedAddressId]);

  // Filter transactions for this asset + chain + optional address
  const assetTransactions = useMemo(() => {
    let filtered = transactions.filter(tx => tx.symbol === symbol);
    if (assetData) {
      filtered = filtered.filter(tx => tx.network === assetData.network);
    }
    // TODO: filter by addressId when transactions have that field
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, symbol, assetData]);

  // Group transactions by date and limit to 5 items
  const groupedTransactions = useMemo(() => {
    const MAX_DISPLAY = 5;
    const displayTxs = assetTransactions.slice(0, MAX_DISPLAY);

    const groups: { date: string; dateLabel: string; transactions: Transaction[] }[] = [];

    displayTxs.forEach(tx => {
      const txDate = new Date(tx.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);

      let dateLabel: string;
      const dateKey = txDate.toDateString();

      if (txDate.toDateString() === today.toDateString()) {
        dateLabel = '今天';
      } else if (txDate.toDateString() === yesterday.toDateString()) {
        dateLabel = '昨天';
      } else {
        dateLabel = `${txDate.getMonth() + 1}月${txDate.getDate()}日`;
      }

      const existingGroup = groups.find(g => g.date === dateKey);
      if (existingGroup) {
        existingGroup.transactions.push(tx);
      } else {
        groups.push({ date: dateKey, dateLabel, transactions: [tx] });
      }
    });

    return groups;
  }, [assetTransactions]);

  const hasMoreTransactions = assetTransactions.length > 5;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const chainInfo = assetData ? SUPPORTED_CHAINS.find(c => c.id === assetData.network) : null;
  const hasMultipleAddresses = assetData ? assetData.addressCount > 1 : false;

  if (!assetData) {
    return (
      <AppLayout showNav={false}>
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">资产不存在</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNav={false}>
      <SwipeBack>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-3 mb-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/home')}
              className="shrink-0"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-2">
              <CryptoIconWithChain symbol={assetData.symbol} chainId={assetData.network} size="lg" />
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-lg font-bold text-foreground">{assetData.symbol}</h1>
                  <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                    {chainInfo?.name}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">{assetData.name}</p>
              </div>
            </div>
          </div>

          {/* Address Filter Pills - only show when multiple addresses */}
          {hasMultipleAddresses && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide py-2 mt-1">
              <button
                onClick={() => setSelectedAddressId('all')}
                className={cn(
                  "relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
                  selectedAddressId === 'all'
                    ? "text-foreground bg-muted"
                    : "border border-border text-muted-foreground"
                )}
              >
                全部
              </button>
              {assetData.addresses.map((addr) => (
                <button
                  key={addr.addressId}
                  onClick={() => setSelectedAddressId(addr.addressId)}
                  className={cn(
                    "relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
                    selectedAddressId === addr.addressId
                      ? "text-foreground bg-muted"
                      : "border border-border text-muted-foreground"
                  )}
                >
                  {addr.label || `${addr.address.slice(0, 6)}...${addr.address.slice(-4)}`}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto px-4 py-4">
          {/* Balance Card */}
          {isLoading ? (
            <div className="card-elevated p-4 mb-4 text-center">
              <Skeleton className="h-8 w-40 mx-auto mb-2" />
              <Skeleton className="h-5 w-24 mx-auto" />
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="card-elevated p-4 mb-4 text-center"
            >
              <p className="text-3xl font-bold text-foreground mb-1">
                {displayBalance.balance.toLocaleString()} {assetData.symbol}
              </p>
              <p className="text-lg text-muted-foreground">
                {formatCurrency(displayBalance.usdValue)}
              </p>
              {hasMultipleAddresses && selectedAddressId === 'all' && (
                <p className="text-xs text-muted-foreground/70 mt-1">
                  {assetData.addressCount} 个地址合计
                </p>
              )}
            </motion.div>
          )}

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex gap-3 mb-4"
          >
            <Button
              className="flex-1 h-10 gradient-accent text-accent-foreground"
              onClick={() => {
                guard(() => {
                  const targetPath = isAgent ? '/request-agent' : '/send';
                  navigate(`${targetPath}?asset=${symbol}&chain=${assetData.network}`);
                });
              }}
            >
              {isAgent ? <Bot className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
              {isAgent ? '请求Agent执行' : '转账'}
            </Button>
            <Button
              variant="outline"
              className="flex-1 h-10"
              onClick={() => {
                navigate(`/receive?chain=${assetData.network}`);
              }}
            >
              <QrCode className="w-4 h-4 mr-2" />
              收款
            </Button>
          </motion.div>

          {/* Address Distribution - show when multiple addresses and viewing "all" */}
          {hasMultipleAddresses && selectedAddressId === 'all' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-4"
            >
              <h2 className="font-semibold text-foreground text-sm mb-2">地址分布</h2>
              <div className="space-y-2">
                {assetData.addresses.map((addr) => (
                  <button
                    key={addr.addressId}
                    className="w-full card-elevated p-3 text-left transition-colors"
                    onClick={() => setSelectedAddressId(addr.addressId)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-foreground text-sm">
                        {addr.label}
                      </span>
                      <div className="text-right">
                        <p className="font-medium text-foreground text-sm">
                          {addr.balance.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrency(addr.usdValue)}
                        </p>
                      </div>
                    </div>
                    <AddressDisplay address={addr.address} />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Single address display - show when only one address, or a specific address is selected */}
          {(!hasMultipleAddresses || selectedAddressId !== 'all') && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mb-4"
            >
              <h2 className="font-semibold text-foreground text-sm mb-2">
                收款地址
              </h2>
              {(() => {
                const addr = selectedAddressId !== 'all'
                  ? assetData.addresses.find(a => a.addressId === selectedAddressId)
                  : assetData.addresses[0];
                return addr ? (
                  <AddressDisplay
                    address={addr.address}
                    label={addr.label}
                    showFull
                  />
                ) : null;
              })()}
            </motion.div>
          )}

          {/* Transactions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold text-foreground text-sm">交易记录</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground text-xs h-7"
                onClick={() => navigate('/history')}
              >
                查看全部
              </Button>
            </div>

            {isLoading ? (
              <TransactionListSkeleton count={4} showDateHeader={false} />
            ) : groupedTransactions.length > 0 ? (
              <div className="space-y-3">
                {groupedTransactions.map((group) => (
                  <div key={group.date}>
                    {/* Date Header */}
                    <p className="text-xs text-muted-foreground mb-1.5 px-1">
                      {group.dateLabel}
                    </p>
                    <div className="space-y-1.5">
                      {group.transactions.map((tx, index) => (
                        <motion.button
                          key={tx.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * index }}
                          className="w-full card-elevated p-3 flex items-center justify-between text-left transition-colors"
                          onClick={() => navigate(`/transaction/${tx.id}`)}
                        >
                          <div className="flex items-center gap-2">
                            <div className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center',
                              tx.type === 'receive' ? 'bg-success/10' : 'bg-accent/10'
                            )}>
                              {tx.type === 'receive' ? (
                                <TrendingDown className="w-4 h-4 text-success rotate-180" />
                              ) : (
                                <Send className="w-4 h-4 text-accent" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-medium text-foreground text-sm">
                                {tx.type === 'receive' ? '转入' : '转出'}
                              </p>
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                  {tx.counterpartyLabel || `${tx.counterparty.slice(0, 6)}...${tx.counterparty.slice(-4)}`}
                                </span>
                                <span className="text-xs text-muted-foreground/60">·</span>
                                <span className="text-xs text-muted-foreground">
                                  {SUPPORTED_CHAINS.find(c => c.id === tx.network)?.shortName}
                                </span>
                                {tx.status === 'pending' && (
                                  <span className="text-xs text-warning flex items-center gap-0.5">
                                    <AlertCircle className="w-3 h-3" />
                                  </span>
                                )}
                                {tx.status === 'confirmed' && (
                                  <span className="text-xs text-success flex items-center gap-0.5">
                                    <CheckCircle2 className="w-3 h-3" />
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="text-right flex items-center gap-2">
                            <div>
                              <p className={cn(
                                'font-medium text-sm',
                                tx.type === 'receive' ? 'text-success' : 'text-foreground'
                              )}>
                                {tx.type === 'receive' ? '+' : '-'}{tx.amount}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                ${(tx.amount * 1).toLocaleString()}
                              </p>
                            </div>
                            <ChevronRight className="w-4 h-4 text-muted-foreground" />
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                ))}

                {/* View More Button */}
                {hasMoreTransactions && (
                  <Button
                    variant="ghost"
                    className="w-full text-muted-foreground text-sm h-10"
                    onClick={() => navigate('/history')}
                  >
                    查看全部
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>
            ) : (
              <EmptyState
                icon={Send}
                title="暂无交易记录"
                description={`暂无 ${assetData.symbol} 在 ${chainInfo?.name || ''} 上的交易`}
              />
            )}
          </motion.div>
        </div>
      </div>
      </SwipeBack>

      <RecoveryRequiredDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        walletName={currentWallet?.name}
      />
    </AppLayout>
  );
}
