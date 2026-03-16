import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, QrCode, Cloud, FileArchive, Key,
  Smartphone, Check, Shield, AlertTriangle, Loader2,
  ChevronRight, Lock, RefreshCw, Eye, EyeOff, MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { RecoveryMethod } from '@/types/wallet';
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
    id: 'scan_device',
    title: '扫描旧设备',
    description: '使用旧设备扫码授权，最快最安全',
    icon: QrCode,
    iconColor: 'text-success',
    bgColor: 'bg-success/10',
    recommended: true,
  },
  {
    id: 'cloud_icloud',
    title: 'iCloud 恢复',
    description: '从 iCloud 备份恢复钱包',
    icon: Cloud,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    id: 'cloud_google',
    title: 'Google Drive 恢复',
    description: '从 Google Drive 备份恢复',
    icon: Cloud,
    iconColor: 'text-success',
    bgColor: 'bg-success/10',
  },
  {
    id: 'local_file',
    title: '本地文件恢复',
    description: '导入 .backup 备份文件',
    icon: FileArchive,
    iconColor: 'text-warning',
    bgColor: 'bg-warning/10',
  },
  {
    id: 'private_key',
    title: '私钥文件导入',
    description: '导入已有私钥（高级选项）',
    icon: Key,
    iconColor: 'text-destructive',
    bgColor: 'bg-destructive/10',
    warning: true,
  },
];

