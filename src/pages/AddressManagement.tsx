import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Plus, Copy, Check, Fingerprint, Loader2, Wallet, ChevronDown, CheckCircle2, Edit3,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/contexts/WalletContext';
import { cn, copyToClipboard, formatAddressShort } from '@/lib/utils';
import { ADDRESS_SYSTEMS, AddressSystem, WalletAddress, isAgentLinked } from '@/types/wallet';
import { getSystemName } from '@/lib/chain-utils';
import { ChainIcon } from '@/components/ChainIcon';
import { toast } from '@/lib/toast';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';

export default function AddressManagement() {
  const { walletId: initialWalletId } = useParams<{ walletId: string }>();
  const navigate = useNavigate();
  const { wallets, addAddress, renameAddress } = useWallet();

  // Only user-created wallets can manage addresses
  const userWallets = wallets.filter(w => !isAgentLinked(w));

  const [activeWalletId, setActiveWalletId] = useState(initialWalletId || userWallets[0]?.id || '');
  const wallet = wallets.find(w => w.id === activeWalletId);

  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [walletDrawerOpen, setWalletDrawerOpen] = useState(false);
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [createSystem, setCreateSystem] = useState<AddressSystem | null>(null);
  const [isBioAuthing, setIsBioAuthing] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  // Rename address
  const [renameDrawerOpen, setRenameDrawerOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Group addresses by system
  const addressesBySystem = useMemo(() => {
    if (!wallet?.walletAddresses) return {} as Record<AddressSystem, WalletAddress[]>;
    const grouped: Record<AddressSystem, WalletAddress[]> = {
      evm: [],
      tron: [],
      solana: [],
    };
    wallet.walletAddresses.forEach(addr => {
      grouped[addr.system].push(addr);
    });
    return grouped;
  }, [wallet]);

  const handleCopy = async (addr: WalletAddress) => {
    const ok = await copyToClipboard(addr.address);
    if (ok) {
      setCopiedId(addr.id);
      toast.success('已复制', formatAddressShort(addr.address));
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const handleSelectWallet = (id: string) => {
    setActiveWalletId(id);
    setWalletDrawerOpen(false);
    // Update URL to reflect the new wallet
    navigate(`/wallet/addresses/${id}`, { replace: true });
  };

  const handleOpenCreate = (system: AddressSystem) => {
    setCreateSystem(system);
    setCreateDrawerOpen(true);
    setIsBioAuthing(false);
    setIsCreating(false);
  };

  const handleCreate = async () => {
    if (!activeWalletId || !createSystem) return;
    setIsBioAuthing(true);
    // Simulate biometric auth
    await new Promise(r => setTimeout(r, 1200));
    setIsBioAuthing(false);
    setIsCreating(true);
    try {
      const newAddr = await addAddress(activeWalletId, createSystem);
      toast.success('地址创建成功', newAddr.label);
      setCreateDrawerOpen(false);
    } catch {
      toast.error('创建失败，请重试');
    } finally {
      setIsCreating(false);
    }
  };

  const handleOpenRename = (addr: WalletAddress) => {
    setRenameTargetId(addr.id);
    setRenameValue(addr.label);
    setRenameDrawerOpen(true);
  };

  const handleConfirmRename = () => {
    if (!activeWalletId || !renameTargetId || !renameValue.trim()) return;
    renameAddress(activeWalletId, renameTargetId, renameValue.trim());
    toast.success('地址已重命名');
    setRenameDrawerOpen(false);
    setRenameTargetId(null);
    setRenameValue('');
  };

  if (!wallet) {
    return (
      <AppLayout showNav={false} showBack title="地址管理">
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">钱包不存在</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNav={false} showBack title="地址管理">
      <SwipeBack>
        <div className="h-full flex flex-col overflow-auto">
          <div className="px-4 py-4 space-y-5">
            {/* Wallet Switcher */}
            <button
              onClick={() => setWalletDrawerOpen(true)}
              className="w-full p-3 rounded-xl border border-border bg-card flex items-center gap-3 hover:bg-muted/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <Wallet className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-sm text-foreground truncate">{wallet.name}</p>
                <p className="text-xs text-muted-foreground">
                  {wallet.walletAddresses?.length || 0} 个地址
                </p>
              </div>
              <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
            </button>

            {/* Address Systems */}
            {ADDRESS_SYSTEMS.map((systemInfo, sysIndex) => {
              const addresses = addressesBySystem[systemInfo.id] || [];
              const chainNames = systemInfo.chains
                .map(c => {
                  if (c === 'ethereum') return 'Ethereum';
                  if (c === 'bsc') return 'BNB Chain';
                  if (c === 'tron') return 'Tron';
                  if (c === 'solana') return 'Solana';
                  return c;
                })
                .join(' / ');

              return (
                <motion.div
                  key={systemInfo.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * sysIndex }}
                >
                  {/* System Header */}
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1">
                        {systemInfo.chains.map(chainId => (
                          <ChainIcon key={chainId} chainId={chainId} size="sm" />
                        ))}
                      </div>
                      <h2 className="font-semibold text-foreground text-sm">
                        {systemInfo.name}
                      </h2>
                      <span className="text-xs text-muted-foreground">
                        ({addresses.length} 个地址)
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground mb-3">
                    适用于 {chainNames}
                  </p>

                  {/* Address List */}
                  <div className="space-y-2">
                    {addresses.map((addr, index) => (
                      <motion.div
                        key={addr.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 * index }}
                        className="card-elevated p-3"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm text-foreground">
                            {addr.label}
                          </span>
                          <div className="flex items-center gap-0.5">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleOpenRename(addr)}
                            >
                              <Edit3 className="w-3.5 h-3.5 text-muted-foreground" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => handleCopy(addr)}
                            >
                              {copiedId === addr.id ? (
                                <Check className="w-3.5 h-3.5 text-success" />
                              ) : (
                                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                              )}
                            </Button>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono break-all">
                          {addr.address}
                        </p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          创建于 {new Date(addr.createdAt).toLocaleDateString('zh-CN')}
                        </p>
                      </motion.div>
                    ))}

                    {/* Create New Address Button */}
                    <button
                      onClick={() => handleOpenCreate(systemInfo.id)}
                      className="w-full p-3 rounded-xl border-2 border-dashed border-border hover:border-accent/50 hover:bg-accent/5 flex items-center justify-center gap-2 text-muted-foreground hover:text-accent transition-all"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-sm font-medium">创建新 {systemInfo.name} 地址</span>
                    </button>
                  </div>
                </motion.div>
              );
            })}

            {/* Bottom spacer */}
            <div className="h-4" />
          </div>
        </div>
      </SwipeBack>

      {/* Wallet Switcher Drawer */}
      <Drawer open={walletDrawerOpen} onOpenChange={setWalletDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle>选择钱包</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-1">
            {userWallets.length === 0 ? (
              <div className="text-center py-8">
                <Wallet className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">没有可用的钱包</p>
              </div>
            ) : (
              userWallets.map(w => (
                <button
                  key={w.id}
                  onClick={() => handleSelectWallet(w.id)}
                  className={cn(
                    'w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors rounded-xl text-left',
                    activeWalletId === w.id ? 'bg-accent/10' : ''
                  )}
                >
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <Wallet className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground text-sm truncate">{w.name}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {w.walletAddresses?.length || 0} 个地址
                    </p>
                  </div>
                  {activeWalletId === w.id && (
                    <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                  )}
                </button>
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>

      {/* Create Address Drawer */}
      <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>创建新地址</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4 space-y-4">
            {createSystem && (
              <>
                <div className="p-4 rounded-xl bg-muted/50 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">地址体系</span>
                    <span className="font-medium text-foreground">
                      {getSystemName(createSystem)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">适用链</span>
                    <span className="font-medium text-foreground">
                      {ADDRESS_SYSTEMS.find(s => s.id === createSystem)?.chains
                        .map(c => {
                          if (c === 'ethereum') return 'ETH';
                          if (c === 'bsc') return 'BSC';
                          if (c === 'tron') return 'Tron';
                          if (c === 'solana') return 'SOL';
                          return c;
                        })
                        .join(' / ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">钱包</span>
                    <span className="font-medium text-foreground">{wallet.name}</span>
                  </div>
                </div>

                <div className="flex items-start gap-2 p-3 rounded-lg bg-accent/5 border border-accent/20">
                  <Fingerprint className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                  <p className="text-xs text-muted-foreground">
                    创建新地址需要进行生物识别验证，以确保账户安全。
                  </p>
                </div>
              </>
            )}
          </div>
          <DrawerFooter className="flex-row gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setCreateDrawerOpen(false)}
              disabled={isBioAuthing || isCreating}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleCreate}
              disabled={isBioAuthing || isCreating}
            >
              {isBioAuthing ? (
                <>
                  <Fingerprint className="w-4 h-4 mr-1.5 animate-pulse" />
                  验证中...
                </>
              ) : isCreating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  创建中...
                </>
              ) : (
                '确认创建'
              )}
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
      {/* Rename Address Drawer */}
      <Drawer open={renameDrawerOpen} onOpenChange={setRenameDrawerOpen} noBodyStyles>
        <DrawerContent>
          <DrawerHeader className="pb-2">
            <DrawerTitle>修改地址名称</DrawerTitle>
          </DrawerHeader>
          <div className="px-4">
            <Input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              placeholder="输入新的地址名称"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && renameValue.trim()) handleConfirmRename();
              }}
            />
          </div>
          <DrawerFooter className="flex-row gap-2 pt-3 !mt-0">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setRenameDrawerOpen(false)}
            >
              取消
            </Button>
            <Button
              className="flex-1"
              onClick={handleConfirmRename}
              disabled={!renameValue.trim()}
            >
              确认
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </AppLayout>
  );
}
