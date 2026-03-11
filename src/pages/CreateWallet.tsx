import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Shield, Fingerprint, Lock, CloudUpload,
  CheckCircle2, Loader2, ChevronLeft, Eye, EyeOff,
  AlertTriangle, Cloud, HardDrive, Upload, Wallet, Sparkles, Bot,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { AgentDelegationPanel } from '@/components/AgentDelegationPanel';
import { useWallet } from '@/contexts/WalletContext';
import { getTSSNodeInfo } from '@/lib/tss-node';
import { cn } from '@/lib/utils';

// Dynamic steps based on whether TSS Node exists
const getSteps = (isFirstWallet: boolean, hasTSSNode: boolean) => {
  // First wallet creation without existing TSS Node: full flow with backup
  if (isFirstWallet && !hasTSSNode) {
    return [
      { id: 1, title: '命名钱包', icon: Wallet, component: 'name' },
      { id: 2, title: '安全验证', icon: Fingerprint, component: 'biometric' },
      { id: 3, title: '设置 PIN', icon: Lock, component: 'pin' },
      { id: 4, title: '创建钱包', icon: Shield, component: 'create' },
      { id: 5, title: '备份保险箱', icon: CloudUpload, component: 'backup' },
    ];
  }
  
  // Subsequent wallet creation: biometric verification + backup + agent
  return [
    { id: 1, title: '命名钱包', icon: Wallet, component: 'name' },
    { id: 2, title: '身份验证', icon: Fingerprint, component: 'biometric' },
    { id: 3, title: '创建钱包', icon: Shield, component: 'create' },
    { id: 4, title: '备份保险箱', icon: CloudUpload, component: 'backup' },
    { id: 5, title: 'Agent 关联', icon: Bot, component: 'agent' },
  ];
};

