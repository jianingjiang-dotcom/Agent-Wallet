import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Link2, CheckCircle2, AlertTriangle, Clipboard,
  ChevronLeft, Shield, Sparkles, Key, CloudUpload,
  Bot, Clock, Wallet, Eye, EyeOff, Info, HelpCircle, ChevronDown,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { ClaimWalletInfo, Wallet as WalletType } from '@/types/wallet';
import { toast } from '@/lib/toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { BiometricVerifyDrawer } from '@/components/BiometricVerifyDrawer';

const steps = [
  { id: 1, title: '输入认领码', icon: Link2, component: 'code-input' },
  { id: 2, title: '确认钱包', icon: Shield, component: 'confirm' },
  { id: 3, title: '密钥生成', icon: Key, component: 'keygen' },
  { id: 4, title: '备份', icon: CloudUpload, component: 'backup' },
];

export default function ClaimWallet() {
  const [currentStep, setCurrentStep] = useState(1);
  const [claimInfo, setClaimInfo] = useState<ClaimWalletInfo | null>(null);
  const navigate = useNavigate();

  const currentComponent = steps[currentStep - 1]?.component;

  const handleStepComplete = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/home');
    }
  };

  const handleBack = () => {
    // Don't allow going back during keygen or after completion
    if (currentStep === 3) return;
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className={cn(
                'p-1 -ml-1 transition-colors',
                currentStep === 3 ? 'text-muted-foreground/30' : 'text-muted-foreground'
              )}
              disabled={currentStep === 3}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-sm text-muted-foreground">
              步骤 {currentStep} / {steps.length}
            </span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {steps[currentStep - 1].title}
          </span>
        </div>

        {/* Step indicators */}
        <div className="flex items-center mt-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isComplete = currentStep > step.id;
            const isCurrent = currentStep === step.id;

            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0',
                    isComplete && 'bg-success text-success-foreground',
                    isCurrent && 'bg-accent text-accent-foreground',
                    !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {<Icon className="w-4 h-4" />}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5',
                      currentStep > step.id ? 'bg-success' : 'bg-muted'
                    )}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="flex-1 px-4 overflow-auto">
        <AnimatePresence mode="wait">
          {currentComponent === 'code-input' && (
            <ClaimCodeStep
              key="code-input"
              onComplete={(info) => {
                setClaimInfo(info);
                handleStepComplete();
              }}
            />
          )}
          {currentComponent === 'confirm' && claimInfo && (
            <ConfirmClaimStep
              key="confirm"
              claimInfo={claimInfo}
              onComplete={handleStepComplete}
            />
          )}
          {currentComponent === 'keygen' && (
            <KeyShareGenStep
              key="keygen"
              claimCode={claimInfo?.walletId || ''}
              onComplete={() => handleStepComplete()}
            />
          )}
          {currentComponent === 'backup' && (
            <BackupStep
              key="backup"
              onComplete={handleStepComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ─── Shared: Expandable help for claim code ────────────────
function ClaimCodeHelp() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        className="flex items-center justify-center gap-1 text-xs text-primary mx-auto py-1"
        onClick={() => setOpen(!open)}
      >
        <HelpCircle className="w-3.5 h-3.5" />
        认领码从哪来？
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="w-3.5 h-3.5" />
        </motion.div>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="mt-1 p-3 bg-muted/50 rounded-xl text-xs leading-relaxed space-y-2">
              <p className="font-medium text-foreground">在 Agent 环境执行以下指令</p>
              <div className="relative">
                <pre className="bg-background rounded-lg p-2.5 pr-9 text-[11px] font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">npx skills add cobosteven/cobo-agent-wallet-manual --skill cobo-agentic-wallet-sandbox --yes --global</pre>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText('npx skills add cobosteven/cobo-agent-wallet-manual --skill cobo-agentic-wallet-sandbox --yes --global');
                    toast.success('已复制');
                  }}
                  className="absolute right-1.5 top-1.5 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Step 1: Enter Claim Code ──────────────────────────────
function ClaimCodeStep({
  onComplete,
}: {
  onComplete: (info: ClaimWalletInfo) => void;
}) {
  const { validateClaimCode } = useWallet();
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setCode(text.trim());
      setError('');
    } catch {
      toast.error('无法访问剪贴板');
    }
  };

  const handleValidate = async () => {
    if (!code.trim()) {
      setError('请输入认领码');
      return;
    }
    setIsValidating(true);
    setError('');
    try {
      const info = await validateClaimCode(code);
      onComplete(info);
    } catch (e: any) {
      setError(e.message || '认领码验证失败');
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5 pt-6"
    >
      <div className="flex flex-col items-center mb-2">
        <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
          <Link2 className="w-10 h-10 text-accent" />
        </div>
        <h3 className="font-semibold text-lg text-center">输入认领码</h3>
        <p className="text-sm text-muted-foreground text-center mt-1">
          输入 AI 助手提供的认领码
        </p>
      </div>

      <div className="space-y-2">
        <div>
          <Input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError('');
            }}
            placeholder="CAW-XXXXX"
            className="h-12 font-mono text-sm tracking-wider text-center"
            maxLength={9}
          />
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-destructive text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
        <ClaimCodeHelp />
      </div>

      <Button
        onClick={handleValidate}
        disabled={!code.trim() || isValidating}
        className="w-full gradient-primary"
        size="lg"
      >
        {isValidating ? '验证中...' : '验证认领码'}
      </Button>
    </motion.div>
  );
}

