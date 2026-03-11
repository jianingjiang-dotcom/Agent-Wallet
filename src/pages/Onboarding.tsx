/**
 * ============================================================================
 * ONBOARDING FLOW - 新用户引导流程（Mode 1: 用户创建钱包）
 * ============================================================================
 *
 * 完整的新用户 Onboarding 流程涉及以下页面：
 *
 * 1. Welcome.tsx        - 欢迎页面（可选入口）
 * 2. Login.tsx          - 登录页面（手机/邮箱验证码 或 密码登录）
 * 3. SetPassword.tsx    - 设置密码页面（新用户强制，?onboarding=true 时不可跳过）
 * 4. ModeSelection.tsx  - 钱包模式选择（创建钱包 / 关联 Agent 钱包）
 * 5. Onboarding.tsx     - 本文件（Mode 1 路径），包含以下步骤：
 *    - Step 1: 安全授权 (SystemAuthStep) - 授权使用系统安全认证
 *    - Step 2: 创建钱包 (CreateWalletStep) - 创建安全账户
 *    - Step 3: 云端备份 (CloudBackupStep) - 备份到 iCloud
 *    （Mode 2 路径走 LinkAgentWallet.tsx，不经过本文件）
 * 6. Home.tsx           - 钱包首页（流程完成后进入）
 *
 * 流程图：
 *                                                   ┌─────────────┐
 *                                              ┌──> │ Onboarding  │ ──┐
 * ┌─────────┐    ┌───────┐    ┌─────────────┐  │    └─────────────┘   │   ┌──────┐
 * │ Welcome │ -> │ Login │ -> │ SetPassword │ -+-> ModeSelection      +-> │ Home │
 * └─────────┘    └───────┘    └─────────────┘  │                      │   └──────┘
 *                (new=true)   (强制设置密码)     │    ┌────────────────┐│
 *                                              └──> │LinkAgentWallet │┘
 *                                                   └────────────────┘
 *
 * 关键参数：
 * - ?new=true       : 标识新用户流程
 * - ?onboarding=true: 标识 onboarding 强制流程（密码设置页使用）
 * - ?recover=true   : 恢复模式（非 onboarding）
 *
 * 注意事项：
 * - 新用户在 Login 成功后会导航到 /set-password?onboarding=true
 * - SetPassword 完成后导航到 /mode-selection（跳过密码时直接到 /onboarding?new=true）
 * - ModeSelection 选择「创建钱包」进入 /onboarding?new=true，选择「关联 Agent 钱包」进入 /link-agent-wallet
 * - Onboarding 完成后导航到 /home
 * - 新用户在 Onboarding 第一步返回会回到 SetPassword
 * ============================================================================
 */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Shield, Fingerprint, Lock, CloudUpload, CloudDownload,
  CheckCircle2, Loader2, ChevronRight, Eye, EyeOff,
  AlertTriangle, Smartphone, QrCode, FileDown, ArrowLeft,
  Cloud, HardDrive, Upload, Info, Bot, Server, FileKey,
  ClipboardList, PauseCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
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
import { HumanAgentListPanel } from '@/components/HumanAgentListPanel';
import { DelegateAgentFlowDrawer } from '@/components/DelegateAgentFlowDrawer';
import { HumanAgent } from '@/types/wallet';

// Create wallet steps - optimized to 3 steps
const createSteps = [
  { id: 1, title: '安全授权', icon: Fingerprint },
  { id: 2, title: '创建钱包', icon: Shield },
  { id: 3, title: '云端备份', icon: CloudUpload },
  { id: 4, title: 'Agent 连接', icon: Bot },
];

// Recovery steps
const recoverySteps = [
  { id: 1, title: '选择方式', icon: CloudDownload },
  { id: 2, title: '恢复数据', icon: Shield },
  { id: 3, title: '安全验证', icon: Fingerprint },
  { id: 4, title: '完成恢复', icon: CheckCircle2 },
];

