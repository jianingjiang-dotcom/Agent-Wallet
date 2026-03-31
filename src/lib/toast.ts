import { getDrawerContainer } from '@/components/layout/PhoneFrame';

let activeToast: HTMLDivElement | null = null;
let fadeTimer: ReturnType<typeof setTimeout> | null = null;
let removeTimer: ReturnType<typeof setTimeout> | null = null;

function showToast(message: string, duration = 2000) {
  // Clean up any existing toast
  if (activeToast) {
    if (fadeTimer) clearTimeout(fadeTimer);
    if (removeTimer) clearTimeout(removeTimer);
    activeToast.remove();
    activeToast = null;
  }

  const container = getDrawerContainer();
  if (!container) return;

  const el = document.createElement('div');
  el.style.cssText = `
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 9999;
    background: rgba(0, 0, 0, 0.90);
    color: #fff;
    font-size: 14px;
    line-height: 20px;
    padding: 8px 16px;
    border-radius: 12px;
    white-space: nowrap;
    pointer-events: none;
    transition: opacity 0.3s ease;
    opacity: 0;
  `;
  el.textContent = message;
  container.appendChild(el);
  activeToast = el;

  // Fade in
  requestAnimationFrame(() => {
    el.style.opacity = '1';
  });

  // Fade out and remove
  fadeTimer = setTimeout(() => {
    el.style.opacity = '0';
    removeTimer = setTimeout(() => {
      el.remove();
      if (activeToast === el) activeToast = null;
    }, 300);
  }, duration);
}

export const toast = {
  success: (title: string, _description?: string) => {
    showToast(title);
  },
  error: (title: string, _description?: string) => {
    showToast(title);
  },
  warning: (title: string, _description?: string) => {
    showToast(title);
  },
  info: (title: string, _description?: string) => {
    showToast(title);
  },
  show: (options: { title: string; description?: string }) => {
    showToast(options.title);
  },
  destructive: (title: string, _description?: string) => {
    showToast(title);
  },
  dismiss: (_toastId?: string | number) => {
    if (activeToast) {
      activeToast.remove();
      activeToast = null;
    }
  },
  fundIncoming: (options: {
    amount: number;
    symbol: string;
    level: 'safe' | 'pending' | 'risky';
    onViewDetails?: () => void;
  }) => {
    const { amount, symbol, level } = options;
    const amountStr = `${amount.toLocaleString()} ${symbol}`;
    if (level === 'safe') {
      showToast(`收款到账 ${amountStr}`, 3000);
    } else if (level === 'pending') {
      showToast(`待确认资金 ${amountStr}`, 5000);
    } else {
      showToast(`高风险资金 ${amountStr}`, 10000);
    }
  },
  fundFrozen: (options: {
    amount: number;
    symbol: string;
    reason: string;
  }) => {
    const { amount, symbol, reason } = options;
    showToast(`资金已冻结 ${amount.toLocaleString()} ${symbol}`, 10000);
  },
};
