import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Shield, Key, Upload, CheckCircle2, Loader2,
  Smartphone, Server, FileKey, Lock, ClipboardList, PauseCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';

interface AgentActivationDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
  walletName: string;
  onActivated: () => void;
}

const progressSteps = [
  '验证备份分片完整性...',
  '加密传输至 Agent 签名服务...',
  '配置风控策略网关...',
  '托管授权完成',
];

export function AgentActivationDrawer({
  open, onOpenChange, walletName, onActivated,
}: AgentActivationDrawerProps) {
  const [step, setStep] = useState(1);
  const [fileName, setFileName] = useState('');
  const [password, setPassword] = useState('');
  const [progressIndex, setProgressIndex] = useState(0);
  const [showPassword, setShowPassword] = useState(false);

  // Reset state when drawer opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setFileName('');
      setPassword('');
      setProgressIndex(0);
      setShowPassword(false);
    }
  }, [open]);

  // Progress animation for step 3
  useEffect(() => {
    if (step !== 3) return;
    if (progressIndex >= progressSteps.length) return;
    const timer = setTimeout(() => {
      setProgressIndex(prev => prev + 1);
    }, 800);
    return () => clearTimeout(timer);
  }, [step, progressIndex]);

  const handleSelectFile = () => {
    // Simulated file selection
    setFileName('tss_backup_2026.enc');
  };

  const handleVerify = () => {
    if (!fileName || !password) return;
    setStep(3);
  };

  const handleComplete = () => {
    onActivated();
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>
            {step === 1 && '授权 Agent 签名权'}
            {step === 2 && '导入 TSS 密钥备份'}
            {step === 3 && (progressIndex >= progressSteps.length ? '授权完成' : '正在授权...')}
          </DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Custody Explanation */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  为「{walletName}」开启 Agent 自动交易
                </p>

                {/* MPC diagram */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="text-center space-y-1.5">
                    <div className="w-10 h-10 mx-auto rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-[11px] font-medium">您的设备</p>
                    <p className="text-[10px] text-muted-foreground">分片 A</p>
                  </div>
                  <div className="text-center space-y-1.5">
                    <div className="w-10 h-10 mx-auto rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                      <Server className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <p className="text-[11px] font-medium">Cobo</p>
                    <p className="text-[10px] text-muted-foreground">分片 B</p>
                  </div>
                  <div className="text-center space-y-1.5">
                    <div className="w-10 h-10 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <p className="text-[11px] font-medium">Agent</p>
                    <p className="text-[10px] text-muted-foreground">使用备份分片</p>
                  </div>
                </div>

                <p className="text-xs text-muted-foreground text-center">
                  Agent 使用您的备份分片 + Cobo 服务器分片完成签名（2-of-3）
                </p>

                {/* Key points */}
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileKey className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">导入备份分片</p>
                      <p className="text-xs text-muted-foreground">Agent 通过您导入的密钥备份获得签名权</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <ClipboardList className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">风控策略约束</p>
                      <p className="text-xs text-muted-foreground">所有自动交易受控制模式、速率限制和地址管控约束</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <PauseCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">随时可撤销</p>
                      <p className="text-xs text-muted-foreground">您可以随时暂停或撤销 Agent 访问权限</p>
                    </div>
                  </div>
                </div>

                <Button className="w-full" onClick={() => setStep(2)}>
                  下一步
                </Button>
              </motion.div>
            )}

            {/* Step 2: Import Backup File */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  请导入您的 TSS 密钥备份文件并输入备份密码
                </p>

                {/* File picker area */}
                <button
                  onClick={handleSelectFile}
                  className={cn(
                    'w-full p-6 rounded-xl border-2 border-dashed transition-all text-center',
                    fileName
                      ? 'border-emerald-500/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                      : 'border-border hover:border-muted-foreground/40 hover:bg-muted/20'
                  )}
                >
                  {fileName ? (
                    <div className="space-y-1">
                      <FileKey className="w-8 h-8 mx-auto text-emerald-600 dark:text-emerald-400" />
                      <p className="text-sm font-medium text-emerald-700 dark:text-emerald-400">{fileName}</p>
                      <p className="text-xs text-muted-foreground">点击重新选择</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Upload className="w-8 h-8 mx-auto text-muted-foreground" />
                      <p className="text-sm text-muted-foreground">点击选择备份文件</p>
                      <p className="text-xs text-muted-foreground/70">支持 .enc 加密备份文件</p>
                    </div>
                  )}
                </button>

                {/* Password input */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">备份密码</label>
                  <div className="relative">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="输入备份时设置的密码"
                      className="pr-10"
                    />
                    <button
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <Lock className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <Button
                  className="w-full"
                  onClick={handleVerify}
                  disabled={!fileName || !password}
                >
                  验证并授权
                </Button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  返回上一步
                </button>
              </motion.div>
            )}

            {/* Step 3: Progress + Complete */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {progressIndex < progressSteps.length ? (
                  // Progress animation
                  <div className="py-4 space-y-4">
                    {progressSteps.map((label, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: i <= progressIndex ? 1 : 0.3, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3"
                      >
                        {i < progressIndex ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0" />
                        ) : i === progressIndex ? (
                          <Loader2 className="w-5 h-5 text-primary animate-spin flex-shrink-0" />
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/20 flex-shrink-0" />
                        )}
                        <span className={cn(
                          'text-sm',
                          i <= progressIndex ? 'text-foreground' : 'text-muted-foreground/50'
                        )}>
                          {label}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  // Success state
                  <div className="py-6 text-center space-y-3">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                    >
                      <div className="w-16 h-16 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
                      </div>
                    </motion.div>
                    <p className="text-lg font-semibold">Agent 签名权已授权</p>
                    <p className="text-sm text-muted-foreground">
                      您可以在设置中配置控制模式和风控策略，<br />也可以随时撤销授权。
                    </p>
                    <Button className="w-full mt-4" onClick={handleComplete}>
                      完成
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
