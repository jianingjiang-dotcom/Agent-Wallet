import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Fingerprint } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import coboLogo from '@/assets/cobo-logo.svg';

export default function LockScreenDemo() {
  const [showUnlockDrawer, setShowUnlockDrawer] = useState(false);
  const [isUnlocking, setIsUnlocking] = useState(false);
  const navigate = useNavigate();

  // Local unlock drawer state
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  const handleIconClick = () => {
    setShowUnlockDrawer(true);
    setShowPasswordInput(false);
    setPassword('');
    setError('');
  };

  const handleUnlock = () => {
    setIsUnlocking(true);
    setShowUnlockDrawer(false);
    
    // 等待动画完成后跳转
    setTimeout(() => {
      navigate('/home');
    }, 600);
  };

  const handleBiometricAuth = async () => {
    setIsLoading(true);
    setError('');
    
    // Simulate biometric authentication
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setIsLoading(false);
    handleUnlock();
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      setError('请输入密码');
      return;
    }

    setIsLoading(true);
    setError('');

    // Simulate password verification
    await new Promise(resolve => setTimeout(resolve, 500));

    // For demo, accept any 6+ character password
    if (password.length >= 6) {
      setIsLoading(false);
      setPassword('');
      handleUnlock();
    } else {
      setIsLoading(false);
      setError('密码错误，请重试');
    }
  };

  return (
    <div className="absolute inset-0 z-[100] overflow-hidden">
      {/* Left panel - slides to left */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isUnlocking ? '-100%' : 0 }}
        transition={{ 
          duration: 0.5, 
          ease: [0.32, 0.72, 0, 1]
        }}
        className="absolute inset-y-0 left-0 w-1/2 bg-background overflow-hidden"
      >
        {/* Left decorative gradient */}
        <motion.div 
          className="absolute top-1/4 -left-20 w-72 h-72 bg-gradient-to-br from-primary/10 to-primary/5 dark:from-foreground/5 dark:to-muted/30 rounded-full blur-3xl"
          animate={{ 
            scale: [1, 1.1, 1],
            opacity: [0.4, 0.6, 0.4]
          }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Right panel - slides to right */}
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: isUnlocking ? '100%' : 0 }}
        transition={{ 
          duration: 0.5, 
          ease: [0.32, 0.72, 0, 1]
        }}
        className="absolute inset-y-0 right-0 w-1/2 bg-background overflow-hidden"
      >
        {/* Right decorative gradient */}
        <motion.div 
          className="absolute bottom-1/3 -right-20 w-80 h-80 bg-gradient-to-br from-primary/5 to-primary/10 dark:from-muted/30 dark:to-foreground/5 rounded-full blur-3xl"
          animate={{ 
            scale: [1.1, 1, 1.1],
            opacity: [0.3, 0.5, 0.3]
          }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>

      {/* Center content - fades and scales down */}
      <motion.div
        initial={{ opacity: 1, scale: 1 }}
        animate={{ 
          opacity: isUnlocking ? 0 : 1, 
          scale: isUnlocking ? 0.8 : 1 
        }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
      >
        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center pointer-events-auto">
          {/* Lock icon with pulse animation */}
          <div className="relative flex items-center justify-center">
            {/* Third pulse ring (outermost) */}
            <motion.div
              className="absolute rounded-full bg-primary/5 dark:bg-white/5"
              style={{ width: 200, height: 200 }}
              animate={{ 
                scale: [0.5, 1],
                opacity: [0.6, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                delay: 1.2
              }}
            />
            {/* Second pulse ring */}
            <motion.div
              className="absolute rounded-full bg-primary/10 dark:bg-white/10"
              style={{ width: 160, height: 160 }}
              animate={{ 
                scale: [0.6, 1],
                opacity: [0.7, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1],
                delay: 0.6
              }}
            />
            {/* First pulse ring (closest) */}
            <motion.div
              className="absolute rounded-full bg-primary/15 dark:bg-white/15"
              style={{ width: 120, height: 120 }}
              animate={{ 
                scale: [0.8, 1],
                opacity: [0.8, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: [0.4, 0, 0.2, 1]
              }}
            />
            
            {/* Lock icon container */}
            <motion.button
              onClick={handleIconClick}
              className="relative w-24 h-24 rounded-full bg-primary/10 dark:bg-white/10 flex items-center justify-center shadow-lg cursor-pointer hover:bg-primary/15 dark:hover:bg-white/15 transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
            >
              <Lock className="w-10 h-10 text-primary dark:text-white" strokeWidth={1.5} />
            </motion.button>
          </div>

          {/* Brand name */}
          <motion.h1
            className="mt-8 text-2xl font-bold text-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            商户钱包
          </motion.h1>

          {/* Hint text */}
          <motion.p
            className="mt-3 text-sm text-muted-foreground"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            点击图标解锁
          </motion.p>
        </div>

        {/* Footer with COBO logo */}
        <motion.div
          className="absolute bottom-12 flex flex-col items-center gap-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
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

      {/* Inline Unlock Drawer - doesn't depend on WalletContext */}
      <Drawer open={showUnlockDrawer} onOpenChange={() => {}}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="pb-2">
            <DrawerTitle className="text-center">身份验证</DrawerTitle>
          </DrawerHeader>
          
          <div className="px-6 pb-8 space-y-6">
            <AnimatePresence mode="wait">
              {!showPasswordInput ? (
                <motion.div
                  key="biometric"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col items-center space-y-6"
                >
                  <button
                    onClick={handleBiometricAuth}
                    disabled={isLoading}
                    className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors disabled:opacity-50"
                  >
                    <Fingerprint className={cn(
                      "w-10 h-10 text-primary",
                      isLoading && "animate-pulse"
                    )} />
                  </button>
                  
                  <p className="text-sm text-muted-foreground text-center">
                    点击使用生物识别解锁
                  </p>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswordInput(true)}
                    className="text-muted-foreground"
                  >
                    使用密码解锁
                  </Button>
                </motion.div>
              ) : (
                <motion.div
                  key="password"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4"
                >
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                      <Lock className="w-8 h-8 text-primary" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Input
                      type="password"
                      placeholder="请输入支付密码"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        setError('');
                      }}
                      onKeyDown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
                      className={cn(error && "border-destructive")}
                    />
                    {error && (
                      <p className="text-xs text-destructive">{error}</p>
                    )}
                  </div>

                  <Button
                    className="w-full"
                    onClick={handlePasswordSubmit}
                    disabled={isLoading}
                  >
                    {isLoading ? '验证中...' : '确认'}
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowPasswordInput(false)}
                    className="w-full text-muted-foreground"
                  >
                    使用生物识别
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
