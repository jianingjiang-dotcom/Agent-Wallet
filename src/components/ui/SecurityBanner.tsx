import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ShieldAlert, WifiOff, ChevronRight } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { getTSSNodeInfo } from '@/lib/tss-node';
import { useNavigate } from 'react-router-dom';
import { isAgentLinked } from '@/types/wallet';

export function SecurityBanner() {
  const { walletStatus, currentWallet } = useWallet();
  const navigate = useNavigate();

  // Agent-linked wallets don't need MPC backup
  if (isAgentLinked(currentWallet)) return null;

  const getBannerConfig = () => {
    // Check TSS Node backup status (account-level, not wallet-level)
    const tssNodeInfo = getTSSNodeInfo();
    const hasTSSNodeBackup = tssNodeInfo.backup.hasCloudBackup || tssNodeInfo.backup.hasLocalBackup;
    
    // Also check current wallet backup status
    const isWalletBackedUp = currentWallet?.isBackedUp || false;
    
    // If TSS Node is backed up OR wallet is backed up, don't show backup banner
    const isFullyBackedUp = hasTSSNodeBackup || isWalletBackedUp;

    switch (walletStatus) {
      case 'created_no_backup':
        // Only show if neither TSS Node nor wallet is backed up
        if (isFullyBackedUp) {
          return { show: false };
        }
        return {
          type: 'error' as const,
          icon: ShieldAlert,
          title: '请完成资产保险箱备份',
          description: '备份未完成将限制转账功能',
          action: '立即备份',
          actionPath: '/profile/security/tss-backup',
          show: true,
        };
      case 'device_risk':
        return {
          type: 'error' as const,
          icon: AlertTriangle,
          title: '检测到设备安全风险',
          description: '当前设备可能已被破解，部分功能受限',
          show: true,
        };
      case 'service_unavailable':
        return {
          type: 'warning' as const,
          icon: WifiOff,
          title: '服务暂时不可用',
          description: '可使用自助模式转移资产',
          action: '了解更多',
          show: true,
        };
      case 'backup_complete':
      case 'fully_secure':
        // Already backed up, don't show banner
        return { show: false };
      default:
        // For any other wallet status (including normal wallets), check if backup is needed
        // Show backup banner if wallet exists but not backed up
        if (!isFullyBackedUp) {
          return {
            type: 'error' as const,
            icon: ShieldAlert,
            title: '请完成资产保险箱备份',
            description: '备份未完成将限制转账功能',
            action: '立即备份',
            actionPath: '/profile/security/tss-backup',
            show: true,
          };
        }
        return { show: false };
    }
  };

  const config = getBannerConfig();

  if (!config.show) return null;

  const Icon = config.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: 'auto', opacity: 1 }}
        exit={{ height: 0, opacity: 0 }}
        className="px-4 py-3"
      >
        <div className="p-4 bg-warning-surface border border-warning/30 rounded-xl">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-warning" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground">
                {config.title}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {config.description}
              </p>
            </div>
            {config.action && (
              <button 
                onClick={() => config.actionPath && navigate(config.actionPath)}
                className="flex items-center gap-1 text-sm font-medium shrink-0 text-warning"
              >
                {config.action}
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
