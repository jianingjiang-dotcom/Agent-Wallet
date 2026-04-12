import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Info, RefreshCw, Copy, Check, Clock, AlertCircle,
  ChevronDown, ChevronRight,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useWallet } from '@/contexts/WalletContext';
import { useSetupTokenTimer } from '@/hooks/useSetupTokenTimer';
import { cn, copyToClipboard } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { DelegateAgentFlowDrawer } from '@/components/DelegateAgentFlowDrawer';
import type { HumanAgent } from '@/types/wallet';

// --- Types ---

interface AgentDelegationPanelProps {
  walletId: string | null;
  onComplete: () => void;
  onSkip?: () => void;
  showSkip?: boolean;
  walletName?: string;
  showHeader?: boolean;
  tokenCardVariant?: 'create-wallet' | 'settings';
}

// --- Animations ---

const viewTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2 },
};

// --- Component ---

export function AgentDelegationPanel({
  walletId,
  onComplete,
  onSkip,
  showSkip = false,
  walletName,
  showHeader = true,
  tokenCardVariant = 'create-wallet',
}: AgentDelegationPanelProps) {
  const {
    humanAgents, delegatedAgents, fetchHumanAgents,
    generateSetupToken, currentSetupToken, addMockHumanAgent,
    wallets,
  } = useWallet();

  // --- Delegate drawer state ---
  const [delegateDrawerOpen, setDelegateDrawerOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<HumanAgent | null>(null);

  // --- Token card state ---
  const [tokenExpanded, setTokenExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- List state ---
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasRefreshedRef = useRef(false);

  const { remainingFormatted, isExpired } = useSetupTokenTimer(
    currentSetupToken?.expiresAt ?? null
  );

  // Generate token on mount
  useEffect(() => {
    generateSetupToken();
  }, [generateSetupToken]);

  // --- Per-wallet delegation check ---
  const isAgentDelegatedToWallet = useCallback((principalId: string) => {
    if (!walletId) return false;
    return delegatedAgents.some(
      da => da.principalId === principalId && da.walletId === walletId && da.status === 'active'
    );
  }, [delegatedAgents, walletId]);

  // --- Check if agent is delegated to another wallet (active or paused) ---
  const isAgentDelegatedElsewhere = useCallback((principalId: string) => {
    if (!walletId) return false;
    return delegatedAgents.some(
      da => da.principalId === principalId && da.walletId !== walletId && da.status !== 'revoked'
    );
  }, [delegatedAgents, walletId]);

  const getDelegatedElsewhereWalletName = useCallback((principalId: string) => {
    const da = delegatedAgents.find(
      d => d.principalId === principalId && d.walletId !== walletId && d.status !== 'revoked'
    );
    if (!da) return '';
    return wallets.find(w => w.id === da.walletId)?.name || da.walletId;
  }, [delegatedAgents, walletId, wallets]);

  // Sort: available first > delegated elsewhere > delegated to this wallet
  const sortedAgents = [...humanAgents].sort((a, b) => {
    const aDelegatedHere = isAgentDelegatedToWallet(a.principalId);
    const bDelegatedHere = isAgentDelegatedToWallet(b.principalId);
    const aDelegatedElsewhere = isAgentDelegatedElsewhere(a.principalId);
    const bDelegatedElsewhere = isAgentDelegatedElsewhere(b.principalId);
    const aUnavailable = aDelegatedHere || aDelegatedElsewhere;
    const bUnavailable = bDelegatedHere || bDelegatedElsewhere;
    if (aUnavailable && !bUnavailable) return 1;
    if (!aUnavailable && bUnavailable) return -1;
    return 0;
  });

  // --- Handlers ---

  const handleAgentClick = (agent: HumanAgent) => {
    if (isAgentDelegatedToWallet(agent.principalId)) return;
    if (isAgentDelegatedElsewhere(agent.principalId)) return;
    setSelectedAgent(agent);
    setDelegateDrawerOpen(true);
  };

  const handleCopy = async () => {
    if (!currentSetupToken || isExpired) return;
    const text = tokenCardVariant === 'create-wallet'
      ? `I'd like to set up a new agent connection. Here is my setup token:\n\n${currentSetupToken.token}\n\nPlease use this token to complete the agent setup process.`
      : currentSetupToken.token;
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopied(true);
      toast.success(tokenCardVariant === 'create-wallet' ? 'Prompt 已复制到剪贴板' : 'Token 已复制');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  const handleNewToken = async () => {
    setIsGenerating(true);
    await generateSetupToken();
    setIsGenerating(false);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchHumanAgents();
    if (!hasRefreshedRef.current) {
      hasRefreshedRef.current = true;
      addMockHumanAgent({
        principalId: 'defi7-swap0-agent-ready-00001',
        displayName: 'DeFi Agent',
        delegationStatus: 'not_delegated',
        createdAt: new Date(),
      });
    }
    setIsRefreshing(false);
    toast.success('列表已刷新');
  };

  // Count how many agents have been delegated to this wallet
  const delegatedCount = humanAgents.filter(a => isAgentDelegatedToWallet(a.principalId)).length;

  // =============================================================
  // RENDER
  // =============================================================

  return (
    <div className="flex flex-col h-full">
      <motion.div key="select" {...viewTransition} className="flex flex-col h-full">
        <div className="flex-1 flex flex-col pt-4 overflow-auto">
          {/* Header */}
          {showHeader && (
            <div className="text-center mb-4">
              <div className="flex items-center justify-center gap-2 mb-1">
                <h2 className="text-lg font-bold text-foreground">关联 Agent</h2>
                <Badge variant="secondary" className="text-[10px] px-2 py-0">可选</Badge>
              </div>
              <p className="text-muted-foreground text-sm">
                {walletName
                  ? `为「${walletName}」关联 Agent，也可稍后在设置中完成`
                  : '选择要关联的 Agent'
                }
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* Collapsible Setup Token Card */}
            <div className="card-elevated overflow-hidden">
              <button
                onClick={() => setTokenExpanded(!tokenExpanded)}
                className="w-full p-4 flex items-center gap-2 text-left"
              >
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0">
                  <Bot className="w-3.5 h-3.5 text-accent" />
                </div>
                <span className="text-sm font-medium flex-1">创建新 Agent</span>
                {tokenCardVariant === 'create-wallet' && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        className="p-1 rounded-full transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Info className="w-3.5 h-3.5 text-muted-foreground" />
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72" side="bottom" align="start">
                      <p className="font-medium text-sm mb-2.5">如何使用 Setup Token</p>
                      <ol className="text-xs space-y-2 text-muted-foreground list-none">
                        <li className="flex gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 text-[10px] font-bold">1</span>
                          <span>下载对应的 Agent Skill</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 text-[10px] font-bold">2</span>
                          <span>将复制的 Prompt（含 Token）发送给 Agent</span>
                        </li>
                        <li className="flex gap-2">
                          <span className="w-5 h-5 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 text-[10px] font-bold">3</span>
                          <span>Agent 验证 Token 后自动完成关联</span>
                        </li>
                      </ol>
                    </PopoverContent>
                  </Popover>
                )}
                <motion.div
                  animate={{ rotate: tokenExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ChevronDown className="w-4 h-4 text-muted-foreground" />
                </motion.div>
              </button>

              <AnimatePresence initial={false}>
                {tokenExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25, ease: [0.04, 0.62, 0.23, 0.98] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-xs text-muted-foreground">
                        {tokenCardVariant === 'create-wallet'
                          ? '点击复制按钮获取包含 Token 的 Prompt，发送给 Agent 完成创建'
                          : '将此 Token 复制到您的 Agent 中完成创建'
                        }
                      </p>

                      {/* Token display */}
                      <div className={cn(
                        'flex items-center gap-2 p-2.5 rounded-lg border font-mono text-xs',
                        isExpired
                          ? 'bg-muted/50 border-border text-muted-foreground'
                          : 'bg-muted/30 border-border'
                      )}>
                        <span className="flex-1 truncate select-all">
                          {currentSetupToken?.token || '生成中...'}
                        </span>
                        {!isExpired && currentSetupToken && (
                          <button
                            onClick={handleCopy}
                            className="shrink-0 p-1 rounded transition-colors"
                            title={tokenCardVariant === 'create-wallet' ? '复制包含 Token 的 Prompt' : '复制 Token'}
                          >
                            {copied ? (
                              <Check className="w-3.5 h-3.5 text-emerald-500" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                          </button>
                        )}
                      </div>

                      {/* Timer / Expired */}
                      <div className="flex items-center justify-between">
                        {isExpired ? (
                          <>
                            <div className="flex items-center gap-1.5 text-xs text-destructive">
                              <AlertCircle className="w-3.5 h-3.5" />
                              Token 已失效
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={handleNewToken}
                              disabled={isGenerating}
                            >
                              获取新 Token
                            </Button>
                          </>
                        ) : (
                          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            有效时间 {remainingFormatted}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Agent List — click to configure individually */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-muted-foreground">Agent 列表</p>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">{humanAgents.length} 个</span>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"
                  >
                    <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
                    刷新
                  </button>
                </div>
              </div>

              {sortedAgents.length === 0 ? (
                <div className="text-center py-8">
                  <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
                  <p className="text-sm text-muted-foreground mb-1">还没有 Agent</p>
                  <p className="text-xs text-muted-foreground/70">
                    使用上方的 Setup Token 创建您的第一个 Agent
                  </p>
                </div>
              ) : (
                sortedAgents.map(agent => {
                  const delegatedForThisWallet = isAgentDelegatedToWallet(agent.principalId);
                  const delegatedElsewhere = isAgentDelegatedElsewhere(agent.principalId);
                  const isUnavailable = delegatedForThisWallet || delegatedElsewhere;

                  return (
                    <button
                      key={agent.principalId}
                      onClick={() => handleAgentClick(agent)}
                      disabled={isUnavailable}
                      className={cn(
                        'card-elevated p-3 w-full flex items-center gap-3 text-left transition-colors',
                        isUnavailable
                          ? 'opacity-60 cursor-not-allowed'
                          : 'active:bg-muted/50',
                      )}
                    >
                      <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                        <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-sm truncate">
                            {agent.displayName || agent.principalId.slice(0, 12)}
                          </span>
                          {delegatedForThisWallet && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400">
                              已关联
                            </span>
                          )}
                          {delegatedElsewhere && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400">
                              已授权
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <p className="text-xs text-muted-foreground font-mono truncate">
                            {agent.principalId.slice(0, 18)}...
                          </p>
                          {delegatedElsewhere && (
                            <>
                              <span className="text-muted-foreground/40 text-xs">·</span>
                              <span className="text-xs text-muted-foreground shrink-0 truncate max-w-[100px]">
                                {getDelegatedElsewhereWalletName(agent.principalId)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>

                      {delegatedForThisWallet ? (
                        <Check className="w-4 h-4 text-emerald-500 shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* Refresh hint */}
            <p className="text-[11px] text-muted-foreground/60 text-center px-4">
              在 Agent 侧完成创建后，点击刷新按钮更新列表
            </p>
          </div>
        </div>

        {/* Bottom buttons */}
        <div className="pb-6 pt-4 space-y-3 shrink-0">
          <Button
            size="lg"
            className="w-full text-base font-medium"
            onClick={onComplete}
          >
            {delegatedCount > 0 ? '完成' : '进入钱包'}
          </Button>
          {showSkip && onSkip && (
            <button
              onClick={onSkip}
              className="w-full text-sm text-muted-foreground transition-colors"
            >
              跳过此步骤
            </button>
          )}
        </div>
      </motion.div>

      {/* Single-agent delegation flow drawer */}
      <DelegateAgentFlowDrawer
        open={delegateDrawerOpen}
        onOpenChange={setDelegateDrawerOpen}
        agent={selectedAgent}
        preSelectedWalletId={walletId}
        onDelegated={() => {
          setDelegateDrawerOpen(false);
        }}
      />
    </div>
  );
}
