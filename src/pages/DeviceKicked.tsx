import { motion } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  AlertTriangle, Smartphone, MapPin, Clock,
  LogIn, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export default function DeviceKickedPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // Get kick info from URL params (or use defaults for demo)
  const deviceName = searchParams.get('device') || 'iPhone 15 Pro';
  const location = searchParams.get('location') || '上海, 中国';
  const kickTime = searchParams.get('time') 
    ? new Date(searchParams.get('time')!) 
    : new Date();

  const handleRelogin = () => {
    navigate('/login');
  };

  const handleContactSupport = () => {
    navigate('/profile/help');
  };

  return (
    <div className="h-full bg-background flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
        {/* Warning Icon with Animation */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', damping: 12, stiffness: 200 }}
          className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6"
        >
          <motion.div
            animate={{ 
              rotate: [0, -10, 10, -10, 0],
            }}
            transition={{ 
              duration: 0.5, 
              delay: 0.5,
              repeat: 2,
            }}
          >
            <AlertTriangle className="w-12 h-12 text-destructive" />
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xl font-bold text-foreground mb-2"
        >
          账号已在其他设备登录
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm text-muted-foreground max-w-[300px] mb-8"
        >
          您的账号已在新设备上登录，当前设备已退出登录
        </motion.p>

        {/* New Device Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="w-full max-w-[320px] bg-card border border-border rounded-xl p-4 mb-6"
        >
          <p className="text-xs text-muted-foreground mb-3">新登录设备信息</p>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Smartphone className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs text-muted-foreground">设备名称</p>
                <p className="text-sm font-medium text-foreground">{deviceName}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <MapPin className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs text-muted-foreground">登录地点</p>
                <p className="text-sm font-medium text-foreground">{location}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                <Clock className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs text-muted-foreground">登录时间</p>
                <p className="text-sm font-medium text-foreground">
                  {format(kickTime, 'yyyy年MM月dd日 HH:mm', { locale: zhCN })}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Notice */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full max-w-[320px] bg-muted/50 rounded-lg p-3 mb-8"
        >
          <p className="text-xs text-muted-foreground text-center">
            为了您的账户安全，每个账号同一时间只能在一台设备上使用
          </p>
        </motion.div>
      </div>

      {/* Bottom Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="px-4 pb-6 space-y-3"
      >
        <Button
          size="lg"
          className="w-full text-base font-medium"
          onClick={handleRelogin}
        >
          <LogIn className="w-5 h-5 mr-2" />
          重新登录
        </Button>
        
        <Button
          variant="outline"
          size="lg"
          className="w-full text-base"
          onClick={handleContactSupport}
        >
          <MessageCircle className="w-5 h-5 mr-2" />
          联系客服
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          如果这不是您本人的操作，请立即联系客服
        </p>
      </motion.div>
    </div>
  );
}
