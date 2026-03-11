/**
 * Speed Up Transaction Drawer
 * 
 * Allows users to select a higher gas fee tier to accelerate
 * a pending transaction via RBF.
 */

import { useState } from 'react';
import { Rocket, X, Turtle, Clock, Zap, Check, AlertTriangle } from 'lucide-react';
import { Transaction, SUPPORTED_CHAINS } from '@/types/wallet';
import { calculateSpeedUpFees, SpeedUpTier, SpeedUpOption, getGasToken } from '@/lib/rbf-utils';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';

interface SpeedUpDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  onConfirm: (selectedTier: SpeedUpTier, newFee: number, newGasAmount: number) => void;
}

const TIER_ICONS: Record<SpeedUpTier, React.ReactNode> = {
  low: <Turtle className="w-5 h-5" />,
  medium: <Clock className="w-5 h-5" />,
  high: <Zap className="w-5 h-5" />,
};

const TIER_STYLES: Record<SpeedUpTier, string> = {
  low: 'bg-muted text-muted-foreground',
  medium: 'bg-accent/10 text-accent',
  high: 'bg-warning/10 text-warning',
};

export function SpeedUpDrawer({ open, onOpenChange, transaction, onConfirm }: SpeedUpDrawerProps) {
  const [selectedTier, setSelectedTier] = useState<SpeedUpTier>('medium');
  
  const currentFee = transaction.gasPrice || transaction.fee || 2.50;
  const currentGasAmount = transaction.gasAmount || 0.00072;
  const gasToken = transaction.gasToken || getGasToken(transaction.network);
  
  const options = calculateSpeedUpFees(currentFee, currentGasAmount, gasToken);
  const selectedOption = options.find(opt => opt.tier === selectedTier)!;
  
  const networkName = SUPPORTED_CHAINS.find(c => c.id === transaction.network)?.name || transaction.network;

  const handleConfirm = () => {
    onConfirm(selectedTier, selectedOption.newFee, selectedOption.newGasAmount);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        {/* Header */}
        <DrawerHeader className="flex flex-row items-start justify-between p-4 pb-2 text-left">
          <DrawerTitle className="text-lg font-semibold text-foreground">加速交易</DrawerTitle>
          <DrawerClose asChild>
            <button className="p-2 -mr-2 -mt-1 hover:bg-muted rounded-full transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </DrawerClose>
        </DrawerHeader>

        {/* Description */}
        <div className="mx-4 p-3 rounded-lg bg-muted/50 border border-border">
          <p className="text-sm text-muted-foreground">
            提高手续费可加快交易确认速度
          </p>
        </div>

        {/* Speed Up Fee */}
        <div className="px-4 py-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">加速费用</span>
            <div className="text-right">
              <span className="font-medium text-foreground">{selectedOption.newGasAmount.toFixed(5)} {gasToken}</span>
              <span className="text-muted-foreground ml-2">≈ ${selectedOption.newFee.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Fee Options */}
        <div className="p-4 pt-2 space-y-3">
          {options.map((option) => (
            <button
              key={option.tier}
              onClick={() => setSelectedTier(option.tier)}
              className={cn(
                "w-full flex items-center gap-4 p-4 rounded-xl border transition-all",
                selectedTier === option.tier 
                  ? "border-accent bg-accent/5" 
                  : "border-border hover:border-accent/50"
              )}
            >
              {/* Icon */}
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                TIER_STYLES[option.tier]
              )}>
                {TIER_ICONS[option.tier]}
              </div>

              {/* Info */}
              <div className="flex-1 text-left">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground">{option.label}</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  {option.estimatedTime}
                </p>
              </div>

              {/* Fee */}
              <div className="text-right shrink-0">
                <p className="font-semibold text-foreground">{option.newGasAmount.toFixed(5)} {gasToken}</p>
                <p className="text-xs text-muted-foreground">≈ ${option.newFee.toFixed(2)}</p>
              </div>

              {/* Selected Indicator */}
              {selectedTier === option.tier && (
                <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
                  <Check className="w-4 h-4 text-primary" />
                </div>
              )}
            </button>
          ))}

        </div>

        {/* Footer */}
        <DrawerFooter className="px-4 pb-6">
          <Button 
            className="w-full h-12"
            onClick={handleConfirm}
          >
            确认加速
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