export default function OnboardingPage() {
  const [searchParams] = useSearchParams();
  const isRecoveryMode = searchParams.get('recover') === 'true';
  const isNewUser = searchParams.get('new') === 'true';
  
  const [currentStep, setCurrentStep] = useState(1);
  const [backupComplete, setBackupComplete] = useState(false);
  const navigate = useNavigate();
  const { 
    enableBiometric, setPin, createWallet, 
    completeCloudBackup, hasBiometric, hasPin 
  } = useWallet();

  const steps = isRecoveryMode ? recoverySteps : createSteps;
  const progress = (currentStep / steps.length) * 100;

  const handleStepComplete = async () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      navigate('/home');
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else if (isNewUser) {
      // New users at step 1: navigate back to set-password page (part of onboarding flow)
      navigate('/set-password?onboarding=true');
    } else {
      navigate('/home');
    }
  };

  return (
    <div className="h-full bg-background flex flex-col pt-7">
      {/* Progress Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            步骤 {currentStep} / {steps.length}
          </span>
          <span className="text-sm font-medium text-foreground">
            {steps[currentStep - 1].title}
          </span>
        </div>
        
        {/* Step indicators with connected lines */}
        <div className="flex items-center mt-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            // Mark step as complete if we've passed it, or if it's the backup step and backup is done
            const isComplete = currentStep > step.id || (step.id === 3 && backupComplete);
            const isCurrent = currentStep === step.id && !(step.id === 3 && backupComplete);
            
            return (
              <div key={step.id} className="flex items-center flex-1 last:flex-none">
                <div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0',
                    isComplete && 'bg-success text-success-foreground',
                    isCurrent && 'bg-accent text-accent-foreground',
                    !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  {isComplete ? (
                    <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
                  ) : (
                    <Icon className="w-5 h-5" strokeWidth={1.5} />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5 mx-2',
                      currentStep > step.id ? 'bg-success' : 'bg-border'
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
          {isRecoveryMode ? (
            // Recovery Flow
            <>
              {currentStep === 1 && (
                <RecoveryMethodStep key="method" onComplete={handleStepComplete} />
              )}
              {currentStep === 2 && (
                <RecoveryDataStep key="data" onComplete={handleStepComplete} />
              )}
              {currentStep === 3 && (
                <RecoveryVerifyStep key="verify" onComplete={handleStepComplete} />
              )}
              {currentStep === 4 && (
                <RecoveryCompleteStep key="complete" onComplete={handleStepComplete} />
              )}
            </>
          ) : (
            // Create Wallet Flow - Optimized to 3 steps
            <>
              {currentStep === 1 && (
                <SystemAuthStep key="auth" onComplete={handleStepComplete} />
              )}
              {currentStep === 2 && (
                <CreateWalletStep key="create" onComplete={handleStepComplete} />
              )}
              {currentStep === 3 && (
                <CloudBackupStep
                  key="backup"
                  onComplete={handleStepComplete}
                  onBackupSuccess={() => setBackupComplete(true)}
                />
              )}
              {currentStep === 4 && (
                <AgentSetupStep
                  key="agent"
                  onComplete={handleStepComplete}
                />
              )}
            </>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// ==================== CREATE WALLET FLOW ====================

// Step 1: System Authentication Authorization (merged Biometric + PIN)
function SystemAuthStep({ onComplete }: { onComplete: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { enableBiometric } = useWallet();
  const navigate = useNavigate();

  // Simulate checking if device has security enabled
  const checkDeviceSecurity = async (): Promise<boolean> => {
    // In real implementation, this would check:
    // iOS: LAContext.canEvaluatePolicy(.deviceOwnerAuthentication)
    // Android: KeyguardManager.isDeviceSecure()
    // For demo, we'll simulate success (return true)
    // Change to false to test the security-required page
    return true;
  };

  const handleAuthorize = async () => {
    setIsLoading(true);
    try {
      // First check if device has security enabled
      const hasDeviceSecurity = await checkDeviceSecurity();
      
      if (!hasDeviceSecurity) {
        // Navigate to security required page
        navigate('/security-required');
        return;
      }

      // Call system authentication API (simulated)
      // In real scenario, this triggers Face ID / Fingerprint / Device Passcode
      await enableBiometric();
      onComplete();
    } catch (error) {
      console.error('Authorization failed:', error);
      // If auth fails due to no security setup, redirect
      navigate('/security-required');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6"
        >
          <Fingerprint className="w-10 h-10 text-accent" strokeWidth={1.5} />
        </motion.div>
        
        <h2 className="text-xl font-bold text-foreground mb-2">
          授权使用系统安全认证
        </h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          使用面容ID / 指纹 / 设备密码保护您的资产安全
        </p>
      </div>

      <div className="pb-8">
          <Button
          size="lg"
          className="w-full h-12 text-base font-medium"
          onClick={handleAuthorize}
          disabled={isLoading}
        >
          {isLoading ? '授权中...' : '授权安全认证'}
        </Button>
      </div>
    </motion.div>
  );
}

// Step 2: Create Wallet
function CreateWalletStep({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState(0);
  const { createWallet } = useWallet();

  const phases = [
    '正在为您创建安全账户…',
    '正在完成安全初始化…',
    '即将完成…'
  ];

  useEffect(() => {
    const createAndAnimate = async () => {
      const phaseInterval = setInterval(() => {
        setPhase(p => Math.min(p + 1, phases.length - 1));
      }, 1000);

      try {
        await createWallet('主钱包');
        clearInterval(phaseInterval);
        setPhase(phases.length - 1);
        setTimeout(onComplete, 500);
      } catch (error) {
        clearInterval(phaseInterval);
        console.error('Create wallet failed:', error);
      }
    };

    createAndAnimate();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full items-center justify-center text-center"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
        className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-6"
      >
        <Shield className="w-12 h-12 text-accent" strokeWidth={1.5} />
      </motion.div>
      
      <AnimatePresence mode="wait">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="text-lg font-medium text-foreground"
        >
          {phases[phase]}
        </motion.p>
      </AnimatePresence>

      <div className="flex gap-2 mt-6">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ 
              scale: phase >= i ? [1, 1.2, 1] : 1,
              opacity: phase >= i ? 1 : 0.3
            }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            className="w-2 h-2 rounded-full bg-accent"
          />
        ))}
      </div>

      {/* Warning message - toast style notification matching "请务必牢记密码" style */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 25 }}
        className="absolute top-4 left-4 right-4 p-4 bg-warning-surface border border-warning/30 rounded-xl"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-4 h-4 text-warning" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-sm font-medium text-foreground">
              创建过程中请勿关闭 App
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              关闭可能导致创建失败
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Step 3: Cloud Backup Only (simplified - iCloud only for Apple ecosystem)
function CloudBackupStep({ onComplete, onBackupSuccess }: { onComplete: () => void; onBackupSuccess?: () => void }) {
  const [showSuccess, setShowSuccess] = useState(false);
  const [showSkipWarning, setShowSkipWarning] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const { completeCloudBackup } = useWallet();

  // Password strength calculation
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
    if (password.length < 8 || password.length > 32) {
      return '密码需要 8-32 位';
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      return '密码必须包含字母和数字';
    }
    if (password !== confirmPassword) {
      return '两次输入的密码不一致';
    }
    return null;
  };

  const handleBackup = async () => {
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!confirmed) {
      setError('请勾选确认已牢记密码');
      return;
    }

    setIsLoading(true);
    try {
      await completeCloudBackup('icloud', password);
      setShowSuccess(true);
      onBackupSuccess?.();
    } catch (error) {
      setError('备份失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkipClick = () => {
    setShowSkipWarning(true);
  };

  const handleConfirmSkip = () => {
    setShowSkipWarning(false);
    onComplete();
  };

  // Success screen after backup
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
            transition={{ type: "spring", duration: 0.5 }}
            className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
          >
            <CheckCircle2 className="w-10 h-10 text-success" strokeWidth={1.5} />
          </motion.div>
          
          <h2 className="text-xl font-bold text-foreground mb-2">
            备份完成
          </h2>
          <p className="text-muted-foreground text-sm">
            您的钱包已安全备份到 iCloud
          </p>

          {/* Local backup tip */}
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
          <Button
            size="lg"
            className="w-full h-12 text-base font-medium"
            onClick={onComplete}
          >
            继续
          </Button>
        </div>
      </motion.div>
    );
  }

  // Main backup screen - directly show password form (no provider selection needed)
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 flex flex-col items-center pt-10">
        {/* iCloud indicator */}
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4"
        >
          <CloudUpload className="w-8 h-8 text-accent" strokeWidth={1.5} />
        </motion.div>
        
        <h2 className="text-xl font-bold text-foreground mb-2">
          备份到 iCloud
        </h2>
        <p className="text-muted-foreground text-sm text-center mb-6">
          设置密码加密您的备份，用于换机恢复
        </p>

        {/* Password form */}
        <div className="w-full space-y-4">
          <div className="space-y-2">
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder="设置密码（8-32位，含字母和数字）"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
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
            
            {/* Password strength indicator */}
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
            placeholder="再次确认密码"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value);
              setError('');
            }}
            className=""
          />

          {/* Password warning banner */}
          <div className="p-4 bg-warning-surface border border-warning/30 rounded-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4 text-warning" strokeWidth={1.5} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium text-foreground">
                  请务必牢记此密码
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  密码用于加密您的备份文件，一旦遗忘将<span className="text-warning font-medium">无法找回</span>，也无法恢复您的钱包资产
                </p>
              </div>
            </div>
          </div>

          <label className="flex items-center gap-3 p-4 bg-muted/50 rounded-xl cursor-pointer">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="w-5 h-5 accent-accent rounded checkbox-thin"
            />
            <span className="text-sm text-foreground">
              我已保存密码，理解密码无法找回
            </span>
          </label>

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
              {error}
            </p>
          )}

        </div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="px-4 pb-8 space-y-3">
        <Button
          size="lg"
          className="w-full h-12 text-base font-medium"
          onClick={handleBackup}
          disabled={isLoading || !password || !confirmPassword || !confirmed}
        >
          {isLoading ? '备份中...' : '备份到 iCloud'}
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full h-12 text-base text-muted-foreground"
          onClick={handleSkipClick}
        >
          稍后备份
        </Button>
      </div>

      {/* Skip Warning Dialog */}
      <AlertDialog open={showSkipWarning} onOpenChange={setShowSkipWarning}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <div className="flex items-center gap-2 text-warning mb-2">
              <AlertTriangle className="w-5 h-5" strokeWidth={1.5} />
              <AlertDialogTitle>确定要跳过备份吗？</AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-3">
                <p className="text-foreground font-medium">不完成备份将导致：</p>
                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                  <li>转账功能被严格限制</li>
                  <li>手机丢失或损坏时无法找回资产</li>
                  <li>无法在新设备上恢复钱包</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              我再想想
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-muted text-muted-foreground hover:bg-muted/80"
              onClick={handleConfirmSkip}
            >
              我已了解风险，稍后备份
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
}

