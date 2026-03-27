import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { cn, copyToClipboard } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface AddressDisplayProps {
  address: string;
  label?: string;
  className?: string;
  showFull?: boolean;
}

export function AddressDisplay({ 
  address, 
  label,
  className,
  showFull = false 
}: AddressDisplayProps) {
  const [copied, setCopied] = useState(false);

  const formatAddress = (addr: string) => {
    if (showFull || addr.length <= 16) return addr;
    return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
  };

  const handleCopy = async () => {
    const ok = await copyToClipboard(address);
    if (ok) {
      setCopied(true);
      toast.success('已复制');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败', '请手动复制地址');
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        "flex items-start gap-2 px-3 py-2.5 rounded-xl bg-muted/50 transition-colors group w-full text-left",
        className
      )}
    >
      <div className="flex-1 min-w-0">
        {label && (
          <span className="text-xs text-muted-foreground block mb-1">{label}</span>
        )}
        <span className={cn(
          "font-mono text-sm text-foreground/80 break-all",
          showFull ? "block" : ""
        )}>
          {formatAddress(address)}
        </span>
      </div>
      <div className="flex-shrink-0 pt-0.5">
        {copied ? (
          <Check className="w-4 h-4 text-success" />
        ) : (
          <Copy className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        )}
      </div>
    </button>
  );
}
