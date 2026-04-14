import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShieldAlert, EyeOff as EyeOffIcon, Copy,
  AlertTriangle, CheckCircle2, Eye, KeyRound, Key,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { cn, copyToClipboard } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { useWallet } from '@/contexts/WalletContext';
import { BiometricVerifyDrawer } from '@/components/BiometricVerifyDrawer';
import type { WalletAddress, AddressSystem } from '@/types/wallet';

// ─── Mock private keys per address system ─────────────────────
function generateMockKey(system: AddressSystem, address: string): string {
  // Deterministic but fake — hash the address to produce a consistent key
  const seed = address.slice(2, 18);
  if (system === 'solana') {
    return `${seed}5Kd4cVdEj3a7x9bNFqR2mLpW8nYtH6cU0fJ1gI3kL4mN5pQ6rS7tU8vW9xY0zA1bC2dE3fG4hI5jK6lM7nO8pQ`;
  }
  return `0x${seed}a3b4c5d6e7f8091a2b3c4d5e6f708192a3b4c5d6e7f8091a2b3c4d5e6f70819`;
}

const SYSTEM_LABELS: Record<AddressSystem, string> = {
  evm: 'EVM',
  tron: 'Tron',
  solana: 'Solana',
};

function truncateAddress(addr: string): string {
  if (addr.length <= 16) return addr;
  return `${addr.slice(0, 10)}...${addr.slice(-6)}`;
}

// ─── Export synthesis stages ──────────────────────────────────
const exportStages = [
  { delay: 0, title: '正在连接安全服务器...', sub: '与 Cobo 节点建立加密通道' },
  { delay: 2000, title: '请求密钥分片...', sub: '从服务器获取协同计算所需分片' },
  { delay: 4500, title: '正在合成完整私钥...', sub: '手机端与服务器协同计算中' },
  { delay: 8000, title: '验证私钥完整性...', sub: '确认导出私钥可正确签名' },
  { delay: 11000, title: '准备导出数据...', sub: '加密封装所有链的私钥信息' },
];

// ─── Steps ────────────────────────────────────────────────────
type Step = 'inform' | 'confirm' | 'synthesis' | 'display';

