import { ChevronDown, Check } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const label = selectedChainInfo?.name || '全部网络';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "flex items-center gap-2 h-8 px-3 rounded-lg",
            "bg-muted active:bg-muted/70 transition-colors",
            "focus:outline-none",
            className
          )}
        >
          <ChainIcon chainId={selectedChainInfo?.icon || 'all'} size="sm" />
          <span className="text-xs font-medium text-foreground">{label}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-48 bg-popover border border-border shadow-lg z-50"
        container={document.getElementById('phone-frame-container') || undefined}
      >
        {SUPPORTED_CHAINS.map((chain) => {
          const isSelected = selectedChain === chain.id;
          return (
            <DropdownMenuItem
              key={chain.id}
              onClick={() => onSelectChain(chain.id)}
              className={cn(
                "flex items-center gap-3 py-2.5 px-3 cursor-pointer",
                isSelected && "bg-muted/50"
              )}
            >
              <ChainIcon chainId={chain.icon} size="sm" className="shrink-0" />
              <span className="flex-1 text-sm font-medium">{chain.name}</span>
              {isSelected && (
                <Check className="w-4 h-4 text-primary shrink-0" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