export default function CreateWalletPage() {
  const [currentStep, setCurrentStep] = useState(1);
  const [walletName, setWalletName] = useState('');
  const [createdWalletId, setCreatedWalletId] = useState<string | null>(null);
  const navigate = useNavigate();
  const { wallets } = useWallet();

  const isFirstWallet = wallets.length === 0;
  const tssNodeInfo = getTSSNodeInfo();
  const hasTSSNode = tssNodeInfo.status !== 'not_created';
  const steps = getSteps(isFirstWallet, hasTSSNode);
  const progress = (currentStep / steps.length) * 100;
  const currentComponent = steps[currentStep - 1]?.component;

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
    } else {
      // First step: go to welcome page for first wallet, home for subsequent
      navigate(isFirstWallet ? '/welcome' : '/home');
    }
  };

  // Auto generate wallet name suggestion only on mount
  useEffect(() => {
    if (walletName === '') {
      const existingCount = wallets.length;
      setWalletName(`钱包 ${existingCount + 1}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Get all existing wallet names for duplicate check
  const existingWalletNames = wallets.map(w => w.name);

  return (
    <div className="h-full bg-background flex flex-col pt-7">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBack}
              className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
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
                  {isComplete ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
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
          {currentComponent === 'name' && (
            <NameWalletStep 
              key="name" 
              walletName={walletName}
              setWalletName={setWalletName}
              existingNames={existingWalletNames}
              onComplete={handleStepComplete} 
            />
          )}
          {currentComponent === 'biometric' && (
            <BiometricStep key="biometric" isFirstWallet={isFirstWallet} onComplete={handleStepComplete} />
          )}
          {currentComponent === 'pin' && (
            <PinStep key="pin" onComplete={handleStepComplete} />
          )}
          {currentComponent === 'create' && (
            <CreateWalletStep
              key="create"
              walletName={walletName}
              isFirstWallet={isFirstWallet}
              onComplete={handleStepComplete}
              onWalletCreated={setCreatedWalletId}
            />
          )}
          {currentComponent === 'backup' && (
            <BackupStep
              key="backup"
              isFirstWallet={isFirstWallet}
              walletId={createdWalletId}
              onComplete={handleStepComplete}
            />
          )}
          {currentComponent === 'agent' && (
            <AgentStep key="agent" walletId={createdWalletId} onComplete={handleStepComplete} />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Step 1: Name Wallet with duplicate detection
function NameWalletStep({ 
  walletName, 
  setWalletName,
  existingNames,
  onComplete 
}: { 
  walletName: string;
  setWalletName: (name: string) => void;
  existingNames: string[];
  onComplete: () => void;
}) {
  const [error, setError] = useState('');
  const [warning, setWarning] = useState('');

  const handleNameChange = (name: string) => {
    setWalletName(name);
    setError('');
    
    // Check for duplicate names
    if (existingNames.includes(name.trim())) {
      setWarning('该名称已被使用，建议更换');
    } else {
      setWarning('');
    }
  };

  const handleContinue = () => {
    if (!walletName.trim()) {
      setError('请输入钱包名称');
      return;
    }
    if (walletName.length > 20) {
      setError('钱包名称不能超过20个字符');
      return;
    }
    onComplete();
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
          className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4"
        >
          <Wallet className="w-10 h-10 text-accent" />
        </motion.div>
        
        <h2 className="text-lg font-bold text-foreground mb-2">
          为您的新钱包命名
        </h2>
        <p className="text-muted-foreground text-sm max-w-[260px] mb-6">
          给钱包起一个容易辨识的名称，方便您管理多个钱包
        </p>

        <div className="w-full max-w-[280px]">
          <Input
            value={walletName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="输入钱包名称"
            className="text-center h-12 text-base"
            maxLength={20}
          />
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive mt-2 flex items-center justify-center gap-1"
            >
              <AlertTriangle className="w-4 h-4" />
              {error}
            </motion.p>
          )}
          {warning && !error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-warning mt-2 flex items-center justify-center gap-1"
            >
              <AlertTriangle className="w-4 h-4" />
              {warning}
            </motion.p>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            {walletName.length}/20 个字符
          </p>
        </div>
      </div>

      <div className="pb-6">
        <Button
          size="lg"
          className="w-full text-base font-medium"
          onClick={handleContinue}
        >
          继续
        </Button>
      </div>
    </motion.div>
  );
}

// Step 2: Biometric — first wallet: enable; subsequent: verify identity
function BiometricStep({ isFirstWallet, onComplete }: { isFirstWallet: boolean; onComplete: () => void }) {
  const [isLoading, setIsLoading] = useState(false);
  const { enableBiometric } = useWallet();

  const handleEnable = async () => {
    setIsLoading(true);
    try {
      await enableBiometric();
      onComplete();
    } catch (error) {
      console.error('Biometric failed:', error);
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
          className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4"
        >
          <Fingerprint className="w-10 h-10 text-accent" />
        </motion.div>

        <h2 className="text-lg font-bold text-foreground mb-2">
          {isFirstWallet ? '开启生物识别验证' : '验证您的身份'}
        </h2>
        <p className="text-muted-foreground text-sm max-w-[260px]">
          {isFirstWallet
            ? '为了保护资金安全，请开启面容 ID 或指纹验证'
            : '创建新钱包前，请通过生物识别确认身份'}
        </p>
      </div>

      <div className="pb-6 space-y-2">
        <Button
          size="lg"
          className="w-full text-base font-medium"
          onClick={handleEnable}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Fingerprint className="w-5 h-5 mr-2" />
          )}
          {isFirstWallet ? '开启生物识别' : '验证身份'}
        </Button>
        {isFirstWallet && (
          <>
            <Button
              variant="ghost"
              size="lg"
              className="w-full text-base text-muted-foreground"
              onClick={onComplete}
            >
              暂时跳过
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              不开启将无法使用转账功能
            </p>
          </>
        )}
      </div>
    </motion.div>
  );
}

// Step 3: PIN (only for first wallet)
function PinStep({ onComplete }: { onComplete: () => void }) {
  const [pin, setPinValue] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState<'enter' | 'confirm'>('enter');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setPin } = useWallet();

  const handlePinInput = (value: string) => {
    if (value.length <= 6) {
      if (step === 'enter') {
        setPinValue(value);
        setError('');
        if (value.length === 6) {
          setTimeout(() => setStep('confirm'), 300);
        }
      } else {
        setConfirmPin(value);
        setError('');
        if (value.length === 6) {
          if (value === pin) {
            handleComplete(value);
          } else {
            setError('PIN 不匹配，请重试');
            setConfirmPin('');
          }
        }
      }
    }
  };

  const handleComplete = async (finalPin: string) => {
    setIsLoading(true);
    try {
      await setPin(finalPin);
      onComplete();
    } catch (error) {
      setError('设置失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const currentPin = step === 'enter' ? pin : confirmPin;

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
          className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4"
        >
          <Lock className="w-8 h-8 text-accent" />
        </motion.div>
        
        <h2 className="text-lg font-bold text-foreground mb-1">
          {step === 'enter' ? '设置 6 位 PIN 码' : '再次确认 PIN 码'}
        </h2>
        <p className="text-muted-foreground text-sm max-w-[260px]">
          PIN 用于关键操作确认，如转账和恢复
        </p>

        {/* PIN Display */}
        <div className="flex gap-3 mt-6 mb-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <motion.div
              key={i}
              initial={{ scale: 0.8 }}
              animate={{ 
                scale: currentPin.length > i ? 1.1 : 1,
                backgroundColor: currentPin.length > i ? 'hsl(var(--accent))' : 'hsl(var(--muted))'
              }}
              className="w-3 h-3 rounded-full"
            />
          ))}
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-destructive flex items-center gap-1"
          >
            <AlertTriangle className="w-4 h-4" />
            {error}
          </motion.p>
        )}
      </div>

      {/* Number Pad */}
      <div className="pb-4">
        <div className="grid grid-cols-3 gap-2 max-w-[240px] mx-auto">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, '', 0, '⌫'].map((num, i) => (
            <Button
              key={i}
              variant="ghost"
              className={cn(
                'h-12 text-xl font-medium rounded-xl',
                num === '' && 'invisible'
              )}
              onClick={() => {
                if (num === '⌫') {
                  handlePinInput(currentPin.slice(0, -1));
                } else if (num !== '') {
                  handlePinInput(currentPin + num);
                }
              }}
              disabled={isLoading}
            >
              {num}
            </Button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

// Step 4: Create Wallet with success animation
function CreateWalletStep({
  walletName,
  isFirstWallet,
  onComplete,
  onWalletCreated,
}: {
  walletName: string;
  isFirstWallet: boolean;
  onComplete: () => void;
  onWalletCreated?: (walletId: string) => void;
}) {
  const [phase, setPhase] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const { createWallet } = useWallet();

  // Shorter phases for non-first wallet
  const phases = isFirstWallet 
    ? [
        '正在为您创建安全账户…',
        '正在完成安全初始化…',
        '即将完成…'
      ]
    : [
        '正在创建钱包…',
        '即将完成…'
      ];

  useEffect(() => {
    const createAndAnimate = async () => {
      const phaseInterval = setInterval(() => {
        setPhase(p => Math.min(p + 1, phases.length - 1));
      }, isFirstWallet ? 1000 : 600);

      try {
        const result = await createWallet(walletName);
        onWalletCreated?.(result.id);
        clearInterval(phaseInterval);
        setPhase(phases.length - 1);
        
        // Show success animation
        setTimeout(() => {
          setIsComplete(true);
          // Move to next step after showing success
          setTimeout(onComplete, 1200);
        }, 500);
      } catch (error) {
        clearInterval(phaseInterval);
        console.error('Create wallet failed:', error);
      }
    };

    createAndAnimate();
  }, [walletName, isFirstWallet]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full items-center justify-center text-center"
    >
      <AnimatePresence mode="wait">
        {!isComplete ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="flex flex-col items-center"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-6"
            >
              <Shield className="w-12 h-12 text-accent" />
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

            <p className="text-sm text-muted-foreground mt-2">
              正在创建: {walletName}
            </p>

            <div className="flex gap-2 mt-6">
              {phases.map((_, i) => (
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
          </motion.div>
        ) : (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center"
          >
            {/* Success animation */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [0, 1.2, 1] }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6 relative"
            >
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <CheckCircle2 className="w-12 h-12 text-success" />
              </motion.div>
              
              {/* Sparkle effects */}
              {[...Array(6)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ 
                    scale: [0, 1, 0],
                    opacity: [0, 1, 0],
                    x: Math.cos((i * 60 * Math.PI) / 180) * 50,
                    y: Math.sin((i * 60 * Math.PI) / 180) * 50,
                  }}
                  transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                  className="absolute"
                >
                  <Sparkles className="w-4 h-4 text-success" />
                </motion.div>
              ))}
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-xl font-bold text-foreground mb-2"
            >
              {isFirstWallet ? '钱包创建成功！' : '新钱包已就绪！'}
            </motion.h2>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-sm"
            >
              {isFirstWallet 
                ? '现在让我们备份您的钱包' 
                : `"${walletName}" 已添加到您的账户`
              }
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Step 5: Backup with differentiated guidance
function BackupStep({
  isFirstWallet,
  walletId,
  onComplete
}: {
  isFirstWallet: boolean;
  walletId?: string | null;
  onComplete: () => void;
}) {
  const [backupType, setBackupType] = useState<'cloud' | 'local' | null>(null);
  const [completedBackups, setCompletedBackups] = useState<Set<'cloud' | 'local'>>(new Set());
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();
  const { wallets, completeCloudBackup, backupWallet } = useWallet();

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
    // This function is now only used for local/file backup
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    if (!confirmed) {
      setError('请确认您已牢记密码');
      return;
    }

    setIsLoading(true);
    try {
      if (walletId) {
        await backupWallet(walletId, {
          method: 'local',
          fileBackupTime: new Date(),
        }, password);
      }
      setCompletedBackups(prev => new Set([...prev, 'local']));
      setShowSuccess(true);
    } catch {
      setError('备份失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSelection = () => {
    setShowSuccess(false);
    setShowPasswordForm(false);
    setBackupType(null);
    setPassword('');
    setConfirmPassword('');
    setConfirmed(false);
    setError('');
  };

  const getOtherBackupType = () => {
    if (completedBackups.has('cloud') && !completedBackups.has('local')) return 'local';
    if (completedBackups.has('local') && !completedBackups.has('cloud')) return 'cloud';
    return null;
  };

  // Success screen after backup
  if (showSuccess) {
    const otherType = getOtherBackupType();
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
            <CheckCircle2 className="w-10 h-10 text-success" />
          </motion.div>
          
          <h2 className="text-lg font-bold text-foreground mb-2">
            {backupType === 'cloud' ? '云备份完成' : '本地备份完成'}
          </h2>
          <p className="text-muted-foreground text-sm max-w-[280px] mb-6">
            {backupType === 'cloud' 
              ? '您的钱包已安全备份到云端'
              : '备份文件已保存到本地'
            }
          </p>

          {/* Show completed backups */}
          <div className="w-full max-w-[300px] space-y-2 mb-4">
            {completedBackups.has('cloud') && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                <Cloud className="w-5 h-5 text-success" />
                <span className="text-sm text-success font-medium">云备份已完成</span>
                <CheckCircle2 className="w-4 h-4 text-success ml-auto" />
              </div>
            )}
            {completedBackups.has('local') && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                <HardDrive className="w-5 h-5 text-success" />
                <span className="text-sm text-success font-medium">本地备份已完成</span>
                <CheckCircle2 className="w-4 h-4 text-success ml-auto" />
              </div>
            )}
          </div>

        </div>

        <div className="pb-6 space-y-2">
          {otherType && (
            <Button
              variant="outline"
              size="lg"
              className="w-full text-base font-medium"
              onClick={handleBackToSelection}
            >
              {otherType === 'cloud' ? (
                <>
                  <Cloud className="w-5 h-5 mr-2" />
                  继续完成云备份
                </>
              ) : (
                <>
                  <HardDrive className="w-5 h-5 mr-2" />
                  继续完成本地备份
                </>
              )}
            </Button>
          )}
          <Button
            size="lg"
            className="w-full text-base font-medium"
            onClick={onComplete}
          >
            {completedBackups.size === 2 ? '完成' : '跳过其他备份'}
          </Button>
        </div>

      </motion.div>
    );
  }

  if (!showPasswordForm) {
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
            className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6"
          >
            <CloudUpload className="w-12 h-12 text-success" />
          </motion.div>
          
          <h2 className="text-lg font-bold text-foreground mb-2">
            {isFirstWallet ? '备份您的钱包' : '更新备份'}
          </h2>
          <p className="text-muted-foreground text-sm max-w-[280px] mb-6">
            {isFirstWallet 
              ? '备份确保您在更换设备或丢失手机时能够恢复资产'
              : '建议更新备份以包含新添加的钱包'
            }
          </p>

          {/* Show completed backups if any */}
          {completedBackups.size > 0 && (
            <div className="w-full max-w-[300px] space-y-2 mb-4">
              {completedBackups.has('cloud') && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                  <Cloud className="w-5 h-5 text-success" />
                  <span className="text-sm text-success font-medium">云备份已完成</span>
                  <CheckCircle2 className="w-4 h-4 text-success ml-auto" />
                </div>
              )}
              {completedBackups.has('local') && (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-success/10 border border-success/20">
                  <HardDrive className="w-5 h-5 text-success" />
                  <span className="text-sm text-success font-medium">本地备份已完成</span>
                  <CheckCircle2 className="w-4 h-4 text-success ml-auto" />
                </div>
              )}
            </div>
          )}

          {/* Backup options - only show uncompleted ones */}
          <div className="w-full space-y-3 max-w-[300px]">
            {!completedBackups.has('cloud') && (
              <button
                onClick={async () => {
                  setBackupType('cloud');
                  setIsLoading(true);
                  try {
                    if (walletId) {
                      await backupWallet(walletId, {
                        method: 'cloud',
                        cloudProvider: 'icloud' as const,
                        lastBackupTime: new Date(),
                      });
                    } else {
                      await completeCloudBackup('icloud');
                    }
                    setCompletedBackups(prev => new Set([...prev, 'cloud']));
                    setShowSuccess(true);
                  } catch {
                    setError('备份失败，请重试');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {isLoading && backupType === 'cloud' ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <Cloud className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {isLoading && backupType === 'cloud' ? '正在备份到云端...' : '云端备份'}
                    </p>
                    <p className="text-xs text-muted-foreground">备份到 iCloud 或 Google Drive</p>
                  </div>
                </div>
              </button>
            )}

            {!completedBackups.has('local') && (
              <button
                onClick={() => {
                  setBackupType('local');
                  setShowPasswordForm(true);
                }}
                className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                    <HardDrive className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">导出备份文件</p>
                    <p className="text-xs text-muted-foreground">保存加密文件到本地</p>
                  </div>
                </div>
              </button>
            )}
          </div>
        </div>

        <div className="pb-6">
          <Button
            variant="ghost"
            size="lg"
            className="w-full text-base text-muted-foreground"
            onClick={onComplete}
          >
            {completedBackups.size > 0 ? '完成' : '稍后备份'}
          </Button>
          {completedBackups.size === 0 && (
            <p className="text-xs text-center text-muted-foreground mt-2">
              {isFirstWallet ? '未备份将限制转账功能' : '您可以随时在设置中完成备份'}
            </p>
          )}
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
      <div className="flex-1 py-4">
        <div className="text-center mb-6">
          <h2 className="text-lg font-bold text-foreground mb-1">
            设置备份文件密码
          </h2>
          <p className="text-muted-foreground text-sm">
            此密码用于加密您的本地备份数据
          </p>
        </div>

        <div className="space-y-4 max-w-[300px] mx-auto">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">设置密码</label>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError('');
                }}
                placeholder="8-32位，包含字母和数字"
                className="h-11 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">确认密码</label>
            <Input
              type={showPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              placeholder="再次输入密码"
              className="h-11"
            />
          </div>

          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive flex items-center gap-1"
            >
              <AlertTriangle className="w-4 h-4" />
              {error}
            </motion.p>
          )}

          <label className="flex items-start gap-2 mt-4">
            <input
              type="checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
              className="mt-1"
            />
            <span className="text-xs text-muted-foreground">
              我已牢记密码，明白丢失密码将无法恢复备份
            </span>
          </label>
        </div>
      </div>

      <div className="pb-6 space-y-2">
        <Button
          size="lg"
          className="w-full text-base font-medium"
          onClick={handleBackup}
          disabled={isLoading || !confirmed}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : (
            <Upload className="w-5 h-5 mr-2" />
          )}
          完成备份
        </Button>
        <Button
          variant="ghost"
          size="lg"
          className="w-full text-base text-muted-foreground"
          onClick={() => setShowPasswordForm(false)}
        >
          返回
        </Button>
      </div>
    </motion.div>
  );
}

// Step 5 (subsequent wallet): Agent Setup — multi-select + setup token + optional badge
function AgentStep({ walletId, onComplete }: { walletId: string | null; onComplete: () => void }) {
  const { wallets } = useWallet();
  const walletName = wallets.find(w => w.id === walletId)?.name || '新钱包';

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <AgentDelegationPanel
        walletId={walletId}
        onComplete={onComplete}
        onSkip={onComplete}
        showSkip
        showHeader
        walletName={walletName}
        tokenCardVariant="create-wallet"
      />
    </motion.div>
  );
}