// ─── Step 2: Confirm Claim ─────────────────────────────────
function ConfirmClaimStep({
  claimInfo,
  onComplete,
}: {
  claimInfo: ClaimWalletInfo;
  onComplete: () => void;
}) {
  const [showBiometric, setShowBiometric] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleVerified = () => {
    setVerified(true);
  };

  if (verified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground mb-2">认领确认成功</h2>
          <p className="text-muted-foreground text-sm">身份验证通过，接下来为您生成安全密钥</p>
        </div>
        <div className="pb-8 px-4">
          <Button size="lg" className="w-full h-12 text-base font-medium" onClick={onComplete}>
            继续
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5 pt-6"
    >
      <div className="flex flex-col items-center mb-2">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <Wallet className="w-10 h-10 text-success" />
        </div>
        <h3 className="font-semibold text-lg text-center">确认钱包信息</h3>
        <p className="text-sm text-muted-foreground text-center mt-1">
          请确认您要认领的钱包
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">钱包名称</span>
          <span className="text-sm font-medium text-foreground">{claimInfo.walletName}</span>
        </div>
        <div className="border-t border-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">当前余额</span>
          <span className="text-sm font-medium text-foreground">${claimInfo.balance.toLocaleString()}</span>
        </div>
        <div className="border-t border-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">支持的链</span>
          <div className="flex gap-1.5">
            {claimInfo.chains.map(chain => (
              <span key={chain} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {chain}
              </span>
            ))}
          </div>
        </div>
        <div className="border-t border-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">当前管理者</span>
          <span className="text-xs font-mono text-purple-600 dark:text-purple-400">{claimInfo.agentId}</span>
        </div>
      </div>

      <div className="bg-accent/5 border border-accent/20 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <Info className="w-4 h-4 text-accent shrink-0 mt-0.5" />
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">认领后：</p>
            <p>- 您将拥有这个钱包的 <span className="text-foreground font-medium">最终控制权</span></p>
            <p>- AI 助手将在您设定的 <span className="text-foreground font-medium">规则内</span> 操作钱包</p>
            <p>- 手机会生成专属安全密钥，保护您的资产</p>
          </div>
        </div>
      </div>

      <Button onClick={() => setShowBiometric(true)} className="w-full gradient-primary" size="lg">
        确认认领
      </Button>

      <BiometricVerifyDrawer
        open={showBiometric}
        onOpenChange={setShowBiometric}
        title="确认认领钱包"
        description="请验证身份以完成钱包认领"
        onVerified={handleVerified}
      />
    </motion.div>
  );
}

