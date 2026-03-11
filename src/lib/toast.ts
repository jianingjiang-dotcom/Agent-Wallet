import { toast as sonnerToast } from 'sonner';

interface ToastOptions {
  title: string;
  description?: string;
}

/**
 * Unified Toast API
 * 
 * This wraps the sonner toast library to provide a consistent
 * interface across the entire application.
 * 
 * Usage:
 *   import { toast } from '@/lib/toast';
 *   toast.show({ title: '成功', description: '操作已完成' });
 *   toast.success('保存成功');
 *   toast.error('操作失败', '请重试');
 */
export const toast = {
  /**
   * Show a default toast notification
   */
  show: (options: ToastOptions) => {
    sonnerToast(options.title, { description: options.description });
  },

  /**
   * Show a success toast notification
   */
  success: (title: string, description?: string) => {
    sonnerToast.success(title, { description });
  },

  /**
   * Show an error toast notification
   */
  error: (title: string, description?: string) => {
    sonnerToast.error(title, { description });
  },

  /**
   * Show a warning toast notification
   */
  warning: (title: string, description?: string) => {
    sonnerToast.warning(title, { description });
  },

  /**
   * Show an info toast notification
   */
  info: (title: string, description?: string) => {
    sonnerToast.info(title, { description });
  },

  /**
   * Compatibility method for legacy code using variant: 'destructive'
   */
  destructive: (title: string, description?: string) => {
    sonnerToast.error(title, { description });
  },

  /**
   * Dismiss a specific toast or all toasts
   */
  dismiss: (toastId?: string | number) => {
    sonnerToast.dismiss(toastId);
  },

  // ========== Fund Monitoring Toasts ==========

  /**
   * Show a fund incoming notification with appropriate styling
   */
  fundIncoming: (options: {
    amount: number;
    symbol: string;
    level: 'safe' | 'pending' | 'risky';
    onViewDetails?: () => void;
  }) => {
    const { amount, symbol, level, onViewDetails } = options;
    const amountStr = `${amount.toLocaleString()} ${symbol}`;

    if (level === 'safe') {
      sonnerToast.success('收款到账', {
        description: `收到 ${amountStr}`,
        duration: 3000,
        action: onViewDetails ? {
          label: '查看',
          onClick: onViewDetails,
        } : undefined,
      });
    } else if (level === 'pending') {
      sonnerToast.warning('待确认资金入账', {
        description: `收到 ${amountStr}，需人工确认`,
        duration: 5000,
        action: onViewDetails ? {
          label: '查看',
          onClick: onViewDetails,
        } : undefined,
      });
    } else {
      // Risky - use error toast with longer duration
      sonnerToast.error('⚠️ 高风险资金入账', {
        description: `${amountStr} 已自动冻结`,
        duration: 10000,
        action: onViewDetails ? {
          label: '立即处理',
          onClick: onViewDetails,
        } : undefined,
      });
    }
  },

  /**
   * Show a fund auto-frozen notification
   */
  fundFrozen: (options: {
    amount: number;
    symbol: string;
    reason: string;
  }) => {
    const { amount, symbol, reason } = options;
    sonnerToast.error('资金已自动冻结', {
      description: `${amount.toLocaleString()} ${symbol} - ${reason}`,
      duration: 10000,
    });
  },
};
