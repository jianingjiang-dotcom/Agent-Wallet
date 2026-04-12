import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ChainId, SUPPORTED_CHAINS } from '@/types/wallet';
import { ChainIcon } from '@/components/ChainIcon';

interface ChainDropdownProps {
  selectedChain: ChainId;
  onSelectChain: (chain: ChainId) => void;
  className?: string;
}

export function ChainDropdown({
  selectedChain,
  onSelectChain,
  className,
}: ChainDropdownProps) {
  const selectedChainInfo = SUPPORTED_CHAINS.find(c => c.id === selectedChain);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "h-8 px-2 gap-1.5 bg-secondary/80 rounded-xl focus-visible:ring-0 focus-visible:ring-offset-0",
            className
          )}
        >
          <ChainIcon chainId={selectedChainInfo?.icon || 'all'} size="md" />
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-48 bg-popover border border-border shadow-xl z-50"
        container={document.getElementById('phone-frame-container') || undefined}
      >
        {SUPPORTED_CHAINS.map((chain) => {
          const isSelected = selectedChain === chain.id;
          return (
            <DropdownMenuItem
              key={chain.id}
              onClick={() => onSelectChain(chain.id)}
              className={cn(
                "flex items-center gap-3 py-2.5 px-3 cursor-pointer focus:bg-muted/50",
                isSelected && "bg-muted/50"
              )}
            >
              <ChainIcon chainId={chain.icon} size="md" className="shrink-0" />
              <span className="flex-1 text-sm font-medium">{chain.name}</span>
              {isSelected && (
                <Check className="w-4 h-4 text-accent shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
