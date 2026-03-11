import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, Key, Fingerprint, Check, Copy,
  AlertTriangle, CheckCircle2, Eye, EyeOff,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { cn, copyToClipboard } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useWallet } from '@/contexts/WalletContext';

// Mock private key for demo
const MOCK_PRIVATE_KEY = '0x3a5f8c2d1e9b7a4f6c3d2e1f0a8b9c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b';

export default function ExportPrivateKeyPage() {
  const navigate = useNavigate();
  const { id: walletId } = useParams();
  const { wallets } = useWallet();
  const wallet = wallets.find(w => w.id === walletId);

  const [step, setStep] = useState(0);
  const [isBioLoading, setIsBioLoading] = useState(false);
  const [synthesisProgress, setSynthesisProgress] = useState(0);
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Step 0: Biometric verification
  const handleBiometricAuth = async () => {
    setIsBioLoading(true);
    // Simulate biometric authentication
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsBioLoading(false);
    setStep(1);
    // Start key synthesis animation
    startSynthesis();
  };

  // Step 1: Key synthesis animation
  const startSynthesis = () => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += 10;
      setSynthesisProgress(progress);
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep(2), 500);
      }
    }, 500);
  };

  // Step 2: Copy private key
  const handleCopyKey = async () => {
    const ok = await copyToClipboard(MOCK_PRIVATE_KEY);
    if (ok) {
      setCopied(true);
      toast.success('已复制到剪贴板');
      setTimeout(() => setCopied(false), 3000);
    } else {
      toast.error('复制失败，请手动复制');
    }
  };

  const handleComplete = () => {
    navigate(-1);
  };

  // ─── Step 0: Biometric Verification ───
  const renderBiometricStep = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px]"
    >
      <motion.div
        animate={isBioLoading ? { scale: [1, 1.1, 1] } : {}}
        transition={isBioLoading ? { duration: 1, repeat: Infinity } : {}}
        className={cn(
          'w-24 h-24 rounded-full flex items-center justify-center mb-8',
          isBioLoading ? 'bg-accent/20' : 'bg-accent/10'
        )}
      >
        <Fingerprint
          className={cn(
            'w-12 h-12',
            isBioLoading ? 'text-accent animate-pulse' : 'text-accent'
          )}
        />
      </motion.div>

      <h2 className="text-lg font-semibold text-foreground mb-2">请验证身份</h2>
      <p className="text-sm text-muted-foreground text-center mb-8">
        导出私钥前需进行生物识别验证
      </p>

      <Button
        className="w-full max-w-xs"
        onClick={handleBiometricAuth}
        disabled={isBioLoading}
      >
        <Fingerprint className="w-4 h-4 mr-2" />
        {isBioLoading ? '验证中...' : '开始验证'}
      </Button>
    </motion.div>
  );

  // ─── Step 1: Key Synthesis Animation ───
  const renderSynthesis = () => (
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

      <h2 className="text-lg font-semibold text-foreground mb-2">正在准备私钥</h2>
      <p className="text-sm text-muted-foreground text-center mb-8">
        请勿关闭此页面
      </p>

      <div className="w-full max-w-xs mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">合成进度</span>
          <span className="text-sm font-medium text-foreground">{synthesisProgress}%</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${synthesisProgress}%` }}
            className="h-full bg-accent rounded-full"
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {[
          { label: '获取本地密钥分片', threshold: 20 },
          { label: '验证分片完整性', threshold: 40 },
          { label: '请求服务器分片', threshold: 60 },
          { label: '合成完整私钥', threshold: 80 },
          { label: '完成', threshold: 100 },
        ].map(({ label, threshold }) => (
          <div key={label} className="flex items-center gap-2 text-muted-foreground">
            <Check className={cn('w-4 h-4', synthesisProgress >= threshold ? 'text-success' : '')} />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );

  // ─── Step 2: Show Private Key ───
  const renderShowKey = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', delay: 0.1 }}
          className="w-16 h-16 rounded-full bg-accent/10 mx-auto mb-4 flex items-center justify-center"
        >
          <Key className="w-8 h-8 text-accent" />
        </motion.div>
        <h2 className="text-lg font-semibold text-foreground mb-1">您的私钥</h2>
        <p className="text-sm text-muted-foreground">
          {wallet?.name || '我的钱包'}
        </p>
      </div>

      {/* Security Warning */}
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-destructive/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-destructive" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-destructive mb-1.5">请务必妥善保管</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• 切勿将私钥分享给任何人</li>
              <li>• 任何获得私钥的人可完全控制您的资产</li>
              <li>• 建议抄写到纸上并离线保存</li>
              <li>• 请勿截屏或复制到不安全的地方</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Private Key Display */}
      <div className="relative">
        <div
          className={cn(
            'p-4 rounded-xl border border-border bg-muted/50 font-mono text-sm break-all leading-relaxed transition-all',
            !showKey && 'select-none'
          )}
        >
          {showKey ? (
            MOCK_PRIVATE_KEY
          ) : (
            <span className="blur-sm pointer-events-none select-none">
              {MOCK_PRIVATE_KEY}
            </span>
          )}
        </div>

        {/* Toggle visibility */}
        <button
          onClick={() => setShowKey(!showKey)}
          className="absolute top-3 right-3 p-1.5 rounded-md bg-background/80 hover:bg-muted transition-colors"
        >
          {showKey ? (
            <EyeOff className="w-4 h-4 text-muted-foreground" />
          ) : (
            <Eye className="w-4 h-4 text-muted-foreground" />
          )}
        </button>
      </div>

      {/* Copy Button */}
      <Button
        variant="outline"
        className="w-full"
        onClick={handleCopyKey}
      >
        {copied ? (
          <>
            <CheckCircle2 className="w-4 h-4 mr-2 text-success" />
            已复制
          </>
        ) : (
          <>
            <Copy className="w-4 h-4 mr-2" />
            复制私钥
          </>
        )}
      </Button>

      {/* Complete Button */}
      <Button className="w-full" onClick={handleComplete}>
        完成
      </Button>
    </motion.div>
  );

  const renderContent = () => {
    switch (step) {
      case 0: return renderBiometricStep();
      case 1: return renderSynthesis();
      case 2: return renderShowKey();
      default: return renderBiometricStep();
    }
  };

  if (!wallet) {
    return (
      <AppLayout showNav={false}>
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">钱包不存在</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNav={false}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              if (step === 0) {
                navigate(-1);
              }
            }}
            disabled={step > 0}
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <h1 className="text-lg font-bold text-foreground">导出私钥</h1>
        </div>

        {/* Progress indicator (shown for steps 1-2) */}
        {step > 0 && (
          <div className="px-4 py-2">
            <div className="flex items-center gap-2">
              {[1, 2].map(s => (
                <div
                  key={s}
                  className={cn(
                    'flex-1 h-1 rounded-full transition-colors',
                    s <= step ? 'bg-accent' : 'bg-muted'
                  )}
                />
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-auto px-4 py-6">
          <AnimatePresence mode="wait">
            {renderContent()}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}
