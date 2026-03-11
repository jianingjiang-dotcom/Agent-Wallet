import { Skeleton } from '@/components/ui/skeleton';

interface TransactionListSkeletonProps {
  count?: number;
  showDateHeader?: boolean;
  showSearchBar?: boolean;
  showTabs?: boolean;
}

export function TransactionListSkeleton({
  count = 5,
  showDateHeader = true,
  showSearchBar = false,
  showTabs = false,
}: TransactionListSkeletonProps) {
  // Split items into two date groups for realism
  const firstGroupCount = Math.min(Math.ceil(count * 0.6), count);
  const secondGroupCount = count - firstGroupCount;

  return (
    <div>
      {/* ── Source Filter Tabs (FilterPills variant="tab") ── */}
      {showTabs && (
        <div className="flex bg-muted/50 rounded-lg p-1 mb-3">
          {/* "全部" — active */}
          <div className="flex-1 py-2 flex items-center justify-center">
            <Skeleton className="h-4 w-8 rounded bg-background" />
          </div>
          {/* "手动" */}
          <div className="flex-1 py-2 flex items-center justify-center">
            <Skeleton className="h-4 w-8 rounded" />
          </div>
          {/* "Agent 27" */}
          <div className="flex-1 py-2 flex items-center justify-center gap-1.5">
            <Skeleton className="h-3.5 w-3.5 rounded" />
            <Skeleton className="h-4 w-10 rounded" />
            <Skeleton className="h-4 w-5 rounded-full" />
          </div>
        </div>
      )}

      {/* ── Search Input + Chain Filter Button ── */}
      {showSearchBar && (
        <div className="flex gap-2 mb-3">
          {/* Search input */}
          <div className="flex-1 h-10 rounded-lg border border-border bg-background flex items-center px-3 gap-2">
            <Skeleton className="w-4 h-4 rounded shrink-0" />
            <Skeleton className="h-3.5 w-20 rounded" />
          </div>
          {/* Chain dropdown button */}
          <div className="h-10 w-[52px] rounded-lg border border-border bg-background flex items-center justify-center gap-1.5 shrink-0">
            <Skeleton className="w-5 h-5 rounded-full" />
            <Skeleton className="w-3 h-3 rounded" />
          </div>
        </div>
      )}

      {/* ── Sub-filter Tabs (underline style: 全部 / 转出 / 收入) ── */}
      {showTabs && (
        <div className="border-b border-border mb-4">
          <div className="flex">
            {['w-8', 'w-8', 'w-8'].map((w, i) => (
              <div key={i} className="px-4 py-3 relative flex items-center justify-center">
                <Skeleton className={`h-3.5 ${w} rounded`} />
                {i === 0 && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 bg-muted rounded-full" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Transaction List ── */}
      <div className="space-y-6">
        {/* First date group */}
        {showDateHeader && (
          <Skeleton className="h-4 w-28 rounded" />
        )}
        <div className="space-y-1.5">
          {Array.from({ length: firstGroupCount }).map((_, index) => (
            <TransactionItemSkeleton key={`a-${index}`} delay={index * 60} />
          ))}
        </div>

        {/* Second date group */}
        {secondGroupCount > 0 && (
          <>
            {showDateHeader && (
              <Skeleton className="h-4 w-24 rounded" />
            )}
            <div className="space-y-1.5">
              {Array.from({ length: secondGroupCount }).map((_, index) => (
                <TransactionItemSkeleton key={`b-${index}`} delay={(firstGroupCount + index) * 60} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/** Single transaction card skeleton — mirrors the real card layout */
function TransactionItemSkeleton({ delay = 0 }: { delay?: number }) {
  return (
    <div
      className="p-3 rounded-xl bg-card border border-border/50 flex items-center justify-between"
      style={{ animationDelay: `${delay}ms` }}
    >
      {/* Left: icon + text */}
      <div className="flex items-center gap-2">
        <Skeleton className="w-8 h-8 rounded-full shrink-0" />
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-4 w-8 rounded" />
          </div>
          <div className="flex items-center gap-1">
            <Skeleton className="h-3 w-20 rounded" />
            <Skeleton className="h-3 w-1 rounded-full" />
            <Skeleton className="h-3 w-8 rounded" />
            <Skeleton className="h-3 w-3 rounded-full" />
          </div>
        </div>
      </div>

      {/* Right: amount + chevron */}
      <div className="flex items-center gap-2">
        <div className="space-y-1.5 text-right">
          <Skeleton className="h-4 w-16 rounded ml-auto" />
          <Skeleton className="h-3 w-10 rounded ml-auto" />
        </div>
        <Skeleton className="h-4 w-4 rounded shrink-0" />
      </div>
    </div>
  );
}
