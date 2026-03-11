import { useState } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { Asset, ChainId } from '@/types/wallet';
import { CryptoIcon } from '@/components/CryptoIcon';
import { ChainIcon } from '@/components/ChainIcon';
import { cn } from '@/lib/utils';
import { getChainShortName } from '@/lib/chain-utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';

interface TokenSelectorProps {
  assets: Asset[];
  selectedAsset: Asset;
  onSelect: (asset: Asset) => void;
}

export function TokenSelector({ assets, selectedAsset, onSelect }: TokenSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger Button - Logo + Symbol + Network */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2.5 px-3 py-2 bg-muted hover:bg-muted/80 rounded-xl transition-colors border border-border/50"
      >
        <CryptoIcon symbol={selectedAsset.symbol} size="md" />
        <div className="flex flex-col items-start">
          <span className="font-semibold text-foreground leading-tight">{selectedAsset.symbol}</span>
          <span className="text-xs text-muted-foreground leading-tight">
            {getChainShortName(selectedAsset.network)}
          </span>
        </div>
        <ChevronDown className="w-4 h-4 text-muted-foreground ml-1" />
      </button>

      {/* Bottom Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-h-[70vh]">
          <DrawerHeader className="border-b border-border pb-4">
            <DrawerTitle className="text-center">选择币种</DrawerTitle>
          </DrawerHeader>

          {/* Asset List */}
          <div className="overflow-y-auto flex-1 pb-safe">
            {assets.map((asset) => (
              <button
                key={`${asset.symbol}-${asset.network}`}
                onClick={() => {
                  onSelect(asset);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 active:bg-muted transition-colors",
                  selectedAsset.symbol === asset.symbol && selectedAsset.network === asset.network && "bg-accent/10"
                )}
              >
                {/* Token Icon with Chain Badge */}
                <div className="relative shrink-0">
                  <CryptoIcon symbol={asset.symbol} size="lg" />
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-card border-2 border-card flex items-center justify-center">
                    <ChainIcon chainId={asset.network} size="sm" />
                  </div>
                </div>

                {/* Token Info */}
                <div className="flex-1 text-left min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{asset.symbol}</span>
                    <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                      {getChainShortName(asset.network)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">{asset.name}</p>
                </div>

                {/* Balance */}
                <div className="text-right shrink-0">
                  <p className="font-medium text-foreground">{asset.balance.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">
                    ${asset.usdValue.toLocaleString()}
                  </p>
                </div>

                {/* Selected Indicator */}
                {selectedAsset.symbol === asset.symbol && selectedAsset.network === asset.network && (
                  <Check className="w-5 h-5 text-accent shrink-0" />
                )}
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
