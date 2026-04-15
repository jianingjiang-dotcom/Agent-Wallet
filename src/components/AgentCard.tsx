import { Bot, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DelegatedAgent, DelegatedAgentStatus } from '@/types/wallet';


interface AgentCardProps {
  agent: DelegatedAgent;
  walletName: string;
  onClick: () => void;
}

const statusConfig: Record<DelegatedAgentStatus, { label: string; color: string }> = {
  active: {
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

export function AgentCard({ agent, walletName, onClick }: AgentCardProps) {
  const status = statusConfig[agent.status];
  const isTssActive = agent.tssNodeStatus === 'active';

  return (
    <button
      onClick={onClick}
      className={cn(
        'card-elevated p-4 w-full flex items-center gap-3 text-left',
        'active:bg-muted/50 transition-colors'
      )}
    >
      {/* Icon with TSS Node status indicator */}
      <div className="relative w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Bot className="w-5 h-5 text-primary" strokeWidth={1.5} />
        {/* TSS Node status dot */}
        <span
          className={cn(
            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white dark:border-gray-900',
            isTssActive ? 'bg-success/80' : 'bg-gray-400'
          )}
          title={isTssActive ? 'TSS Node 活跃' : 'TSS Node 非活跃'}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-sm text-foreground truncate">
            {agent.agentName}
          </span>
          <span
            className={cn(
              'text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
              status.color
            )}
          >
            {status.label}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
          {agent.principalId.slice(0, 10)}...
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-xs text-muted-foreground">{walletName}</span>
        </div>
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
    </button>
  );
}
