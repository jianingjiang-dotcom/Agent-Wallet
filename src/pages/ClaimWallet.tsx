import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertTriangle,
  ChevronLeft, Shield, Key, CloudUpload,
  Bot, Wallet, Eye, EyeOff, Info,
} from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
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
import { Switch } from '@/components/ui/switch';

const steps = [
  { id: 1, title: '确认钱包', icon: Shield, component: 'confirm' },
  { id: 2, title: '密钥生成', icon: Key, component: 'keygen' },
  { id: 3, title: '备份', icon: CloudUpload, component: 'backup' },
];

export default function ClaimWallet() {
  const navigate = useNavigate();
  const location = useLocation();
  const passedClaimInfo = (location.state as { claimInfo?: ClaimWalletInfo })?.claimInfo || null;
  const resumeParam = new URLSearchParams(window.location.search).get('resume');
  const initialStep = resumeParam === 'keygen' ? 2 : resumeParam === 'backup' ? 3 : 1;
  const [currentStep, setCurrentStep] = useState(initialStep);
  const [claimInfo, setClaimInfo] = useState<ClaimWalletInfo | null>(passedClaimInfo);

  const currentComponent = steps[currentStep - 1]?.component;

  const handleStepComplete = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/home');
    }
  };

  const handleBack = () => {
    // Don't allow going back during keygen
    if (currentStep === 2) return;
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
                currentStep === 2 ? 'text-muted-foreground/30' : 'text-muted-foreground'
              )}
              disabled={currentStep === 2}
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
          {currentComponent === 'confirm' && (
            <ConfirmClaimStep
              key="confirm"
              claimInfo={claimInfo}
              onClaimInfoReady={setClaimInfo}
              onComplete={handleStepComplete}
            />
          )}
          {currentComponent === 'keygen' && (
            <KeyShareGenStep
              key="keygen"
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


// ─── Step 1: Code Entry + Confirm Claim ───────────────────
function ConfirmClaimStep({
  claimInfo,
  onClaimInfoReady,
  onComplete,
}: {
  claimInfo: ClaimWalletInfo | null;
  onClaimInfoReady: (info: ClaimWalletInfo) => void;
  onComplete: () => void;
}) {
  const { validateClaimCode, confirmClaim } = useWallet();
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [codeError, setCodeError] = useState('');
  const [showBiometric, setShowBiometric] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleValidate = async () => {
    if (code.length !== 6) { setCodeError('请输入完整的 6 位配对口令'); return; }
    setIsValidating(true);
    setCodeError('');
    try {
      const info = await validateClaimCode(code);
      onClaimInfoReady(info);
    } catch (e: any) {
      setCodeError(e.message || '配对口令验证失败');
    } finally {
      setIsValidating(false);
    }
  };

  const handleVerified = async () => {
    if (!claimInfo) return;
    await confirmClaim(claimInfo.walletId);
    setVerified(true);
  };

  // Success state after biometric verification
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
            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-success" strokeWidth={1.5} />
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

  // Phase 1: Code input (no claimInfo yet)
  if (!claimInfo) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col items-center pt-12 space-y-6"
      >
        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <Key className="w-8 h-8 text-primary" strokeWidth={1.5} />
        </div>
        <div className="text-center">
          <h3 className="font-semibold text-lg">输入配对口令</h3>
          <p className="text-sm text-muted-foreground mt-1">请输入 Agent 提供的 6 位配对口令</p>
        </div>

        <InputOTP maxLength={6} value={code} onChange={(v) => { setCode(v); setCodeError(''); }} disabled={isValidating}>
          <InputOTPGroup className="gap-2.5">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <InputOTPSlot key={i} index={i} className="w-11 h-12 rounded-lg border border-border text-lg font-semibold" />
            ))}
          </InputOTPGroup>
        </InputOTP>

        {codeError && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-1.5 text-destructive text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />{codeError}
          </motion.div>
        )}

        <Button
          size="lg"
          className="w-full gradient-primary"
          onClick={handleValidate}
          disabled={code.length !== 6 || isValidating}
        >
          {isValidating ? '验证中...' : '验证口令'}
        </Button>
      </motion.div>
    );
  }

  // Phase 2: Wallet info confirmation (claimInfo available)
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
          <span className="text-xs font-mono text-primary">{claimInfo.agentId}</span>
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
const keygenStages = [
  { delay: 0, title: '正在连接安全服务器...', sub: '与 Cobo 节点建立加密通道' },
  { delay: 2000, title: '协商密钥参数...', sub: '同步 MPC 计算规则与参与方信息' },
  { delay: 4500, title: '正在生成密钥分片...', sub: '手机端与服务器协同计算中' },
  { delay: 8000, title: '验证密钥分片...', sub: '确认双方分片可正确协同签名' },
  { delay: 12000, title: '正在写入安全存储...', sub: '将密钥分片加密保存至本地' },
];

