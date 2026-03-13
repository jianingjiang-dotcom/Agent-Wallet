import { useState } from 'react';
import { ChevronDown, Check, Copy, LayoutGrid } from 'lucide-react';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { cn, formatAddressShort, copyToClipboard } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { ChainIcon } from '@/components/ChainIcon';
import { getSystemName } from '@/lib/chain-utils';
import type { AddressSelection, WalletAddress, ADDRESS_SYSTEMS as ADDRESS_SYSTEMS_TYPE } from '@/types/wallet';
import { ADDRESS_SYSTEMS } from '@/types/wallet';

interface AddressPickerProps {
  selection: AddressSelection;
  onSelectionChange: (selection: AddressSelection) => void;
  walletAddresses: WalletAddress[];
  className?: string;
}

export function AddressPicker({
  selection,
  onSelectionChange,
  walletAddresses,
  className,
}: AddressPickerProps) {
  const [open, setOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Derive display info for trigger button
  const selectedAddr = selection.mode === 'address'
    ? walletAddresses.find(a => a.id === selection.addressId)
    : null;

  const triggerLabel = selectedAddr ? selectedAddr.label : '全部地址';
  const triggerAddress = selectedAddr ? formatAddressShort(selectedAddr.address) : null;
  const triggerIcon = selectedAddr ? selectedAddr.system : null;

  // Group addresses by system for drawer
  const groupedAddresses = ADDRESS_SYSTEMS.map(sys => ({
    ...sys,
    addresses: walletAddresses.filter(a => a.system === sys.id),
  })).filter(g => g.addresses.length > 0);

  const handleSelect = (sel: AddressSelection) => {
    onSelectionChange(sel);
    setOpen(false);
  };

  const handleCopy = async (e: React.MouseEvent, addr: WalletAddress) => {
    e.stopPropagation();
    const ok = await copyToClipboard(addr.address);
    if (ok) {
      setCopiedId(addr.id);
      toast.success('已复制');
      setTimeout(() => setCopiedId(null), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  const isSelected = (addrId: string) =>
    selection.mode === 'address' && selection.addressId === addrId;

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={cn(
          'w-full flex items-center gap-2.5 h-9 px-3 rounded-xl',
          'bg-white/10 border border-white/15 backdrop-blur-sm',
          'active:bg-white/20 transition-colors',
          className,
        )}
      >
        {triggerIcon ? (
          <ChainIcon chainId={triggerIcon} size="sm" />
        ) : (
          <LayoutGrid className="w-3.5 h-3.5 text-primary-foreground/70" />
        )}
        <div className="flex-1 min-w-0 text-left">
          <span className="text-sm font-medium text-primary-foreground/90 truncate block">
            {triggerLabel}
          </span>
        </div>
        {triggerAddress && (
          <span className="text-xs font-mono text-primary-foreground/50 shrink-0">
            {triggerAddress}
          </span>
        )}
        <ChevronDown className="w-3.5 h-3.5 text-primary-foreground/50 shrink-0" />
      </button>

      {/* Address picker drawer */}
      <Drawer open={open} onOpenChange={setOpen}>
        <DrawerContent className="max-h-[80%]">
          <DrawerHeader>
            <DrawerTitle>选择地址</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6 overflow-y-auto">
            {/* "All addresses" option */}
            <button
              onClick={() => handleSelect({ mode: 'all' })}
              className={cn(
                'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                selection.mode === 'all'
                  ? 'bg-accent/10'
                  : 'hover:bg-muted/50',
              )}
            >
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                <LayoutGrid className="w-4 h-4 text-muted-foreground" />
              </div>
              <span className="flex-1 text-sm font-medium">全部地址</span>
              {selection.mode === 'all' && (
                <Check className="w-4 h-4 text-accent shrink-0" />
              )}
            </button>

            {/* Grouped by address system */}
            {groupedAddresses.map(group => (
              <div key={group.id} className="mt-4">
                {/* System header */}
                <div className="flex items-center gap-2 px-3 mb-1.5">
                  <ChainIcon chainId={group.id} size="xs" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    {group.name}
                  </span>
                  <div className="flex-1 h-px bg-border" />
                </div>

                {/* Address rows */}
                {group.addresses.map(addr => (
                  <button
                    key={addr.id}
                    onClick={() => handleSelect({ mode: 'address', addressId: addr.id })}
                    className={cn(
                      'w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left',
                      isSelected(addr.id)
                        ? 'bg-accent/10'
                        : 'hover:bg-muted/50',
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
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={(e) => handleCopy(e, addr)}
                        className="p-1.5 rounded-lg hover:bg-muted/80 transition-colors"
                      >
                        {copiedId === addr.id ? (
                          <Check className="w-3.5 h-3.5 text-success" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                        )}
                      </button>
                      {isSelected(addr.id) && (
                        <Check className="w-4 h-4 text-accent" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