// Step 4: Agent Setup (setup token + agent list, replaces old AgentIntroStep)
function AgentSetupStep({ onComplete }: { onComplete: () => void }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<HumanAgent | null>(null);
  const { fetchHumanAgents } = useWallet();

  const handleDelegateAgent = useCallback((agent: HumanAgent) => {
    setSelectedAgent(agent);
    setDrawerOpen(true);
  }, []);

  const handleDelegated = useCallback(() => {
    fetchHumanAgents();
  }, [fetchHumanAgents]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 flex flex-col pt-4 overflow-auto">
        <div className="text-center mb-4">
          <h2 className="text-xl font-bold text-foreground mb-1">
            连接您的 Agent
          </h2>
          <p className="text-muted-foreground text-sm">
            关联已有 Agent 或创建新 Agent
          </p>
        </div>

        <HumanAgentListPanel
          onDelegateAgent={handleDelegateAgent}
          showHeader={false}
        />
      </div>

      <div className="pb-8 pt-4 space-y-3 shrink-0">
        <Button
          size="lg"
          className="w-full h-12 text-base font-medium"
          onClick={onComplete}
        >
          开始使用钱包
        </Button>
        <button
          onClick={onComplete}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          稍后设置
        </button>
      </div>

      <DelegateAgentFlowDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        agent={selectedAgent}
        onDelegated={handleDelegated}
      />
    </motion.div>
  );
}

