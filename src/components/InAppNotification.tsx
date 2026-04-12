import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { onInAppNotification, type InAppNotif } from '@/lib/in-app-notification';

export function InAppNotification() {
  const [current, setCurrent] = useState<InAppNotif | null>(null);
  const [queue, setQueue] = useState<InAppNotif[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const dismiss = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setCurrent(null);
  }, []);

  // Process queue
  useEffect(() => {
    if (!current && queue.length > 0) {
      const [next, ...rest] = queue;
      setCurrent(next);
      setQueue(rest);
    }
  }, [current, queue]);

  // Auto-dismiss timer
  useEffect(() => {
    if (!current) return;
    timerRef.current = setTimeout(dismiss, current.duration || 4000);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [current, dismiss]);

  // Listen for new notifications
  useEffect(() => {
    return onInAppNotification((notif) => {
      if (current) {
        setQueue(prev => [...prev, notif]);
      } else {
        setCurrent(notif);
      }
    });
  }, [current]);

  const handleClick = () => {
    if (current?.route) {
      dismiss();
      navigate(current.route);
    }
  };

  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y < -30) dismiss();
  };

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          key={current.id}
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
          drag="y"
          dragConstraints={{ top: -100, bottom: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          onClick={handleClick}
          className="absolute top-2 left-3 right-3 z-50"
          style={{ cursor: current.route ? 'pointer' : 'default' }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/20"
            style={{
              background: 'rgba(255, 255, 255, 0.85)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              boxShadow: '0 4px 24px rgba(0, 0, 0, 0.12), 0 1px 4px rgba(0, 0, 0, 0.08)',
            }}
          >
            {/* Icon */}
            {current.icon && (
              <div className="shrink-0">
                {current.icon}
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-foreground leading-tight truncate">{current.title}</p>
              <p className="text-[12px] text-muted-foreground leading-tight mt-0.5 truncate">{current.subtitle}</p>
            </div>

            {/* Time */}
            <span className="text-[10px] text-muted-foreground/60 shrink-0">刚刚</span>
          </div>

          {/* Drag handle hint */}
          <div className="flex justify-center mt-1">
            <div className="w-8 h-1 rounded-full bg-muted-foreground/15" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