function KeyShareGenStep({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const { generateKeyShare } = useWallet();
  const navigate = useNavigate();
  const [started, setStarted] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const [stageIndex, setStageIndex] = useState(0);
  const [displayedSub, setDisplayedSub] = useState('');

  const handleStart = () => {
    setStarted(true);
  };

  // Start keygen only after user confirms
  useEffect(() => {
    if (!started) return;

    generateKeyShare()
      .then(() => {
        setDone(true);
      })
      .catch((e) => {
        setError(e.message || '密钥生成失败');
      });
  }, [started]);

  // Stage timer — advance through fake progress stages
  useEffect(() => {
    if (!started || done) return;
    const timers = keygenStages.slice(1).map((stage, i) =>
      setTimeout(() => setStageIndex(i + 1), stage.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [started, done]);

  // Typewriter effect for subtitle
  const currentSub = keygenStages[stageIndex]?.sub || '';
  useEffect(() => {
    if (!started || done) return;
    setDisplayedSub('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedSub(currentSub.slice(0, i));
      if (i >= currentSub.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [stageIndex, started, done, currentSub]);

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

        <div className="pb-8 space-y-3">
          <Button size="lg" className="w-full h-12 text-base font-medium gradient-primary" onClick={handleStart}>
            开始生成
          </Button>
          <button
            className="w-full text-center text-sm text-muted-foreground py-2"
            onClick={() => navigate('/home')}
          >
            稍后再说
          </button>
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
            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-success" strokeWidth={1.5} />
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

      <AnimatePresence mode="wait">
        <motion.p
          key={stageIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-base font-semibold text-foreground"
        >
          {keygenStages[stageIndex]?.title}
        </motion.p>
      </AnimatePresence>

      <p className="text-xs text-muted-foreground mt-2 mb-8 leading-relaxed max-w-[260px] min-h-[1.5em]">
        {displayedSub}
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
          className="inline-block w-px h-3 bg-muted-foreground/50 ml-0.5 align-middle"
        />
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
  const [passkeySetup, setPasskeySetup] = useState(false);
  const [showPasskeyDrawer, setShowPasskeyDrawer] = useState(false);
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
      await completeCloudBackup('icloud', passkeySetup);
      setShowSuccess(true);
    } catch {
      setError('备份失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Success screen ──
  if (showSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col h-full"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', duration: 0.5 }}
            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-success" strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-xl font-bold text-foreground mb-2">备份完成</h2>
          <p className="text-muted-foreground text-sm">您的手机端密钥已加密备份到 iCloud</p>
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6 flex items-start gap-2 px-1"
          >
            <Info className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" strokeWidth={1.5} />
            <p className="text-[11px] text-muted-foreground text-left">
              建议在「设置 → 钱包管理」中额外创建本地备份，双重保障更安心
            </p>
          </motion.div>
        </div>
        <div className="pb-8 px-4">
          <Button size="lg" className="w-full h-12 text-base font-medium gradient-primary" onClick={onComplete}>
            进入钱包
          </Button>
        </div>
      </motion.div>
    );
  }

  // ── Main backup form ──
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 overflow-y-auto pb-4">
        {/* Header */}
        <div className="flex flex-col items-center pt-8 mb-6">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center mb-3"
          >
            <CloudUpload className="w-7 h-7 text-accent" strokeWidth={1.5} />
          </motion.div>
          <h2 className="text-lg font-bold text-foreground mb-1">备份手机端密钥</h2>
          <p className="text-muted-foreground text-[13px] text-center">
            加密备份到 iCloud，防止手机丢失后无法恢复
          </p>
        </div>

        {/* Card 1: Password backup (required) */}
        <div className="bg-card border border-border rounded-2xl p-4 mb-3">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-foreground" strokeWidth={1.5} />
              <span className="text-[14px] font-semibold text-foreground">设置备份密码</span>
            </div>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-destructive/8 text-destructive">必填</span>
          </div>

          <div className="space-y-3">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="设置密码（8-32位，含字母和数字）"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(''); }}
                className="pr-12 h-11"
              />
              <button
                type="button"
                className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="w-4.5 h-4.5" strokeWidth={1.5} /> : <Eye className="w-4.5 h-4.5" strokeWidth={1.5} />}
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
                  'text-[11px] font-medium',
                  passwordStrength.level === 1 && 'text-destructive',
                  passwordStrength.level === 2 && 'text-warning',
                  passwordStrength.level === 3 && 'text-success'
                )}>
                  {passwordStrength.label}
                </span>
              </div>
            )}

            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="确认密码"
              value={confirmPassword}
              onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
              className="h-11"
            />

            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="mt-0.5 rounded border-border"
              />
              <span className="text-[11px] text-muted-foreground leading-relaxed">
                我已牢记密码。如果忘记密码，将无法从备份中恢复钱包。
              </span>
            </label>

            {error && (
              <div className="flex items-center gap-1.5 text-destructive text-[11px]">
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Card 2: Passkey backup (optional) */}
        <div className="border border-border rounded-2xl p-4 bg-muted/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Shield className={cn('w-4 h-4', passkeySetup ? 'text-success' : 'text-foreground')} strokeWidth={1.5} />
              <div>
                <span className="text-[14px] font-semibold text-foreground">Passkey 恢复</span>
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-violet-100 text-violet-700 ml-2">推荐</span>
              </div>
            </div>
            <Switch
              checked={passkeySetup}
              onCheckedChange={(v) => {
                if (v) {
                  setShowPasskeyDrawer(true);
                } else {
                  setPasskeySetup(false);
                }
              }}
            />
          </div>

          <p className="text-[11px] text-muted-foreground mt-2 leading-relaxed">
            忘记密码时的备用恢复方式，通过 Face ID / 指纹创建独立备份，与密码互不依赖
          </p>
        </div>
      </div>

      {/* Bottom actions */}
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

      {/* Passkey setup drawer */}
      <BiometricVerifyDrawer
        open={showPasskeyDrawer}
        onOpenChange={(open) => {
          setShowPasskeyDrawer(open);
        }}
        title="设置 Passkey"
        description="通过 Face ID / 指纹创建独立备份密钥"
        onVerified={() => setPasskeySetup(true)}
      />

      {/* Skip warning */}
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
