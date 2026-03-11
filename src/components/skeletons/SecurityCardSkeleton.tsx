import { Skeleton } from '@/components/ui/skeleton';

export function SecurityCardSkeleton() {
  return (
    <div className="p-4 rounded-2xl border border-border/50 bg-muted/20 mb-4">
      <div className="flex items-center gap-3">
        <Skeleton className="w-10 h-10 rounded-full" />
        <div className="flex-1 space-y-1.5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </div>
  );
}
