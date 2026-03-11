import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, QrCode, Smartphone, Check, Loader2,
  Shield, AlertTriangle, X, Fingerprint
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface NewDeviceInfo {
  name: string;
  model: string;
  location: string;
  requestTime: Date;
}

export default function AuthorizeDevicePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0); // 0: scanning, 1: device info, 2: verify, 3: syncing, 4: complete
  const [isScanning, setIsScanning] = useState(false);
  const [newDevice, setNewDevice] = useState<NewDeviceInfo | null>(null);
  const [deactivateOld, setDeactivateOld] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);

  // Simulate QR code scanning
  const handleStartScan = () => {
    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      setNewDevice({
        name: 'iPhone 15 Pro Max',
        model: 'iPhone16,2',
        location: '北京, 中国',
        requestTime: new Date(),
      });
      setStep(1);
    }, 2000);
  };

  // Simulate biometric verification
  const handleVerify = async () => {
    setIsVerifying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsVerifying(false);
    setStep(3);
  };

  // Simulate data sync
  useEffect(() => {
    if (step === 3) {
      const interval = setInterval(() => {
        setSyncProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setStep(4), 500);
            return 100;
          }
          return prev + 15;
        });
      }, 600);
      return () => clearInterval(interval);
    }
  }, [step]);

  const handleComplete = () => {
    toast.success('新设备授权成功');
    navigate('/profile/devices');
  };

  // Step 0: Scan QR Code
  const renderScanStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px]"
    >
      <div className="text-center mb-8">
        <h2 className="text-lg font-semibold text-foreground mb-2">授权新设备</h2>
        <p className="text-sm text-muted-foreground">
          扫描新设备上显示的二维码以完成授权
        </p>
      </div>

      {isScanning ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center"
        >
          <div className="w-48 h-48 rounded-2xl bg-muted/50 border-2 border-dashed border-accent flex items-center justify-center mb-6 relative overflow-hidden">
            <motion.div
              animate={{ y: [-100, 100] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="absolute left-0 right-0 h-0.5 bg-accent"
            />
            <QrCode className="w-16 h-16 text-muted-foreground" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span className="text-sm">正在扫描...</span>
          </div>
        </motion.div>
      ) : (
        <>
          <div className="w-48 h-48 rounded-2xl bg-muted/30 border-2 border-dashed border-border flex items-center justify-center mb-6">
            <QrCode className="w-16 h-16 text-muted-foreground" />
          </div>
          <Button onClick={handleStartScan}>
            <QrCode className="w-4 h-4 mr-2" />
            打开相机扫描
          </Button>
        </>
      )}
    </motion.div>
  );

  // Step 1: Confirm Device Info
  const renderDeviceInfo = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <h2 className="text-lg font-semibold text-foreground mb-2">确认新设备</h2>
        <p className="text-sm text-muted-foreground">
          请确认以下设备信息是否正确
        </p>
      </div>

      {newDevice && (
        <div className="card-elevated p-5">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Smartphone className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{newDevice.name}</p>
              <p className="text-sm text-muted-foreground">{newDevice.model}</p>
            </div>
          </div>

          <div className="space-y-3 pt-4 border-t border-border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">位置</span>
              <span className="font-medium text-foreground">{newDevice.location}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">请求时间</span>
              <span className="font-medium text-foreground">
                {newDevice.requestTime.toLocaleString('zh-CN')}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-warning-surface border border-warning/30 rounded-xl">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-warning" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">安全提示</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              请确认是您本人在操作新设备。如非本人操作，请立即取消并检查账户安全。
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" className="flex-1" onClick={() => navigate(-1)}>
          <X className="w-4 h-4 mr-2" />
          取消
        </Button>
        <Button className="flex-1" onClick={() => setStep(2)}>
          <Check className="w-4 h-4 mr-2" />
          确认授权
        </Button>
      </div>
    </motion.div>
  );

  // Step 2: Biometric Verification
  const renderVerification = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px]"
    >
      <motion.div
        animate={isVerifying ? { scale: [1, 1.1, 1] } : {}}
        transition={{ duration: 1, repeat: isVerifying ? Infinity : 0 }}
        className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6"
      >
        <Fingerprint className={cn(
          "w-10 h-10",
          isVerifying ? "text-accent" : "text-muted-foreground"
        )} />
      </motion.div>

      <h2 className="text-lg font-semibold text-foreground mb-2">身份验证</h2>
      <p className="text-sm text-muted-foreground text-center mb-8">
        使用生物识别验证您的身份
      </p>

      <Button 
        onClick={handleVerify}
        disabled={isVerifying}
        className="min-w-[200px]"
      >
        {isVerifying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            验证中...
          </>
        ) : (
          <>
            <Fingerprint className="w-4 h-4 mr-2" />
            开始验证
          </>
        )}
      </Button>
    </motion.div>
  );

  // Step 3: Syncing Data
  const renderSyncing = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px]"
    >
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
        className="w-20 h-20 rounded-full border-4 border-accent/20 border-t-accent mb-8"
      />

      <h2 className="text-lg font-semibold text-foreground mb-2">正在同步数据</h2>
      <p className="text-sm text-muted-foreground text-center mb-8">
        请稍候，正在向新设备传输数据...
      </p>

      <div className="w-full max-w-xs mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">同步进度</span>
          <span className="text-sm font-medium text-foreground">{syncProgress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${syncProgress}%` }}
            className="h-full bg-accent rounded-full"
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Check className={cn("w-4 h-4", syncProgress > 25 ? "text-success" : "")} />
          <span>同步密钥分片</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Check className={cn("w-4 h-4", syncProgress > 50 ? "text-success" : "")} />
          <span>同步联系人</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Check className={cn("w-4 h-4", syncProgress > 75 ? "text-success" : "")} />
          <span>同步设置</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Check className={cn("w-4 h-4", syncProgress >= 100 ? "text-success" : "")} />
          <span>完成</span>
        </div>
      </div>
    </motion.div>
  );

  // Step 4: Complete
  const renderComplete = () => (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[400px]"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
      >
        <Check className="w-10 h-10 text-success" />
      </motion.div>

      <h2 className="text-xl font-bold text-foreground mb-2">授权成功</h2>
      <p className="text-sm text-muted-foreground text-center mb-8">
        新设备已成功添加到您的账户
      </p>

      {newDevice && (
        <div className="card-elevated p-4 w-full mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-success" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{newDevice.name}</p>
              <p className="text-xs text-muted-foreground">{newDevice.location}</p>
            </div>
            <Check className="w-5 h-5 text-success" />
          </div>
        </div>
      )}

      <label className="flex items-center gap-3 p-4 bg-muted/30 rounded-xl w-full mb-6 cursor-pointer">
        <Checkbox
          checked={deactivateOld}
          onCheckedChange={(checked) => setDeactivateOld(!!checked)}
        />
        <div>
          <p className="text-sm font-medium text-foreground">停用当前设备</p>
          <p className="text-xs text-muted-foreground">新设备激活后，当前设备将被移除</p>
        </div>
      </label>

      <Button className="w-full" onClick={handleComplete}>
        完成
      </Button>
    </motion.div>
  );

  const renderContent = () => {
    switch (step) {
      case 0: return renderScanStep();
      case 1: return renderDeviceInfo();
      case 2: return renderVerification();
      case 3: return renderSyncing();
      case 4: return renderComplete();
      default: return renderScanStep();
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
              if (step === 0 || step === 4) {
                navigate(-1);
              } else if (step < 3) {
                setStep(step - 1);
              }
            }}
            disabled={step === 3}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">授权新设备</h1>
        </div>

        <div className="flex-1 overflow-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
