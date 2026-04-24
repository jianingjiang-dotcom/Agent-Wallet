import { motion } from 'framer-motion';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecoveryBannerProps {
  /** Optional override return path after recovery completes */
  returnTo?: string;
}

/**
 * Shown at the top of Home when current wallet is in view-only mode (key share not recovered).
 * Single-line, warning-tinted, fully clickable.
 */
export function RecoveryBanner({ returnTo }: RecoveryBannerProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate('/wallet/recovery', {
      state: { returnTo: returnTo ?? '/home' },
    });
  };

  return (
    <motion.button
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={handleClick}
      className="w-full flex items-center gap-2.5 px-3 py-2.5 mb-3 rounded-xl bg-warning/8 active:bg-warning/12 transition-colors text-left"
    >
      <AlertTriangle className="w-4 h-4 text-warning shrink-0" strokeWidth={2} />
      <span className="flex-1 text-[13px] font-medium text-foreground">
        钱包未激活，无法发起转账
      </span>
      <span className="flex items-center gap-0.5 text-[13px] font-semibold text-warning shrink-0">
        激活
        <ChevronRight className="w-3.5 h-3.5" />
      </span>
    </motion.button>
  );
}
