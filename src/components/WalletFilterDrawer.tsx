import { useState, useRef, useEffect } from 'react';
import { Check, Copy, LayoutGrid, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { cn, formatAddressShort, copyToClipboard } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { ChainIcon } from '@/components/ChainIcon';
import type { AddressSelection, WalletAddress, ChainId } from '@/types/wallet';
import { ADDRESS_SYSTEMS, SUPPORTED_CHAINS } from '@/types/wallet';

interface WalletFilterDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletAddresses: WalletAddress[];
  addressSelection: AddressSelection;
  onAddressChange: (sel: AddressSelection) => void;
  selectedChain: ChainId;
  onChainChange: (chain: ChainId) => void;
}

export function WalletFilterDrawer({
  open, onOpenChange,
  walletAddresses,
  addressSelection, onAddressChange,
  selectedChain, onChainChange,
}: WalletFilterDrawerProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [chainMenuOpen, setChainMenuOpen] = useState(false);
  const chainMenuRef = useRef<HTMLDivElement>(null);
  const selectedChainInfo = SUPPORTED_CHAINS.find(c => c.id === selectedChain);

  // Close chain menu on outside click
  useEffect(() => {
    if (!chainMenuOpen) return;
    const handler = (e: MouseEvent) => {
      if (chainMenuRef.current && !chainMenuRef.current.contains(e.target as Node)) {
        setChainMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [chainMenuOpen]);

  // Reset chain menu when drawer closes
  useEffect(() => {
    if (!open) setChainMenuOpen(false);
  }, [open]);

  // Filter addresses based on selected chain
  const filteredAddresses = selectedChain === 'all'
    ? walletAddresses
    : walletAddresses.filter(addr => {
        const sys = ADDRESS_SYSTEMS.find(s => s.id === addr.system);
        return sys?.chains.includes(selectedChain);
      });

  const groupedAddresses = ADDRESS_SYSTEMS.map(sys => ({
    ...sys,
    addresses: filteredAddresses.filter(a => a.system === sys.id),
  })).filter(g => g.addresses.length > 0);

  const handleSelectAddress = (sel: AddressSelection) => {
    onAddressChange(sel);
    onOpenChange(false);
  };

  const handleSelectChain = (chain: ChainId) => {
    onChainChange(chain);
    setChainMenuOpen(false);
    // Reset address if it doesn't belong to this chain
    if (addressSelection.mode === 'address' && chain !== 'all') {
      const addr = walletAddresses.find(a => a.id === addressSelection.addressId);
      if (addr) {
        const sys = ADDRESS_SYSTEMS.find(s => s.id === addr.system);
        if (!sys?.chains.includes(chain)) {
          onAddressChange({ mode: 'all' });
        }
      }
    }
  };

  const handleCopy = async (e: React.MouseEvent, addr: WalletAddress) => {
    e.stopPropagation();
    const ok = await copyToClipboard(addr.address);
    if (ok) {
      setCopiedId(addr.id);
      toast.success('已复制');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  const isSelected = (addrId: string) =>
    addressSelection.mode === 'address' && addressSelection.addressId === addrId;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[80%]">
        <DrawerHeader className="flex items-center justify-between pr-4">
          <DrawerTitle>选择地址</DrawerTitle>

          {/* Chain filter — custom dropdown */}
          <div className="relative" ref={chainMenuRef}>
            <button
              onClick={() => setChainMenuOpen(!chainMenuOpen)}
              className="flex items-center gap-1.5 h-8 px-2.5 rounded-xl bg-muted text-sm font-medium transition-colors"
            >
              <ChainIcon chainId={selectedChainInfo?.icon || 'all'} size="sm" />
              <span className="text-xs">{selectedChainInfo?.id === 'all' ? '全部网络' : selectedChainInfo?.shortName}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform', chainMenuOpen && 'rotate-180')} />
            </button>

            <AnimatePresence>
              {chainMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1 w-44 bg-popover border border-border rounded-xl shadow-xl z-50 py-1 max-h-60 overflow-y-auto"
                >
                  {SUPPORTED_CHAINS.map(chain => (
                    <button
                      key={chain.id}
                      onClick={() => handleSelectChain(chain.id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 py-2.5 px-3 text-left transition-colors',
                        selectedChain === chain.id ? 'bg-accent/10' : 'hover:bg-muted/50',
                      )}
                    >
                      <ChainIcon chainId={chain.icon} size="sm" className="shrink-0" />
                      <span className="flex-1 text-sm">{chain.name}</span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto">
          {/* All addresses */}
          <button
            onClick={() => handleSelectAddress({ mode: 'all' })}
            className={cn(
              'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
              addressSelection.mode === 'all' && 'bg-accent/10',
            )}
          >
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <LayoutGrid className="w-4 h-4 text-muted-foreground" />
            </div>
            <span className="flex-1 text-sm font-medium">全部地址</span>
          </button>

          {/* Grouped addresses — filtered by chain */}
          {groupedAddresses.map(group => (
            <div key={group.id} className="mt-4">
              <div className="flex items-center gap-2 px-3 mb-1.5">
                <ChainIcon chainId={group.id} size="xs" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  {group.name}
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>

              {group.addresses.map(addr => (
                <button
                  key={addr.id}
                  onClick={() => handleSelectAddress({ mode: 'address', addressId: addr.id })}
                  className={cn(
                    'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                    isSelected(addr.id) && 'bg-accent/10',
                  )}
                >
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                    isSelected(addr.id) ? 'bg-accent/10' : 'bg-muted',
                  )}>
                    <ChainIcon chainId={addr.system} size="md" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{addr.label}</p>
                    <p className="text-xs font-mono text-muted-foreground/70 truncate">
                      {formatAddressShort(addr.address)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => handleCopy(e, addr)}
                    className="p-1.5 rounded-lg transition-colors shrink-0"
                  >
                    {copiedId === addr.id ? (
                      <Check className="w-3.5 h-3.5 text-success" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </button>
                </button>
              ))}
            </div>
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
}