// ==================== RECOVERY FLOW ====================

// Recovery Step 1: Choose Recovery Method
function RecoveryMethodStep({ onComplete }: { onComplete: () => void }) {
  const [selectedMethod, setSelectedMethod] = useState<'scan' | 'cloud' | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6"
        >
          <CloudDownload className="w-10 h-10 text-accent" strokeWidth={1.5} />
        </motion.div>
        
        <h2 className="text-xl font-bold text-foreground mb-2">
          恢复资产保险箱
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          选择一种方式恢复您的钱包
        </p>

        <div className="w-full space-y-3">
          <button
            onClick={() => setSelectedMethod('scan')}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl border transition-colors',
              selectedMethod === 'scan' 
                ? 'border-accent bg-accent/5' 
                : 'border-border bg-card hover:border-accent/50'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <QrCode className="w-6 h-6 text-foreground" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">扫码恢复</p>
              <p className="text-sm text-muted-foreground">使用旧手机扫码授权</p>
            </div>
          </button>

          <button
            onClick={() => setSelectedMethod('cloud')}
            className={cn(
              'w-full flex items-center gap-4 p-4 rounded-xl border transition-colors',
              selectedMethod === 'cloud' 
                ? 'border-accent bg-accent/5' 
                : 'border-border bg-card hover:border-accent/50'
            )}
          >
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
              <Cloud className="w-6 h-6 text-foreground" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="font-medium text-foreground">从云端恢复</p>
              <p className="text-sm text-muted-foreground">iCloud / Google Drive</p>
            </div>
          </button>
        </div>
      </div>

      <div className="pb-8">
        <Button
          size="lg"
          className="w-full h-12 text-base font-medium"
          disabled={!selectedMethod}
          onClick={onComplete}
        >
          继续
          <ChevronRight className="w-5 h-5 ml-1" strokeWidth={1.5} />
        </Button>
      </div>
    </motion.div>
  );
}

