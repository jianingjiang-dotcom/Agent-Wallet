import { Skeleton } from '@/components/ui/skeleton';

export function BalanceCardSkeleton() {
  return (
    <div className="relative overflow-hidden card-elevated p-4 mb-4">
      {/* Light gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-success/8 pointer-events-none" />
      
      <div className="relative z-10">
        {/* Address picker skeleton */}
        <Skeleton className="h-9 w-36 rounded-xl mb-3" />
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-4 w-12" />
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24 rounded-lg" />
        </div>
        
        <div className="flex items-baseline gap-0.5 mb-4">
          <Skeleton className="h-9 w-32" />
          <Skeleton className="h-5 w-8" />
        </div>

        {/* Quick Actions */}
        <div className="flex gap-3">
          <Skeleton className="flex-1 h-10 rounded-lg" />
          <Skeleton className="flex-1 h-10 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
