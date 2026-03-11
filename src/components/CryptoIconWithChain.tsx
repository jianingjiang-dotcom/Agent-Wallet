import { CryptoIcon } from '@/components/CryptoIcon';
import { ChainIcon } from '@/components/ChainIcon';
import { ChainId } from '@/types/wallet';
import { cn } from '@/lib/utils';

interface CryptoIconWithChainProps {
  symbol: string;
  chainId: ChainId;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const badgeSizeMap = {
  sm: 'w-3 h-3 -bottom-0.5 -right-0.5',
  md: 'w-4 h-4 -bottom-0.5 -right-0.5',
  lg: 'w-5 h-5 -bottom-0.5 -right-0.5',
};

export function CryptoIconWithChain({ symbol, chainId, size = 'md', className }: CryptoIconWithChainProps) {
  // Don't show chain badge for 'all'
  if (chainId === 'all') {
    return <CryptoIcon symbol={symbol} size={size} className={className} />;
  }

  return (
    <div className={cn('relative inline-flex', className)}>
      <CryptoIcon symbol={symbol} size={size} />
      <div className={cn(
        'absolute rounded-full bg-background border border-border/50 flex items-center justify-center',
        badgeSizeMap[size]
      )}>
        <ChainIcon chainId={chainId} size="xs" />
      </div>
    </div>
  );
}