// ─── Step 3: KeyShare Generation ───────────────────────────
function KeyShareGenStep({
  claimCode,
  onComplete,
}: {
  claimCode: string;
  onComplete: () => void;
}) {
  const { claimWallet } = useWallet();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const handleStart = () => {
    setStarted(true);
  };

  // Start keygen only after user confirms
  useEffect(() => {
    if (!started) return;

    claimWallet(claimCode)
      .then(() => {
        setDone(true);
      })
      .catch((e) => {
        setError(e.message || '密钥生成失败');
      });
  }, [started]);

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col h-full items-center justify-center text-center"
      >
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-destructive" />
        </div>
        <h3 className="font-semibold text-lg mb-2">密钥生成失败</h3>
        <p className="text-sm text-muted-foreground mb-6">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()}>
          重试
        </Button>
      </motion.div>
    );
  }

  // Intro screen - explain why MPC keygen is needed
  if (!started) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col h-full"
      >
        <div className="flex-1 flex flex-col items-center pt-10">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6"
          >
            <Key className="w-10 h-10 text-accent" />
          </motion.div>

          <h2 className="text-xl font-bold text-foreground mb-2">生成安全密钥</h2>
          <p className="text-sm text-muted-foreground text-center mb-8 px-2">
            为了保护您的资产，需要在手机上生成专属密钥
          </p>

          {/* MPC explanation cards */}
          <div className="w-full space-y-3">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                <Shield className="w-4 h-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">双重保护</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  密钥分为两部分：一部分在您的手机，一部分由 Cobo 保管。两者配合才能操作钱包。
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center shrink-0 mt-0.5">
                <CheckCircle2 className="w-4 h-4 text-success" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">您掌握主动权</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  手机上的密钥由您独自持有。没有您的确认，任何人（包括 AI 助手和 Cobo）都无法转移您的资产。
                </p>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="pb-8">
          <Button size="lg" className="w-full h-12 text-base font-medium gradient-primary" onClick={handleStart}>
            开始生成
          </Button>
        </div>
      </motion.div>
    );
  }

  // Success state — user clicks continue to proceed to backup
  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.2, 1] }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground mb-2">安全密钥生成完毕</h2>
          <p className="text-muted-foreground text-sm">您的手机端密钥已就绪，建议立即备份以防丢失</p>
        </div>
        <div className="pb-8 px-4">
          <Button size="lg" className="w-full h-12 text-base font-medium" onClick={onComplete}>
            继续
          </Button>
        </div>
      </motion.div>
    );
  }

  // Generation animation
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col h-full items-center justify-center text-center px-6"
    >
      {/* Orbital animation */}
      <div className="relative w-40 h-40 mb-10">
        {/* Outer pulse ring */}
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-accent/20"
          animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.1, 0.3] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
        />
        {/* Rotating arc */}
        <svg
          className="absolute inset-0 w-full h-full animate-spin"
          style={{ animationDuration: '4s', animationTimingFunction: 'linear' }}
          viewBox="0 0 160 160"
        >
          <circle
            cx="80" cy="80" r="72"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeDasharray="120 452"
            className="text-accent"
          />
        </svg>
        {/* Secondary orbit */}
        <svg
          className="absolute inset-0 w-full h-full"
          style={{ animation: 'spin 8s linear infinite reverse' }}
          viewBox="0 0 160 160"
        >
          <circle
            cx="80" cy="80" r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="1"
            strokeLinecap="round"
            strokeDasharray="40 200"
            className="text-accent/25"
          />
        </svg>
        {/* Center icon with breathing glow */}
        <div className="absolute inset-0 flex items-center justify-center">
          <motion.div
            className="relative"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <motion.div
              className="absolute -inset-4 rounded-full bg-accent/10 blur-xl"
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            />
            <div className="relative w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
              <Key className="w-8 h-8 text-accent" />
            </div>
          </motion.div>
        </div>
      </div>

      <p className="text-base font-semibold text-foreground">
        正在生成安全密钥...
      </p>

      <p className="text-xs text-muted-foreground mt-2 mb-8 leading-relaxed max-w-[260px]">
        密钥生成需要手机与服务器协同计算，可能需要一些时间，请勿关闭页面
      </p>
    </motion.div>
  );
}

