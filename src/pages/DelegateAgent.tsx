import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Bot, Plus, RefreshCw, Copy, Check, Clock, AlertCircle,
  ChevronRight, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { AppLayout } from '@/components/layout/AppLayout';
import { DelegateAgentFlowDrawer } from '@/components/DelegateAgentFlowDrawer';

import { useWallet } from '@/contexts/WalletContext';
import { useSetupTokenTimer } from '@/hooks/useSetupTokenTimer';
import { cn, copyToClipboard } from '@/lib/utils';
import { toast } from '@/lib/toast';
import type { HumanAgent, DelegatedAgentStatus } from '@/types/wallet';

// --- Status config ---
const delegatedStatusConfig: Record<DelegatedAgentStatus, { label: string; color: string }> = {
  active: {
    label: '活跃',
    color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400',
  },
  paused: {
    label: '已暂停',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  },
  revoked: {
    label: '已撤销',
    color: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400',
  },
};

// --- Wallet filter chip value for "all" ---
const ALL_WALLETS = '__all__';

export default function DelegateAgent() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preSelectedWalletId = searchParams.get('wallet') || null;

  const {
    humanAgents, delegatedAgents, wallets, currentWallet,
    fetchHumanAgents, generateSetupToken, currentSetupToken, addMockHumanAgent,
  } = useWallet();

  // --- Delegate drawer state ---
  const [delegateDrawerOpen, setDelegateDrawerOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<HumanAgent | null>(null);

  // --- Create Agent drawer state ---
  const [createDrawerOpen, setCreateDrawerOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // --- List state ---
  const [isRefreshing, setIsRefreshing] = useState(false);
  const hasRefreshedRef = useRef(false);

  // --- Wallet filter state ---
  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string>(ALL_WALLETS);

  const { remainingFormatted, isExpired } = useSetupTokenTimer(
    currentSetupToken?.expiresAt ?? null
  );

  // Generate token on mount
  useEffect(() => {
    generateSetupToken();
  }, [generateSetupToken]);

  // --- Data grouping ---

  // Undelegated: HumanAgents with no active/paused DelegatedAgent
  const undelegated = useMemo(() =>
    humanAgents.filter(ha =>
      !delegatedAgents.some(da => da.principalId === ha.principalId && da.status !== 'revoked')
    ),
    [humanAgents, delegatedAgents]
  );

  // Active + Paused delegated agents
  const activeDelegated = useMemo(() =>
    delegatedAgents.filter(da => da.status === 'active' || da.status === 'paused'),
    [delegatedAgents]
  );

  // Revoked delegated agents
  const revokedDelegated = useMemo(() =>
    delegatedAgents.filter(da => da.status === 'revoked'),
    [delegatedAgents]
  );

  const getWalletName = useCallback((walletId: string) =>
    wallets.find(w => w.id === walletId)?.name || walletId,
    [wallets]
  );

  // --- Wallet filter: extract unique wallet names from delegatedAgents ---
  const walletFilterOptions = useMemo(() => {
    const walletIdSet = new Set<string>();
    delegatedAgents.forEach(da => walletIdSet.add(da.walletId));
    const options = Array.from(walletIdSet).map(wId => ({
      walletId: wId,
      name: getWalletName(wId),
    }));
    // Sort alphabetically by name for consistency
    options.sort((a, b) => a.name.localeCompare(b.name));
    return options;
  }, [delegatedAgents, getWalletName]);

  // --- Filtered lists based on wallet filter ---
  const filteredActiveDelegated = useMemo(() => {
    if (selectedWalletFilter === ALL_WALLETS) return activeDelegated;
    return activeDelegated.filter(da => da.walletId === selectedWalletFilter);
  }, [activeDelegated, selectedWalletFilter]);

  const filteredRevokedDelegated = useMemo(() => {
    if (selectedWalletFilter === ALL_WALLETS) return revokedDelegated;
    return revokedDelegated.filter(da => da.walletId === selectedWalletFilter);
  }, [revokedDelegated, selectedWalletFilter]);

  // --- Build the full prompt text to copy ---
  const buildAgentPrompt = useCallback(() => {
    if (!currentSetupToken) return '';
    const walletName = currentWallet?.name || '我的钱包';
    const walletAddresses = currentWallet?.walletAddresses
      ?.map(a => `  - ${a.system.toUpperCase()}: ${a.address}`)
      .join('\n') || '';

    return [
      `我想将你设置为我的 Cobo 商户钱包的自动交易 Agent。`,
      ``,
      `钱包名称：${walletName}`,
      walletAddresses ? `钱包地址：\n${walletAddresses}` : '',
      ``,
      `请使用以下 Setup Token 完成关联：`,
      ``,
      `${currentSetupToken.token}`,
      ``,
      `Token 有效期 15 分钟，请尽快使用。`,
      ``,
      `关联成功后，你将可以：`,
      `1. 查询该钱包的资产余额和交易记录`,
      `2. 在授权策略范围内发起转账交易`,
      `3. 所有交易将经过风控审批后执行`,
    ].filter(Boolean).join('\n');
  }, [currentSetupToken, currentWallet]);

  // --- Handlers ---

  const handleCopy = async () => {
    if (!currentSetupToken || isExpired) return;
    const promptText = buildAgentPrompt();
    const ok = await copyToClipboard(promptText);
    if (ok) {
      setCopied(true);
      toast.success('Prompt 已复制，可直接粘贴给 Agent');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  const handleCopyToken = async () => {
    if (!currentSetupToken || isExpired) return;
    const ok = await copyToClipboard(currentSetupToken.token);
    if (ok) {
      setTokenCopied(true);
      toast.success('Token 已复制');
      setTimeout(() => setTokenCopied(false), 2000);
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

  const openDelegateDrawer = (agent: HumanAgent) => {
    setSelectedAgent(agent);
    setDelegateDrawerOpen(true);
  };

  // --- Computed ---
  const hasDelegated = activeDelegated.length > 0 || revokedDelegated.length > 0;
  const hasFilteredDelegated = filteredActiveDelegated.length > 0 || filteredRevokedDelegated.length > 0;
  const isEmpty = humanAgents.length === 0 && delegatedAgents.length === 0;

  return (
    <AppLayout title="Agent 授权管理" showBack showNav showSecurityBanner={false}>
      <div className="px-4 py-4 space-y-4 overflow-auto h-full">

        {/* ============================================ */}
        {/* 1. Create New Agent Button                   */}
        {/* ============================================ */}
        <Button
          variant="outline"
          className="w-full gap-2 h-11"
          onClick={() => setCreateDrawerOpen(true)}
        >
          <Plus className="w-4 h-4" />
          创建新 Agent
        </Button>

        {/* ============================================ */}
        {/* 2. 待授权 Section                            */}
        {/* ============================================ */}
        {undelegated.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-muted-foreground">待授权</p>
                <span className="text-xs text-muted-foreground">{undelegated.length} 个</span>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"
              >
                <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
                刷新
              </button>
            </div>

            {undelegated.map((agent, idx) => (
              <motion.button
                key={agent.principalId}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04 }}
                onClick={() => openDelegateDrawer(agent)}
                className="card-elevated p-3 w-full flex items-center gap-3 text-left active:bg-muted/50 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {agent.displayName || agent.principalId.slice(0, 12)}
                    </span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400">
                      待授权
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground font-mono truncate mt-0.5">
                    {agent.principalId.slice(0, 18)}...
                  </p>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </motion.button>
            ))}
          </div>
        )}

        {/* ============================================ */}
        {/* 3. 已授权 Section                            */}
        {/* ============================================ */}
        {hasDelegated && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <p className="text-sm font-medium text-muted-foreground">已授权</p>
              <span className="text-xs text-muted-foreground">
                {activeDelegated.length + revokedDelegated.length} 个
              </span>
            </div>

            {/* Wallet name filter chips */}
            {walletFilterOptions.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
                <button
                  onClick={() => setSelectedWalletFilter(ALL_WALLETS)}
                  className={cn(
                    'shrink-0 text-xs px-3 py-1 rounded-full font-medium transition-colors',
                    selectedWalletFilter === ALL_WALLETS
                      ? 'bg-purple-600 text-white dark:bg-purple-500'
                      : 'bg-muted text-muted-foreground'
                  )}
                >
                  全部
                </button>
                {walletFilterOptions.map(opt => (
                  <button
                    key={opt.walletId}
                    onClick={() => setSelectedWalletFilter(opt.walletId)}
                    className={cn(
                      'shrink-0 text-xs px-3 py-1 rounded-full font-medium transition-colors whitespace-nowrap',
                      selectedWalletFilter === opt.walletId
                        ? 'bg-purple-600 text-white dark:bg-purple-500'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {opt.name}
                  </button>
                ))}
              </div>
            )}

            {/* Active / Paused agents — clickable */}
            {filteredActiveDelegated.map((da, idx) => {
              const status = delegatedStatusConfig[da.status];
              const isTssActive = da.tssNodeStatus === 'active';
              return (
                <motion.button
                  key={da.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  onClick={() => navigate(`/agent-management/${da.id}`)}
                  className="card-elevated p-3 w-full flex items-center gap-3 text-left active:bg-muted/50 transition-colors"
                >
                  {/* Icon with TSS Node status indicator */}
                  <div className="relative w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900',
                        isTssActive ? 'bg-emerald-500' : 'bg-gray-400'
                      )}
                      title={isTssActive ? 'TSS Node 活跃' : 'TSS Node 非活跃'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{da.agentName}</span>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
                        status.color
                      )}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Wallet className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {getWalletName(da.walletId)}
                      </span>

                    </div>
                  </div>

                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                </motion.button>
              );
            })}

            {/* Revoked agents — dimmed, not clickable */}
            {filteredRevokedDelegated.map((da) => {
              const status = delegatedStatusConfig[da.status];
              const isTssActive = da.tssNodeStatus === 'active';
              return (
                <div
                  key={da.id}
                  className="card-elevated p-3 w-full flex items-center gap-3 text-left opacity-50"
                >
                  {/* Icon with TSS Node status indicator */}
                  <div className="relative w-9 h-9 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
                    <span
                      className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white dark:border-gray-900',
                        isTssActive ? 'bg-emerald-500' : 'bg-gray-400'
                      )}
                      title={isTssActive ? 'TSS Node 活跃' : 'TSS Node 非活跃'}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm truncate">{da.agentName}</span>
                      <span className={cn(
                        'text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
                        status.color
                      )}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Wallet className="w-3 h-3 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground truncate">
                        {getWalletName(da.walletId)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Empty state when filter yields no results */}
            {!hasFilteredDelegated && (
              <div className="text-center py-6">
                <p className="text-xs text-muted-foreground">该钱包下暂无已授权的 Agent</p>
              </div>
            )}
          </div>
        )}

        {/* ============================================ */}
        {/* 4. Empty state — no agents at all            */}
        {/* ============================================ */}
        {isEmpty && (
          <div className="text-center py-12">
            <Bot className="w-14 h-14 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground mb-1">还没有 Agent</p>
            <p className="text-xs text-muted-foreground/70">
              点击上方「创建新 Agent」获取 Setup Token，创建您的第一个 Agent
            </p>
          </div>
        )}

        {/* Show refresh hint only when there are undelegated agents or no agents */}
        {(undelegated.length > 0 || isEmpty) && (
          <p className="text-[11px] text-muted-foreground/60 text-center px-4">
            在 Agent 侧完成创建后，点击刷新按钮更新列表
          </p>
        )}

        {/* Only show refresh at bottom when undelegated section is hidden but we have no undelegated */}
        {undelegated.length === 0 && !isEmpty && (
          <div className="flex justify-center">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors py-2"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
              刷新 Agent 列表
            </button>
          </div>
        )}
      </div>

      {/* ============================================ */}
      {/* Create New Agent Drawer (Setup Token)        */}
      {/* ============================================ */}
      <Drawer open={createDrawerOpen} onOpenChange={setCreateDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader>
            <DrawerTitle>创建新 Agent</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-6 space-y-5">
            {/* How-to steps */}
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                复制以下 Prompt 发送给 AI Agent，即可完成钱包关联
              </p>
              <ol className="space-y-2.5">
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">1</span>
                  <div>
                    <p className="text-sm font-medium">复制 Prompt</p>
                    <p className="text-xs text-muted-foreground mt-0.5">包含钱包信息、Setup Token 和权限说明</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">2</span>
                  <div>
                    <p className="text-sm font-medium">发送给 Agent</p>
                    <p className="text-xs text-muted-foreground mt-0.5">在对应 AI 平台的对话框中粘贴发送</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center shrink-0 text-xs font-bold mt-0.5">3</span>
                  <div>
                    <p className="text-sm font-medium">等待关联完成</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Agent 验证 Token 后自动出现在列表中</p>
                  </div>
                </li>
              </ol>
            </div>

            {/* Prompt preview */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Prompt 预览</p>
                {!isExpired && currentSetupToken && (
                  <button
                    onClick={handleCopyToken}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {tokenCopied ? (
                      <><Check className="w-3.5 h-3.5 text-emerald-500" /> 已复制 Token</>
                    ) : (
                      <><Copy className="w-3.5 h-3.5" /> 仅复制 Token</>
                    )}
                  </button>
                )}
              </div>
              <div className={cn(
                'p-3 rounded-xl border text-xs leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto',
                isExpired
                  ? 'bg-muted/50 border-border text-muted-foreground'
                  : 'bg-muted/30 border-border'
              )}>
                {currentSetupToken ? buildAgentPrompt() : '生成中...'}
              </div>

              {/* Timer / Expired */}
              <div className="flex items-center justify-between">
                {isExpired ? (
                  <>
                    <div className="flex items-center gap-1.5 text-xs text-destructive">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Token 已失效
                    </div>
                    <button
                      className="text-xs text-primary"
                      onClick={handleNewToken}
                      disabled={isGenerating}
                    >
                      重新生成
                    </button>
                  </>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    有效时间 {remainingFormatted}
                  </div>
                )}
              </div>
            </div>

            {/* Copy button */}
            <Button
              className="w-full"
              size="lg"
              disabled={!currentSetupToken || isExpired}
              onClick={handleCopy}
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 mr-1.5" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-1.5" />
                  复制 Prompt
                </>
              )}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ============================================ */}
      {/* Delegate Agent Flow Drawer                   */}
      {/* ============================================ */}
      <DelegateAgentFlowDrawer
        open={delegateDrawerOpen}
        onOpenChange={setDelegateDrawerOpen}
        agent={selectedAgent}
        preSelectedWalletId={preSelectedWalletId}
        onDelegated={() => {
          setDelegateDrawerOpen(false);
        }}
      />
    </AppLayout>
  );
}