export default function WalletRecoveryPage() {
  const navigate = useNavigate();
  const [selectedMethod, setSelectedMethod] = useState<RecoveryMethod | null>(null);
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
            setTimeout(() => setStep(3), 500);
            return 100;
          }
          return prev + 20;
        });
      }, 800);
      return () => clearInterval(interval);
    }
  }, [step, selectedMethod]);

  const handleSelectMethod = (method: RecoveryMethod) => {
    setSelectedMethod(method);
    setStep(1);
  };

  const handleStartScanDevice = () => {
    setWaitingForAuth(true);
  };

  const handleCloudAuth = async () => {
    setIsProcessing(true);
    // Simulate cloud authorization + recovery (no password needed)
    await new Promise(resolve => setTimeout(resolve, 2000));
    setIsProcessing(false);
    setStep(3); // Skip password step, go directly to success
  };

  const handlePasswordSubmit = async () => {
    if (!password.trim()) {
      toast.error('请输入密码');
      return;
    }
    setIsProcessing(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsProcessing(false);
    setStep(3);
  };

  const handleComplete = () => {
    toast.success('钱包恢复成功');
    navigate('/home');
  };

  // Render method selection
  const renderMethodSelection = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4"
    >
      <div className="text-center mb-6">
        <h1 className="text-xl font-bold text-foreground mb-2">恢复钱包</h1>
        <p className="text-sm text-muted-foreground">选择一种方式恢复您的钱包</p>
      </div>

      {/* Recommended option */}
      <div className="mb-4">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">推荐方式</p>
        {recoveryOptions.filter(o => o.recommended).map(option => (
          <motion.button
            key={option.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectMethod(option.id)}
            className={cn(
              "w-full p-4 rounded-xl border-2 border-success/30 bg-success/5 flex items-center gap-4",
              "hover:border-success/50 transition-colors"
            )}
          >
            <div className={cn("w-12 h-12 rounded-full flex items-center justify-center", option.bgColor)}>
              <option.icon className={cn("w-6 h-6", option.iconColor)} />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <p className="font-semibold text-foreground">{option.title}</p>
                <span className="text-[10px] px-1.5 py-0.5 bg-success text-white rounded">推荐</span>
              </div>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </motion.button>
        ))
        }
      </div>

      {/* Other options */}
      <div>
        <p className="text-xs font-medium text-foreground mb-2 px-1">其他方式</p>
        <div className="space-y-2">
          {recoveryOptions.filter(o => !o.recommended && !o.warning).map(option => (
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

      {/* Advanced option */}
      <div className="pt-4 border-t border-border">
        <p className="text-xs font-medium text-muted-foreground mb-2 px-1">高级选项</p>
        {recoveryOptions.filter(o => o.warning).map(option => (
          <motion.button
            key={option.id}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectMethod(option.id)}
            className="w-full p-4 rounded-xl border border-destructive/20 bg-destructive/5 flex items-center gap-4"
          >
            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", option.bgColor)}>
              <option.icon className={cn("w-5 h-5", option.iconColor)} />
            </div>
            <div className="flex-1 text-left">
              <div className="flex items-center gap-2">
                <p className="font-medium text-foreground">{option.title}</p>
                <AlertTriangle className="w-3.5 h-3.5 text-warning" />
              </div>
              <p className="text-xs text-muted-foreground">{option.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </motion.button>
        ))
        }
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
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="text-center">
            <div className={cn(
              "w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center",
              selectedMethod === 'cloud_icloud' ? "bg-trust/10" : "bg-success/10"
            )}>
              <Cloud className={cn(
                "w-8 h-8",
                selectedMethod === 'cloud_icloud' ? "text-trust" : "text-success"
              )} />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">
              {selectedMethod === 'cloud_icloud' ? 'iCloud' : 'Google Drive'} 授权
            </h2>
            <p className="text-sm text-muted-foreground">
              授权访问您的云存储以恢复备份
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
            <h2 className="text-lg font-semibold text-foreground mb-2">输入保险箱密码</h2>
            <p className="text-sm text-muted-foreground">
              请输入您设置的备份密码以解密钱包
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
    if (step === 1) {
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
            <Button variant="outline" onClick={() => setStep(2)}>
              选择文件
            </Button>
          </div>
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

  // Render private key import flow
  const renderPrivateKeyFlow = () => {
    if (step === 1) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-destructive mb-1">重要提示</p>
                <p className="text-sm text-muted-foreground">
                  通过私钥导入的钱包将以自托管模式运行，无法享受 MPC 多签保护和 Cobo 安全服务。
                </p>
              </div>
            </div>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/10 mx-auto mb-4 flex items-center justify-center">
              <Key className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-2">选择私钥文件</h2>
            <p className="text-sm text-muted-foreground">
              选择您的 .key 私钥文件
            </p>
          </div>

          <div className="border-2 border-dashed border-destructive/30 rounded-xl p-8 text-center">
            <Key className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground mb-3">点击或拖拽私钥文件到此处</p>
            <Button variant="outline" onClick={() => setStep(2)}>
              选择文件
            </Button>
          </div>
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
            <h2 className="text-lg font-semibold text-foreground mb-2">输入私钥密码</h2>
            <p className="text-sm text-muted-foreground">
              请输入私钥文件的加密密码
            </p>
          </div>

          <div className="p-3 bg-destructive/5 rounded-lg flex items-center gap-3">
            <Key className="w-5 h-5 text-destructive" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">wallet_privatekey.key</p>
              <p className="text-xs text-muted-foreground">加密私钥文件</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入私钥密码"
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
              className="w-full bg-destructive hover:bg-destructive/90" 
              onClick={handlePasswordSubmit}
              disabled={isProcessing || !password.trim()}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Key className="w-4 h-4 mr-2" />
              )}
              {isProcessing ? '导入中...' : '导入私钥'}
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
        {selectedMethod === 'private_key' 
          ? '钱包已导入，运行于自托管模式'
          : '您的钱包已成功恢复'}
      </p>

      {selectedMethod === 'private_key' && (
        <div className="p-3 bg-warning/10 border border-warning/20 rounded-xl mb-4 w-full">
          <div className="flex items-center gap-2 text-warning text-sm">
            <AlertTriangle className="w-4 h-4" />
            <span>此钱包为自托管模式，无 MPC 保护</span>
          </div>
        </div>
      )}

      {/* Wallet Info Card */}
      <div className="card-elevated p-4 w-full mb-4">
        <div className="flex items-center gap-3 mb-3 pb-3 border-b border-border">
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center",
            selectedMethod === 'private_key' ? "bg-warning/10" : "bg-accent/10"
          )}>
            {selectedMethod === 'private_key' ? (
              <Key className="w-6 h-6 text-warning" />
            ) : (
              <Shield className="w-6 h-6 text-accent" />
            )}
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

    if (!selectedMethod) return renderMethodSelection();

    switch (selectedMethod) {
      case 'scan_device':
        return renderScanDeviceFlow();
      case 'cloud_icloud':
      case 'cloud_google':
        return renderCloudFlow();
      case 'local_file':
        return renderLocalFileFlow();
      case 'private_key':
        return renderPrivateKeyFlow();
      default:
        return renderMethodSelection();
    }
  };

  return (
    <AppLayout showNav={false}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => {
              if (step > 0 && selectedMethod) {
                if (step === 1) {
                  setSelectedMethod(null);
                  setStep(0);
                } else {
                  setStep(step - 1);
                }
              } else {
                navigate(-1);
              }
            }}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">恢复钱包</h1>
        </div>

        <div className="flex-1 overflow-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>

        {/* Contact Support */}
        {step !== 3 && (
          <div className="px-4 pb-6 pt-2">
            <button
              onClick={() => navigate('/help')}
              className="w-full flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-3"
            >
              <MessageCircle className="w-4 h-4" />
              <span>遇到问题？联系客服</span>
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

