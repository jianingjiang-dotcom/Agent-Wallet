import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressBarProps {
  address: string;
  label?: string;
  onClear?: () => void;
  className?: string;
}

export function AddressBar({ address, label, onClear, className }: AddressBarProps) {
  return (
    <div className={cn(
      "flex items-start gap-3 px-4 py-3 bg-muted/50 rounded-xl border border-border/50",
      className
    )}>
      <span className="text-sm text-muted-foreground shrink-0 mt-0.5">To</span>
      <div className="flex-1 min-w-0">
        {label && (
          <p className="font-medium text-foreground mb-1">{label}</p>
        )}
        <p className="text-sm text-muted-foreground font-mono break-all">{address}</p>
      </div>
      {onClear && (
        <button
          onClick={onClear}
          className="w-6 h-6 rounded-full bg-muted flex items-center justify-center hover:bg-muted-foreground/20 transition-colors shrink-0"
        >
          <X className="w-3.5 h-3.5 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
