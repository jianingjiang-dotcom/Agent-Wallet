import { motion } from 'framer-motion';
import { 
  AlertTriangle, Smartphone, MapPin, Clock, LogIn 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { DeviceKickInfo } from '@/types/wallet';

interface DeviceKickedDialogProps {
  open: boolean;
  kickInfo: DeviceKickInfo | null;
  onConfirm: () => void;
}

export function DeviceKickedDialog({ 
  open, 
  kickInfo, 
  onConfirm 
}: DeviceKickedDialogProps) {
  if (!kickInfo) return null;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent className="max-w-[340px]">
        <AlertDialogHeader className="text-center">
          {/* Warning Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 12, stiffness: 200 }}
            className="w-16 h-16 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-2"
          >
            <AlertTriangle className="w-8 h-8 text-destructive" />
          </motion.div>

          <AlertDialogTitle className="text-lg">
            您已在其他设备登录
          </AlertDialogTitle>
          
          <AlertDialogDescription className="text-sm">
            您的账号已在新设备上登录，当前设备已退出登录
          </AlertDialogDescription>
        </AlertDialogHeader>

        {/* Device Info */}
        <div className="bg-muted/50 rounded-lg p-3 space-y-2.5 my-2">
          <div className="flex items-center gap-2 text-sm">
            <Smartphone className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">新设备：</span>
            <span className="font-medium text-foreground">{kickInfo.newDeviceName}</span>
          </div>
          
          {kickInfo.newDeviceLocation && (
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">登录地点：</span>
              <span className="font-medium text-foreground">{kickInfo.newDeviceLocation}</span>
            </div>
          )}
          
          <div className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">登录时间：</span>
            <span className="font-medium text-foreground">
              {format(kickInfo.kickedAt, 'HH:mm', { locale: zhCN })}
            </span>
          </div>
        </div>

        <AlertDialogFooter className="sm:justify-center">
          <Button
            size="lg"
            className="w-full"
            onClick={onConfirm}
          >
            <LogIn className="w-4 h-4 mr-2" />
            我知道了
          </Button>
        </AlertDialogFooter>

        <p className="text-xs text-center text-muted-foreground -mt-1">
          如非本人操作，请立即联系客服
        </p>
      </AlertDialogContent>
    </AlertDialog>
  );
}
