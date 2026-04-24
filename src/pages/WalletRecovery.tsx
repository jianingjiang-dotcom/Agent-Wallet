import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, QrCode, Cloud, FileArchive, Wallet, Info,
  Smartphone, Check, Shield, Loader2,
  ChevronRight, Lock, RefreshCw, Eye, EyeOff, MessageCircle
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { RecoveryMethod } from '@/types/wallet';
import { useWallet, getWalletTotalBalance } from '@/contexts/WalletContext';
import { QRCodeSVG } from 'qrcode.react';

interface RecoveryOption {
  id: RecoveryMethod;
  title: string;
  description: string;
  icon: typeof QrCode;
  iconColor: string;
  bgColor: string;
  recommended?: boolean;
  warning?: boolean;
}

const recoveryOptions: RecoveryOption[] = [
  {
    id: 'cloud_icloud',
    title: '云端恢复',
    description: '从 iCloud 或 Google Drive 备份恢复',
    icon: Cloud,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
  },
  {
    id: 'local_file',
    title: '本地文件恢复',
    description: '导入 .backup 备份文件',
    icon: FileArchive,
    iconColor: 'text-primary',
    bgColor: 'bg-primary/10',
  },
];

export default function WalletRecoveryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { recoverAllKeyShares, markAllUnrecovered, wallets } = useWallet();
  const returnTo = (location.state as { returnTo?: string })?.returnTo || '/home';
  const [selectedMethod, setSelectedMethod] = useState<RecoveryMethod | null>(null);
  const [skipDrawerOpen, setSkipDrawerOpen] = useState(false);
  const [showWalletList, setShowWalletList] = useState(false);
  const [step, setStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [waitingForAuth, setWaitingForAuth] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [qrCode] = useState(`recovery-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`);

  // Simulate waiting for device authorization
  useEffect(() => {
    if (waitingForAuth) {
      const timer = setTimeout(() => {
        setWaitingForAuth(false);
        setStep(2); // Move to sync step
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [waitingForAuth]);

  // Simulate sync progress
  useEffect(() => {
    if (step === 2 && selectedMethod === 'scan_device') {
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            // Mark all wallets as recovered then advance to success
            recoverAllKeyShares().then(() => {
              setTimeout(() => setStep(3), 500);
            });
            return 100;
          }
          return prev + 20;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [step, selectedMethod]);

  const handleSelectMethod = (method: RecoveryMethod) => {
    // Reshare navigates away immediately — don't enter internal flow
    setSelectedMethod(method);
    setStep(1);
  };

  const handleStartScanDevice = () => {
    setWaitingForAuth(true);
  };

  const handleCloudAuth = async () => {
    setIsProcessing(true);
    // Simulate cloud authorization
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setShowWalletList(true); // Show discovered wallets before password
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast.error('请输入密码');
      return;
    }
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    await recoverAllKeyShares();
    setIsProcessing(false);
    setStep(3);
  };

  const handleComplete = () => {
    toast.success('钱包恢复成功');
    navigate(returnTo, { replace: true });
  };

  // Render method selection
  const renderMethodSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >

      {/* Recovery options */}
      <div>
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">恢复方式</p>
        <div className="space-y-2">
          {recoveryOptions.map(option => (
            <motion.button
              key={option.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleSelectMethod(option.id)}
              className="w-full card-elevated p-4 flex items-center gap-4"
            >
              <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", option.bgColor)}>
                <option.icon className={cn("w-5 h-5", option.iconColor)} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">{option.title}</p>
                <p className="text-xs text-muted-foreground">{option.description}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </motion.button>
          ))
          }
        </div>
      </div>

    </motion.div>
  );

  // Render scan device flow
  const renderScanDeviceFlow = () => {
    if (waitingForAuth) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[400px]"
        >
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
          >
            <Smartphone className="w-10 h-10 text-success" />
          </motion.div>
          <h2 className="text-lg font-semibold text-foreground mb-2">等待旧设备授权</h2>
          <p className="text-sm text-muted-foreground text-center mb-4">
            请在旧设备上打开 App 并扫描上方二维码
          </p>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">等待中...</span>
          </div>
        </motion.div>
      );
    }

    if (step === 1) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center"
        >
          <div className="text-center mb-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">使用旧设备扫描</h2>
            <p className="text-sm text-muted-foreground">
              在旧设备上打开 App，扫描下方二维码
            </p>
          </div>

          <div className="p-4 bg-white rounded-xl mb-6">
            <QRCodeSVG value={qrCode} size={200} level="H" />
          </div>

          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <RefreshCw className="w-4 h-4" />
            <span>二维码 5 分钟内有效</span>
          </div>

          <Button 
            className="w-full" 
            variant="outline"
            onClick={handleStartScanDevice}
          >
            <Smartphone className="w-4 h-4 mr-2" />
            模拟恢复流程（演示）
          </Button>
        </motion.div>
      );
    }

    if (step === 2) {
      return (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center min-h-[400px]"
        >
          <div className="w-full max-w-xs mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">正在同步数据...</span>
              <span className="text-sm font-medium text-foreground">{syncProgress}%</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${syncProgress}%` }}
                className="h-full bg-success rounded-full"
              />
            </div>
          </div>

          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className={cn("w-4 h-4", syncProgress > 20 ? "text-success" : "text-muted-foreground")} />
              <span>验证设备身份</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className={cn("w-4 h-4", syncProgress > 40 ? "text-success" : "text-muted-foreground")} />
              <span>同步密钥分片</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className={cn("w-4 h-4", syncProgress > 60 ? "text-success" : "text-muted-foreground")} />
              <span>同步联系人</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Check className={cn("w-4 h-4", syncProgress > 80 ? "text-success" : "text-muted-foreground")} />
              <span>同步设置</span>
            </div>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  // Render cloud recovery flow
  const renderCloudFlow = () => {
    if (step === 1) {
      // Wallet list after auth — data from cloud backup (mock)
      if (showWalletList) {
        // In production this comes from the cloud backup file, not local context.
        // Mock: simulate discovering wallets from backup.
        const discoveredWallets = wallets.length > 0
          ? wallets.map(w => ({ id: w.id, name: w.name, balance: getWalletTotalBalance(w.id), backedUp: w.isBackedUp }))
          : [
              { id: 'w1', name: '我的钱包', balance: 50010.50, backedUp: true },
              { id: 'w2', name: '商务钱包', balance: 74540.00, backedUp: true },
              { id: 'w3', name: '备用钱包', balance: 15155.00, backedUp: false },
              { id: 'w4', name: 'Agent 交易钱包', balance: 49200.00, backedUp: false },
            ];
        const recoverable = discoveredWallets.filter(w => w.backedUp);
        const unrecoverable = discoveredWallets.filter(w => !w.backedUp);

        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            <div className="text-center">
              <h2 className="text-lg font-semibold text-foreground mb-1">发现以下钱包</h2>
              <p className="text-sm text-muted-foreground">已从云端备份中读取钱包信息</p>
            </div>

            {/* Recoverable wallets */}
            {recoverable.length > 0 && (
              <div>
                <p className="text-[12px] text-muted-foreground mb-2 px-1">可恢复（{recoverable.length}）</p>
                <div className="bg-card border border-border rounded-xl overflow-hidden">
                  {recoverable.map((w, idx) => (
                    <div key={w.id} className={cn(idx > 0 && 'border-t border-border')}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Wallet className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <p className="flex-1 text-[14px] font-semibold text-foreground truncate">{w.name}</p>
                        <span className="text-[14px] font-semibold text-foreground tabular-nums shrink-0">
                          ${w.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Unrecoverable wallets */}
            {unrecoverable.length > 0 && (
              <div>
                <p className="text-[12px] text-muted-foreground mb-2 px-1">不在本次备份范围（{unrecoverable.length}）</p>
                <div className="bg-card border border-border/50 rounded-xl overflow-hidden opacity-60">
                  {unrecoverable.map((w, idx) => (
                    <div key={w.id} className={cn(idx > 0 && 'border-t border-border/50')}>
                      <div className="flex items-center gap-3 px-4 py-3">
                        <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                          <Wallet className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                        </div>
                        <p className="flex-1 text-[14px] font-medium text-muted-foreground truncate">{w.name}</p>
                        <span className="text-[14px] font-medium text-muted-foreground tabular-nums shrink-0">
                          ${w.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 px-1 pt-2">
                  <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                  <p className="text-[11px] text-muted-foreground">以上钱包可尝试其他方式恢复</p>
                </div>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={() => { setShowWalletList(false); setStep(2); }}
            >
              继续恢复
            </Button>
          </motion.div>
        );
      }

      // Auth screen
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center bg-primary/10">
              <Cloud className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              云端授权
            </h2>
            <p className="text-sm text-muted-foreground">
              授权访问 iCloud 或 Google Drive 以恢复备份
            </p>
          </div>

          <Button
            className="w-full"
            onClick={handleCloudAuth}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Cloud className="w-4 h-4 mr-2" />
            )}
            {isProcessing ? '授权中...' : '授权访问'}
          </Button>
        </motion.div>
      );
    }

    if (step === 2) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">输入恢复密码</h2>
            <p className="text-sm text-muted-foreground">
              请输入备份时设置的密码以解密密钥分片
            </p>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入备份密码"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button 
              className="w-full" 
              onClick={handlePasswordSubmit}
              disabled={isProcessing || !password.trim()}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? '解密中...' : '确认恢复'}
            </Button>
          </div>
        </motion.div>
      );
    }

    return null;
  };

  // Render local file flow
  const renderLocalFileFlow = () => {
    if (step === 1 && !showWalletList) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-warning/10 mx-auto mb-4 flex items-center justify-center">
              <FileArchive className="w-8 h-8 text-warning" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">选择备份文件</h2>
            <p className="text-sm text-muted-foreground">
              选择您保存的 .backup 文件
            </p>
          </div>

          <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
            <FileArchive className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">点击或拖拽文件到此处</p>
            <Button variant="outline" onClick={() => setShowWalletList(true)}>
              选择文件
            </Button>
          </div>
        </motion.div>
      );
    }

    // Wallet list after file selected (same pattern as cloud)
    if (step === 1 && showWalletList) {
      const discoveredWallets = wallets.length > 0
        ? wallets.map(w => ({ id: w.id, name: w.name, balance: getWalletTotalBalance(w.id), backedUp: w.isBackedUp }))
        : [
            { id: 'w1', name: '我的钱包', balance: 50010.50, backedUp: true },
            { id: 'w2', name: '商务钱包', balance: 74540.00, backedUp: true },
            { id: 'w3', name: '备用钱包', balance: 15155.00, backedUp: false },
            { id: 'w4', name: 'Agent 交易钱包', balance: 49200.00, backedUp: false },
          ];
      const recoverable = discoveredWallets.filter(w => w.backedUp);
      const unrecoverable = discoveredWallets.filter(w => !w.backedUp);

      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-5"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground mb-1">发现以下钱包</h2>
            <p className="text-sm text-muted-foreground">已从备份文件中读取钱包信息</p>
          </div>

          {recoverable.length > 0 && (
            <div>
              <p className="text-[12px] text-muted-foreground mb-2 px-1">可恢复（{recoverable.length}）</p>
              <div className="bg-card border border-border rounded-xl overflow-hidden">
                {recoverable.map((w, idx) => (
                  <div key={w.id} className={cn(idx > 0 && 'border-t border-border')}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Wallet className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <p className="flex-1 text-[14px] font-semibold text-foreground truncate">{w.name}</p>
                      <span className="text-[14px] font-semibold text-foreground tabular-nums shrink-0">
                        ${w.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {unrecoverable.length > 0 && (
            <div>
              <p className="text-[12px] text-muted-foreground mb-2 px-1">不在本次备份范围（{unrecoverable.length}）</p>
              <div className="bg-card border border-border/50 rounded-xl overflow-hidden opacity-60">
                {unrecoverable.map((w, idx) => (
                  <div key={w.id} className={cn(idx > 0 && 'border-t border-border/50')}>
                    <div className="flex items-center gap-3 px-4 py-3">
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Wallet className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
                      </div>
                      <p className="flex-1 text-[14px] font-medium text-muted-foreground truncate">{w.name}</p>
                      <span className="text-[14px] font-medium text-muted-foreground tabular-nums shrink-0">
                        ${w.balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-1.5 px-1 pt-2">
                <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0" strokeWidth={1.5} />
                <p className="text-[11px] text-muted-foreground">以上钱包可尝试其他方式恢复</p>
              </div>
            </div>
          )}

          <Button
            className="w-full"
            size="lg"
            onClick={() => { setShowWalletList(false); setStep(2); }}
          >
            继续恢复
          </Button>
        </motion.div>
      );
    }

    if (step === 2) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground mb-2">输入备份密码</h2>
            <p className="text-sm text-muted-foreground">
              请输入创建备份时设置的密码
            </p>
          </div>

          <div className="p-3 bg-muted/50 rounded-lg flex items-center gap-3">
            <FileArchive className="w-5 h-5 text-warning" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">wallet_backup_2024.backup</p>
              <p className="text-xs text-muted-foreground">2.3 MB</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入备份密码"
                className="pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <Button 
              className="w-full" 
              onClick={handlePasswordSubmit}
              disabled={isProcessing || !password.trim()}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Lock className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? '解密中...' : '确认恢复'}
            </Button>
          </div>
        </motion.div>
      );
    }

    return null;
  };


  // Mock recovered wallet data
  const recoveredWallet = {
    name: '我的钱包',
    address: '0x7a8b...3e2f',
    recoveredAt: new Date(),
    assets: [
      { symbol: 'USDT', name: 'Tether USD', balance: 12580.50, network: 'Ethereum' },
      { symbol: 'ETH', name: 'Ethereum', balance: 2.35, usdValue: 8225.00, network: 'Ethereum' },
      { symbol: 'USDC', name: 'USD Coin', balance: 5000.00, network: 'Tron' },
    ],
    totalBalance: 25805.50,
  };

  // Render completion step
  const renderComplete = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4 mx-auto"
      >
        <Check className="w-10 h-10 text-success" />
      </motion.div>

      <h2 className="text-xl font-bold text-foreground mb-1 text-center">恢复成功</h2>
      <p className="text-sm text-muted-foreground text-center mb-6">
        您的钱包已成功恢复
      </p>

      {/* Wallet Info Card */}
      <div className="card-elevated p-4 w-full mb-4">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
          <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
            <Shield className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-foreground">{recoveredWallet.name}</p>
            <p className="text-xs text-muted-foreground">{recoveredWallet.address}</p>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">总资产</span>
          <span className="text-lg font-bold text-foreground">
            ${recoveredWallet.totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Asset Preview */}
      <div className="mb-6">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">资产预览</p>
        <div className="card-elevated overflow-hidden">
          {recoveredWallet.assets.map((asset, index) => (
            <motion.div
              key={asset.symbol}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className={cn(
                "p-3 flex items-center justify-between",
                index !== recoveredWallet.assets.length - 1 && "border-b border-border"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                  <span className="text-xs font-bold text-muted-foreground">
                    {asset.symbol.slice(0, 2)}
                  </span>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">{asset.symbol}</p>
                  <p className="text-xs text-muted-foreground">{asset.network}</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-foreground">
                  {asset.balance.toLocaleString(undefined, { maximumFractionDigits: 4 })}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recovery time */}
      <p className="text-xs text-muted-foreground text-center mb-4">
        恢复时间: {recoveredWallet.recoveredAt.toLocaleString('zh-CN')}
      </p>

      <Button className="w-full" onClick={handleComplete}>
        进入钱包
      </Button>
    </motion.div>
  );

  const renderContent = () => {
    if (step === 3) return renderComplete();

    if (!selectedMethod) return <motion.div key="method-selection" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{renderMethodSelection()}</motion.div>;

    switch (selectedMethod) {
      case 'scan_device':
        return <motion.div key="scan-device" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{renderScanDeviceFlow()}</motion.div>;
      case 'cloud_icloud':
        return <motion.div key={`cloud-${step}-${showWalletList}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{renderCloudFlow()}</motion.div>;
      case 'local_file':
        return <motion.div key={`local-${step}-${showWalletList}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>{renderLocalFileFlow()}</motion.div>;
      default:
        return renderMethodSelection();
    }
  };

  return (
    <AppLayout
      showNav={false}
      showBack
      title="恢复钱包"
      onBack={() => {
        if (step > 0 && selectedMethod) {
          if (step === 1) {
            setSelectedMethod(null);
            setShowWalletList(false);
            setStep(0);
          } else {
            setStep(step - 1);
          }
        } else {
          navigate(-1);
        }
      }}
    >
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>

        {/* Skip + Support */}
        {step !== 3 && !selectedMethod && (
          <div className="px-4 pb-6 pt-2 space-y-1">
            <button
              onClick={() => setSkipDrawerOpen(true)}
              className="w-full text-center text-sm text-muted-foreground font-medium py-3 active:opacity-60 transition-opacity"
            >
              跳过恢复
            </button>
            <button
              onClick={() => navigate('/help')}
              className="w-full flex items-center justify-center gap-2 text-xs text-muted-foreground/60 transition-colors py-2"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>遇到问题？联系客服</span>
            </button>
          </div>
        )}
      </div>

      {/* Skip confirmation drawer */}
      <Drawer open={skipDrawerOpen} onOpenChange={setSkipDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>跳过恢复</DrawerTitle>
          </DrawerHeader>

          <div className="px-6 pt-2 pb-6 flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-[68px] h-[68px] rounded-[20px] bg-warning/10 flex items-center justify-center mb-5"
            >
              <EyeOff className="w-8 h-8 text-warning" strokeWidth={1.75} />
            </motion.div>

            <h2 className="text-[22px] font-bold text-foreground tracking-tight mb-2">
              确认跳过恢复？
            </h2>

            <div className="text-[14px] text-muted-foreground leading-relaxed max-w-[300px] mb-6 space-y-3 text-left">
              <p>
                跳过后，钱包仅支持通过<span className="text-foreground font-medium">重新配对</span>完成恢复。
              </p>
              <p>
                未激活的钱包<span className="text-foreground font-medium">无法发起转账或签名</span>。
              </p>
            </div>

            <div className="w-full space-y-2.5">
              <Button
                size="lg"
                className="w-full h-12 text-[15px] font-semibold rounded-xl"
                onClick={() => setSkipDrawerOpen(false)}
              >
                返回恢复
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="w-full h-12 text-[15px] text-muted-foreground rounded-xl"
                onClick={() => {
                  setSkipDrawerOpen(false);
                  navigate('/home/norecovery', { replace: true });
                }}
              >
                确认跳过
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

    </AppLayout>
  );
}

