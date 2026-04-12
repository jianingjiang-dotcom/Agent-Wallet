import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Fingerprint, CheckCircle2, Loader2 } from 'lucide-react';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';

interface BiometricVerifyDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  onVerified: () => void;
}

export function BiometricVerifyDrawer({
  open, onOpenChange, title, description, onVerified,
}: BiometricVerifyDrawerProps) {
  const [status, setStatus] = useState<'idle' | 'verifying' | 'success'>('idle');

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setStatus('idle');
    }
  }, [open]);

  const handleVerify = async () => {
    setStatus('verifying');
    // Simulate biometric authentication
    await new Promise(r => setTimeout(r, 1200));
    setStatus('success');
    // Short delay to show success state
    await new Promise(r => setTimeout(r, 400));
    onOpenChange(false);
    onVerified();
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{title}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 flex flex-col items-center">
          {description && (
            <p className="text-sm text-muted-foreground text-center mb-6 px-4">
              {description}
            </p>
          )}

          {/* Fingerprint icon with animation */}
          <motion.div
            className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6"
            animate={status === 'verifying' ? { scale: [1, 1.1, 1] } : {}}
            transition={{ repeat: Infinity, duration: 1.2 }}
          >
            {status === 'success' ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500" />
            ) : (
              <Fingerprint
                className={`w-10 h-10 ${status === 'verifying' ? 'text-primary animate-pulse' : 'text-muted-foreground'}`}
              />
            )}
          </motion.div>

          <p className="text-sm text-muted-foreground mb-6">
            {status === 'idle' && '请验证生物识别以继续操作'}
            {status === 'verifying' && '验证中...'}
            {status === 'success' && '验证成功'}
          </p>

          <Button
            className="w-full"
            size="lg"
            disabled={status !== 'idle'}
            onClick={handleVerify}
          >
            {status === 'verifying' ? (
              <>
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                验证中...
              </>
            ) : status === 'success' ? (
              <>
                <CheckCircle2 className="w-4 h-4 mr-1.5" />
                已验证
              </>
            ) : (
              <>
                <Fingerprint className="w-4 h-4 mr-1.5" />
                开始验证
              </>
            )}
          </Button>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
