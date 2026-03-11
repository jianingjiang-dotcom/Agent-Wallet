import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Clipboard, CheckCircle2, AlertCircle,
  Fingerprint, Shield, Loader2, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { DEFAULT_AGENT_PERMISSIONS } from '@/types/wallet';

const PRINCIPAL_ID_REGEX = /^[a-z0-9-]+$/;

interface DelegateAgentDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  walletId: string;
  walletName: string;
  onDelegated: (agentName: string, principalId: string) => void;
}

export function DelegateAgentDrawer({
  open, onOpenChange, walletId, walletName, onDelegated,
}: DelegateAgentDrawerProps) {
  const { delegateAgent } = useWallet();

  const [step, setStep] = useState(1);
  const [principalId, setPrincipalId] = useState('');
  const [principalError, setPrincipalError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [agentName, setAgentName] = useState('');
  const [isBioAuthing, setIsBioAuthing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(1);
      setPrincipalId('');
      setPrincipalError('');
      setIsVerifying(false);
      setAgentName('');
      setIsBioAuthing(false);
      setIsSaving(false);
    }
  }, [open]);

  // -- Step 1: Paste & Verify Principal ID --
  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setPrincipalId(text.trim());
      setPrincipalError('');
    } catch {
      toast.error('无法读取剪贴板');
    }
  };

  const handleVerifyPrincipal = async () => {
    const trimmed = principalId.trim();
    if (!trimmed) {
      setPrincipalError('请输入 Principal ID');
      return;
    }
    if (trimmed.length < 10) {
      setPrincipalError('Principal ID 长度至少 10 个字符');
      return;
    }
    if (!PRINCIPAL_ID_REGEX.test(trimmed)) {
      setPrincipalError('格式无效，仅支持小写字母、数字和连字符');
      return;
    }
    setPrincipalError('');
    setIsVerifying(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsVerifying(false);
    toast.success('Principal ID 验证通过');
    setStep(2);
  };

  // -- Step 3: Biometric + Delegate --
  const handleBiometricAuth = async () => {
    setIsBioAuthing(true);
    await new Promise((r) => setTimeout(r, 1500));
    setIsBioAuthing(false);

    // Call delegateAgent with default risk config
    setIsSaving(true);
    try {
      await delegateAgent(walletId, principalId.trim(), agentName.trim(), { ...DEFAULT_AGENT_PERMISSIONS }, {
        defaultAction: 'deny',
        policies: [],
      });
      toast.success('Agent 授权成功');
      setStep(4);
    } catch {
      toast.error('授权失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  // -- Step 4: Complete --
  const handleComplete = () => {
    onDelegated(agentName.trim(), principalId.trim());
    onOpenChange(false);
  };

  const drawerTitle = step === 1
    ? '输入 Principal ID'
    : step === 2
      ? '命名 Agent'
      : step === 3
        ? '确认授权'
        : '授权成功';

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader>
          <DrawerTitle>{drawerTitle}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6">
          <AnimatePresence mode="wait">
            {/* Step 1: Principal ID Input */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  请输入外部 Agent 提供的 Principal ID
                </p>

                <div className="relative">
                  <textarea
                    value={principalId}
                    onChange={(e) => { setPrincipalId(e.target.value); setPrincipalError(''); }}
                    placeholder="例如: abc12-defgh-3ijkl-mn456-opqrs"
                    className={cn(
                      'w-full min-h-[80px] p-3 pr-12 rounded-xl border bg-background font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all',
                      principalError ? 'border-red-400 focus:ring-red-400/50' : 'border-border'
                    )}
                  />
                  <button
                    onClick={handlePaste}
                    className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted transition-colors"
                    title="粘贴"
                  >
                    <Clipboard className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>

                {principalError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-1.5 text-destructive text-xs"
                  >
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{principalError}</span>
                  </motion.div>
                )}

                <Button
                  onClick={handleVerifyPrincipal}
                  disabled={isVerifying || !principalId.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isVerifying ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      验证中...
                    </>
                  ) : '验证'}
                </Button>
              </motion.div>
            )}

            {/* Step 2: Name the Agent */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground">
                  为此 Agent 起一个名称，方便后续识别
                </p>

                <div>
                  <label className="text-sm font-medium mb-1.5 block">Agent 名称</label>
                  <Input
                    value={agentName}
                    onChange={(e) => setAgentName(e.target.value)}
                    placeholder="例如: Trading Bot Alpha"
                    maxLength={30}
                  />
                  <p className="text-xs text-muted-foreground mt-1 text-right">
                    {agentName.length}/30
                  </p>
                </div>

                <div className="bg-muted/50 rounded-xl p-3">
                  <p className="text-xs text-muted-foreground mb-1">Principal ID</p>
                  <p className="font-mono text-xs text-muted-foreground break-all">
                    {principalId.trim()}
                  </p>
                </div>

                <Button
                  onClick={() => setStep(3)}
                  disabled={!agentName.trim()}
                  className="w-full"
                  size="lg"
                >
                  下一步
                </Button>

                <button
                  onClick={() => setStep(1)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  返回上一步
                </button>
              </motion.div>
            )}

            {/* Step 3: Confirm & Biometric */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Summary card */}
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                      <Wallet className="w-4 h-4 text-accent" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">钱包</p>
                      <p className="text-sm font-medium truncate">{walletName}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-blue-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Agent 名称</p>
                      <p className="text-sm font-medium truncate">{agentName.trim()}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center shrink-0">
                      <Shield className="w-4 h-4 text-purple-500" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs text-muted-foreground">Principal ID</p>
                      <p className="font-mono text-xs text-muted-foreground break-all">
                        {principalId.trim()}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  onClick={handleBiometricAuth}
                  disabled={isBioAuthing || isSaving}
                  className="w-full"
                  size="lg"
                >
                  {(isBioAuthing || isSaving) ? (
                    <motion.div className="flex items-center gap-2">
                      {isSaving ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ repeat: Infinity, duration: 1 }}
                        >
                          <Fingerprint className="w-5 h-5" />
                        </motion.div>
                      )}
                      <span>{isSaving ? '授权中...' : '验证中...'}</span>
                    </motion.div>
                  ) : (
                    <span className="flex items-center gap-2">
                      <Fingerprint className="w-5 h-5" />
                      确认并授权
                    </span>
                  )}
                </Button>

                <button
                  onClick={() => setStep(2)}
                  className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  返回上一步
                </button>
              </motion.div>
            )}

            {/* Step 4: Success */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-4 text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                >
                  <div className="w-16 h-16 mx-auto rounded-full bg-success/10 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-success" />
                  </div>
                </motion.div>
                <div>
                  <p className="text-lg font-semibold">授权成功</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    <span className="font-medium text-foreground">{agentName.trim()}</span>{' '}
                    已获得对钱包{' '}
                    <span className="font-medium text-foreground">{walletName}</span>{' '}
                    的操作授权
                  </p>
                </div>
                <Button className="w-full mt-2" onClick={handleComplete}>
                  完成
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