// Recovery Step 2: Restore Data
function RecoveryDataStep({ onComplete }: { onComplete: () => void }) {
  const [source, setSource] = useState<'icloud' | 'google_drive' | 'file' | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCloudRestore = async (cloudSource: 'icloud' | 'google_drive') => {
    setSource(cloudSource);
    setIsLoading(true);
    try {
      // Cloud restore: no password needed
      await new Promise(resolve => setTimeout(resolve, 2000));
      onComplete();
    } catch {
      setError('恢复失败，请重试');
      setIsLoading(false);
    }
  };

  const handleRestore = async () => {
    // Only for local file restore
    if (!password) {
      setError('请输入备份密码');
      return;
    }

    setIsLoading(true);
    try {
      // Simulate restoration
      await new Promise(resolve => setTimeout(resolve, 2000));
      onComplete();
    } catch {
      setError('密码错误或备份文件损坏');
    } finally {
      setIsLoading(false);
    }
  };

  if (!source) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col h-full"
      >
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">
            选择备份来源
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            选择您的备份存储位置
          </p>

          <div className="w-full space-y-3">
            <button
              onClick={() => handleCloudRestore('icloud')}
              disabled={isLoading}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-accent transition-colors disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                {isLoading && source === 'icloud' ? (
                  <Loader2 className="w-6 h-6 text-foreground animate-spin" strokeWidth={1.5} />
                ) : (
                  <Cloud className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">
                  {isLoading && source === 'icloud' ? '正在恢复...' : 'iCloud'}
                </p>
                <p className="text-sm text-muted-foreground">从 iCloud 恢复</p>
              </div>
              {!(isLoading && source === 'icloud') && (
                <ChevronRight className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              )}
            </button>

            <button
              onClick={() => handleCloudRestore('google_drive')}
              disabled={isLoading}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-accent transition-colors disabled:opacity-50"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                {isLoading && source === 'google_drive' ? (
                  <Loader2 className="w-6 h-6 text-foreground animate-spin" strokeWidth={1.5} />
                ) : (
                  <Cloud className="w-6 h-6 text-foreground" strokeWidth={1.5} />
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">
                  {isLoading && source === 'google_drive' ? '正在恢复...' : 'Google Drive'}
                </p>
                <p className="text-sm text-muted-foreground">从 Google Drive 恢复</p>
              </div>
              {!(isLoading && source === 'google_drive') && (
                <ChevronRight className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
              )}
            </button>

            <button
              onClick={() => setSource('file')}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-border bg-card hover:border-accent transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <FileDown className="w-6 h-6 text-foreground" strokeWidth={1.5} />
              </div>
              <div className="flex-1 text-left">
                <p className="font-medium text-foreground">本地文件</p>
                <p className="text-sm text-muted-foreground">选择备份文件</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Password form only for local file restore
  if (source === 'file') {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className="flex flex-col h-full pt-8"
      >
        <h2 className="text-xl font-bold text-foreground mb-2">
          输入备份密码
        </h2>
        <p className="text-muted-foreground text-sm mb-6">
          请输入您创建备份时设置的密码
        </p>

        <div className="space-y-4 flex-1">
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="备份密码"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
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

          {error && (
            <p className="text-sm text-destructive flex items-center gap-1">
              <AlertTriangle className="w-4 h-4" strokeWidth={1.5} />
              {error}
            </p>
          )}
        </div>

        {/* Fixed Bottom Buttons */}
        <div className="pb-8 space-y-3">
          <Button
            size="lg"
            className="w-full h-12 text-base font-medium"
            onClick={handleRestore}
            disabled={isLoading || !password}
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 mr-2 animate-spin" strokeWidth={1.5} />
            ) : null}
            恢复数据
          </Button>
          <Button
            variant="ghost"
            size="lg"
            className="w-full h-12 text-base text-muted-foreground"
            onClick={() => {
              setSource(null);
              setPassword('');
              setError('');
            }}
          >
            返回
          </Button>
        </div>
      </motion.div>
    );
  }

  // Cloud restore in progress — show nothing (loading is handled inline on the buttons)
  return null;
}

