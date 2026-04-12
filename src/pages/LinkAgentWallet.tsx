import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Link2, CheckCircle2, AlertTriangle, Clipboard,
  ChevronLeft, Shield, Sparkles
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { Wallet } from '@/types/wallet';
import { toast } from '@/lib/toast';

const steps = [
  { id: 1, title: '输入令牌', icon: Link2, component: 'token' },
  { id: 2, title: '确认钱包', icon: Bot, component: 'confirm' },
  { id: 3, title: '关联完成', icon: CheckCircle2, component: 'complete' },
];

export default function LinkAgentWallet() {
  const [currentStep, setCurrentStep] = useState(1);
  const [linkedWallet, setLinkedWallet] = useState<Wallet | null>(null);
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
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header — matches CreateWallet */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className="p-1 -ml-1 text-muted-foreground transition-colors"
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

        {/* Step indicators — matches CreateWallet */}
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
          {currentComponent === 'token' && (
            <TokenInputStep
              key="token"
              onComplete={(wallet) => {
                setLinkedWallet(wallet);
                handleStepComplete();
              }}
            />
          )}
          {currentComponent === 'confirm' && linkedWallet && (
            <ConfirmWalletStep
              key="confirm"
              wallet={linkedWallet}
              onComplete={handleStepComplete}
            />
          )}
          {currentComponent === 'complete' && (
            <LinkCompleteStep
              key="complete"
              onComplete={handleStepComplete}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Step 1: Token Input
function TokenInputStep({
  onComplete
}: {
  onComplete: (wallet: Wallet) => void;
}) {
  const { linkAgentWallet } = useWallet();
  const [token, setToken] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setToken(text);
      setError('');
    } catch {
      toast.error('无法访问剪贴板');
    }
  };

  const handleValidateToken = async () => {
    if (!token.trim()) {
      setError('请输入设置令牌');
      return;
    }
    setIsValidating(true);
    setError('');
    try {
      const wallet = await linkAgentWallet(token);
      onComplete(wallet);
    } catch (e: any) {
      setError(e.message || '令牌验证失败');
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
        <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center mb-4">
          <Link2 className="w-10 h-10 text-purple-600 dark:text-purple-400" />
        </div>
        <h3 className="font-semibold text-lg text-center">输入设置令牌</h3>
        <p className="text-sm text-muted-foreground text-center mt-1">
          将 Agent 提供的令牌粘贴到下方
        </p>
      </div>

      <div className="space-y-2">
        <div className="relative">
          <Input
            value={token}
            onChange={(e) => { setToken(e.target.value); setError(''); }}
            placeholder="粘贴设置令牌..."
            className="pr-12 h-12 font-mono text-sm"
          />
          <button
            onClick={handlePaste}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-muted-foreground"
          >
            <Clipboard className="w-4 h-4" />
          </button>
        </div>
        {error && (
          <div className="flex items-center gap-1.5 text-destructive text-xs">
            <AlertTriangle className="w-3.5 h-3.5" />
            {error}
          </div>
        )}
      </div>

      <Button
        onClick={handleValidateToken}
        disabled={!token.trim() || isValidating}
        className="w-full gradient-primary"
        size="lg"
      >
        {isValidating ? '验证中...' : '验证令牌'}
      </Button>
    </motion.div>
  );
}

// Step 2: Confirm Wallet Info
function ConfirmWalletStep({
  wallet,
  onComplete
}: {
  wallet: Wallet;
  onComplete: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-5 pt-6"
    >
      <div className="flex flex-col items-center mb-2">
        <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4">
          <CheckCircle2 className="w-10 h-10 text-success" />
        </div>
        <h3 className="font-semibold text-lg text-center">钱包验证成功</h3>
        <p className="text-sm text-muted-foreground text-center mt-1">
          请确认以下钱包信息
        </p>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Agent 名称</span>
          <span className="text-sm font-medium flex items-center gap-1.5">
            <Bot className="w-4 h-4 text-purple-500" />
            {wallet.agentInfo?.agentName || 'Trading Agent'}
          </span>
        </div>
        <div className="border-t border-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">钱包地址</span>
          <span className="text-xs font-mono text-foreground">
            {wallet.addresses.ethereum?.slice(0, 6)}...{wallet.addresses.ethereum?.slice(-4)}
          </span>
        </div>
        <div className="border-t border-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">支持链</span>
          <div className="flex gap-1.5">
            {['ETH', 'TRON', 'BSC', 'SOL'].map(chain => (
              <span key={chain} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                {chain}
              </span>
            ))}
          </div>
        </div>
        <div className="border-t border-border" />
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">签名方式</span>
          <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">Agent 签名</span>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/40 rounded-xl p-3">
        <div className="flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-400">
            此钱包由 Agent 控制签名权。您可以审批交易和查看资产，但无法直接发起转账。
          </p>
        </div>
      </div>

      <Button onClick={onComplete} className="w-full gradient-primary" size="lg">
        确认关联
      </Button>
    </motion.div>
  );
}

// Step 3: Linking animation + success (matches CreateWalletStep pattern)
function LinkCompleteStep({
  onComplete
}: {
  onComplete: () => void;
}) {
  const [phase, setPhase] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const navigate = useNavigate();

  const phases = ['正在关联钱包…', '即将完成…'];

  useEffect(() => {
    const phaseInterval = setInterval(() => {
      setPhase(p => Math.min(p + 1, phases.length - 1));
    }, 800);

    // Simulate linking delay
    const linkTimer = setTimeout(() => {
      clearInterval(phaseInterval);
      setPhase(phases.length - 1);
      setTimeout(() => setIsComplete(true), 400);
    }, 1600);

    return () => {
      clearInterval(phaseInterval);
      clearTimeout(linkTimer);
    };
  }, []);

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
            {/* Success animation — matches CreateWalletStep */}
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
              钱包关联成功！
            </motion.h2>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-muted-foreground text-sm mb-8"
            >
              Agent 钱包已成功关联到您的账户
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="w-full"
            >
              <Button onClick={() => navigate('/home')} className="w-full gradient-primary" size="lg">
                进入钱包
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
