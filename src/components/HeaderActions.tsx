import { useNavigate } from 'react-router-dom';
import { Bell, AlignJustify } from 'lucide-react';
import { motion } from 'framer-motion';
import { useWallet } from '@/contexts/WalletContext';

export function HeaderActions({ onMenuClick }: { onMenuClick?: () => void }) {
  const navigate = useNavigate();
  const { notifications } = useWallet();
  const unreadNotificationCount = notifications?.filter(n => !n.read).length ?? 0;

  const handleMenuClick = onMenuClick ?? (() => {
    sessionStorage.setItem('sidebarOpen', 'true');
    navigate('/home');
  });

  return (
    <div className="flex items-center gap-3">
      <motion.button
        className="relative flex items-center justify-center w-9 h-9 rounded-full bg-background card-elevated no-card-shadow"
        onClick={() => navigate('/messages')}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Bell className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
        {unreadNotificationCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 bg-destructive text-destructive-foreground text-[10px] font-medium rounded-full flex items-center justify-center"
          >
            {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
          </motion.span>
        )}
      </motion.button>
      <motion.button
        className="flex items-center justify-center w-9 h-9 rounded-full bg-background card-elevated no-card-shadow"
        onClick={handleMenuClick}
        whileTap={{ scale: 0.9 }}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <AlignJustify className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
      </motion.button>
    </div>
  );
}
