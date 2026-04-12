import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useInView } from 'react-intersection-observer';

interface UseInfiniteScrollOptions<T> {
  data: T[];
  pageSize?: number;
  initialCount?: number;
  loadDelay?: number;
}

interface UseInfiniteScrollReturn<T> {
  displayedData: T[];
  hasMore: boolean;
  isLoadingMore: boolean;
  loadMore: () => void;
  scrollTriggerRef: (node?: Element | null) => void;
  reset: () => void;
}

export function useInfiniteScroll<T>({
  data,
  pageSize = 10,
  initialCount = 10,
  loadDelay = 300,
}: UseInfiniteScrollOptions<T>): UseInfiniteScrollReturn<T> {
  const [displayedCount, setDisplayedCount] = useState(initialCount);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const loadingRef = useRef(false);
  
  const { ref: scrollTriggerRef, inView } = useInView({
    threshold: 0,
    rootMargin: '100px',
  });

  const hasMore = displayedCount < data.length;

  const displayedData = useMemo(() => {
    return data.slice(0, displayedCount);
  }, [data, displayedCount]);

  const loadMore = useCallback(() => {
    if (loadingRef.current || !hasMore) return;
    
    loadingRef.current = true;
    setIsLoadingMore(true);
    
    setTimeout(() => {
      setDisplayedCount(prev => Math.min(prev + pageSize, data.length));
      setIsLoadingMore(false);
      loadingRef.current = false;
    }, loadDelay);
  }, [hasMore, pageSize, data.length, loadDelay]);

  const reset = useCallback(() => {
    setDisplayedCount(initialCount);
    setIsLoadingMore(false);
    loadingRef.current = false;
  }, [initialCount]);

  // Auto-load when trigger is in view
  useEffect(() => {
    if (inView && hasMore && !loadingRef.current) {
      loadMore();
    }
  }, [inView, hasMore, loadMore]);

  // Reset when data changes significantly (e.g., filter change)
  useEffect(() => {
    if (data.length < displayedCount) {
      setDisplayedCount(Math.min(initialCount, data.length || initialCount));
    }
  }, [data.length, displayedCount, initialCount]);

  return {
    displayedData,
    hasMore,
    isLoadingMore,
    loadMore,
    scrollTriggerRef,
    reset,
  };
}
