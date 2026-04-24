/**
 * Home page in "unrecovered" mode — normal wallet features (balance, assets, transactions)
 * but with a prominent recovery banner and "未激活" badge.
 * Accessed via /home/norecovery after user skips recovery.
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Eye, EyeOff, Send, QrCode, Wallet, ChevronDown, Bell,
  Shield,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useWallet, aggregateByChain } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { CryptoIconWithChain } from '@/components/CryptoIconWithChain';
import { ChainDropdown } from '@/components/ChainDropdown';
import { AddressPicker } from '@/components/AddressPicker';
import { AnimatedBalance } from '@/components/AnimatedNumber';
import { RecoveryRequiredDrawer } from '@/components/RecoveryRequiredDrawer';
import { WalletSwitcher } from '@/components/WalletSwitcher';
import { ChainId, AddressSelection } from '@/types/wallet';
import { getChainShortName } from '@/lib/chain-utils';

function formatBalanceParts(value: number) {
  const [integer, decimal] = value.toFixed(2).split('.');
  const formattedInteger = parseInt(integer).toLocaleString('en-US');
  return { integer: formattedInteger, decimal };
}

export default function HomeNoRecovery() {
  const navigate = useNavigate();
  const [hideBalance, setHideBalance] = useState(false);
  const [selectedChain, setSelectedChain] = useState<ChainId>('all');
  const [addressSelection, setAddressSelection] = useState<AddressSelection>({ mode: 'all' });
  const [recoveryDrawerOpen, setRecoveryDrawerOpen] = useState(false);
  const [showWalletSwitcher, setShowWalletSwitcher] = useState(false);

  const { assets, transactions, currentWallet, unreadMessageCount, pendingTodoCount } = useWallet();

  const handleAddressChange = useCallback((sel: AddressSelection) => {
    setAddressSelection(sel);
    setSelectedChain('all');
  }, []);

  // Filtered assets
  const filteredAssetsByAddress = useMemo(() => {
    if (addressSelection.mode === 'all') return assets;
    return assets.filter(a => a.addressId === addressSelection.addressId);
  }, [assets, addressSelection]);

  const displayAssets = useMemo(() => {
    const allChainAssets = aggregateByChain(filteredAssetsByAddress, currentWallet);
    if (selectedChain === 'all') return allChainAssets;
    return allChainAssets.filter(a => a.network === selectedChain);
  }, [filteredAssetsByAddress, selectedChain, currentWallet]);

  const totalBalance = useMemo(() => {
    let filtered = filteredAssetsByAddress;
    if (selectedChain !== 'all') filtered = filtered.filter(a => a.network === selectedChain);
    return filtered.reduce((sum, asset) => sum + asset.usdValue, 0);
  }, [filteredAssetsByAddress, selectedChain]);

  const balanceParts = formatBalanceParts(totalBalance);

  return (
    <AppLayout showNav>
      <div className="px-4 relative">
        {/* Header */}
        <div className="flex items-center justify-between h-[44px] mb-2">
          <motion.button
            onClick={() => setShowWalletSwitcher(true)}
            className="flex items-center gap-3 rounded-xl p-1 -m-1 active:bg-muted/50 transition-colors"
            whileTap={{ scale: 0.97 }}
          >
            <div className="w-9 h-9 rounded-full flex items-center justify-center bg-muted">
              <Wallet className="w-5 h-5 text-muted-foreground" />
            </div>
            <div className="text-left">
              <p className="text-xs text-muted-foreground">当前钱包</p>
              <div className="flex items-center gap-1">
                <p className="font-semibold text-foreground text-sm">{currentWallet?.name || '我的钱包'}</p>
                <span className="text-[10px] px-1.5 py-0.5 bg-warning/10 text-warning rounded font-medium">
                  未激活
                </span>
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </div>
            </div>
          </motion.button>

          <div className="flex items-center gap-2.5">
            <motion.button
              className="relative flex items-center justify-center"
              onClick={() => navigate('/messages')}
              whileTap={{ scale: 0.9 }}
            >
              <Bell className="w-6 h-6" strokeWidth={1.5} style={{ color: '#000000' }} />
              {(unreadMessageCount + pendingTodoCount) > 0 && (
                <span className="absolute -top-[6px] -right-[6px] min-w-4 h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center">
                  {(unreadMessageCount + pendingTodoCount) > 9 ? '9+' : (unreadMessageCount + pendingTodoCount)}
                </span>
              )}
            </motion.button>
          </div>
        </div>

        {/* Recovery Banner — Apple style */}
        <motion.button
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => navigate('/claim-wallet', { state: { mode: 'reshare', returnTo: '/home' } })}
          className="w-full flex items-center gap-3 px-4 py-3 mb-3 rounded-2xl bg-muted active:bg-muted/70 transition-colors text-left"
        >
          <div className="w-8 h-8 rounded-full bg-warning/12 flex items-center justify-center shrink-0">
            <Shield className="w-4 h-4 text-warning" strokeWidth={1.75} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-medium text-foreground">重新配对钱包以激活签名能力</p>
          </div>
          <span className="text-[13px] font-medium text-primary shrink-0">激活</span>
        </motion.button>

        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-5 mb-4"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">总资产</span>
              <button onClick={() => setHideBalance(!hideBalance)}>
                {hideBalance
                  ? <EyeOff className="w-4 h-4 text-muted-foreground" />
                  : <Eye className="w-4 h-4 text-muted-foreground" />
                }
              </button>
            </div>
            <ChainDropdown selectedChain={selectedChain} onSelectChain={setSelectedChain} />
          </div>

          <div className="mb-5">
            <AnimatedBalance
              integer={balanceParts.integer}
              decimal={balanceParts.decimal}
              hidden={hideBalance}
              integerClassName="text-[34px] font-bold text-foreground tracking-tight"
              decimalClassName="text-xl font-medium text-muted-foreground"
            />
          </div>

          {/* Disabled action buttons */}
          <div className="flex gap-3">
            <Button
              className="flex-1 h-11 bg-primary/50 text-primary-foreground rounded-xl text-[15px] font-semibold cursor-not-allowed"
              onClick={() => setRecoveryDrawerOpen(true)}
            >
              <Send className="w-4 h-4 mr-2" strokeWidth={1.5} />
              转账
            </Button>
            <Button
              variant="secondary"
              className="flex-1 h-11 rounded-xl text-[15px] font-semibold"
              onClick={() => navigate('/receive')}
            >
              <QrCode className="w-4 h-4 mr-2" strokeWidth={1.5} />
              收款
            </Button>
          </div>
        </motion.div>

        {/* Assets */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h2 className="font-semibold text-foreground text-sm">资产</h2>
            <AddressPicker
              selection={addressSelection}
              onSelectionChange={handleAddressChange}
              walletAddresses={currentWallet?.walletAddresses || []}
            />
          </div>

          <div className="space-y-1">
            {displayAssets.map((asset) => (
              <button
                key={`${asset.symbol}-${asset.network}`}
                onClick={() => navigate(`/asset/${asset.symbol}?chain=${asset.network}`)}
                className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors active:bg-muted/50"
              >
                <CryptoIconWithChain symbol={asset.symbol} chainId={asset.network} size="md" />
                <div className="flex-1 text-left min-w-0">
                  <p className="font-semibold text-foreground text-sm">{asset.symbol}</p>
                  <p className="text-xs text-muted-foreground">
                    {getChainShortName(asset.network)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-foreground text-sm tabular-nums">
                    {asset.totalBalance.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    ${asset.totalUsdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </motion.div>

        <div className="h-24" />
      </div>

      {/* Recovery drawer when trying to transfer */}
      <RecoveryRequiredDrawer
        open={recoveryDrawerOpen}
        onOpenChange={setRecoveryDrawerOpen}
        walletName={currentWallet?.name}
        returnTo="/home"
      />

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
