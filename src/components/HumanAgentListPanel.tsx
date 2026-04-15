import { useState, useEffect } from 'react';
import {
  Bot, Copy, Check, RefreshCw, Clock, AlertCircle, ChevronRight, Wallet,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { useSetupTokenTimer } from '@/hooks/useSetupTokenTimer';
import { cn } from '@/lib/utils';
import { copyToClipboard } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { HumanAgent, HumanAgentDelegationStatus } from '@/types/wallet';

interface HumanAgentListPanelProps {
  onDelegateAgent: (agent: HumanAgent) => void;
  onViewAgent?: (agentId: string) => void;
  showHeader?: boolean;
}

const statusConfig: Record<HumanAgentDelegationStatus, { label: string; color: string }> = {
  not_delegated: {
    label: '未授权',
    color: 'bg-primary/10 text-primary',
  },
  delegated: {
    label: '已授权',
    color: 'bg-success/10 text-success',
  },
  paused: {
    label: '已暂停',
    color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400',
  },
  revoked: {
    label: '已撤销',
    color: 'bg-destructive/10 text-destructive',
  },
};

export function HumanAgentListPanel({
  onDelegateAgent,
  onViewAgent,
  showHeader = true,
}: HumanAgentListPanelProps) {
  const {
    humanAgents, currentSetupToken, delegatedAgents,
    fetchHumanAgents, generateSetupToken, wallets,
  } = useWallet();

  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const { remainingFormatted, isExpired } = useSetupTokenTimer(
    currentSetupToken?.expiresAt ?? null
  );

  // Generate token on mount
  useEffect(() => {
    generateSetupToken();
  }, [generateSetupToken]);

  const handleCopy = async () => {
    if (!currentSetupToken || isExpired) return;
    const ok = await copyToClipboard(currentSetupToken.token);
    if (ok) {
      setCopied(true);
      toast.success('Token 已复制');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchHumanAgents();
    setIsRefreshing(false);
    toast.success('列表已刷新');
  };

  const handleNewToken = async () => {
    setIsGenerating(true);
    // Force new token by clearing current first
    await generateSetupToken();
    setIsGenerating(false);
  };

  // Check if agent is already delegated to any wallet (active or paused)
  const isAgentAlreadyDelegated = (principalId: string) => {
    return delegatedAgents.some(
      da => da.principalId === principalId && da.status !== 'revoked'
    );
  };

  const handleAgentClick = (agent: HumanAgent) => {
    // Agent already delegated (active/paused) — cannot delegate again
    if (isAgentAlreadyDelegated(agent.principalId)) {
      if (agent.delegatedAgentId && onViewAgent) {
        onViewAgent(agent.delegatedAgentId);
      }
      return;
    }
    if (agent.delegationStatus === 'not_delegated') {
      onDelegateAgent(agent);
    } else if (agent.delegatedAgentId && onViewAgent) {
      onViewAgent(agent.delegatedAgentId);
    }
  };

  const getWalletName = (walletId?: string) => {
    if (!walletId) return '';
    return wallets.find(w => w.id === walletId)?.name || walletId;
  };

  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-base">我的 Agent</h3>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 text-xs text-muted-foreground transition-colors"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRefreshing && 'animate-spin')} />
            刷新
          </button>
        </div>
      )}

      {/* Setup Token Card */}
      <div className="card-elevated p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-accent" />
          </div>
          <span className="text-sm font-medium">创建新 Agent</span>
        </div>

        <p className="text-xs text-muted-foreground">
          将此 Token 复制到您的 Agent 中完成创建，创建后在下方列表可见
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
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-success" />
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

      {/* Agent List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-muted-foreground">Agent 列表</p>
          <span className="text-xs text-muted-foreground">{humanAgents.length} 个</span>
        </div>

        {humanAgents.length === 0 ? (
          <div className="text-center py-10">
            <Bot className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" strokeWidth={1} />
            <p className="text-sm text-muted-foreground mb-1">还没有 Agent</p>
            <p className="text-xs text-muted-foreground/70">
              使用上方的 Setup Token 创建您的第一个 Agent
            </p>
          </div>
        ) : (
          humanAgents.map(agent => {
            const status = statusConfig[agent.delegationStatus];
            const alreadyDelegated = isAgentAlreadyDelegated(agent.principalId);
            return (
              <button
                key={agent.principalId}
                onClick={() => handleAgentClick(agent)}
                disabled={alreadyDelegated}
                className={cn(
                  'card-elevated p-3 w-full flex items-center gap-3 text-left transition-colors',
                  alreadyDelegated
                    ? 'opacity-60 cursor-not-allowed'
                    : 'active:bg-muted/50'
                )}
              >
                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-primary" strokeWidth={1.5} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm truncate">
                      {agent.displayName || agent.principalId.slice(0, 12)}
                    </span>
                    <span className={cn(
                      'text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
                      status.color
                    )}>
                      {status.label}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 mt-0.5">
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {agent.principalId.slice(0, 18)}...
                    </p>
                    {agent.delegatedWalletId && (
                      <>
                        <span className="text-muted-foreground/40 text-xs">·</span>
                        <div className="flex items-center gap-0.5 text-xs text-muted-foreground shrink-0">
                          <Wallet className="w-3 h-3" />
                          <span className="truncate max-w-[80px]">{getWalletName(agent.delegatedWalletId)}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            );
          })
        )}
      </div>

      {/* Refresh hint */}
      <p className="text-[11px] text-muted-foreground/60 text-center px-4">
        在 Agent 侧完成关联后，点击刷新按钮更新列表
      </p>
    </div>
  );
}
