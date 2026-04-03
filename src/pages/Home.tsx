import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useT } from '@/lib/i18n';
import { mockPacts } from '@/lib/mock-pacts';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye, EyeOff, ChevronRight, Send, QrCode,
  TrendingDown, Wallet, Plus, Shield, ShieldCheck, AlertTriangle,
  CheckCircle2, Sparkles, Lock, ChevronDown, Clock, Bell, Bot, ClipboardCheck,
  LayoutGrid
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useWallet, aggregateByChain } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { ChainDropdown } from '@/components/ChainDropdown';
import { CryptoIcon } from '@/components/CryptoIcon';
import { CryptoIconWithChain } from '@/components/CryptoIconWithChain';
import { ChainIcon } from '@/components/ChainIcon';
import { TokenManager } from '@/components/TokenManager';
import { PullToRefresh } from '@/components/PullToRefresh';
import { WalletSwitcher } from '@/components/WalletSwitcher';
import { BalanceCardSkeleton, AssetListSkeleton, TransactionListSkeleton } from '@/components/skeletons';
import { EmptyState } from '@/components/EmptyState';
import { AnimatedBalance } from '@/components/AnimatedNumber';
import { WalletModeBadge } from '@/components/WalletModeBadge';
import { ProfileSidebar } from '@/components/ProfileSidebar';

import { AddressPicker } from '@/components/AddressPicker';
import { ChainId, SUPPORTED_CHAINS, Transaction, isAgentLinked, AddressSelection, ADDRESS_SYSTEMS } from '@/types/wallet';
import { TokenInfo } from '@/lib/tokens';
import { toast } from '@/lib/toast';
import { getChainShortName } from '@/lib/chain-utils';

// Empty state component when no wallet exists - guides user to create first wallet
function EmptyWalletState() {
  const navigate = useNavigate();
  const t = useT();

  return (
    <AppLayout showNav={false}>
      <div className="h-full flex flex-col items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-sm w-full"
        >
          {/* Wallet icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-20 h-20 mx-auto mb-6 rounded-xl gradient-primary flex items-center justify-center shadow-xl"
          >
            <Wallet className="w-10 h-10 text-primary-foreground" />
          </motion.div>

          <h1 className="text-xl font-bold text-foreground mb-2">
            {t.home.createWalletTitle}
          </h1>
          <p className="text-muted-foreground text-sm mb-1">
            {t.home.createWalletSubtitle}
          </p>
          <p className="text-xs text-muted-foreground mb-8">
            {t.home.createWalletSecurity}
          </p>

          {/* Feature highlights */}
          <div className="space-y-3 mb-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-background"
            >
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                <Shield className="w-5 h-5 text-success" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">{t.home.bankGradeSecurity}</p>
                <p className="text-xs text-muted-foreground">{t.home.bankGradeSecurityDesc}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-background"
            >
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-accent" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">{t.home.fullControl}</p>
                <p className="text-xs text-muted-foreground">{t.home.fullControlDesc}</p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-4 p-3 rounded-xl bg-background"
            >
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-5 h-5 text-warning" />
              </div>
              <div className="text-left">
                <p className="font-medium text-foreground text-sm">{t.home.recoverable}</p>
                <p className="text-xs text-muted-foreground">{t.home.recoverableDesc}</p>
              </div>
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="space-y-3"
          >
            <Button
              size="lg"
              className="w-full text-base gradient-primary"
              onClick={() => navigate('/onboarding')}
            >
              {t.home.createWallet}
            </Button>
            <p className="text-xs text-muted-foreground">
              {t.home.haveBackup}
              <button 
                className="text-primary ml-1"
                onClick={() => navigate('/onboarding?recover=true')}
              >
                {t.home.recoverWallet}
              </button>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </AppLayout>
  );
}

// Helper to format balance with different sizes for integer and decimal parts
function formatBalanceParts(value: number) {
  const [integer, decimal] = value.toFixed(2).split('.');
  const formattedInteger = parseInt(integer).toLocaleString('en-US');
  return { integer: formattedInteger, decimal };
}

// Helper to mask email for privacy
function maskEmail(email: string) {
  const [name, domain] = email.split('@');
  if (!domain) return email;
  const maskedName = name.length > 2 ? `${name[0]}***${name[name.length - 1]}` : name;
  return `${maskedName}@${domain}`;
}

