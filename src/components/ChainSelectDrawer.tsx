import { ChainId, SUPPORTED_CHAINS } from '@/types/wallet';
import { ChainIcon } from '@/components/ChainIcon';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface ChainData {
  network: Exclude<ChainId, 'all'>;
  balance: number;
  usdValue: number;
}

interface ChainSelectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  assetSymbol: string;
  chains: ChainData[];
  onSelectChain: (chainId: Exclude<ChainId, 'all'>) => void;
}

export function ChainSelectDrawer({
  open,
  onOpenChange,
  title,
  assetSymbol,
  chains,
  onSelectChain,
}: ChainSelectDrawerProps) {
  const handleSelect = (chainId: Exclude<ChainId, 'all'>) => {
    onSelectChain(chainId);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="pb-2">
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6">
          <div className="space-y-2">
            {chains.map((chain) => {
              const chainInfo = SUPPORTED_CHAINS.find(c => c.id === chain.network);
              return (
                <button
                  key={chain.network}
                  onClick={() => handleSelect(chain.network)}
                  className="w-full p-4 flex items-center gap-3 hover:bg-muted/50 transition-colors rounded-xl bg-card border border-border/50"
                >
                  <div className="w-10 h-10 rounded-full bg-muted/50 flex items-center justify-center">
                    <ChainIcon chainId={chain.network} size="lg" />
                  </div>
                  <div className="flex flex-col items-start flex-1">
                    <span className="font-semibold text-foreground">
                      {chainInfo?.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {chainInfo?.shortName}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-foreground">
                      {chain.balance.toLocaleString()} {assetSymbol}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ≈ ${chain.usdValue.toLocaleString()}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
