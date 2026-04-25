/**
 * Agent Reshare Page
 *
 * User-initiated flow to rebuild an Agent's key share.
 * Full step-indicator flow: 授权码 → 分片生成 → 完成
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, Copy, Check, Clock, AlertTriangle, CheckCircle2,
  ChevronLeft, Sparkles, Bot, RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { useSetupTokenTimer } from '@/hooks/useSetupTokenTimer';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

type Step = 'code' | 'processing' | 'done';

const STEP_CONFIG = [
  { id: 1, title: '授权码', icon: Key, step: 'code' as Step },
  { id: 2, title: '分片生成', icon: RefreshCw, step: 'processing' as Step },
  { id: 3, title: '完成', icon: CheckCircle2, step: 'done' as Step },
];

// Reshare stages — same structure as ClaimWallet keygenStages
const reshareStages = [
  { delay: 0, title: '正在连接 Agent 节点...', sub: '与 Agent TSS Node 建立加密通道' },
  { delay: 2000, title: '协商授权参数...', sub: '同步 MPC 计算规则与参与方信息' },
  { delay: 4500, title: '正在生成密钥分片...', sub: '手机端与 Agent 节点协同计算中' },
  { delay: 8000, title: '验证新分片...', sub: '确认新分片可正确协同签名' },
  { delay: 12000, title: '正在写入安全存储...', sub: '将更新后的配置加密保存' },
];

function formatDate(date?: Date): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric', month: '2-digit', day: '2-digit',
  });
}

function getStepNumber(step: Step): number {
  const found = STEP_CONFIG.find(s => s.step === step);
  return found?.id ?? 1;
}

export default function AgentReshare() {
  const { walletId } = useParams<{ walletId: string }>();
  const navigate = useNavigate();
  const { delegatedAgents, wallets, generateReshareCode, reshareAgentNode } = useWallet();

  const wallet = useMemo(() => wallets.find(w => w.id === walletId), [wallets, walletId]);

  // Get non-revoked agents for this wallet
  const availableAgents = useMemo(() =>
    delegatedAgents.filter(a => a.walletId === walletId && a.status !== 'revoked'),
    [delegatedAgents, walletId]
  );

  const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);
  const selectedAgent = useMemo(() => {
    if (selectedAgentId) return delegatedAgents.find(a => a.id === selectedAgentId);
    if (availableAgents.length === 1) return availableAgents[0];
    return null;
  }, [delegatedAgents, selectedAgentId, availableAgents]);

  // Step management
  const [step, setStep] = useState<Step>('code');
  const currentStepNum = getStepNumber(step);

  // Reshare code
  const [reshareCode, setReshareCode] = useState<{ code: string; expiresAt: Date } | null>(null);
  const [copied, setCopied] = useState(false);

  // Processing animation (keygenStages pattern)
  const [stageIndex, setStageIndex] = useState(0);
  const [displayedSub, setDisplayedSub] = useState('');
  const [processingDone, setProcessingDone] = useState(false);

  // Timer
  const { remainingFormatted, isExpired } = useSetupTokenTimer(reshareCode?.expiresAt ?? null);

  // Auto-select if only one agent
  useEffect(() => {
    if (availableAgents.length === 1 && !selectedAgentId) {
      setSelectedAgentId(availableAgents[0].id);
    }
  }, [availableAgents, selectedAgentId]);

  // Generate code when agent is selected
  useEffect(() => {
    if (selectedAgent && !reshareCode) {
      const result = generateReshareCode(selectedAgent.id);
      setReshareCode(result);
    }
  }, [selectedAgent, reshareCode, generateReshareCode]);

  // Mock: Agent "connects" after 5 seconds → go directly to processing
  useEffect(() => {
    if (step !== 'code' || !reshareCode || isExpired) return;
    const timer = setTimeout(() => {
      setStep('processing');
    }, 5000);
    return () => clearTimeout(timer);
  }, [step, reshareCode, isExpired]);

  // Processing: stage timer (same pattern as KeyShareGenStep)
  useEffect(() => {
    if (step !== 'processing' || processingDone) return;
    const timers = reshareStages.slice(1).map((stage, i) =>
      setTimeout(() => setStageIndex(i + 1), stage.delay)
    );
    const doneTimer = setTimeout(() => {
      setProcessingDone(true);
    }, 14000);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(doneTimer);
    };
  }, [step, processingDone]);

  // Processing: typewriter effect for subtitle
  const currentSub = reshareStages[stageIndex]?.sub || '';
  useEffect(() => {
    if (step !== 'processing' || processingDone) return;
    setDisplayedSub('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedSub(currentSub.slice(0, i));
      if (i >= currentSub.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [stageIndex, step, processingDone, currentSub]);

  // When processing done, transition to done step
  useEffect(() => {
    if (processingDone && step === 'processing') {
      const timer = setTimeout(() => setStep('done'), 600);
      return () => clearTimeout(timer);
    }
  }, [processingDone, step]);

  const handleCopy = useCallback(async () => {
    if (!reshareCode) return;
    try {
      await navigator.clipboard.writeText(reshareCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('复制失败');
    }
  }, [reshareCode]);

  const handleDone = () => {
    if (selectedAgent) {
      reshareAgentNode(selectedAgent.id);
    }
    navigate(-1);
  };

  const handleRegenerate = () => {
    if (selectedAgent) {
      const result = generateReshareCode(selectedAgent.id);
      setReshareCode(result);
      setStep('code');
      setCopied(false);
    }
  };

  const handleBack = () => {
    if (step === 'processing') return; // Can't go back during processing
    navigate(-1);
  };

  // Agent selection (multiple agents) — no step indicators yet
  if (availableAgents.length > 1 && !selectedAgentId) {
    return (
      <div className="h-full bg-background flex flex-col">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center gap-2">
            <button onClick={() => navigate(-1)} className="p-1 -ml-1 text-muted-foreground">
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-sm font-medium text-foreground">选择 Agent</span>
          </div>
        </div>
        <div className="flex-1 px-4 pt-4 space-y-3">
          <p className="text-sm text-muted-foreground mb-4">
            该钱包有多个 Agent，请选择要重新授权的 Agent：
          </p>
          {availableAgents.map(agent => (
            <button
              key={agent.id}
              onClick={() => setSelectedAgentId(agent.id)}
              className="w-full card-elevated p-4 flex items-center gap-3 text-left active:bg-muted/60 transition-colors"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                <Bot className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground truncate">{agent.agentName}</p>
                <p className="text-xs text-muted-foreground">
                  {agent.status === 'active' ? '运行中' : '已暂停'}
                </p>
              </div>
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="h-full bg-background flex flex-col">
      {/* Header with step indicators — same layout as ClaimWallet */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={handleBack}
              className={cn(
                'p-1 -ml-1 transition-colors',
                step === 'processing' ? 'text-muted-foreground/30' : 'text-muted-foreground'
              )}
              disabled={step === 'processing'}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <span className="text-sm text-muted-foreground">
              步骤 {currentStepNum} / {STEP_CONFIG.length}
            </span>
          </div>
          <span className="text-sm font-medium text-foreground">
            {STEP_CONFIG[currentStepNum - 1]?.title}
          </span>
        </div>

        {/* Step indicator dots + progress lines */}
        <div className="flex items-center mt-6">
          {STEP_CONFIG.map((s, index) => {
            const Icon = s.icon;
            const isComplete = currentStepNum > s.id;
            const isCurrent = currentStepNum === s.id;

            return (
              <div key={s.id} className="flex items-center flex-1 last:flex-none">
                <div
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center transition-all shrink-0',
                    isComplete && 'bg-success text-success-foreground',
                    isCurrent && 'bg-accent text-accent-foreground',
                    !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </div>
                {index < STEP_CONFIG.length - 1 && (
                  <div
                    className={cn(
                      'flex-1 h-0.5',
                      currentStepNum > s.id ? 'bg-success' : 'bg-muted'
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
          {/* ===== Step 1: Code Display + Waiting ===== */}
          {step === 'code' && reshareCode && selectedAgent && (
            <motion.div
              key="code"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="pt-6 pb-8 space-y-5"
            >
              {/* Hero */}
              <div className="flex flex-col items-center text-center pb-2">
                <div className="w-20 h-20 rounded-full bg-accent/10 flex items-center justify-center mb-4">
                  <Key className="w-10 h-10 text-accent" strokeWidth={1.5} />
                </div>
                <h3 className="font-semibold text-lg">将此授权码提供给 Agent</h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {selectedAgent.agentName} 输入后将自动开始授权流程
                </p>
              </div>

              {/* Code Display */}
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs text-muted-foreground mb-3">授权码</p>
                {isExpired ? (
                  <div className="text-center py-4">
                    <p className="text-sm text-destructive mb-3">授权码已过期</p>
                    <Button size="sm" onClick={handleRegenerate}>
                      重新生成
                    </Button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <p className="font-mono text-xl font-bold text-foreground tracking-wider">
                        {reshareCode.code}
                      </p>
                      <button
                        onClick={handleCopy}
                        className="p-2 rounded-lg bg-muted/50 transition-colors"
                      >
                        {copied
                          ? <Check className="w-4 h-4 text-success" />
                          : <Copy className="w-4 h-4 text-muted-foreground" />
                        }
                      </button>
                    </div>
                    <div className="flex items-center gap-1.5 mt-3">
                      <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        有效期 {remainingFormatted}
                      </span>
                    </div>
                  </>
                )}
              </div>

              {/* Agent Info Card */}
              <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Agent 名称</span>
                  <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <Bot className="w-4 h-4 text-purple-500" />
                    {selectedAgent.agentName}
                  </span>
                </div>
                <div className="border-t border-border" />
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">关联钱包</span>
                  <span className="text-sm font-medium text-foreground">{wallet?.name || '-'}</span>
                </div>
              </div>

              {/* Waiting indicator */}
              {!isExpired && (
                <div className="flex items-center justify-center gap-2 pt-2">
                  <motion.div
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="w-2 h-2 rounded-full bg-accent"
                  />
                  <span className="text-sm text-muted-foreground">等待 Agent 输入授权码...</span>
                </div>
              )}
            </motion.div>
          )}

          {/* ===== Step 2: Processing Animation (onboarding style) ===== */}
          {step === 'processing' && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full items-center justify-center text-center px-2"
            >
              {/* Orbital animation — from ClaimWallet KeyShareGenStep */}
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

              {/* Stage title */}
              <AnimatePresence mode="wait">
                <motion.p
                  key={stageIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="text-base font-semibold text-foreground"
                >
                  {reshareStages[stageIndex]?.title}
                </motion.p>
              </AnimatePresence>

              {/* Typewriter subtitle */}
              <p className="text-xs text-muted-foreground mt-2 mb-8 leading-relaxed max-w-[260px] min-h-[1.5em]">
                {displayedSub}
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
                  className="inline-block w-px h-3 bg-muted-foreground/50 ml-0.5 align-middle"
                />
              </p>
            </motion.div>
          )}

          {/* ===== Step 3: Done — wallet-agent relationship ===== */}
          {step === 'done' && selectedAgent && (
            <motion.div
              key="done"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col h-full"
            >
              <div className="flex-1 flex flex-col items-center text-center pt-10">
                {/* Success icon with sparkles */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [0, 1.2, 1] }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6 relative"
                >
                  <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <CheckCircle2 className="w-10 h-10 text-success" strokeWidth={1.5} />
                  </motion.div>
                  {[...Array(6)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{
                        scale: [0, 1, 0],
                        opacity: [0, 1, 0],
                        x: Math.cos((i * 60 * Math.PI) / 180) * 45,
                        y: Math.sin((i * 60 * Math.PI) / 180) * 45,
                      }}
                      transition={{ delay: 0.3 + i * 0.05, duration: 0.6 }}
                      className="absolute"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-success" />
                    </motion.div>
                  ))}
                </motion.div>

                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-xl font-bold text-foreground mb-2"
                >
                  授权完成
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground text-sm mb-6"
                >
                  Agent 已获得新的密钥分片，可以正常协同签名
                </motion.p>

                {/* Wallet-Agent relationship card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="w-full bg-card border border-border rounded-xl p-4 space-y-3 text-left"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">钱包名称</span>
                    <span className="text-sm font-medium text-foreground">{wallet?.name || '-'}</span>
                  </div>
                  <div className="border-t border-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Agent 名称</span>
                    <span className="text-sm font-medium text-foreground flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-purple-500" />
                      {selectedAgent.agentName}
                    </span>
                  </div>
                  <div className="border-t border-border" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">关联时间</span>
                    <span className="text-sm text-foreground">{formatDate(selectedAgent.createdAt)}</span>
                  </div>
                </motion.div>

                {/* Warning: old shard invalidated */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="w-full bg-warning/5 border border-warning/20 rounded-xl p-3 mt-4"
                >
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" />
                    <p className="text-xs text-warning leading-relaxed text-left">
                      Agent 的旧分片已失效，仅新 Node 可以执行签名操作。你的分片未受影响。
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Done button */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="pb-8 pt-4"
              >
                <Button
                  size="lg"
                  className="w-full h-12 text-base font-medium"
                  onClick={handleDone}
                >
                  完成
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
