import { useState } from 'react';
import { getCryptoIconUrl, getIconFallback } from '@/lib/crypto-icons';
import { cn } from '@/lib/utils';

interface CryptoIconProps {
  symbol: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const sizeMap = {
  sm: 'w-5 h-5',
  md: 'w-8 h-8',
  lg: 'w-10 h-10',
  xl: 'w-12 h-12',
};

export function CryptoIcon({ symbol, size = 'md', className }: CryptoIconProps) {
  const [hasError, setHasError] = useState(false);
  const iconUrl = getCryptoIconUrl(symbol);
  
  if (hasError) {
    return (
      <div className={cn(
        sizeMap[size],
        'rounded-full bg-muted flex items-center justify-center text-xs font-semibold text-muted-foreground',
        className
      )}>
        {getIconFallback(symbol)}
      </div>
    );
  }
  
  return (
    <img
      src={iconUrl}
      alt={`${symbol} icon`}
      className={cn(sizeMap[size], 'rounded-full object-contain', className)}
      onError={() => setHasError(true)}
    />
  );
}
