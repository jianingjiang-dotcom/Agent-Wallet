import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Scan, Users, AlertTriangle,
  CheckCircle2, Loader2, Search, X,
  Info, ChevronRight, Lightbulb
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { RiskColor, SUPPORTED_CHAINS, ChainId, Asset, WalletAddress, isAgentLinked } from '@/types/wallet';
import { getChainShortName, getChainName, validateAddress as validateChainAddress, getAddressesForChain } from '@/lib/chain-utils';
import { QRScanner } from '@/components/QRScanner';
import { ParsedQRData } from '@/lib/qr-parser';
import { NumericKeypad } from '@/components/NumericKeypad';
import { AmountDisplay } from '@/components/AmountDisplay';
import { AddressBar } from '@/components/AddressBar';
import { CryptoIcon } from '@/components/CryptoIcon';
import { ChainIcon } from '@/components/ChainIcon';
import { NetworkFeeSelector, FeeTier } from '@/components/NetworkFeeSelector';
import { ContactDrawer } from '@/components/ContactDrawer';
import { ScrollArea } from '@/components/ui/scroll-area';

type Step = 'asset' | 'address' | 'amount' | 'confirm' | 'success';

export default function SendPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    assets, contacts, scanAddressRisk, sendTransaction, walletStatus,
    getLimitStatus, checkTransferLimit, currentWallet
  } = useWallet();

  // Redirect agent_linked wallets to request-agent flow
  useEffect(() => {
    if (isAgentLinked(currentWallet)) {
      navigate('/request-agent', { replace: true });
    }
  }, [currentWallet, navigate]);

  // Handle prefilled data from contact detail page
  const prefilledData = location.state as {
    prefilledAddress?: string;
    prefilledNetwork?: ChainId;
  } | null;
  
  // Parse asset and chain from URL query params (e.g., /send?asset=USDC&chain=ethereum)
  const searchParams = new URLSearchParams(location.search);
  const assetFromUrl = searchParams.get('asset');
  const chainFromUrl = searchParams.get('chain') as ChainId | null;
  
  // Find the matching asset from URL params - if chain is specified, match both symbol AND network
  const initialAsset = useMemo(() => {
    if (assetFromUrl && chainFromUrl && chainFromUrl !== 'all') {
      // Find specific asset matching both symbol and chain
      return assets.find(a => 
        a.symbol.toUpperCase() === assetFromUrl.toUpperCase() && 
        a.network === chainFromUrl
      ) || null;
    } else if (assetFromUrl) {
      // Find first asset matching symbol
      return assets.find(a => a.symbol.toUpperCase() === assetFromUrl.toUpperCase()) || null;
    }
    return null;
  }, [assets, assetFromUrl, chainFromUrl]);

  // Determine initial step based on context
  const getInitialStep = (): Step => {
    // If both asset and chain specified via URL, skip to address input
    if (assetFromUrl && chainFromUrl && chainFromUrl !== 'all' && initialAsset) {
      return 'address';
    }
    // If only asset specified via URL, still skip to address (for backward compatibility)
    if (assetFromUrl && initialAsset) {
      return 'address';
    }
    // Default: start with asset selection
    return 'asset';
  };
  
  const [step, setStep] = useState<Step>(getInitialStep());
  const [address, setAddress] = useState(prefilledData?.prefilledAddress || '');
  const [selectedContact, setSelectedContact] = useState<typeof contacts[0] | null>(null);
  const [amount, setAmount] = useState('');
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(initialAsset || (assets[0] || null));
  const [memo, setMemo] = useState('');
  const [riskScore, setRiskScore] = useState<{ score: RiskColor; reasons: string[] } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showSatoshiTest, setShowSatoshiTest] = useState(false);
  const [confirmRisk, setConfirmRisk] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [feeTier, setFeeTier] = useState<FeeTier>('standard');
  const [isGasless, setIsGasless] = useState(false);
  const [gaslessPromptShown, setGaslessPromptShown] = useState(false);
  const [gaslessConfirmOpen, setGaslessConfirmOpen] = useState(false);
  const [showContactDrawer, setShowContactDrawer] = useState(false);
  const [testTipDismissed, setTestTipDismissed] = useState(false);
  

  // Source address selection
  const [selectedSourceAddressId, setSelectedSourceAddressId] = useState<string | null>(null);

  // Asset selection step states
  const [assetSearchQuery, setAssetSearchQuery] = useState('');
  const [assetFilterChain, setAssetFilterChain] = useState<ChainId>('all');

  // Source addresses for the selected asset's chain
  const sourceAddresses = useMemo(() => {
    if (!selectedAsset) return [];
    return getAddressesForChain(currentWallet, selectedAsset.network);
  }, [selectedAsset, currentWallet]);

  const hasMultipleSourceAddresses = sourceAddresses.length > 1;

  const selectedSourceAddress = useMemo(() => {
    if (selectedSourceAddressId) {
      return sourceAddresses.find(a => a.id === selectedSourceAddressId) || sourceAddresses[0] || null;
    }
    return sourceAddresses[0] || null;
  }, [sourceAddresses, selectedSourceAddressId]);

  // Get the balance for the selected source address
  const sourceBalance = useMemo(() => {
    if (!selectedAsset || !hasMultipleSourceAddresses || !selectedSourceAddressId) {
      return selectedAsset?.balance || 0;
    }
    // Find assets matching both symbol, network and addressId
    const addrAssets = assets.filter(a =>
      a.symbol === selectedAsset.symbol &&
      a.network === selectedAsset.network &&
      a.addressId === selectedSourceAddressId
    );
    return addrAssets.reduce((sum, a) => sum + a.balance, 0);
  }, [selectedAsset, assets, hasMultipleSourceAddresses, selectedSourceAddressId]);

  // Get limit status
  const limitStatus = getLimitStatus();
  const currentAmount = parseFloat(amount) || 0;
  const limitCheck = checkTransferLimit(currentAmount);

  // Mock token price (in real app, fetch from API)
  const tokenPrice = selectedAsset 
    ? (selectedAsset.symbol === 'USDT' || selectedAsset.symbol === 'USDC' ? 1 : 
       selectedAsset.symbol === 'ETH' ? 3500 : 
       selectedAsset.symbol === 'BTC' ? 97500 : 1)
    : 1;

  // Filtered and sorted assets for asset selection step
  const filteredAssets = useMemo(() => {
    let result = [...assets];

    // Chain filter
    if (assetFilterChain !== 'all') {
      result = result.filter(asset => asset.network === assetFilterChain);
    }

    // Search filter
    if (assetSearchQuery.trim()) {
      const query = assetSearchQuery.toLowerCase().trim();
      result = result.filter(
        asset =>
          asset.symbol.toLowerCase().includes(query) ||
          asset.name.toLowerCase().includes(query)
      );
    }

    // Sort by USD value descending
    return result.sort((a, b) => b.usdValue - a.usdValue);
  }, [assets, assetFilterChain, assetSearchQuery]);

  // Check if should show test transfer tip (for new addresses with large amounts)
  const shouldShowTestTip = useMemo(() => {
    if (testTipDismissed) return false;
    if (!amount || parseFloat(amount) <= 0) return false;
    
    const usdValue = parseFloat(amount) * tokenPrice;
    const isNewAddress = !contacts.find(c => 
      c.address.toLowerCase() === address.toLowerCase()
    );
    
    return isNewAddress && usdValue > 100;
  }, [amount, tokenPrice, contacts, address, testTipDismissed]);

  // Handle test transfer button click
  const handleTestTransfer = () => {
    setAmount('1');
    setTestTipDismissed(true);
    toast.success('已改为测试金额');
  };

  // Simple address validation using unified chain-utils
  const isAddressValid = useMemo(() => {
    if (!address || address.length < 20 || !selectedAsset) return false;
    return validateChainAddress(address, selectedAsset.network);
  }, [address, selectedAsset]);

  const handleSelectAsset = (asset: Asset) => {
    setSelectedAsset(asset);
    setSelectedSourceAddressId(null); // Reset source address
    setAmount(''); // Reset amount when changing asset
    setStep('address');
  };

  const handleSelectContact = (contact: typeof contacts[0]) => {
    setSelectedContact(contact);
    setAddress(contact.address);
  };

  const handleQRScan = (data: ParsedQRData) => {
    setAddress(data.address);
    setSelectedContact(null);
    if (data.amount) setAmount(data.amount.toString());
    if (data.memo) setMemo(data.memo);
  };

  const handleKeypadInput = (key: string) => {
    if (key === '.' && amount.includes('.')) return;
    if (amount === '0' && key !== '.') {
      setAmount(key);
    } else {
      setAmount(prev => prev + key);
    }
  };

  const handleKeypadDelete = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleContinue = () => {
    if (step === 'address' && address && isAddressValid) {
      setStep('amount');
    } else if (step === 'amount' && parseFloat(amount) > 0 && limitCheck.allowed && selectedAsset) {
      setStep('confirm');
    } else if (step === 'confirm') {
      if (riskScore?.score === 'yellow' && !confirmRisk) return;
      // Directly trigger authentication and send
      handleAuth();
    }
  };

  const handleAuth = async () => {
    if (!selectedAsset) return;
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await sendTransaction(address, parseFloat(amount), selectedAsset.symbol, selectedAsset.network, memo);
      setStep('success');
    } catch (error) {
      console.error('Transaction failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    switch (step) {
      case 'asset':
        navigate(-1);
        break;
      case 'address':
        // If coming from URL with asset specified, go back to previous page
        if (assetFromUrl && initialAsset) {
          navigate(-1);
        } else {
          setStep('asset');
        }
        break;
      case 'amount':
        // Reset test tip state when going back
        setTestTipDismissed(false);
        setStep('address');
        break;
      case 'confirm':
        setStep('amount');
        break;
      default:
        setStep('address');
    }
  };

  const isLimitedTransfer = walletStatus === 'created_no_backup';
  const transferLimit = isLimitedTransfer ? 50 : limitStatus.singleLimit;

  const getStepTitle = () => {
    switch (step) {
      case 'asset': return '选择币种';
      case 'address': return '收款地址';
      case 'amount': return '输入金额';
      case 'confirm': return '确认转账';
      case 'success': return '转账成功';
    }
  };


  return (
    <AppLayout showNav={false} showSecurityBanner={false}>
      <SwipeBack enabled={step === 'asset' || (step === 'address' && !!assetFromUrl)}>
      <div className="flex flex-col h-full bg-background">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 shrink-0">
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">{getStepTitle()}</h1>
          <div className="w-10" />
        </div>

        {/* Limit Warning for unbacked wallet */}
        {isLimitedTransfer && step !== 'success' && step !== 'asset' && (
          <div className="mx-4 mb-3 p-4 bg-warning-surface border border-warning/30 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-warning" strokeWidth={1.5} />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <p className="text-sm font-medium text-foreground">
                  未完成备份，单笔限额 {transferLimit} USDT
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col overflow-hidden">
          <AnimatePresence mode="wait">
            {/* Step 0: Asset Selection */}
            {step === 'asset' && (
              <motion.div
                key="asset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col overflow-hidden"
              >
                {/* Search Bar */}
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
                      <button
                        onClick={() => setAssetSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                      >
                        <X className="w-4 h-4 text-muted-foreground" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Chain Filter */}
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

                {/* Asset List */}
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
                          {/* Token Icon with Chain Badge */}
                          <div className="relative shrink-0">
                            <CryptoIcon symbol={asset.symbol} size="lg" />
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border-2 border-card flex items-center justify-center">
                              <ChainIcon chainId={asset.network} size="sm" />
                            </div>
                          </div>

                          {/* Token Info */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground">
                                {asset.symbol}
                              </span>
                              <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                {getChainName(asset.network)}
                              </span>
                            </div>
                            <p className="text-sm text-muted-foreground truncate mt-0.5">
                              {asset.name}
                            </p>
                          </div>

                          {/* Balance */}
                          <div className="text-right shrink-0">
                            <p className="font-medium text-foreground">
                              {asset.balance.toLocaleString()}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ${asset.usdValue.toLocaleString()}
                            </p>
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </motion.div>
            )}

            {/* Step 1: Address */}
            {step === 'address' && (
              <motion.div
                key="address"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 px-4 py-4 overflow-y-auto space-y-4"
              >
                {/* Selected Asset Display */}
                {selectedAsset && (
                  <button
                    onClick={() => {
                      if (!assetFromUrl) {
                        setStep('asset');
                      }
                    }}
                    className={cn(
                      "w-full p-3 rounded-xl bg-muted/50 border border-border/50 flex items-center gap-3",
                      !assetFromUrl && "transition-colors"
                    )}
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
                    {!assetFromUrl && (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                )}

                {/* Source Address Selector - only when multiple addresses */}
                {hasMultipleSourceAddresses && selectedAsset && (
                  <div>
                    <label className="text-sm font-medium text-foreground mb-2 block">
                      付款地址
                    </label>
                    <div className="space-y-1.5">
                      {sourceAddresses.map((addr) => {
                        const isSelected = selectedSourceAddress?.id === addr.id;
                        // Get balance for this specific address
                        const addrBalance = assets
                          .filter(a => a.symbol === selectedAsset.symbol && a.network === selectedAsset.network && a.addressId === addr.id)
                          .reduce((sum, a) => sum + a.balance, 0);
                        return (
                          <button
                            key={addr.id}
                            onClick={() => setSelectedSourceAddressId(addr.id)}
                            className={cn(
                              'w-full p-3 rounded-xl border flex items-center gap-3 text-left transition-all',
                              isSelected
                                ? 'border-accent bg-accent/5 ring-2 ring-inset ring-accent/30'
                                : 'border-border'
                            )}
                          >
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-foreground">{addr.label}</p>
                              <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                                {addr.address.slice(0, 8)}...{addr.address.slice(-6)}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-sm font-medium text-foreground">
                                {addrBalance.toLocaleString()}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {selectedAsset.symbol}
                              </p>
                            </div>
                            {isSelected && (
                              <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    收款地址
                  </label>
                  <div className="relative">
                    <Input
                      placeholder="粘贴地址或选择联系人"
                      value={address}
                      onChange={(e) => {
                        setAddress(e.target.value);
                        setSelectedContact(null);
                      }}
                      className="pr-[88px] text-base h-12"
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-9 w-9"
                        onClick={() => setShowQRScanner(true)}
                      >
                        <Scan className="w-5 h-5 text-muted-foreground" />
                      </Button>
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

                {/* Address Validation Status */}
                {address && !isAddressValid && (
                  <p className="text-sm text-destructive mt-1.5 px-1">
                    请输入有效的钱包地址
                  </p>
                )}

                {/* Contacts - filtered by same chain family */}
                {(() => {
                  // Get chain label for display
                  const getChainLabel = (network: string) => {
                    if (network === 'ethereum' || network === 'bsc') return 'EVM';
                    if (network === 'tron') return 'TRX';
                    return network.toUpperCase();
                  };

                  // Check if contact matches current asset's chain family
                  const isChainCompatible = (contactNetwork: string) => {
                    if (!selectedAsset) return true;
                    const assetNetwork = selectedAsset.network;
                    // EVM chains (ethereum, bsc) are compatible with each other
                    const evmChains = ['ethereum', 'bsc'];
                    if (evmChains.includes(assetNetwork) && evmChains.includes(contactNetwork)) {
                      return true;
                    }
                    // Other chains must match exactly
                    return assetNetwork === contactNetwork;
                  };

                  const filteredContacts = contacts.filter(c => isChainCompatible(c.network));

                  return (
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-medium text-foreground">最近交易</h3>
                        {filteredContacts.length > 3 && (
                          <button
                            onClick={() => setShowContactDrawer(true)}
                            className="text-xs text-primary"
                          >
                            查看全部
                          </button>
                        )}
                      </div>
                      <div className="space-y-2">
                        {filteredContacts.slice(0, 3).map((contact) => (
                          <button
                            key={contact.id}
                            onClick={() => handleSelectContact(contact)}
                            className={cn(
                              'w-full p-4 rounded-xl border text-left transition-colors',
                              selectedContact?.id === contact.id 
                                ? 'border-accent bg-accent/5' 
                                : 'border-border'
                            )}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className={cn(
                                    "font-medium",
                                    contact.name ? "text-foreground" : "text-muted-foreground"
                                  )}>
                                    {contact.name || '未命名地址'}
                                  </p>
                                  <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded">
                                    {getChainLabel(contact.network)}
                                  </span>
                                </div>
                                <p className="text-sm text-muted-foreground font-mono break-all mt-1">
                                  {contact.address}
                                </p>
                              </div>
                              {selectedContact?.id === contact.id && (
                                <CheckCircle2 className="w-5 h-5 text-accent" />
                              )}
                            </div>
                          </button>
                        ))}
                        
                        {filteredContacts.length === 0 && (
                          <div className="w-full p-4 rounded-xl border border-dashed border-border text-center text-muted-foreground">
                            <Users className="w-5 h-5 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">暂无最近交易</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })()}
              </motion.div>
            )}

            {/* Step 2: Amount - Mobile Optimized */}
            {step === 'amount' && selectedAsset && (
              <motion.div
                key="amount"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col"
              >
                {/* Address Bar */}
                <div className="px-4 pt-2">
                  <AddressBar
                    address={address}
                    label={selectedContact?.name}
                    onClear={() => setStep('address')}
                  />
                </div>

                {/* Amount Display - Centered */}
                <div className="flex-1 flex flex-col items-center justify-center px-4 min-h-0">
                  <AmountDisplay
                    amount={amount}
                    symbol={selectedAsset.symbol}
                    tokenPrice={tokenPrice}
                    maxBalance={hasMultipleSourceAddresses ? sourceBalance : selectedAsset.balance}
                    onMaxClick={() => setAmount((hasMultipleSourceAddresses ? sourceBalance : selectedAsset.balance).toString())}
                    chainId={selectedAsset.network}
                    className="py-4"
                  />

                  {/* Balance Info with Max Button */}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>可用:</span>
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-muted rounded-lg">
                      <span className="font-medium text-foreground">
                        {(hasMultipleSourceAddresses ? sourceBalance : selectedAsset.balance).toLocaleString()} {selectedAsset.symbol}
                      </span>
                    </div>
                    <button
                      onClick={() => setAmount((hasMultipleSourceAddresses ? sourceBalance : selectedAsset.balance).toString())}
                      className="px-3 py-1 text-xs font-medium text-primary bg-primary/10 rounded-full transition-colors"
                    >
                      全部
                    </button>
                  </div>
                </div>

                {/* Test Transfer Tip + Send Button - Fixed height section */}
                <div className="px-4 pb-2 space-y-3 shrink-0">
                  {/* Test Transfer Tip - Compact Version */}
                  <AnimatePresence>
                    {shouldShowTestTip && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 py-2 rounded-lg border border-warning/30 bg-warning/10 flex items-center gap-2">
                          <Lightbulb className="w-3.5 h-3.5 text-warning shrink-0" />
                          <span className="text-xs text-foreground flex-1">首次转账建议先小额验证</span>
                          <button
                            className="text-xs text-muted-foreground ml-auto"
                            onClick={() => setTestTipDismissed(true)}
                          >
                            忽略
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Send Button */}
                  <Button
                    size="lg"
                    className="w-full text-lg font-semibold h-12"
                    onClick={handleContinue}
                    disabled={!amount || parseFloat(amount) <= 0 || parseFloat(amount) > (hasMultipleSourceAddresses ? sourceBalance : selectedAsset.balance) || !limitCheck.allowed}
                  >
                    发送
                  </Button>
                </div>

                {/* Numeric Keypad */}
                <NumericKeypad
                  onInput={handleKeypadInput}
                  onDelete={handleKeypadDelete}
                />
              </motion.div>
            )}

            {/* Step 3: Confirm */}
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
                        <span className="text-xs bg-warning/10 text-warning px-2 py-0.5 rounded-full">
                          新地址
                        </span>
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
                </div>

                {/* Fee Selector */}
                <NetworkFeeSelector
                  selectedTier={feeTier}
                  onSelect={setFeeTier}
                  networkName={SUPPORTED_CHAINS.find(c => c.id === selectedAsset.network)?.name}
                  isGasless={isGasless}
                  onGaslessChange={(v) => {
                    if (v && !gaslessPromptShown) {
                      setGaslessConfirmOpen(true);
                    } else {
                      setIsGasless(v);
                    }
                  }}
                />

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

                {/* Satoshi Test Suggestion */}
                {showSatoshiTest && (
                  <div className="card-elevated p-4 border-accent/30 bg-accent/5">
                    <div className="flex items-start gap-3">
                      <Info className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-foreground">建议先进行小额测试</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          确认对方地址可正常到账后再转大额
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Risk Warning Confirm */}
                {riskScore?.score === 'yellow' && (
                  <label className="flex items-start gap-3 p-4 bg-warning/5 border border-warning/20 rounded-xl cursor-pointer">
                    <input
                      type="checkbox"
                      checked={confirmRisk}
                      onChange={(e) => setConfirmRisk(e.target.checked)}
                      className="mt-0.5 w-5 h-5 accent-warning"
                    />
                    <span className="text-sm text-foreground">
                      我理解该地址存在潜在风险，仍要继续转账
                    </span>
                  </label>
                )}
              </motion.div>
            )}

            {/* Step 4: Success */}
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
                  className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6"
                >
                  <CheckCircle2 className="w-12 h-12 text-success" />
                </motion.div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                  转账已提交
                </h2>
                <p className="text-muted-foreground text-sm max-w-[280px]">
                  交易正在处理中，请在记录页面查看状态
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
              onClick={handleContinue}
              disabled={
                (step === 'address' && (!address || !isAddressValid)) ||
                isLoading
              }
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  处理中...
                </>
              ) : (step === 'confirm' ? '确认并转账' : '继续')}
            </Button>
          </div>
        )}
      </div>
      </SwipeBack>

      {/* QR Scanner Modal */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />

      {/* Contact Drawer */}
      <ContactDrawer
        open={showContactDrawer}
        onOpenChange={setShowContactDrawer}
        contacts={contacts}
        onSelect={handleSelectContact}
        selectedNetwork={selectedAsset?.network}
      />

      {/* Gasless first-time confirmation dialog */}
      {gaslessConfirmOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={() => setGaslessConfirmOpen(false)}>
          <div
            className="bg-white rounded-[16px] w-[270px] overflow-hidden"
            style={{ boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.12)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 text-center">
              <p className="text-[16px] leading-[22px] font-semibold text-[#1c1c1c]">Gasless 交易</p>
              <p className="text-[14px] leading-[20px] text-[#8E8E93] mt-2">开启 Gasless 后，交易将由赞助方代付 Gas 费用。首次使用需要签署两笔交易：第一笔为 Gasless 授权，第二笔为实际转账。</p>
            </div>
            <div className="flex border-t border-[#EDEEF3]">
              <button
                className="flex-1 py-3 text-[16px] leading-[22px] font-medium text-[#1c1c1c] border-r border-[#EDEEF3] active:bg-muted/50 transition-colors"
                onClick={() => setGaslessConfirmOpen(false)}
              >
                取消
              </button>
              <button
                className="flex-1 py-3 text-[16px] leading-[22px] font-medium text-[#1F32D6] active:bg-muted/50 transition-colors"
                onClick={() => {
                  setIsGasless(true);
                  setGaslessPromptShown(true);
                  setGaslessConfirmOpen(false);
                }}
              >
                确认开启
              </button>
            </div>
          </div>
        </div>
      )}

    </AppLayout>
  );
}
