import { useState, useRef, useCallback, useEffect, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  navSpacer?: boolean;
}

const PULL_THRESHOLD = 80;
const MAX_PULL = 120;

/**
 * Find the nearest scrollable ancestor of the given element.
 */
function getScrollParent(el: HTMLElement | null): HTMLElement | null {
  let node = el?.parentElement ?? null;
  while (node) {
    const { overflowY } = getComputedStyle(node);
    if (overflowY === 'auto' || overflowY === 'scroll') return node;
    node = node.parentElement;
  }
  return null;
}

export function PullToRefresh({ children, onRefresh, className, navSpacer }: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollParentRef = useRef<HTMLElement | null>(null);
  const startY = useRef(0);
  const currentY = useMotionValue(0);

  const pullProgress = useTransform(currentY, [0, PULL_THRESHOLD], [0, 1]);
  const rotation = useTransform(currentY, [0, PULL_THRESHOLD], [0, 180]);
  const opacity = useTransform(currentY, [0, 30, PULL_THRESHOLD], [0, 0.5, 1]);

  // Cache the scroll parent after mount
  useEffect(() => {
    scrollParentRef.current = getScrollParent(containerRef.current);
  }, []);

  const isAtTop = useCallback(() => {
    const sp = scrollParentRef.current;
    return sp ? sp.scrollTop <= 0 : true;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isAtTop() && !isRefreshing) {
      startY.current = e.touches[0].clientY;
      setIsPulling(true);
    }
  }, [isRefreshing, isAtTop]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    const deltaY = e.touches[0].clientY - startY.current;
    if (deltaY > 0 && isAtTop()) {
      // Apply resistance
      const resistance = 0.5;
      const pullDistance = Math.min(deltaY * resistance, MAX_PULL);
      currentY.set(pullDistance);
    }
  }, [isPulling, isRefreshing, currentY, isAtTop]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling) return;

    const pullDistance = currentY.get();
    setIsPulling(false);

    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      currentY.set(60); // Keep indicator visible

      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        currentY.set(0);
      }
    } else {
      currentY.set(0);
    }
  }, [isPulling, currentY, isRefreshing, onRefresh]);

  return (
    <div
      ref={containerRef}
      className={`relative ${className || ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            className="absolute left-0 right-0 flex justify-center z-20 pointer-events-none"
            style={{
              top: -40,
              y: currentY
            }}
          >
            <motion.div
              className="w-10 h-10 rounded-full bg-card border border-border shadow-lg flex items-center justify-center"
              style={{ opacity }}
            >
              <motion.div
                style={{ rotate: isRefreshing ? undefined : rotation }}
                animate={isRefreshing ? { rotate: 360 } : undefined}
                transition={isRefreshing ? {
                  duration: 1,
                  repeat: Infinity,
                  ease: 'linear'
                } : undefined}
              >
                <RefreshCw className="w-5 h-5 text-accent" />
              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content with transform */}
      <motion.div
        style={{ y: isPulling || isRefreshing ? currentY : 0 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {children}
      </motion.div>
    </div>
  );
}
