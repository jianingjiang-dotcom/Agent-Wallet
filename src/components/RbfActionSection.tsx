/**
 * RBF Action Section Component
 * 
 * Displays in transaction detail drawer when a pending send transaction
 * can be accelerated or cancelled via RBF.
 */

import { Rocket, X, Zap, Info, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/wallet';
import { getRbfSupport, formatWaitTime } from '@/lib/rbf-utils';
import { cn } from '@/lib/utils';

interface RbfActionSectionProps {
  transaction: Transaction;
  onSpeedUp: () => void;
  onCancel: () => void;
}

export function RbfActionSection({ transaction, onSpeedUp, onCancel }: RbfActionSectionProps) {
  const rbfSupport = getRbfSupport(transaction);
  
  // Don't render anything if RBF is not applicable
  if (!rbfSupport.canSpeedUp && !rbfSupport.canCancel) {
    // Only show reason for Bitcoin with RBF disabled
    if (rbfSupport.reason) {
      return (
        <div className="px-4 py-3 bg-muted/50 rounded-xl border border-border mb-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{rbfSupport.reason}</p>
        </div>
      );
    }
    // For all other unsupported cases, hide the section entirely
    return null;
  }

  const waitTime = formatWaitTime(transaction.timestamp);

  return (
    <div className="mb-6 mt-4">
      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="default"
          className="flex-1 h-10"
          onClick={onSpeedUp}
        >
          <Rocket className="w-4 h-4" />
          加速交易
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-10"
          onClick={onCancel}
        >
          <Ban className="w-4 h-4" />
          取消交易
        </Button>
      </div>
    </div>
  );
}
