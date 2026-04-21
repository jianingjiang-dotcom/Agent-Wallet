/**
 * RBF Action Section Component
 *
 * Fixed bottom bar for pending send transactions that support RBF.
 * Left: Cancel, Right: Speed Up (matches Pact detail button layout convention).
 */

import { Rocket, Ban } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Transaction } from '@/types/wallet';
import { getRbfSupport } from '@/lib/rbf-utils';

interface RbfActionSectionProps {
  transaction: Transaction;
  onSpeedUp: () => void;
  onCancel: () => void;
}

export function RbfActionSection({ transaction, onSpeedUp, onCancel }: RbfActionSectionProps) {
  const rbfSupport = getRbfSupport(transaction);

  if (!rbfSupport.canSpeedUp && !rbfSupport.canCancel) {
    if (rbfSupport.reason) {
      return (
        <div className="px-4 py-3 bg-muted/50 rounded-xl border border-border mb-4">
          <p className="text-xs text-muted-foreground leading-relaxed">{rbfSupport.reason}</p>
        </div>
      );
    }
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 pt-3 pb-8 flex items-center gap-2.5" style={{ maxWidth: 430, margin: '0 auto' }}>
      <Button
        variant="outline"
        className="flex-1 h-12 text-[15px] font-semibold rounded-xl border-destructive/20 text-destructive hover:bg-destructive/8"
        onClick={onCancel}
      >
        <Ban className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
        取消交易
      </Button>
      <Button
        className="flex-1 h-12 text-[15px] font-semibold rounded-xl"
        onClick={onSpeedUp}
      >
        <Rocket className="w-4 h-4 mr-1.5" strokeWidth={1.5} />
        加速交易
      </Button>
    </div>
  );
}
