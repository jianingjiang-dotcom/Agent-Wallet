import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Search, X, Scan, Users, AlertTriangle,
  CheckCircle2, Loader2, ChevronRight, Info
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { SUPPORTED_CHAINS, ChainId, Asset } from '@/types/wallet';
import { getChainShortName, getChainName, validateAddress as validateChainAddress } from '@/lib/chain-utils';
import { NumericKeypad } from '@/components/NumericKeypad';
import { AmountDisplay } from '@/components/AmountDisplay';
import { AddressBar } from '@/components/AddressBar';
import { CryptoIcon } from '@/components/CryptoIcon';
import { ChainIcon } from '@/components/ChainIcon';
import { ContactDrawer } from '@/components/ContactDrawer';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Contact } from '@/types/wallet';
import { toast } from '@/lib/toast';

type Step = 'asset' | 'address' | 'amount' | 'confirm' | 'success';

export default function RequestAgentPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    assets, contacts, currentWallet, submitAgentRequest
  } = useWallet();

  const [step, setStep] = useState<Step>('asset');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [address, setAddress] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetFilterChain, setAssetFilterChain] = useState<ChainId>('all');
  const [showContactDrawer, setShowContactDrawer] = useState(false);

  // Filter assets
  const filteredAssets = useMemo(() => {
    let filtered = assets;
    if (assetFilterChain !== 'all') {
      filtered = filtered.filter(a => a.network === assetFilterChain);
    }
    if (assetSearchQuery) {
      const q = assetSearchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.symbol.toLowerCase().includes(q) || a.name.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [assets, assetFilterChain, assetSearchQuery]);

  const isAddressValid = useMemo(() => {
    if (!address || !selectedAsset) return false;
    return validateChainAddress(address, selectedAsset.network);
  }, [address, selectedAsset]);

  const tokenPrice = useMemo(() => {
    if (!selectedAsset || selectedAsset.balance === 0) return 0;
    return selectedAsset.usdValue / selectedAsset.balance;
  }, [selectedAsset]);

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setStep('address');
  };

  const handleSelectContact = (contact: Contact) => {
    setAddress(contact.address);
    setSelectedContact(contact);
    setShowContactDrawer(false);
  };

  const handleKeypadInput = (key: string) => {
    setAmount(prev => {
      if (key === '.' && prev.includes('.')) return prev;
      if (key === '.' && !prev) return '0.';
      if (prev === '0' && key !== '.') return key;
      return prev + key;
    });
  };

  const handleKeypadDelete = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleContinue = () => {
    if (step === 'address' && isAddressValid) {
      setStep('amount');
    } else if (step === 'amount' && selectedAsset) {
      const val = parseFloat(amount);
      if (val > 0 && val <= selectedAsset.balance) {
        setStep('confirm');
      }
    }
  };

  const handleSubmit = async () => {
    if (!selectedAsset || !currentWallet) return;
    setIsLoading(true);
    try {
      await submitAgentRequest({
        walletId: currentWallet.id,
        toAddress: address,
        amount: parseFloat(amount),
        symbol: selectedAsset.symbol,
        network: selectedAsset.network,
        usdValue: parseFloat(amount) * tokenPrice,
        toLabel: selectedContact?.name,
        memo: memo || undefined,
      });
      setStep('success');
    } catch (e: any) {
      toast.error(e.message || '提交失败');
    } finally {
      setIsLoading(false);
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'asset': return '选择资产';
      case 'address': return '收款地址';
      case 'amount': return '输入金额';
      case 'confirm': return '确认请求';
      case 'success': return '提交成功';
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'asset': navigate(-1); break;
      case 'address': setStep('asset'); break;
      case 'amount': setStep('address'); break;
      case 'confirm': setStep('amount'); break;
      case 'success': navigate('/home'); break;
    }
  };

  return (
    <AppLayout showNav={false} title={getTitle()} showBack onBack={handleBack}>
      {/* Agent notice banner */}
      <div className="px-4 pt-2 pb-1">
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800/40">
          <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <p className="text-xs text-purple-700 dark:text-purple-400">
            此钱包由 Agent 签名，转账请求将提交给 Agent 执行
          </p>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <AnimatePresence mode="wait">
          {/* Step: Asset Selection */}
          {step === 'asset' && (
            <motion.div
              key="asset"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col overflow-hidden"
            >
              <div className="px-4 pt-2 pb-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="搜索币种名称或符号"
                    value={assetSearchQuery}
                    onChange={(e) => setAssetSearchQuery(e.target.value)}
                    className="pl-9 pr-9 bg-muted/50 border-0 h-12"
                  />
                  {assetSearchQuery && (
                    <button onClick={() => setAssetSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                      <X className="w-4 h-4 text-muted-foreground" />
                    </button>
                  )}
                </div>
              </div>

              <div className="px-4 pb-3">
                <div className="flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] py-1">
                  {SUPPORTED_CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => setAssetFilterChain(chain.id)}
                      className={cn(
                        "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap shrink-0 transition-colors",
                        assetFilterChain === chain.id
                          ? "bg-muted text-foreground"
                          : "border border-border text-muted-foreground"
                      )}
                    >
                      <ChainIcon chainId={chain.id} size="sm" />
                      <span>{chain.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <ScrollArea className="flex-1 px-4 pb-4">
                {filteredAssets.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                      <Search className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {assetSearchQuery ? '没有找到匹配的币种' : '暂无可用币种'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {filteredAssets.map((asset, index) => (
                      <motion.button
                        key={`${asset.symbol}-${asset.network}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleSelectAsset(asset)}
                        className="w-full p-3 rounded-xl bg-card border border-border/50 flex items-center gap-3 text-left transition-colors"
                      >
                        <div className="relative shrink-0">
                          <CryptoIcon symbol={asset.symbol} size="lg" />
                          <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border-2 border-card flex items-center justify-center">
                            <ChainIcon chainId={asset.network} size="sm" />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-foreground">{asset.symbol}</span>
                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              {getChainName(asset.network)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground truncate mt-0.5">{asset.name}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="font-medium text-foreground">{asset.balance.toLocaleString()}</p>
                          <p className="text-sm text-muted-foreground">${asset.usdValue.toLocaleString()}</p>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </motion.div>
          )}

          {/* Step: Address */}
          {step === 'address' && (
            <motion.div
              key="address"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 px-4 py-4 overflow-y-auto space-y-4"
            >
              {selectedAsset && (
                <button
                  onClick={() => setStep('asset')}
                  className="w-full p-3 rounded-xl bg-muted/50 border border-border/50 flex items-center gap-3 transition-colors"
                >
                  <div className="relative shrink-0">
                    <CryptoIcon symbol={selectedAsset.symbol} size="md" />
                    <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-card border border-card flex items-center justify-center">
                      <ChainIcon chainId={selectedAsset.network} size="xs" />
                    </div>
                  </div>
                  <div className="flex-1 text-left">
                    <p className="font-medium text-foreground">{selectedAsset.symbol}</p>
                    <p className="text-xs text-muted-foreground">
                      余额: {selectedAsset.balance.toLocaleString()} {selectedAsset.symbol}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              )}

              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">收款地址</label>
                <div className="relative">
                  <Input
                    placeholder="粘贴地址或选择联系人"
                    value={address}
                    onChange={(e) => { setAddress(e.target.value); setSelectedContact(null); }}
                    className="pr-[52px] text-base h-12"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9"
                      onClick={() => setShowContactDrawer(true)}
                    >
                      <Users className="w-5 h-5 text-muted-foreground" />
                    </Button>
                  </div>
                </div>
              </div>

              {address && !isAddressValid && (
                <p className="text-sm text-destructive px-1">
                  地址格式不正确
                </p>
              )}

              {selectedContact && (
                <div className="p-3 rounded-xl bg-success/5 border border-success/20 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                  <span className="text-sm text-foreground">{selectedContact.name}</span>
                  {selectedContact.isWhitelisted && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-success/10 text-success rounded-full ml-auto">白名单</span>
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* Step: Amount */}
          {step === 'amount' && selectedAsset && (
            <motion.div
              key="amount"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 flex flex-col"
            >
              <div className="px-4 pt-2">
                <AddressBar
                  address={address}
                  label={selectedContact?.name}
                  onClear={() => setStep('address')}
                />
              </div>

              <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
                <AmountDisplay
                  amount={amount}
                  symbol={selectedAsset.symbol}
                  tokenPrice={tokenPrice}
                  maxBalance={selectedAsset.balance}
                  onMaxClick={() => setAmount(selectedAsset.balance.toString())}
                  chainId={selectedAsset.network}
                  className="py-4"
                />

                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>可用:</span>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-lg">
                    <span className="font-medium text-foreground">{selectedAsset.balance.toLocaleString()} {selectedAsset.symbol}</span>
                  </div>
                  <button
                    onClick={() => setAmount(selectedAsset.balance.toString())}
                    className="px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full transition-colors"
                  >
                    全部
                  </button>
                </div>
              </div>

              <div className="px-4 pb-2 shrink-0">
                <Button
                  size="lg"
                  className="w-full text-lg font-semibold h-12"
                  onClick={handleContinue}
                  disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > selectedAsset.balance}
                >
                  下一步
                </Button>
              </div>

              <NumericKeypad
                onInput={handleKeypadInput}
                onDelete={handleKeypadDelete}
              />
            </motion.div>
          )}

          {/* Step: Confirm */}
          {step === 'confirm' && selectedAsset && (
            <motion.div
              key="confirm"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex-1 px-4 py-4 overflow-y-auto space-y-4"
            >
              {/* Amount Card */}
              <div className="card-elevated p-6 text-center">
                <CryptoIcon symbol={selectedAsset.symbol} size="xl" className="mx-auto mb-3" />
                <p className="text-3xl font-bold text-foreground">
                  {amount} {selectedAsset.symbol}
                </p>
                <p className="text-muted-foreground mt-1">
                  ≈ ${(parseFloat(amount) * tokenPrice).toLocaleString()}
                </p>
              </div>

              {/* Details Card */}
              <div className="card-elevated p-4 space-y-4">
                <div>
                  <p className="text-sm text-muted-foreground">收款方</p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="font-medium text-foreground">
                      {selectedContact?.name || '未知地址'}
                    </p>
                    {!selectedContact && (
                      <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">新地址</span>
                    )}
                  </div>
                  <p className="text-sm font-mono text-muted-foreground mt-1 break-all">
                    <span className="font-bold text-foreground">{address.slice(0, 4)}</span>
                    {address.slice(4, -4)}
                    <span className="font-bold text-foreground">{address.slice(-4)}</span>
                  </p>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">网络</span>
                  <div className="flex items-center gap-2">
                    <ChainIcon chainId={selectedAsset.network} size="sm" />
                    <span className="text-sm font-medium text-foreground">
                      {SUPPORTED_CHAINS.find(c => c.id === selectedAsset.network)?.name}
                    </span>
                  </div>
                </div>
                <div className="h-px bg-border" />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">手续费</span>
                  <span className="text-sm text-muted-foreground">由 Agent 决定</span>
                </div>
              </div>

              {/* Memo */}
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  备注（可选）
                </label>
                <Input
                  placeholder="添加对账信息"
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  className="h-12"
                />
              </div>

              {/* Agent execution notice */}
              <div className="card-elevated p-4 border-purple-200 dark:border-purple-800/40 bg-purple-50 dark:bg-purple-950/20">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-foreground text-sm">Agent 执行转账</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      请求提交后，Agent 将根据风控策略决定是否执行。您无法直接签名此钱包的交易。
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Step: Success */}
          {step === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex-1 flex flex-col items-center justify-center text-center px-4 py-12"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
                className="w-24 h-24 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-6"
              >
                <Bot className="w-12 h-12 text-purple-600 dark:text-purple-400" />
              </motion.div>
              <h2 className="text-xl font-bold text-foreground mb-2">
                请求已提交
              </h2>
              <p className="text-muted-foreground text-sm max-w-[280px]">
                转账请求已提交给 Agent，Agent 将根据风控策略决定是否执行
              </p>

              <div className="w-full space-y-3 mt-8">
                <Button
                  size="lg"
                  className="w-full h-12"
                  onClick={() => navigate('/history')}
                >
                  查看交易记录
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12"
                  onClick={() => navigate('/home')}
                >
                  返回首页
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom Action - Only for address and confirm steps */}
      {(step === 'address' || step === 'confirm') && (
        <div className="p-4 pb-8 border-t border-border shrink-0">
          <Button
            size="lg"
            className="w-full h-12"
            onClick={step === 'confirm' ? handleSubmit : handleContinue}
            disabled={
              (step === 'address' && (!address || !isAddressValid)) ||
              isLoading
            }
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ) : null}
            {step === 'confirm' ? '提交请求' : '下一步'}
          </Button>
        </div>
      )}

      {/* Contact Drawer */}
      <ContactDrawer
        isOpen={showContactDrawer}
        onClose={() => setShowContactDrawer(false)}
        contacts={contacts}
        onSelect={handleSelectContact}
        selectedNetwork={selectedAsset?.network}
      />
    </AppLayout>
  );
}