// ─── Step 4: Backup ────────────────────────────────────────
function BackupStep({ onComplete }: { onComplete: () => void }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const { completeCloudBackup } = useWallet();

  const getPasswordStrength = (pwd: string): { level: 0 | 1 | 2 | 3; label: string; color: string } => {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 8) score++;
    if (pwd.length >= 12) score++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^a-zA-Z0-9]/.test(pwd)) score++;
    if (score <= 2) return { level: 1, label: '弱', color: 'bg-destructive' };
    if (score <= 3) return { level: 2, label: '中', color: 'bg-warning' };
    return { level: 3, label: '强', color: 'bg-success' };
  };

  const passwordStrength = getPasswordStrength(password);

  const validatePassword = () => {
    if (password.length < 8 || password.length > 32) return '密码需要 8-32 位';
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return '密码必须包含字母和数字';
    if (password !== confirmPassword) return '两次输入的密码不一致';
    return null;
  };

  const handleBackup = async () => {
    const validationError = validatePassword();
    if (validationError) { setError(validationError); return; }
    if (!confirmed) { setError('请勾选确认已牢记密码'); return; }

    setIsLoading(true);
    try {
      await completeCloudBackup('icloud', password);
      setShowSuccess(true);
    } catch {
      setError('备份失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex flex-col h-full"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-emerald-500" strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground mb-2">备份完成</h2>
          <p className="text-muted-foreground text-sm">您的手机端密钥已加密备份到 iCloud</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 p-3 bg-muted/50 rounded-xl flex items-start gap-2"
          >
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground text-left">
              建议在「设置 → 钱包管理」中额外创建本地备份，双重保障更安心
            </p>
          </motion.div>
        </div>
        <div className="pb-8">
          <Button size="lg" className="w-full h-12 text-base font-medium gradient-primary" onClick={onComplete}>
            进入钱包
          </Button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 flex flex-col items-center pt-10">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4"
        >
          <CloudUpload className="w-8 h-8 text-accent" strokeWidth={1.5} />
        </motion.div>

        <h2 className="text-xl font-bold text-foreground mb-2">备份手机端密钥</h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          加密备份到 iCloud，防止手机丢失后无法恢复
        </p>

        <div className="w-full space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="设置密码（8-32位，含字母和数字）"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="pr-12"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
              </button>
            </div>

            {password && (
              <div className="flex items-center gap-2">
                <div className="flex gap-1 flex-1">
                  {[1, 2, 3].map((level) => (
                    <div
                      key={level}
                      className={cn(
                        'h-1.5 flex-1 rounded-full transition-all',
                        passwordStrength.level >= level ? passwordStrength.color : 'bg-muted'
                      )}
                    />
                  ))}
                </div>
                <span className={cn(
                  'text-xs font-medium',
                  passwordStrength.level === 1 && 'text-destructive',
                  passwordStrength.level === 2 && 'text-warning',
                  passwordStrength.level === 3 && 'text-success'
                )}>
                  {passwordStrength.label}
                </span>
              </div>
            )}
          </div>

          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="确认密码"
            value={confirmPassword}
            onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
          />

          <label className="flex items-start gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1 rounded border-border"
            />
            <span className="text-xs text-muted-foreground">
              我已牢记密码。如果忘记密码，将无法从备份中恢复钱包。
            </span>
          </label>

          {error && (
            <div className="flex items-center gap-1.5 text-destructive text-xs">
              <AlertTriangle className="w-3.5 h-3.5" />
              {error}
            </div>
          )}
        </div>
      </div>

      <div className="pb-8 space-y-3">
        <Button
          size="lg"
          className="w-full h-12 text-base font-medium"
          onClick={handleBackup}
          disabled={isLoading || !confirmed}
        >
          {isLoading ? '备份中...' : '开始备份'}
        </Button>
        <button
          className="w-full text-center text-sm text-muted-foreground py-2"
          onClick={() => setShowSkipWarning(true)}
        >
          稍后再备份
        </button>
      </div>

      <AlertDialog open={showSkipWarning} onOpenChange={setShowSkipWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确定跳过备份？</AlertDialogTitle>
            <AlertDialogDescription>
              手机端密钥是您控制钱包的凭证。如果不备份，手机丢失或损坏时将无法恢复钱包控制权。建议尽快完成备份。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>返回备份</AlertDialogCancel>
            <AlertDialogAction onClick={onComplete}>
              确定跳过
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}
