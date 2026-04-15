import { useState } from 'react';
import { ChevronRight, X, Zap, Clock, Turtle, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Switch } from '@/components/ui/switch';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

export type FeeTier = 'slow' | 'standard' | 'fast';

interface FeeOption {
  tier: FeeTier;
  label: string;
  labelEn: string;
  time: string;
  fee: number;
  gasAmount: number;
  icon: React.ReactNode;
}

interface NetworkFeeSelectorProps {
  selectedTier: FeeTier;
  onSelect: (tier: FeeTier) => void;
  networkName?: string;
  gasToken?: string;
  isGasless?: boolean;
  onGaslessChange?: (v: boolean) => void;
}

const FEE_OPTIONS: FeeOption[] = [
  {
    tier: 'slow',
    label: '慢速',
    labelEn: 'Slow',
    time: '~30分钟',
    fee: 0.80,
    gasAmount: 0.00023,
    icon: <Turtle className="w-5 h-5" />,
  },
  {
    tier: 'standard',
    label: '标准',
    labelEn: 'Standard',
    time: '~5分钟',
    fee: 2.50,
    gasAmount: 0.00072,
    icon: <Clock className="w-5 h-5" />,
  },
  {
    tier: 'fast',
    label: '快速',
    labelEn: 'Fast',
    time: '~1分钟',
    fee: 5.00,
    gasAmount: 0.00145,
    icon: <Zap className="w-5 h-5" />,
  },
];

export function NetworkFeeSelector({ selectedTier, onSelect, networkName = 'Ethereum', gasToken = 'ETH', isGasless = false, onGaslessChange }: NetworkFeeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const currentOption = FEE_OPTIONS.find(opt => opt.tier === selectedTier) || FEE_OPTIONS[1];

  return (
    <>
      {/* Trigger Card */}
      <div className="w-full card-elevated overflow-hidden">
        <button
          type="button"
          onClick={() => { if (!isGasless) setIsOpen(true); }}
          className="w-full p-4 text-left transition-colors"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">预计网络费用</span>
              {isGasless ? (
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-success/10 text-success">
                  Gasless
                </span>
              ) : (
                <span className="text-xs bg-muted px-1.5 py-0.5 rounded text-muted-foreground">
                  {currentOption.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              <span className={cn(
                'text-sm font-medium',
                isGasless ? 'text-success' : 'text-foreground'
              )}>
                {isGasless ? '$0.00' : `$${currentOption.fee.toFixed(2)}`}
              </span>
              {!isGasless && <ChevronRight className="w-4 h-4 text-muted-foreground" />}
            </div>
          </div>
        </button>

        {/* Gasless toggle row */}
        {onGaslessChange && (
          <div className="flex items-center justify-between px-4 pb-3 pt-0">
            <span className="text-[12px] text-muted-foreground">Gasless 交易</span>
            <Switch
              checked={isGasless}
              onCheckedChange={onGaslessChange}
            />
          </div>
        )}
      </div>

      {/* Bottom Drawer */}
      <Drawer open={isOpen} onOpenChange={setIsOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="flex flex-row items-start justify-between p-4 pb-2 text-left">
            <div>
              <DrawerTitle className="text-lg font-semibold text-foreground">网络费用</DrawerTitle>
              <p className="text-sm text-muted-foreground mt-1">{networkName} 网络</p>
            </div>
            <DrawerClose asChild>
              <button className="p-2 -mr-2 -mt-1 rounded-full transition-colors">
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </DrawerClose>
          </DrawerHeader>

          <div className="p-4 pt-2 space-y-3">
            {FEE_OPTIONS.map((option) => (
              <button
                key={option.tier}
                onClick={() => {
                  onSelect(option.tier);
                  setIsOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-4 p-4 rounded-xl border transition-all",
                  selectedTier === option.tier
                    ? "border-accent bg-accent/5"
                    : "border-border"
                )}
              >
                <div className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
                  option.tier === 'slow' && "bg-muted text-muted-foreground",
                  option.tier === 'standard' && "bg-accent/10 text-accent",
                  option.tier === 'fast' && "bg-warning/10 text-warning"
                )}>
                  {option.icon}
                </div>

                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-foreground">{option.label}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {option.time}
                  </p>
                </div>

                <div className="text-right shrink-0">
                  <p className="font-semibold text-foreground">{option.gasAmount} {gasToken}</p>
                  <p className="text-xs text-muted-foreground">≈ ${option.fee.toFixed(2)}</p>
                </div>

                {selectedTier === option.tier && (
                  <div className="w-6 h-6 rounded-full border-2 border-primary flex items-center justify-center shrink-0">
                    <Check className="w-4 h-4 text-primary" />
                  </div>
                )}
              </button>
            ))}

            <p className="text-xs text-muted-foreground text-center pt-2 pb-4">
              网络费用取决于当前网络拥堵程度，实际费用可能略有浮动
            </p>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