export default function HomePage() {
  const t = useT();
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedChain, setSelectedChain] = useState<ChainId>('all');
  const [addressSelection, setAddressSelection] = useState<AddressSelection>({ mode: 'all' });
  const [showTokenSearch, setShowTokenSearch] = useState(false);
  const [showWalletSwitcher, setShowWalletSwitcher] = useState(false);

  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [showAllAssets, setShowAllAssets] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const handledSidebarOpen = useRef(false);

  // Re-open sidebar when returning from a sidebar-originated navigation
  useEffect(() => {
    if ((location.state as { openSidebar?: boolean })?.openSidebar && !handledSidebarOpen.current) {
      handledSidebarOpen.current = true;
      setShowProfileDrawer(true);
    } else if (!(location.state as { openSidebar?: boolean })?.openSidebar) {
      handledSidebarOpen.current = false;
    }
  }, [location.state]);
  const { assets, transactions, currentWallet, walletStatus, addToken, removeToken, unreadNotificationCount, getAgentTxByWallet, agentTransactions } = useWallet();

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Number of assets to show initially
  const INITIAL_ASSETS_COUNT = 5;

  // Get list of already added token symbols for each network
  const addedSymbols = useMemo(() => {
    return assets.map(a => a.symbol);
  }, [assets]);

  // Handle adding token to all supported networks
  const handleAddToken = (token: TokenInfo) => {
    token.networks.forEach(network => {
      addToken(token.symbol, token.name, network, token.price, token.change24h);
    });
    toast.success(t.home.tokenAdded.replace('{symbol}', token.symbol).replace('{count}', String(token.networks.length)));
  };

  // Handle removing token from all networks
  const handleRemoveToken = (symbol: string) => {
    removeToken(symbol);
    toast.success(t.home.tokenRemoved.replace('{symbol}', symbol));
  };

  // Pull to refresh handler
  const handleRefresh = useCallback(async () => {
    // Simulate API call to refresh balances
    await new Promise(resolve => setTimeout(resolve, 1500));
    toast.success(t.home.balanceRefreshed);
  }, [t]);

  // Address selection change handler — resets chain filter
  const handleAddressChange = useCallback((sel: AddressSelection) => {
    setAddressSelection(sel);
    setSelectedChain('all');
  }, []);

  // Reset address & chain selection when wallet changes
  useEffect(() => {
    setAddressSelection({ mode: 'all' });
    setSelectedChain('all');
  }, [currentWallet?.id]);

  // L1 filter: filter assets by selected address
  const filteredAssetsByAddress = useMemo(() => {
    if (addressSelection.mode === 'all') return assets;
    return assets.filter(a => a.addressId === addressSelection.addressId);
  }, [assets, addressSelection]);

  // L2 filter + aggregate: chain filter on top of address-filtered assets
  const displayAssets = useMemo(() => {
    const allChainAssets = aggregateByChain(filteredAssetsByAddress, currentWallet);
    if (selectedChain === 'all') {
      return allChainAssets;
    }
    return allChainAssets.filter(a => a.network === selectedChain);
  }, [filteredAssetsByAddress, selectedChain, currentWallet]);

  // Calculate total balance from two-level filtered assets
  const totalBalance = useMemo(() => {
    let filtered = filteredAssetsByAddress;
    if (selectedChain !== 'all') {
      filtered = filtered.filter(a => a.network === selectedChain);
    }
    return filtered.reduce((sum, asset) => sum + asset.usdValue, 0);
  }, [filteredAssetsByAddress, selectedChain]);

  // Filter transactions based on selected address + chain
  const filteredTransactions = useMemo(() => {
    let filtered = transactions;
    // L1: address filter — match by the address system's chains
    if (addressSelection.mode === 'address') {
      const selectedAddr = currentWallet?.walletAddresses?.find(
        a => a.id === addressSelection.addressId
      );
      if (selectedAddr) {
        const systemInfo = ADDRESS_SYSTEMS.find(s => s.id === selectedAddr.system);
        const systemChains = systemInfo?.chains || [];
        filtered = filtered.filter(tx => systemChains.includes(tx.network as ChainId));
      }
    }
    // L2: chain filter
    if (selectedChain !== 'all') {
      filtered = filtered.filter(tx => tx.network === selectedChain);
    }
    // Sort by timestamp descending (newest first)
    return filtered.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [transactions, addressSelection, selectedChain, currentWallet]);

  // Group transactions by date and limit to 5 items
  const groupedTransactions = useMemo(() => {
    const MAX_DISPLAY = 5;
    const displayTxs = filteredTransactions.slice(0, MAX_DISPLAY);
    
    const groups: { date: string; dateLabel: string; transactions: Transaction[] }[] = [];
    
    displayTxs.forEach(tx => {
      const txDate = new Date(tx.timestamp);
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      let dateLabel: string;
      const dateKey = txDate.toDateString();
      
      if (txDate.toDateString() === today.toDateString()) {
        dateLabel = t.common.today;
      } else if (txDate.toDateString() === yesterday.toDateString()) {
        dateLabel = t.common.yesterday;
      } else {
        dateLabel = txDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
      }
      
      const existingGroup = groups.find(g => g.date === dateKey);
      if (existingGroup) {
        existingGroup.transactions.push(tx);
      } else {
        groups.push({ date: dateKey, dateLabel, transactions: [tx] });
      }
    });
    
    return groups;
  }, [filteredTransactions, t]);

  const hasMoreTransactions = filteredTransactions.length > 5;

  // Pending agent transactions for current wallet
  const walletPendingCount = useMemo(() => {
    return agentTransactions.filter(tx => tx.status === 'pending_approval').length;
  }, [agentTransactions]);

  const pactPendingCount = useMemo(() => mockPacts.filter(p => p.status === 'pending').length, []);
  const pactActiveCount = useMemo(() => mockPacts.filter(p => p.status === 'active' || p.status === 'approved').length, []);

  const balanceParts = formatBalanceParts(totalBalance);

  // Show empty state when no wallet exists
  if (walletStatus === 'not_created') {
    return <EmptyWalletState />;
  }

  return (
    <AppLayout showNav>
      <PullToRefresh onRefresh={handleRefresh}>
        <div className="px-4 relative">
        {/* Header - Wallet Selector */}
        <div className="flex items-center justify-between h-[44px] mb-2">
          <motion.button
            onClick={() => setShowWalletSwitcher(true)}
            className="flex items-center gap-3 rounded-xl p-1 -m-1 active:bg-muted/50 transition-colors"
            whileTap={{ scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
          <motion.div
            className={cn(
              "w-9 h-9 rounded-full flex items-center justify-center",
              isAgentLinked(currentWallet)
                ? "bg-purple-100 dark:bg-purple-900/40"
                : "gradient-primary"
            )}
            whileTap={{ scale: 0.9 }}
          >
            {isAgentLinked(currentWallet) ? (
              <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            ) : (
              <Wallet className="w-5 h-5 text-primary-foreground" />
            )}
          </motion.div>
          <div className="text-left">
            <p className="text-xs text-muted-foreground">
              {t.home.currentWallet}
            </p>
            <div className="flex items-center gap-1">
              <p className="font-semibold text-foreground text-sm">
                {currentWallet?.name || t.home.myWallet}
              </p>
              {isAgentLinked(currentWallet) && (
                <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded ml-1">
                  Agent
                </span>
              )}
              {currentWallet?.controlMode && !isAgentLinked(currentWallet) && (
                <WalletModeBadge mode={currentWallet.controlMode} />
              )}
              <ChevronDown className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          </motion.button>

          <div className="flex items-center gap-3">
            {/* Message Center Entry */}
            <motion.button
              className="relative flex items-center justify-center"
              onClick={() => navigate('/messages')}
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Bell className="w-6 h-6" strokeWidth={1.5} style={{ color: '#000000' }} />
              {unreadNotificationCount > 0 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-[6px] -right-[6px] min-w-4 h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center"
                >
                  {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                </motion.span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Balance Card with Light Gradient Overlay */}
        {isLoading ? (
          <BalanceCardSkeleton />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="card-premium p-5 mb-4 animate-gradient-shift"
          >
            {/* Decorative overlays */}
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5 pointer-events-none" />
            <div className="absolute -right-6 -top-6 w-24 h-24 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -left-4 -bottom-4 w-20 h-20 bg-white/5 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              {/* Address Picker — top of balance card */}
              <AddressPicker
                selection={addressSelection}
                onSelectionChange={handleAddressChange}
                walletAddresses={currentWallet?.walletAddresses || []}
                className="mb-3"
              />

              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-primary-foreground/70">
                    {t.home.totalAssets}
                  </span>
                  <button onClick={() => setHideBalance(!hideBalance)}>
                    {hideBalance ? (
                      <EyeOff className="w-4 h-4 text-primary-foreground/70" />
                    ) : (
                      <Eye className="w-4 h-4 text-primary-foreground/70" />
                    )}
                  </button>
                </div>
                <ChainDropdown
                  selectedChain={selectedChain}
                  onSelectChain={setSelectedChain}
                />
              </div>

              <div className="mb-4">
                <AnimatedBalance
                  integer={balanceParts.integer}
                  decimal={balanceParts.decimal}
                  hidden={hideBalance}
                  integerClassName="text-3xl font-bold text-primary-foreground"
                  decimalClassName="text-lg font-medium text-primary-foreground/80"
                />
              </div>

              {/* Quick Actions */}
              <div className="flex gap-3">
                <Button
                  className="flex-1 h-10 bg-white/20 backdrop-blur-sm text-white border border-white/20 transition-colors"
                  onClick={() => navigate(isAgentLinked(currentWallet) ? '/request-agent' : '/send')}
                >
                  {isAgentLinked(currentWallet) ? (
                    <Bot className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  ) : (
                    <Send className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  )}
                  {isAgentLinked(currentWallet) ? t.home.requestAgent : t.home.send}
                </Button>
                <Button
                  className="flex-1 h-10 bg-white/10 backdrop-blur-sm text-white/90 border border-white/15 transition-colors"
                  onClick={() => navigate('/receive')}
                >
                  <QrCode className="w-4 h-4 mr-2" strokeWidth={1.5} />
                  {t.home.receive}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Pending Approval Banner */}
        {!isLoading && walletPendingCount > 0 && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            onClick={() => navigate('/agent-review')}
            className="w-full p-3.5 rounded-2xl mb-3 flex items-center gap-3 active:scale-[0.98] transition-transform bg-white border border-border/60 shadow-sm"
          >
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
              <ClipboardCheck className="w-4 h-4 text-amber-600" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-foreground">{t.home.agentPending}</span>
                {walletPendingCount > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {walletPendingCount}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-muted-foreground truncate">
                {isAgentLinked(currentWallet)
                  ? t.home.agentPendingDesc.replace('{agent}', currentWallet?.agentInfo?.agentName || 'Agent').replace('{count}', String(walletPendingCount))
                  : t.home.agentPendingDescGeneric
                }
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
          </motion.button>
        )}

        {/* Pact Summary Card */}
        {!isLoading && (
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            onClick={() => navigate('/pact')}
            className="w-full p-3.5 rounded-2xl mb-3 flex items-center gap-3 active:scale-[0.98] transition-transform bg-white border border-border/60 shadow-sm"
          >
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-blue-600" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[14px] font-medium text-foreground">{t.home.pact}</span>
                {pactPendingCount > 0 && (
                  <span className="min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                    {pactPendingCount}
                  </span>
                )}
              </div>
              <p className="text-[12px] text-muted-foreground truncate">
                {t.home.pactDesc}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
          </motion.button>
        )}

        {/* Assets */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-foreground text-sm">{t.home.assets}</h2>
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-accent text-xs h-7 gap-1"
              onClick={() => setShowTokenSearch(true)}
            >
              <Plus className="w-3.5 h-3.5" />
              {t.home.addToken}
            </Button>
          </div>

          {isLoading ? (
            <AssetListSkeleton count={5} />
          ) : displayAssets.length === 0 ? (
            <EmptyState
              icon={Wallet}
              title={t.home.noAssets}
              description={t.home.noAssetsDesc}
              action={{
                label: t.home.addToken,
                icon: Plus,
                onClick: () => setShowTokenSearch(true),
              }}
            />
          ) : (
            <div className="space-y-1.5 no-card-shadow">
              <AnimatePresence mode="popLayout">
                {(showAllAssets ? displayAssets : displayAssets.slice(0, INITIAL_ASSETS_COUNT)).map((asset, index) => (
                  <motion.button
                    key={`${asset.symbol}-${asset.network}`}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: 0.05 * index }}
                    onClick={() => navigate(`/asset/${asset.symbol}?chain=${asset.network}`)}
                    className="w-full card-elevated p-3 flex items-center justify-between active:scale-[0.98] active:bg-muted/50 transition-all"
                  >
                    <div className="flex items-center gap-2">
                      <CryptoIconWithChain symbol={asset.symbol} chainId={asset.network} size="md" />
                      <div className="text-left">
                        <div className="flex items-center gap-1.5">
                          <p className="font-medium text-foreground text-sm">{asset.symbol}</p>
                          <span className="text-[10px] leading-none px-1.5 py-0.5 bg-muted rounded text-muted-foreground">
                            {getChainShortName(asset.network)}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {asset.name}
                          {asset.addressCount > 1 && (
                            <span className="ml-1 text-accent">· {asset.addressCount} {t.home.addresses}</span>
                          )}
                        </p>
                      </div>
                    </div>
                      <div className="text-right flex items-center gap-2">
                      <div>
                        <p className="font-medium text-foreground text-sm">
                          {hideBalance ? '****' : asset.totalBalance.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {hideBalance ? '**' : `$${asset.totalUsdValue.toLocaleString()}`}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </motion.button>
                ))}
              </AnimatePresence>
              
              {/* Show more / Show less button */}
              {displayAssets.length > INITIAL_ASSETS_COUNT && (
                <motion.button
                  layout
                  onClick={() => setShowAllAssets(!showAllAssets)}
                  className="w-full py-3 flex items-center justify-center gap-2 text-sm text-muted-foreground transition-colors rounded-xl"
                >
                  <motion.div
                    animate={{ rotate: showAllAssets ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                  {showAllAssets ? t.common.collapse : t.common.expandAll}
                </motion.button>
              )}
            </div>
          )}
        </motion.div>

        {/* Recent Transactions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-foreground text-sm">{t.home.recentTransactions}</h2>
          </div>

          {isLoading ? (
            <TransactionListSkeleton count={5} showDateHeader={true} />
          ) : groupedTransactions.length === 0 ? (
            <EmptyState
              icon={Send}
              title={t.home.noTransactions}
              description={t.home.noTransactionsDesc}
            />
          ) : (
            <div className="space-y-3">
              {groupedTransactions.map((group) => (
                <div key={group.date}>
                  {/* Date Header */}
                  <p className="text-xs text-muted-foreground mb-1.5 px-1">
                    {group.dateLabel}
                  </p>
                  <div className="space-y-1.5 no-card-shadow">
                    {group.transactions.map((tx, index) => (
                      <motion.button
                        key={tx.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        onClick={() => navigate(`/transaction/${tx.id}`)}
                        className="w-full card-elevated p-3 flex items-center justify-between text-left active:scale-[0.98] active:bg-muted/50 transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center',
                            tx.type === 'receive' ? 'icon-gradient-success' : 'icon-gradient-primary'
                          )}>
                            {tx.type === 'receive' ? (
                              <TrendingDown className="w-4 h-4 text-success rotate-180" />
                            ) : (
                              <Send className="w-4 h-4 text-accent" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-foreground text-sm">
                              {tx.type === 'receive' ? t.home.transferIn : t.home.transferOut}
                            </p>
                            <div className="flex items-center gap-1">
                              <span className="text-xs text-muted-foreground truncate max-w-[100px]">
                                {tx.counterpartyLabel || `${tx.counterparty.slice(0, 6)}...${tx.counterparty.slice(-4)}`}
                              </span>
                              <span className="text-xs text-muted-foreground/60">·</span>
                              <span className="text-xs text-muted-foreground">
                                {SUPPORTED_CHAINS.find(c => c.id === tx.network)?.shortName || tx.network}
                              </span>
                              {tx.status === 'pending' && (
                                <span className="text-xs text-warning flex items-center gap-0.5">
                                  <Clock className="w-3 h-3" />
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
                              {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.symbol}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              ${tx.usdValue.toLocaleString()}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </motion.button>
                    ))}
                  </div>
                </div>
              ))}
              
              {/* View All Button - positioned below the list */}
              {hasMoreTransactions && (
                <motion.button
                  onClick={() => navigate('/history')}
                  className="w-full py-3 flex items-center justify-center gap-1 text-sm text-muted-foreground transition-colors rounded-xl"
                >
                  {t.common.viewAll}
                  <ChevronRight className="w-4 h-4" />
                </motion.button>
              )}
            </div>
          )}
        </motion.div>
      </div>
      </PullToRefresh>

      {/* Token Search Modal */}
      <AnimatePresence>
        {showTokenSearch && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-background"
          >
            <TokenManager
              addedSymbols={addedSymbols}
              addedAssets={assets}
              onAddToken={handleAddToken}
              onRemoveToken={handleRemoveToken}
              onClose={() => setShowTokenSearch(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Wallet Switcher */}
      <WalletSwitcher
        isOpen={showWalletSwitcher}
        onClose={() => setShowWalletSwitcher(false)}
        onCreateNew={() => {
          setShowWalletSwitcher(false);
          navigate('/create-wallet');
        }}
      />

    </AppLayout>
  );
}