// Recovery Step 3: Verify Identity
function RecoveryVerifyStep({ onComplete }: { onComplete: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { enableBiometric } = useWallet();

  const handleVerify = async () => {
    setIsLoading(true);
    try {
      await enableBiometric();
      onComplete();
    } catch (error) {
      console.error('Verification failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 flex flex-col items-center justify-center text-center">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2 }}
          className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-6"
        >
          <Fingerprint className="w-10 h-10 text-accent" strokeWidth={1.5} />
        </motion.div>
        
        <h2 className="text-xl font-bold text-foreground mb-2">
          验证您的身份
        </h2>
        <p className="text-muted-foreground text-sm">
          使用生物识别完成身份验证
        </p>
      </div>

      <div className="pb-8">
        <Button
          size="lg"
          className="w-full h-12 text-base font-medium"
          onClick={handleVerify}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" strokeWidth={1.5} />
          ) : (
            <Fingerprint className="w-5 h-5 mr-2" strokeWidth={1.5} />
          )}
          开始验证
        </Button>
      </div>
    </motion.div>
  );
}

// Recovery Step 4: Complete
function RecoveryCompleteStep({ onComplete }: { onComplete: () => void }) {
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
          transition={{ type: "spring", duration: 0.5 }}
          className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="w-10 h-10 text-success" strokeWidth={1.5} />
        </motion.div>
        
        <h2 className="text-2xl font-bold text-foreground mb-2">
          恢复完成
        </h2>
        <p className="text-muted-foreground text-sm mb-8">
          您的钱包已成功恢复，所有资产均可正常使用
        </p>

        <div className="w-full space-y-2">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10">
            <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={1.5} />
            <span className="text-sm text-foreground">资产保险箱已恢复</span>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10">
            <CheckCircle2 className="w-5 h-5 text-success" strokeWidth={1.5} />
            <span className="text-sm text-foreground">安全设置已同步</span>
          </div>
        </div>
      </div>

      <div className="pb-8">
        <Button
          size="lg"
          className="w-full h-12 text-base font-medium"
          onClick={onComplete}
        >
          进入钱包
        </Button>
      </div>
    </motion.div>
  );
}
