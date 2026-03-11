import { motion } from 'framer-motion';
import { ChainId, ChainInfo, SUPPORTED_CHAINS } from '@/types/wallet';
import { ChainIcon } from '@/components/ChainIcon';
import { cn } from '@/lib/utils';

interface ChainSelectorProps {
  selectedChain: ChainId;
  onSelectChain: (chain: ChainId) => void;
  showAll?: boolean;
  /** Custom list of chain IDs to show (if provided, overrides showAll) */
  availableChains?: ChainId[];
  className?: string;
}

export function ChainSelector({ 
  selectedChain, 
  onSelectChain, 
  showAll = true,
  availableChains,
  className 
}: ChainSelectorProps) {
  // If availableChains is provided, filter to only those chains (always include 'all' at the start if showAll is true)
  const chains = availableChains 
    ? (showAll 
        ? [SUPPORTED_CHAINS.find(c => c.id === 'all')!, ...SUPPORTED_CHAINS.filter(c => availableChains.includes(c.id) && c.id !== 'all')]
        : SUPPORTED_CHAINS.filter(c => availableChains.includes(c.id) && c.id !== 'all'))
    : (showAll 
        ? SUPPORTED_CHAINS 
        : SUPPORTED_CHAINS.filter(c => c.id !== 'all'));

  return (
    <div className={cn("flex gap-2 overflow-x-auto scrollbar-hide py-1", className)}>
      {chains.map((chain) => (
        <button
          key={chain.id}
          onClick={() => onSelectChain(chain.id)}
          className={cn(
            "relative flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition-colors",
            selectedChain === chain.id
              ? "text-foreground border border-transparent"
              : "border border-border text-muted-foreground hover:bg-muted/30"
          )}
        >
          {selectedChain === chain.id && (
            <motion.div
              layoutId="chainSelector"
              className="absolute inset-0 bg-muted rounded-full"
              transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10 flex items-center">
            <ChainIcon chainId={chain.icon} size="sm" />
          </span>
          <span className="relative z-10">{chain.name}</span>
        </button>
      ))}
    </div>
  );
}
