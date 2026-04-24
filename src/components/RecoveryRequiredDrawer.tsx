import { motion } from 'framer-motion';
import { ShieldAlert } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

interface RecoveryRequiredDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Optional wallet name to personalize the message */
  walletName?: string;
  /** Optional return path after recovery completes */
  returnTo?: string;
}

export function RecoveryRequiredDrawer({
  open,
  onOpenChange,
  walletName,
  returnTo,
}: RecoveryRequiredDrawerProps) {
  const navigate = useNavigate();

  const handleRecover = () => {
    onOpenChange(false);
    navigate('/wallet/recovery', {
      state: { returnTo: returnTo ?? window.location.pathname },
    });
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="sr-only">
          <DrawerTitle>钱包未激活</DrawerTitle>
        </DrawerHeader>

        <div className="px-6 pt-2 pb-6 flex flex-col items-center text-center">
          {/* Icon — Apple rounded-square style */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-[68px] h-[68px] rounded-[20px] bg-warning/10 flex items-center justify-center mb-5"
          >
            <ShieldAlert className="w-8 h-8 text-warning" strokeWidth={1.75} />
          </motion.div>

          <h2 className="text-[22px] font-bold text-foreground tracking-tight mb-2">
            钱包未激活
          </h2>

          <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[280px] mb-6">
            {walletName ? `「${walletName}」` : '当前钱包'}
            的签名分片未在此设备激活，无法发起交易。完成激活后即可正常使用。
          </p>

          <div className="w-full space-y-2.5">
            <Button
              size="lg"
              className="w-full h-12 text-[15px] font-semibold rounded-xl"
              onClick={handleRecover}
            >
              立即恢复
            </Button>
            <Button
              size="lg"
              variant="ghost"
              className="w-full h-12 text-[15px] text-muted-foreground rounded-xl"
              onClick={() => onOpenChange(false)}
            >
              取消
            </Button>
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
