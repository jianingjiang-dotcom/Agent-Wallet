import { Skeleton } from '@/components/ui/skeleton';

interface MessageListSkeletonProps {
  count?: number;
  showTabs?: boolean;
}

export function MessageListSkeleton({ count = 4, showTabs = false }: MessageListSkeletonProps) {
  return (
    <div>
      {/* Tabs skeleton */}
      {showTabs && (
        <div className="px-4 py-3">
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg h-9">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton 
                key={i} 
                className={`flex-1 h-7 rounded-md ${i === 0 ? 'bg-background' : ''}`} 
              />
            ))}
          </div>
        </div>
      )}

      {/* Message list skeleton */}
      <div className="px-4 py-2">
        {/* Today group */}
        <div className="mb-4">
          <Skeleton className="h-3 w-8 mb-2" />
          <div className="space-y-2">
            {Array.from({ length: Math.ceil(count * 0.6) }).map((_, i) => (
              <div
                key={`today-${i}`}
                className="p-3 rounded-xl bg-card border border-border/50"
              >
                <div className="flex gap-3">
                  {/* Icon skeleton */}
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  
                  {/* Content skeleton */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-12" />
                    </div>
                    <Skeleton className="h-3 w-full mt-2" />
                    <Skeleton className="h-3 w-3/4 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Yesterday group */}
        <div className="mb-4">
          <Skeleton className="h-3 w-8 mb-2" />
          <div className="space-y-2">
            {Array.from({ length: Math.floor(count * 0.4) }).map((_, i) => (
              <div
                key={`yesterday-${i}`}
                className="p-3 rounded-xl bg-card border border-border/50"
              >
                <div className="flex gap-3">
                  <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Skeleton className="h-4 w-28" />
                      <Skeleton className="h-3 w-10" />
                    </div>
                    <Skeleton className="h-3 w-full mt-2" />
                    <Skeleton className="h-3 w-2/3 mt-1" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
