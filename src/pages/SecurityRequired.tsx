import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ShieldOff, Settings, Lock, Fingerprint, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';

export default function SecurityRequiredPage() {
  const navigate = useNavigate();

  const handleOpenSettings = () => {
    // In a real app, this would open system settings
    // For iOS: App.openURL('App-Prefs:root=TOUCHID_PASSCODE')
    // For Android: Intent for security settings
    console.log('Opening system settings...');
  };

  const handleRetry = () => {
    navigate('/onboarding?new=true');
  };

  return (
    <AppLayout showNav={false} showBack title="安全认证" showSecurityBanner={false}>

      {/* Content */}
      <div className="flex-1 px-4 flex flex-col">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Error Icon */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center mb-6"
          >
            <ShieldOff className="w-12 h-12 text-destructive" />
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl font-bold text-foreground mb-3"
          >
            设备未启用安全认证
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-sm max-w-[280px] leading-relaxed mb-8"
          >
            为了保护您的资产安全，请先在系统设置中开启设备锁屏密码或生物识别认证
          </motion.p>

          {/* Requirement Items */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="w-full max-w-[300px] space-y-3"
          >
            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Lock className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">设备锁屏密码</p>
                <p className="text-xs text-muted-foreground">数字密码或图案密码</p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/50 border border-border">
              <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                <Fingerprint className="w-5 h-5 text-accent" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-foreground">生物识别认证</p>
                <p className="text-xs text-muted-foreground">面容 ID / 指纹识别</p>
              </div>
            </div>
          </motion.div>

          {/* Info Tip */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-6 p-4 rounded-xl bg-warning/10 border border-warning/20 max-w-[300px]"
          >
            <p className="text-xs text-warning leading-relaxed">
              <span className="font-medium">为什么需要系统安全认证？</span>
              <br />
              我们使用设备自身的安全能力来保护您的钱包私钥，这是行业最高安全标准的做法。
            </p>
          </motion.div>
        </div>

        {/* Bottom Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pb-6 space-y-3"
        >
          <Button
            size="lg"
            className="w-full text-base font-medium"
            onClick={handleOpenSettings}
          >
            <Settings className="w-5 h-5 mr-2" />
            前往系统设置
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
          
          <Button
            variant="outline"
            size="lg"
            className="w-full text-base font-medium"
            onClick={handleRetry}
          >
            已完成设置，重新授权
          </Button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
