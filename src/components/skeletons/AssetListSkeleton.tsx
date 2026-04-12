import { Skeleton } from '@/components/ui/skeleton';

interface AssetListSkeletonProps {
  count?: number;
}

export function AssetListSkeleton({ count = 5 }: AssetListSkeletonProps) {
  return (
    <div className="space-y-1.5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="card-elevated p-3 flex items-center justify-between"
          style={{ animationDelay: `${index * 100}ms` }}
        >
          <div className="flex items-center gap-3">
            <Skeleton className="w-10 h-10 rounded-full" />
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="text-right space-y-1.5">
            <Skeleton className="h-4 w-20 ml-auto" />
            <Skeleton className="h-3 w-14 ml-auto" />
          </div>
        </div>
      ))}
    </div>
  );
}
