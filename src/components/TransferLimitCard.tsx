import { motion } from 'framer-motion';
import { BarChart3, AlertCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface LimitStatus {
  singleLimit: number;
  dailyLimit: number;
  dailyUsed: number;
  monthlyLimit: number;
  monthlyUsed: number;
}

interface TransferLimitCardProps {
  limitStatus: LimitStatus;
  currentAmount: number;
  className?: string;
}

export function TransferLimitCard({ limitStatus, currentAmount, className }: TransferLimitCardProps) {
  const dailyRemaining = limitStatus.dailyLimit - limitStatus.dailyUsed;
  const monthlyRemaining = limitStatus.monthlyLimit - limitStatus.monthlyUsed;
  const dailyPercent = (limitStatus.dailyUsed / limitStatus.dailyLimit) * 100;
  const monthlyPercent = (limitStatus.monthlyUsed / limitStatus.monthlyLimit) * 100;

  // Check if current amount would exceed any limit
  const exceedsSingle = currentAmount > limitStatus.singleLimit;
  const exceedsDaily = currentAmount > dailyRemaining;
  const exceedsMonthly = currentAmount > monthlyRemaining;
  const hasWarning = exceedsSingle || exceedsDaily || exceedsMonthly;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'p-4 rounded-xl border',
        hasWarning ? 'bg-destructive/5 border-destructive/20' : 'bg-card border-border',
        className
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <BarChart3 className={cn('w-5 h-5', hasWarning ? 'text-destructive' : 'text-accent')} />
        <span className="font-medium text-foreground">转账额度</span>
        {hasWarning && (
          <span className="ml-auto text-xs text-destructive flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            超出限额
          </span>
        )}
      </div>

      <div className="space-y-4">
        {/* Single limit */}
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">单笔上限</span>
          <span className={cn(
            'text-sm font-medium',
            exceedsSingle ? 'text-destructive' : 'text-foreground'
          )}>
            ${limitStatus.singleLimit.toLocaleString()}
          </span>
        </div>

        {/* Daily limit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">今日剩余</span>
            <span className={cn(
              'text-sm font-medium',
              exceedsDaily ? 'text-destructive' : 'text-foreground'
            )}>
              ${dailyRemaining.toLocaleString()} / ${limitStatus.dailyLimit.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={dailyPercent} 
            className={cn('h-2', exceedsDaily && '[&>div]:bg-destructive')}
          />
        </div>

        {/* Monthly limit */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">本月剩余</span>
            <span className={cn(
              'text-sm font-medium',
              exceedsMonthly ? 'text-destructive' : 'text-foreground'
            )}>
              ${monthlyRemaining.toLocaleString()} / ${limitStatus.monthlyLimit.toLocaleString()}
            </span>
          </div>
          <Progress 
            value={monthlyPercent} 
            className={cn('h-2', exceedsMonthly && '[&>div]:bg-destructive')}
          />
        </div>

        {/* Warning messages */}
        {hasWarning && (
          <div className="pt-2 space-y-1">
            {exceedsSingle && (
              <p className="text-xs text-destructive">• 金额超出单笔限额 ${limitStatus.singleLimit.toLocaleString()}</p>
            )}
            {exceedsDaily && (
              <p className="text-xs text-destructive">• 金额超出今日剩余额度 ${dailyRemaining.toLocaleString()}</p>
            )}
            {exceedsMonthly && (
              <p className="text-xs text-destructive">• 金额超出本月剩余额度 ${monthlyRemaining.toLocaleString()}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
