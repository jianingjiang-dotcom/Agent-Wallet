import { useRef, useCallback, ReactNode } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { useNavigate } from 'react-router-dom';

interface SwipeBackProps {
  children: ReactNode;
  enabled?: boolean;
  threshold?: number;
}

const SWIPE_THRESHOLD = 100;
const EDGE_WIDTH = 30; // Only trigger from left edge

export function SwipeBack({ 
  children, 
  enabled = true,
  threshold = SWIPE_THRESHOLD 
}: SwipeBackProps) {
  const navigate = useNavigate();
  const x = useMotionValue(0);
  const startX = useRef(0);
  const isFromEdge = useRef(false);
  
  // Visual feedback
  const opacity = useTransform(x, [0, threshold], [0, 0.3]);
  const scale = useTransform(x, [0, threshold], [0.8, 1]);
  const indicatorX = useTransform(x, [0, threshold], [-20, 10]);

  const handleDragStart = useCallback((event: MouseEvent | TouchEvent | PointerEvent) => {
    if (!enabled) return;
    
    // Check if drag started from left edge
    const clientX = 'touches' in event 
      ? (event as TouchEvent).touches[0].clientX 
      : (event as MouseEvent).clientX;
    
    isFromEdge.current = clientX <= EDGE_WIDTH;
    startX.current = clientX;
  }, [enabled]);

  const handleDrag = useCallback((
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!enabled || !isFromEdge.current) {
      x.set(0);
      return;
    }
    
    // Only allow right swipe (positive delta)
    if (info.offset.x > 0) {
      x.set(Math.min(info.offset.x, threshold * 1.5));
    }
  }, [enabled, threshold, x]);

  const handleDragEnd = useCallback((
    _: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo
  ) => {
    if (!enabled || !isFromEdge.current) {
      x.set(0);
      return;
    }
    
    if (info.offset.x > threshold && info.velocity.x > -500) {
      // Navigate back
      navigate(-1);
    }
    
    // Reset
    x.set(0);
    isFromEdge.current = false;
  }, [enabled, threshold, navigate, x]);

  if (!enabled) {
    return <>{children}</>;
  }

  return (
    <div className="relative h-full overflow-hidden">
      {/* Back indicator */}
      <motion.div
        className="absolute left-0 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
        style={{ 
          x: indicatorX,
          opacity,
          scale,
        }}
      >
        <div className="w-10 h-10 rounded-lg bg-muted/80 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <svg 
            width="20" 
            height="20" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2"
            className="text-foreground"
          >
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </div>
      </motion.div>
      
      {/* Draggable content */}
      <motion.div
        className="h-full"
        style={{ x }}
        drag="x"
        dragDirectionLock
        dragElastic={0.1}
        dragConstraints={{ left: 0, right: 0 }}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      >
        {children}
      </motion.div>
    </div>
  );
}
