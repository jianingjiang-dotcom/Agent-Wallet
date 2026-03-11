import { motion } from 'framer-motion';
import { Wallet, Sparkles, ArrowLeftRight, User } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useCallback, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';

const navItems = [
  {
    path: '/home',
    icon: Wallet,
    label: '钱包'
  },
  {
    path: '/assistant',
    icon: Sparkles,
    label: 'AI 助手'
  },
  {
    path: '/history',
    icon: ArrowLeftRight,
    label: '交易'
  },
  {
    path: '/profile',
    icon: User,
    label: '我的'
  },
];

// Ripple effect component
function Ripple({ x, y }: { x: number; y: number }) {
  return (
    <motion.span
      className="absolute bg-white/30 rounded-full pointer-events-none"
      style={{ left: x, top: y, x: '-50%', y: '-50%' }}
      initial={{ width: 0, height: 0, opacity: 0.5 }}
      animate={{ width: 80, height: 80, opacity: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    />
  );
}

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { unreadNotificationCount } = useWallet();
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; path: string }[]>([]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>, path: string) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();

    setRipples(prev => [...prev, { id, x, y, path }]);

    if (navigator.vibrate) {
      navigator.vibrate(10);
    }

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 500);

    navigate(path);
  }, [navigate]);

  return (
    <nav className="absolute bottom-5 left-4 right-4 z-40 drop-shadow-[0_12px_32px_rgba(0,0,0,0.18)]">
      {/* Liquid Glass Container */}
      <div className="relative rounded-full overflow-hidden">
        {/* Glass background layers */}
        <div className="absolute inset-0 backdrop-blur-2xl bg-[#FBFBFB]/95 dark:bg-card/90" />

        {/* Gradient overlay for depth - dark mode only */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-transparent dark:from-white/5 dark:to-transparent" />

        {/* Top highlight - liquid glass edge - dark mode only */}
        <div className="absolute inset-x-0 top-0 h-[1px] bg-transparent dark:bg-gradient-to-r dark:from-transparent dark:via-white/20 dark:to-transparent" />

        {/* Inner shadow for depth */}
        <div className="absolute inset-0 rounded-full shadow-[inset_0_0.5px_0_rgba(255,255,255,0.9),inset_0_-0.5px_0_rgba(0,0,0,0.04)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.08),inset_0_-1px_1px_rgba(0,0,0,0.3)]" />

        {/* Border */}
        <div className="absolute inset-0 rounded-full border border-white dark:border-border/50" />

                <div className="relative flex items-center justify-around h-14 px-4">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            const itemRipples = ripples.filter(r => r.path === item.path);

            return (
              <motion.button
                key={item.path}
                onClick={(e) => handleClick(e, item.path)}
                className="relative flex items-center justify-center w-14 h-14 overflow-hidden rounded-2xl"
                whileTap={{ scale: 0.92 }}
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              >
                {/* Ripple effects */}
                {itemRipples.map(ripple => (
                  <Ripple key={ripple.id} x={ripple.x} y={ripple.y} />
                ))}

                <div className="relative flex items-center justify-center">
                  {/* Active pill - simple light blue circle */}
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-pill"
                      className="absolute w-10 h-10 rounded-full bg-accent/10"
                      initial={false}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}

                  {/* Icon */}
                  <motion.div
                    animate={{
                      scale: isActive ? 1.1 : 1,
                      y: isActive ? -1 : 0,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Icon
                      className={cn(
                        'w-[22px] h-[22px] relative z-10 transition-all duration-200',
                        isActive
                          ? 'text-accent'
                          : 'text-foreground'
                      )}
                      strokeWidth={1.5}
                    />
                    {item.path === '/home' && unreadNotificationCount > 0 && (
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-destructive rounded-full z-20" />
                    )}
                  </motion.div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
