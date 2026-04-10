import { useNavigate } from 'react-router-dom';
import {
  FileText, ShieldCheck, CloudOff, ArrowUpCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { StatusBadge } from './StatusBadge';
import { CryptoIconWithChain } from '@/components/CryptoIconWithChain';
import type { Message, MessageSubType } from '@/types/notification';
import type { ChainId } from '@/types/wallet';

interface MessageCardProps {
  message: Message;
  onRead: (id: string) => void;
}

// Generic icon mapping for non-crypto messages
const genericIconMap: Partial<Record<MessageSubType, { icon: LucideIcon; bg: string; color: string }>> = {
  message_signing:  { icon: FileText,      bg: 'bg-blue-100 dark:bg-blue-900/30',    color: 'text-blue-600 dark:text-blue-400' },
  backup_reminder:  { icon: CloudOff,      bg: 'bg-amber-100 dark:bg-amber-900/30',  color: 'text-amber-600 dark:text-amber-400' },
  upgrade_prompt:   { icon: ArrowUpCircle, bg: 'bg-blue-100 dark:bg-blue-900/30',    color: 'text-blue-600 dark:text-blue-400' },
};

// All Pact subTypes share one icon
const pactSubTypes: MessageSubType[] = ['pact_activated', 'pact_rejected', 'pact_completed', 'pact_expired', 'pact_revoked'];
const pactIconConfig = { icon: ShieldCheck, bg: 'bg-violet-100 dark:bg-violet-900/30', color: 'text-violet-600 dark:text-violet-400' };

export function MessageCard({ message, onRead }: MessageCardProps) {
  const navigate = useNavigate();

  const handleClick = () => {
    if (!message.isRead) onRead(message.id);
    navigate(message.route);
  };

  // Render icon area
  const renderIcon = () => {
    if (message.icon.type === 'crypto') {
      return (
        <CryptoIconWithChain
          symbol={message.icon.symbol}
          chainId={message.icon.chainId as ChainId}
          size="lg"
        />
      );
    }

    // Pact types — unified ShieldCheck icon
    if (pactSubTypes.includes(message.subType)) {
      const PactIcon = pactIconConfig.icon;
      return (
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', pactIconConfig.bg)}>
          <PactIcon className={cn('w-5 h-5', pactIconConfig.color)} strokeWidth={1.5} />
        </div>
      );
    }

    // Other generic icons
    const config = genericIconMap[message.subType];
    if (config) {
      const Icon = config.icon;
      return (
        <div className={cn('w-10 h-10 rounded-full flex items-center justify-center', config.bg)}>
          <Icon className={cn('w-5 h-5', config.color)} strokeWidth={1.5} />
        </div>
      );
    }

    return (
      <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
        <FileText className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
      </div>
    );
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-start gap-3 p-3 rounded-xl border bg-card transition-colors active:bg-muted/50 text-left',
        !message.isRead
          ? 'border-primary/30 bg-primary/[0.02]'
          : 'border-border'
      )}
    >
      {/* Icon */}
      <div className="flex-shrink-0 pt-0.5">
        {renderIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p className={cn(
            'text-sm truncate',
            !message.isRead ? 'font-normal text-foreground' : 'font-normal text-foreground/80'
          )}>
            {message.title}
          </p>
          {/* Right side: amount (if present) */}
          {message.amount && (
            <span className={cn(
              'text-sm font-normal whitespace-nowrap flex-shrink-0',
              message.amount.startsWith('+') ? 'text-emerald-600 dark:text-emerald-400' : 'text-foreground'
            )}>
              {message.amount}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 mt-0.5">
          {message.summary && (
            <p className="text-xs text-muted-foreground truncate">
              {message.summary}
            </p>
          )}
          <div className="flex-shrink-0">
            <StatusBadge label={message.status.label} variant={message.status.variant} />
          </div>
        </div>
      </div>
    </button>
  );
}
