import { useState, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Copy, Download, Check, CheckCircle2, ChevronDown, Info, Search,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/lib/toast';
import { copyToClipboard } from '@/lib/utils';
import { ChainId, SUPPORTED_CHAINS } from '@/types/wallet';
import { ChainIcon } from '@/components/ChainIcon';
import { getChainIconUrl } from '@/lib/crypto-icons';
import { getAddressesForChain } from '@/lib/chain-utils';
import { cn } from '@/lib/utils';
import coboLogoSvg from '@/assets/cobo-logo.svg';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

const networks = SUPPORTED_CHAINS.filter(c => c.id !== 'all').map(c => ({
  id: c.id as Exclude<ChainId, 'all'>,
  name: c.name,
  icon: c.icon,
  shortName: c.shortName,
}));

// Mock addresses for each chain (real format)
const MOCK_ADDRESSES: Record<Exclude<ChainId, 'all'>, string> = {
  ethereum: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD91',
  tron: 'TN7qZLpmCvTnfbXnYFMBEZAjuZwKyxqvMb',
  bsc: '0x8B4c5A9d3E7f1C2b0A6D8E9F4C3B2A1E7D6C5B4A',
  solana: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
};

export default function ReceivePage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { currentWallet } = useWallet();
  const qrRef = useRef<HTMLDivElement>(null);
  
  // Parse chain from URL query params (e.g., /receive?chain=ethereum)
  const searchParams = new URLSearchParams(location.search);
  const chainFromUrl = searchParams.get('chain') as Exclude<ChainId, 'all'> | null;
  
  // Find initial network based on URL param
  const initialNetwork = useMemo(() => {
    if (chainFromUrl) {
      return networks.find(n => n.id === chainFromUrl) || networks[0];
    }
    return networks[0];
  }, [chainFromUrl]);

  const [selectedNetwork, setSelectedNetwork] = useState(initialNetwork);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddressDrawerOpen, setIsAddressDrawerOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addressExpanded, setAddressExpanded] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);

  // Get wallet addresses for the selected network
  const networkAddresses = useMemo(() => {
    return getAddressesForChain(currentWallet, selectedNetwork.id as ChainId);
  }, [currentWallet, selectedNetwork.id]);

  const hasMultipleAddresses = networkAddresses.length > 1;

  // Selected address object
  const selectedWalletAddress = useMemo(() => {
    if (selectedAddressId) {
      return networkAddresses.find(a => a.id === selectedAddressId) || networkAddresses[0] || null;
    }
    return networkAddresses[0] || null;
  }, [networkAddresses, selectedAddressId]);

  // Handle context-aware back navigation
  const handleBack = useCallback(() => {
    // Check if there's a referrer state passed from the previous page
    const fromPage = location.state?.from;
    
    if (fromPage) {
      navigate(fromPage);
    } else if (window.history.length > 2) {
      // If there's browser history, go back
      navigate(-1);
    } else {
      // Default fallback to home
      navigate('/home');
    }
  }, [navigate, location.state]);

  // Get the address for the selected network - memoized to prevent QR refresh
  const fullAddress = useMemo(() => {
    // Prefer the selected wallet address from walletAddresses
    if (selectedWalletAddress) {
      return selectedWalletAddress.address;
    }
    // Fallback to legacy addresses
    if (currentWallet?.addresses?.[selectedNetwork.id]) {
      return currentWallet.addresses[selectedNetwork.id];
    }
    return MOCK_ADDRESSES[selectedNetwork.id];
  }, [selectedWalletAddress, currentWallet, selectedNetwork.id]);

  // Filter networks by search query
  const filteredNetworks = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    return networks.filter(n => 
      n.name.toLowerCase().includes(query) || 
      n.shortName.toLowerCase().includes(query)
    );
  }, [searchQuery]);

  const handleCopy = useCallback(async () => {
    const ok = await copyToClipboard(fullAddress);
    if (ok) {
      setCopied(true);
      toast.success('已复制到剪贴板', '收款地址已复制');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败', '请手动复制地址');
    }
  }, [fullAddress]);

  const handleSaveQRCode = useCallback(async () => {
    if (!qrRef.current) return;
    
    setSaving(true);
    try {
      const svg = qrRef.current.querySelector('svg');
      if (!svg) throw new Error('QR code not found');
      
      // High DPI scale for crisp output (3x for retina quality)
      const scale = 3;
      
      // Base dimensions (will be multiplied by scale)
      const baseWidth = 380;
      const basePadding = 32;
      const baseLogoHeight = 32;
      const baseQrSize = 200;
      const baseContentWidth = baseWidth - basePadding * 2;
      
      // Create canvas with high DPI
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context not available');
      
      // Helper to load image
      const loadImage = (src: string): Promise<HTMLImageElement> => {
        return new Promise((resolve, reject) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => resolve(img);
          img.onerror = reject;
          img.src = src;
        });
      };

      // Helper to wrap text into lines (using scaled font)
      const wrapText = (text: string, maxWidth: number, fontSize: number): string[] => {
        ctx.font = `${fontSize * scale}px ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace`;
        const lines: string[] = [];
        let currentLine = '';
        
        for (const char of text) {
          const testLine = currentLine + char;
          const metrics = ctx.measureText(testLine);
          if (metrics.width > maxWidth * scale && currentLine) {
            lines.push(currentLine);
            currentLine = char;
          } else {
            currentLine = testLine;
          }
        }
        if (currentLine) lines.push(currentLine);
        return lines;
      };

      // Load all assets
      const [logoImg, chainIconImg, qrImg] = await Promise.all([
        loadImage(coboLogoSvg),
        loadImage(getChainIconUrl(selectedNetwork.id)).catch(() => null),
        (async () => {
          const svgData = new XMLSerializer().serializeToString(svg);
          const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
          const svgUrl = URL.createObjectURL(svgBlob);
          const img = await loadImage(svgUrl);
          URL.revokeObjectURL(svgUrl);
          return img;
        })(),
      ]);

      // Calculate address lines height
      const addressLines = wrapText(fullAddress, baseContentWidth, 13);
      const baseAddressLineHeight = 18;
      const baseAddressBlockHeight = addressLines.length * baseAddressLineHeight;

      // Calculate total canvas height (base dimensions)
      const baseLogoSection = baseLogoHeight + 24;
      const baseQrSection = baseQrSize + 20;
      const baseNetworkSection = 28;
      const baseDivider1 = 20;
      const baseAddressSection = baseAddressBlockHeight + 16;
      const baseDivider2 = 16;
      const baseWarningSection = 40;
      const baseBottomPadding = 24;
      
      const baseHeight = basePadding + baseLogoSection + baseQrSection + baseNetworkSection + baseDivider1 + baseAddressSection + baseDivider2 + baseWarningSection + baseBottomPadding;
      
      // Set canvas size with scale
      canvas.width = baseWidth * scale;
      canvas.height = baseHeight * scale;
      
      // Scale all drawing operations
      ctx.scale(scale, scale);
      
      // Fill white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, baseWidth, baseHeight);
      
      let yOffset = basePadding;
      
      // 1. Draw Logo (centered)
      const logoAspect = logoImg.width / logoImg.height;
      const logoDrawHeight = baseLogoHeight;
      const logoDrawWidth = logoDrawHeight * logoAspect;
      ctx.drawImage(logoImg, (baseWidth - logoDrawWidth) / 2, yOffset, logoDrawWidth, logoDrawHeight);
      yOffset += baseLogoSection;
      
      // 2. Draw QR Code (centered)
      const qrX = (baseWidth - baseQrSize) / 2;
      ctx.drawImage(qrImg, qrX, yOffset, baseQrSize, baseQrSize);
      yOffset += baseQrSection;
      
      // 3. Draw Network Badge (centered)
      const networkName = selectedNetwork.name;
      ctx.font = 'bold 14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const networkTextWidth = ctx.measureText(networkName).width;
      const chainIconSize = 18;
      const badgePadding = 12;
      const badgeGap = 6;
      const badgeWidth = chainIconSize + badgeGap + networkTextWidth + badgePadding * 2;
      const badgeHeight = 28;
      const badgeX = (baseWidth - badgeWidth) / 2;
      
      // Badge background
      ctx.fillStyle = '#f3f4f6';
      ctx.beginPath();
      ctx.roundRect(badgeX, yOffset, badgeWidth, badgeHeight, 14);
      ctx.fill();
      
      // Chain icon
      if (chainIconImg) {
        ctx.drawImage(chainIconImg, badgeX + badgePadding, yOffset + (badgeHeight - chainIconSize) / 2, chainIconSize, chainIconSize);
      }
      
      // Network name
      ctx.fillStyle = '#1f2937';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillText(networkName, badgeX + badgePadding + chainIconSize + badgeGap, yOffset + badgeHeight / 2);
      yOffset += baseNetworkSection + baseDivider1;
      
      // 4. Draw divider line
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(basePadding, yOffset - 10);
      ctx.lineTo(baseWidth - basePadding, yOffset - 10);
      ctx.stroke();
      
      // 5. Draw Full Address
      ctx.font = '13px ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace';
      ctx.fillStyle = '#374151';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      
      addressLines.forEach((line, index) => {
        ctx.fillText(line, baseWidth / 2, yOffset + index * baseAddressLineHeight);
      });
      yOffset += baseAddressBlockHeight + baseDivider2;
      
      // 6. Draw divider line
      ctx.beginPath();
      ctx.moveTo(basePadding, yOffset);
      ctx.lineTo(baseWidth - basePadding, yOffset);
      ctx.stroke();
      yOffset += 16;
      
      // 7. Draw Warning
      ctx.font = '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#f59e0b';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠️ 请确认使用 ${networkName} 网络转账`, baseWidth / 2, yOffset);
      
      // Download the image
      const link = document.createElement('a');
      link.download = `收款码_${selectedNetwork.name}_${fullAddress.slice(0, 8)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      setSaving(false);
      toast.success('保存成功', '收款码已保存到本地');
    } catch (error) {
      console.error('Save QR code error:', error);
      setSaving(false);
      toast.error('保存失败', '请重试或截图保存');
    }
  }, [selectedNetwork, fullAddress]);

  const handleSelectNetwork = (network: typeof networks[0]) => {
    setSelectedNetwork(network);
    setSelectedAddressId(null); // Reset address selection when changing network
    setIsDrawerOpen(false);
    setSearchQuery('');
  };

  const NetworkItem = ({ network }: { network: typeof networks[0] }) => (
    <button
      onClick={() => handleSelectNetwork(network)}
      className={`w-full p-4 flex items-center gap-3 transition-colors rounded-xl ${
        selectedNetwork.id === network.id ? 'bg-accent/10' : ''
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
        <ChainIcon chainId={network.id} size="lg" />
      </div>
      <span className="font-semibold text-foreground flex-1 text-left">{network.name}</span>
      {selectedNetwork.id === network.id && (
        <CheckCircle2 className="w-5 h-5 text-accent" />
      )}
    </button>
  );

  return (
    <AppLayout showNav={false} showBack title="收款" onBack={handleBack}>
      <SwipeBack>
      <div className="px-4 py-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >

          {/* Network Selector */}
          <div className="mb-4">
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              选择网络
            </label>
            <Drawer open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
              <DrawerTrigger asChild>
                <button className="w-full card-elevated p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                      <ChainIcon chainId={selectedNetwork.id} size="lg" />
                    </div>
                    <span className="font-semibold text-foreground">{selectedNetwork.name}</span>
                  </div>
                  <ChevronDown className="w-5 h-5 text-muted-foreground" />
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader className="pb-2">
                  <DrawerTitle>选择网络</DrawerTitle>
                </DrawerHeader>
                
                <div className="px-4 pb-4">
                  {/* Search Input */}
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="搜索网络..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9 bg-muted/30 border-0"
                    />
                  </div>

                  {/* Network List */}
                  <div>
                    {filteredNetworks.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        未找到匹配的网络
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredNetworks.map((network) => (
                          <NetworkItem key={network.id} network={network} />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Address Selector - only show when multiple addresses */}
          {hasMultipleAddresses && (
            <div className="mb-4">
              <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
                选择地址
              </label>
              <Drawer open={isAddressDrawerOpen} onOpenChange={setIsAddressDrawerOpen}>
                <DrawerTrigger asChild>
                  <button className="w-full card-elevated p-4 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground text-left text-sm">
                        {selectedWalletAddress?.label || '选择地址'}
                      </p>
                      {selectedWalletAddress && (
                        <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                          {selectedWalletAddress.address.slice(0, 10)}...{selectedWalletAddress.address.slice(-8)}
                        </p>
                      )}
                    </div>
                    <ChevronDown className="w-5 h-5 text-muted-foreground shrink-0 ml-2" />
                  </button>
                </DrawerTrigger>
                <DrawerContent>
                  <DrawerHeader className="pb-2">
                    <DrawerTitle>选择收款地址</DrawerTitle>
                  </DrawerHeader>
                  <div className="px-4 pb-6 space-y-1">
                    {networkAddresses.map((addr) => (
                      <button
                        key={addr.id}
                        onClick={() => {
                          setSelectedAddressId(addr.id);
                          setIsAddressDrawerOpen(false);
                        }}
                        className={cn(
                          'w-full p-4 flex items-center gap-3 transition-colors rounded-xl',
                          (selectedWalletAddress?.id === addr.id) ? 'bg-accent/10' : ''
                        )}
                      >
                        <div className="flex-1 min-w-0 text-left">
                          <p className="font-semibold text-foreground text-sm">{addr.label}</p>
                          <p className="text-xs text-muted-foreground font-mono mt-0.5 truncate">
                            {addr.address}
                          </p>
                        </div>
                        {selectedWalletAddress?.id === addr.id && (
                          <CheckCircle2 className="w-5 h-5 text-accent shrink-0" />
                        )}
                      </button>
                    ))}
                  </div>
                </DrawerContent>
              </Drawer>
            </div>
          )}

          {/* QR Code */}
          <motion.div
            initial={{ scale: 0.95 }}
            animate={{ scale: 1 }}
            className="card-elevated p-4 text-center mb-4"
          >
            <div ref={qrRef} className="w-40 h-40 mx-auto bg-white rounded-xl p-3 mb-3 shadow-sm">
              <QRCodeSVG
                value={fullAddress}
                size={136}
                level="M"
                includeMargin={false}
                className="w-full h-full"
              />
            </div>
            
            <p className="text-xs text-muted-foreground mb-2">
              使用 {selectedNetwork.name} 网络转账到以下地址
            </p>
            
            <button 
              onClick={() => setAddressExpanded(!addressExpanded)}
              className="w-full bg-muted/50 rounded-xl p-3 font-mono text-xs text-foreground text-center transition-all active:bg-muted/70"
            >
              {addressExpanded ? (
                <span className="break-all">{fullAddress}</span>
              ) : (
                <span>{fullAddress.slice(0, 12)}...{fullAddress.slice(-10)}</span>
              )}
              <span className="block text-[10px] text-muted-foreground mt-1">
                {addressExpanded ? '点击收起' : '点击查看完整地址'}
              </span>
            </button>
          </motion.div>

          {/* Actions */}
          <div className="flex gap-3 mb-4">
            <Button
              variant="outline"
              className="flex-1 h-10"
              onClick={handleCopy}
            >
              {copied ? (
                <Check className="w-4 h-4 mr-2" strokeWidth={1.5} />
              ) : (
                <Copy className="w-4 h-4 mr-2" strokeWidth={1.5} />
              )}
              {copied ? '已复制' : '复制地址'}
            </Button>
            <Button
              className="flex-1 h-10"
              onClick={handleSaveQRCode}
              disabled={saving}
            >
              <Download className="w-4 h-4 mr-2" strokeWidth={1.5} />
              {saving ? '保存中...' : '保存二维码'}
            </Button>
          </div>

          {/* Warning */}
          <div className="card-elevated p-3 border-warning/30 bg-warning/5">
            <div className="flex items-start gap-2">
              <Info className="w-4 h-4 text-warning shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-foreground text-sm">重要提示</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  请确保付款方选择相同的网络（{selectedNetwork.name}），否则可能导致资金丢失。
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      </SwipeBack>
    </AppLayout>
  );
}
