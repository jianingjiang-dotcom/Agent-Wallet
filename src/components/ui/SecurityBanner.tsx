import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, WifiOff, ChevronRight, X, AlertOctagon } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { getTSSNodeInfo } from '@/lib/tss-node';
import { useNavigate } from 'react-router-dom';
import { isAgentLinked } from '@/types/wallet';

// ── System announcement data ──
interface SystemAnnouncement {
  id: string;
  type: 'service_down' | 'chain_congestion';
  priority: number;
  title: string;
  description: string;
  dismissible: boolean;
  detailContent?: string;
}

const SYSTEM_ANNOUNCEMENTS: Record<string, SystemAnnouncement> = {
  service_down: {
    id: 'ann-service-down',
    type: 'service_down',
    priority: 0,
    title: '服务暂时不可用',
    description: '我们正在紧急修复，请稍后重试',
    dismissible: false,
    detailContent: '尊敬的用户：\n\n由于底层链节点升级，以下服务暂时不可用：\n· Ethereum 转账\n· 合约交互\n\n预计恢复时间：2026-04-12 12:00\n\n期间您的资产不受影响，请耐心等待。如有紧急需求，请联系客服。',
  },
  chain_congestion: {
    id: 'ann-chain-congestion',
    type: 'chain_congestion',
    priority: 1,
    title: 'Ethereum 网络拥堵',
    description: '交易确认可能延迟',
    dismissible: true,
  },
};

// ── Banner config type ──
interface BannerConfig {
  show: boolean;
  variant?: 'error' | 'warning';
  icon?: typeof ShieldAlert;
  title?: string;
  description?: string;
  action?: string;
  actionPath?: string;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export function SecurityBanner() {
  const { walletStatus, systemStatus, currentWallet } = useWallet();
  const navigate = useNavigate();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // ── System announcement banner (highest priority) ──
  const getSystemBanner = (): BannerConfig => {
    if (systemStatus === 'normal') return { show: false };

    const ann = SYSTEM_ANNOUNCEMENTS[systemStatus];
    if (!ann) return { show: false };
    if (dismissedIds.has(ann.id)) return { show: false };

    return {
      show: true,
      variant: 'error',
      icon: systemStatus === 'service_down' ? AlertOctagon : AlertTriangle,
      title: ann.title,
      description: ann.description,
      dismissible: ann.dismissible,
      onDismiss: ann.dismissible ? () => setDismissedIds(prev => new Set(prev).add(ann.id)) : undefined,
      action: ann.detailContent ? '详情' : undefined,
      actionPath: ann.detailContent ? `/system-announcement/${ann.id}` : undefined,
    };
  };

  // ── Security banner (lower priority) ──
  const getSecurityBanner = (): BannerConfig => {
    if (!currentWallet) return { show: false };
    if (isAgentLinked(currentWallet)) return { show: false };

    const tssNodeInfo = getTSSNodeInfo();
    const hasTSSNodeBackup = tssNodeInfo.backup.hasCloudBackup || tssNodeInfo.backup.hasLocalBackup;
    const isWalletBackedUp = currentWallet?.isBackedUp || false;
    const isFullyBackedUp = hasTSSNodeBackup || isWalletBackedUp;

    switch (walletStatus) {
      case 'claimed_no_key':
        return {
          show: true,
          variant: 'warning',
          icon: ShieldAlert,
          title: '请完成密钥生成',
          description: '生成 MPC 密钥分片后即可正常使用',
          action: '去完成',
          actionPath: '/claim-wallet?resume=keygen',
        };
      case 'created_no_backup':
        if (isFullyBackedUp) return { show: false };
        if (currentWallet?.origin === 'claimed') {
          return {
            show: true,
            variant: 'warning',
            icon: ShieldAlert,
            title: '请完成钱包备份',
            description: '备份密钥后可防止手机丢失导致资产无法恢复',
            action: '去备份',
            actionPath: '/claim-wallet?resume=backup',
          };
        }
        return {
          show: true,
          variant: 'warning',
          icon: ShieldAlert,
          title: '请完成资产保险箱备份',
          description: '备份未完成将限制转账功能',
          action: '立即备份',
          actionPath: '/profile/security/tss-backup',
        };
      case 'device_risk':
        return {
          show: true,
          variant: 'error',
          icon: AlertTriangle,
          title: '检测到设备安全风险',
          description: '当前设备可能已被破解，部分功能受限',
        };
      case 'service_unavailable':
        return {
          show: true,
          variant: 'warning',
          icon: WifiOff,
          title: '服务暂时不可用',
          description: '可使用自助模式转移资产',
          action: '了解更多',
        };
      case 'backup_complete':
      case 'fully_secure':
        return { show: false };
      default:
        if (!isFullyBackedUp) {
          return {
            show: true,
            variant: 'warning',
            icon: ShieldAlert,
            title: '请完成资产保险箱备份',
            description: '备份未完成将限制转账功能',
            action: '立即备份',
            actionPath: '/profile/security/tss-backup',
          };
        }
        return { show: false };
    }
  };

  // Priority: system > security
  const systemBanner = getSystemBanner();
  const securityBanner = getSecurityBanner();
  const config = systemBanner.show ? systemBanner : securityBanner;

  if (!config.show) return null;

  const Icon = config.icon!;
  const isError = config.variant === 'error';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="px-4 py-3"
      >
        <div
          className={cn(
            'p-4 border rounded-xl',
            isError
              ? 'bg-red-50 dark:bg-red-900/15 border-red-200/50 dark:border-red-800/40'
              : 'bg-warning-surface border-warning/30'
          )}
          onClick={() => config.actionPath && navigate(config.actionPath)}
          role={config.actionPath ? 'button' : undefined}
          style={config.actionPath ? { cursor: 'pointer' } : undefined}
        >
          <div className="flex items-center gap-3">
            <div className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
              isError ? 'bg-red-100 dark:bg-red-800/30' : 'bg-warning/20'
            )}>
              <Icon className={cn('w-4 h-4', isError ? 'text-red-600' : 'text-warning')} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">{config.title}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{config.description}</p>
            </div>
            {config.dismissible && config.onDismiss ? (
              <button
                onClick={(e) => { e.stopPropagation(); config.onDismiss!(); }}
                className="p-1 rounded-full text-muted-foreground shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            ) : config.action ? (
              <span className={cn(
                'flex items-center gap-0.5 text-[12px] font-medium shrink-0',
                isError ? 'text-red-600' : 'text-warning'
              )}>
                {config.action}
                <ChevronRight className="w-3.5 h-3.5" />
              </span>
            ) : null}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
