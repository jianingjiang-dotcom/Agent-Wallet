import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Fingerprint } from 'lucide-react';
import { useAppLock } from '@/contexts/AppLockContext';
import coboLogo from '@/assets/cobo-logo.svg';
import { cn } from '@/lib/utils';

type LockPhase = 'locked' | 'authenticating' | 'unlocking';

export function AppLockScreen() {
  const { isLocked, unlock } = useAppLock();

  const [phase, setPhase] = useState<LockPhase>('locked');

  // Reset state whenever lock activates
  useEffect(() => {
    if (isLocked) {
      setPhase('locked');
    }
  }, [isLocked]);

  // Auto-trigger biometric on mount
  useEffect(() => {
    if (isLocked && phase === 'locked') {
      const timer = setTimeout(() => {
        triggerBiometric();
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [isLocked]);

  const triggerBiometric = useCallback(async () => {
    if (phase === 'authenticating' || phase === 'unlocking') return;
    setPhase('authenticating');
    // Simulate biometric authentication
    await new Promise(r => setTimeout(r, 800));
    setPhase('unlocking');
  }, [phase]);

  // -- Curtain animation complete → unlock --
  const handleCurtainComplete = useCallback(() => {
    if (phase === 'unlocking') {
      unlock();
    }
  }, [phase, unlock]);

  // Shared gradient classes for the two curtain halves
  const gradientBg = 'bg-gradient-to-b from-muted via-background to-background';
  const gradientOverlay = 'bg-gradient-to-br from-primary/5 via-transparent to-primary/3';

  // Curtain easing: fast out, smooth stop
  const curtainEase = [0.22, 1, 0.36, 1] as const;

  return (
    <AnimatePresence>
      {isLocked && (
        <motion.div
          className="absolute inset-0 z-[100]"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
        >
          {/* ===== Left curtain half ===== */}
          <motion.div
            className="absolute left-0 top-0 w-1/2 h-full overflow-hidden"
            animate={phase === 'unlocking' ? { x: '-100%' } : { x: 0 }}
            transition={{ duration: 0.55, ease: curtainEase, delay: phase === 'unlocking' ? 0.15 : 0 }}
            onAnimationComplete={handleCurtainComplete}
          >
            <div className={cn('absolute inset-0 w-[200%]', gradientBg)} />
            <div className={cn('absolute inset-0 w-[200%]', gradientOverlay)} />
          </motion.div>

          {/* ===== Right curtain half ===== */}
          <motion.div
            className="absolute right-0 top-0 w-1/2 h-full overflow-hidden"
            animate={phase === 'unlocking' ? { x: '100%' } : { x: 0 }}
            transition={{ duration: 0.55, ease: curtainEase, delay: phase === 'unlocking' ? 0.15 : 0 }}
          >
            <div className={cn('absolute inset-0 w-[200%] -translate-x-1/2', gradientBg)} />
            <div className={cn('absolute inset-0 w-[200%] -translate-x-1/2', gradientOverlay)} />
          </motion.div>

          {/* ===== Center content layer ===== */}
          <motion.div
            className="absolute inset-0 flex flex-col items-center justify-center z-10"
            animate={phase === 'unlocking'
              ? { opacity: 0, scale: 0.8 }
              : { opacity: 1, scale: 1 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          >
            {/* Fingerprint icon area */}
            <motion.button
              onClick={triggerBiometric}
              disabled={phase === 'authenticating' || phase === 'unlocking'}
              className="relative flex items-center justify-center cursor-pointer focus:outline-none disabled:cursor-default"
              whileHover={phase === 'locked' ? { scale: 1.05 } : {}}
              whileTap={phase === 'locked' ? { scale: 0.95 } : {}}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              {/* Outer glow ring */}
              <motion.div
                className="absolute w-28 h-28 rounded-full bg-primary/10"
                animate={phase === 'authenticating'
                  ? { scale: [1, 1.3, 1], opacity: [0.3, 0.05, 0.3] }
                  : { scale: [1, 1.2, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{
                  duration: phase === 'authenticating' ? 1 : 3,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />

              {/* Icon background */}
              <div className="relative w-20 h-20 rounded-full bg-primary/15 flex items-center justify-center">
                <motion.div
                  animate={phase === 'authenticating'
                    ? { scale: [1, 1.15, 1] }
                    : { scale: 1 }}
                  transition={{
                    scale: { duration: 1, repeat: phase === 'authenticating' ? Infinity : 0, ease: 'easeInOut' },
                  }}
                >
                  <Fingerprint className="w-8 h-8 text-primary" strokeWidth={1.5} />
                </motion.div>
              </div>
            </motion.button>

            {/* Brand name */}
            <h1 className="mt-8 text-2xl font-bold text-foreground">
              智能钱包
            </h1>

            {/* Hint text */}
            <AnimatePresence mode="wait">
              {phase === 'authenticating' ? (
                <motion.p
                  key="auth-hint"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-3 text-sm text-muted-foreground"
                >
                  验证中...
                </motion.p>
              ) : (
                <motion.p
                  key="lock-hint"
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="mt-3 text-sm text-muted-foreground"
                >
                  点击验证身份
                </motion.p>
              )}
            </AnimatePresence>
          </motion.div>

          {/* ===== Footer with COBO logo ===== */}
          <motion.div
            className="absolute bottom-12 left-0 right-0 flex flex-col items-center gap-2 z-10"
            animate={phase === 'unlocking' ? { opacity: 0 } : { opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            <p className="text-xs text-muted-foreground/60">Powered by</p>
            <div className="bg-white rounded-lg px-3 py-1.5 shadow-sm">
              <img
                src={coboLogo}
                alt="COBO"
                className="h-4"
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