export default function ExportPrivateKeyPage() {
  const navigate = useNavigate();
  const { id: walletId } = useParams();
  const { wallets } = useWallet();
  const wallet = wallets.find(w => w.id === walletId);

  const [step, setStep] = useState<Step>('inform');

  // Step: confirm
  const [check1, setCheck1] = useState(false);
  const [check2, setCheck2] = useState(false);

  // Biometric drawer
  const [bioDrawerOpen, setBioDrawerOpen] = useState(false);

  // Step: synthesis
  const [synthesisProgress, setSynthesisProgress] = useState(0);
  const [stageIndex, setStageIndex] = useState(0);
  const [displayedSub, setDisplayedSub] = useState('');

  // Step: display
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);

  // Stage timer for synthesis
  useEffect(() => {
    if (step !== 'synthesis') return;
    const timers = exportStages.slice(1).map((stage, i) =>
      setTimeout(() => setStageIndex(i + 1), stage.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [step]);

  // Typewriter effect for synthesis subtitle
  const currentSub = exportStages[stageIndex]?.sub || '';
  useEffect(() => {
    if (step !== 'synthesis') return;
    setDisplayedSub('');
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedSub(currentSub.slice(0, i));
      if (i >= currentSub.length) clearInterval(interval);
    }, 40);
    return () => clearInterval(interval);
  }, [stageIndex, step, currentSub]);

  // Auto-hide keys after 10s
  useEffect(() => {
    const visibleEntries = Object.entries(visibleKeys).filter(([, v]) => v);
    if (visibleEntries.length === 0) return;
    const timer = setTimeout(() => {
      setVisibleKeys({});
    }, 10000);
    return () => clearTimeout(timer);
  }, [visibleKeys]);

  // Key pairs from wallet addresses
  const keyPairs = (wallet?.walletAddresses ?? []).map(addr => ({
    ...addr,
    privateKey: generateMockKey(addr.system, addr.address),
  }));

  // ─── Handlers ─────────────────────────────────────────────

  const startSynthesis = useCallback(() => {
    setStep('synthesis');
    setStageIndex(0);
    setSynthesisProgress(0);
    // Total ~13s to match stage timers
    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      setSynthesisProgress(Math.min(progress, 100));
      if (progress >= 100) {
        clearInterval(interval);
        setTimeout(() => setStep('display'), 600);
      }
    }, 500);
  }, []);

  const handleCopyKey = useCallback(async (keyId: string, key: string) => {
    const ok = await copyToClipboard(key);
    if (ok) {
      setCopiedId(keyId);
      toast.success('已复制私钥');
      setTimeout(() => setCopiedId(null), 2000);
    }
  }, []);

  const handleCopyAll = useCallback(async () => {
    const text = keyPairs.map(kp =>
      `${SYSTEM_LABELS[kp.system]} (${truncateAddress(kp.address)})\n${kp.privateKey}`
    ).join('\n\n');
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedAll(true);
      toast.success('已复制全部私钥');
      setTimeout(() => setCopiedAll(false), 2000);
    }
  }, [keyPairs]);

  // ─── Not found ────────────────────────────────────────────

  if (!wallet) {
    return (
      <AppLayout showNav={false}>
        <div className="h-full flex items-center justify-center">
          <p className="text-muted-foreground">钱包不存在</p>
        </div>
      </AppLayout>
    );
  }

  // ─── Step 1: Security Inform ──────────────────────────────

  const renderInform = () => (
    <motion.div
      key="inform"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Icon — layered shield with subtle glow */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="relative mb-10"
        >
          <div className="w-[88px] h-[88px] rounded-[28px] bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/40 dark:to-orange-950/40 border border-amber-200/60 dark:border-amber-800/40 flex items-center justify-center shadow-sm">
            <ShieldAlert className="w-10 h-10 text-amber-500" strokeWidth={1.75} />
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center shadow-sm">
            <AlertTriangle className="w-3 h-3 text-white" strokeWidth={2.5} />
          </div>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-1 rounded-full bg-foreground" />
          <div className="w-5 h-1 rounded-full bg-muted" />
        </div>

        {/* Title */}
        <h2 className="text-[22px] font-bold text-foreground tracking-tight mb-3">
          脱离 MPC 保护
        </h2>

        {/* Description — concise */}
        <p className="text-[15px] text-muted-foreground leading-relaxed text-center max-w-[280px] mb-6">
          导出后可在任何钱包中使用私钥发起交易，无需 Cobo 参与。
        </p>

        {/* Warning card — refined */}
        <div className="w-full max-w-[300px] p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/50 dark:border-amber-800/30">
          <p className="text-[13px] text-amber-700 dark:text-amber-400 leading-relaxed text-center font-medium">
            私钥一旦泄露，资产将无法找回
          </p>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-2.5">
        <Button size="lg" className="w-full text-[15px] font-semibold h-12 rounded-xl" onClick={() => setStep('confirm')}>
          我已了解风险
        </Button>
        <Button size="lg" variant="ghost" className="w-full text-[15px] text-muted-foreground h-12 rounded-xl" onClick={() => navigate(-1)}>
          取消
        </Button>
      </div>
    </motion.div>
  );

  // ─── Step 2: Risk Confirm ─────────────────────────────────

  const renderConfirm = () => (
    <motion.div
      key="confirm"
      initial={{ opacity: 0, x: 40 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -40 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Icon */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.6 }}
          className="relative mb-10"
        >
          <div className="w-[88px] h-[88px] rounded-[28px] bg-gradient-to-br from-slate-50 to-gray-100 dark:from-slate-900/60 dark:to-gray-900/40 border border-gray-200/60 dark:border-gray-700/40 flex items-center justify-center shadow-sm">
            <EyeOffIcon className="w-10 h-10 text-gray-500" strokeWidth={1.75} />
          </div>
        </motion.div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-1 rounded-full bg-foreground" />
          <div className="w-5 h-1 rounded-full bg-foreground" />
        </div>

        {/* Title */}
        <h2 className="text-[22px] font-bold text-foreground tracking-tight mb-2">
          确认环境安全
        </h2>
        <p className="text-sm text-muted-foreground mb-8">
          请仔细阅读并确认以下事项
        </p>

        {/* Checkboxes */}
        <div className="w-full max-w-[320px] space-y-3">
          <label
            className={cn(
              'flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all',
              check1
                ? 'border-accent/40 bg-accent/5'
                : 'border-border bg-card hover:bg-muted/30'
            )}
          >
            <input
              type="checkbox"
              checked={check1}
              onChange={(e) => setCheck1(e.target.checked)}
              className="mt-0.5 w-[18px] h-[18px] accent-accent shrink-0 rounded"
            />
            <span className="text-[14px] text-foreground leading-relaxed">
              周围无人旁观，没有摄像和录屏
            </span>
          </label>

          <label
            className={cn(
              'flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all',
              check2
                ? 'border-accent/40 bg-accent/5'
                : 'border-border bg-card hover:bg-muted/30'
            )}
          >
            <input
              type="checkbox"
              checked={check2}
              onChange={(e) => setCheck2(e.target.checked)}
              className="mt-0.5 w-[18px] h-[18px] accent-accent shrink-0 rounded"
            />
            <span className="text-[14px] text-foreground leading-relaxed">
              私钥一旦导出，Cobo 无法帮我找回或冻结
            </span>
          </label>
        </div>
      </div>

      <div className="px-6 pb-6 space-y-2.5">
        <Button
          size="lg"
          className="w-full text-[15px] font-semibold h-12 rounded-xl"
          disabled={!check1 || !check2}
          onClick={() => setBioDrawerOpen(true)}
        >
          确认导出
        </Button>
        <Button size="lg" variant="ghost" className="w-full text-[15px] text-muted-foreground h-12 rounded-xl" onClick={() => navigate(-1)}>
          取消
        </Button>
      </div>
    </motion.div>
  );

  // ─── Step 3: Synthesis — orbital animation ─────────────────

  const renderSynthesis = () => (
    <motion.div
      key="synthesis"
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
        {/* Secondary reverse orbit */}
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

      {/* Stage title — animated swap */}
      <AnimatePresence mode="wait">
        <motion.p
          key={stageIndex}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="text-base font-semibold text-foreground"
        >
          {exportStages[stageIndex]?.title}
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
  );

  // ─── Step 5: Display Key Pairs ────────────────────────────

  const renderDisplay = () => (
    <motion.div
      key="display"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="space-y-4"
    >
      {/* Persistent warning */}
      <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
        <p className="text-xs text-destructive font-medium">请妥善保管私钥，不要截屏或分享给任何人</p>
      </div>

      {/* Key pair cards */}
      {keyPairs.map((kp) => {
        const isVisible = visibleKeys[kp.id] ?? false;
        const isCopied = copiedId === kp.id;

        return (
          <motion.div
            key={kp.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-border bg-card overflow-hidden"
          >
            {/* Chain header */}
            <div className="px-4 py-2.5 border-b border-border bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-sm font-semibold text-foreground">{SYSTEM_LABELS[kp.system]}</span>
              </div>
              <span className="text-[11px] text-muted-foreground font-mono">{truncateAddress(kp.address)}</span>
            </div>

            {/* Key area */}
            <div className="px-4 py-3">
              {isVisible ? (
                <div>
                  <p className="font-mono text-xs text-foreground break-all leading-relaxed select-all">
                    {kp.privateKey}
                  </p>
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => handleCopyKey(kp.id, kp.privateKey)}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      {isCopied ? (
                        <><CheckCircle2 className="w-3.5 h-3.5 text-success" /> 已复制</>
                      ) : (
                        <><Copy className="w-3.5 h-3.5" /> 复制私钥</>
                      )}
                    </button>
                    <button
                      onClick={() => setVisibleKeys(prev => ({ ...prev, [kp.id]: false }))}
                      className="flex items-center gap-1.5 h-8 px-3 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
                    >
                      <EyeOffIcon className="w-3.5 h-3.5" /> 隐藏
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setVisibleKeys(prev => ({ ...prev, [kp.id]: true }))}
                  className="w-full py-4 flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div className="text-muted-foreground text-sm font-mono tracking-[0.3em]">
                    ••••••••••••••••••••
                  </div>
                  <span className="flex items-center gap-1 text-xs text-accent font-medium group-hover:underline">
                    <Eye className="w-3.5 h-3.5" />
                    点击查看私钥
                  </span>
                </button>
              )}
            </div>
          </motion.div>
        );
      })}

      {/* Copy all + Done */}
      <div className="pt-2 space-y-2">
        <Button variant="outline" className="w-full" onClick={handleCopyAll}>
          {copiedAll ? (
            <><CheckCircle2 className="w-4 h-4 mr-2 text-success" /> 已复制全部</>
          ) : (
            <><Copy className="w-4 h-4 mr-2" /> 复制全部私钥</>
          )}
        </Button>
        <Button className="w-full" onClick={() => navigate('/profile/wallets')}>
          完成
        </Button>
      </div>
    </motion.div>
  );

  // ─── Render ───────────────────────────────────────────────

  return (
    <AppLayout showNav={false}>
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-border flex items-center justify-center">
          <h1 className="text-lg font-bold text-foreground">导出私钥</h1>
        </div>

        <div className="flex-1 overflow-auto px-4 py-4">
          <AnimatePresence mode="wait">
            {step === 'inform' && renderInform()}
            {step === 'confirm' && renderConfirm()}
            {step === 'synthesis' && renderSynthesis()}
            {step === 'display' && renderDisplay()}
          </AnimatePresence>
        </div>

        {/* Biometric drawer — triggered from confirm step */}
        <BiometricVerifyDrawer
          open={bioDrawerOpen}
          onOpenChange={setBioDrawerOpen}
          title="验证身份"
          description="导出私钥需要验证生物识别"
          onVerified={startSynthesis}
        />
      </div>
    </AppLayout>
  );
}
