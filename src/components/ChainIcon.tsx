import { useState } from 'react';
import { getChainIconUrl } from '@/lib/crypto-icons';
import { cn } from '@/lib/utils';
import { LayoutGrid, Layers } from 'lucide-react';

interface ChainIconProps {
  chainId: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-6 h-6',
};

export function ChainIcon({ chainId, size = 'md', className }: ChainIconProps) {
  const [hasError, setHasError] = useState(false);
  
  // For 'all' chains, show a generic token icon that inherits color from parent
  if (chainId === 'all') {
    return (
      <div className={cn(sizeMap[size], 'flex items-center justify-center', className)}>
        <LayoutGrid className="w-full h-full" />
      </div>
    );
  }
  
  // For 'evm' unified chain, show a Layers icon with primary color
  if (chainId === 'evm') {
    return (
      <div className={cn(sizeMap[size], 'flex items-center justify-center text-primary', className)}>
        <Layers className="w-full h-full" />
      </div>
    );
  }
  
  const iconUrl = getChainIconUrl(chainId);
  
  if (hasError) {
    return (
      <div className={cn(
        sizeMap[size],
        'rounded-full bg-muted flex items-center justify-center text-[10px] font-semibold text-muted-foreground',
        className
      )}>
        {chainId.slice(0, 2).toUpperCase()}
      </div>
    );
  }
  
  return (
    <img
      src={iconUrl}
      alt={`${chainId} chain icon`}
      className={cn(sizeMap[size], 'rounded-full object-contain', className)}
      onError={() => setHasError(true)}
    />
  );
}
