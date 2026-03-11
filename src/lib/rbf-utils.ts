/**
 * RBF (Replace-By-Fee) Utility Functions
 * 
 * Handles logic for transaction acceleration and cancellation
 * across different blockchain networks.
 */

import { Transaction, ChainId } from '@/types/wallet';

// Chains that support RBF
const RBF_SUPPORTED_CHAINS = ['ethereum', 'bsc'];

// Chains that don't support RBF
const RBF_UNSUPPORTED_CHAINS = ['tron', 'solana'];

export type SpeedUpTier = 'low' | 'medium' | 'high';

export interface SpeedUpOption {
  tier: SpeedUpTier;
  label: string;
  multiplier: number;
  newFee: number;
  newGasAmount: number;
  additionalFee: number;
  additionalGasAmount: number;
  estimatedTime: string;
}

export interface RbfSupportInfo {
  canSpeedUp: boolean;
  canCancel: boolean;
  reason?: string;
}

/**
 * Check if a transaction supports RBF operations
 */
export function getRbfSupport(tx: Transaction): RbfSupportInfo {
  // Only pending send transactions can be accelerated/cancelled
  if (tx.status !== 'pending') {
    return { 
      canSpeedUp: false, 
      canCancel: false
    };
  }

  if (tx.type !== 'send') {
    return { 
      canSpeedUp: false, 
      canCancel: false
    };
  }

  // Check if already replaced
  if (tx.replacedByTxHash) {
    return { 
      canSpeedUp: false, 
      canCancel: false
    };
  }

  // Tron and other unsupported chains - just hide RBF, no message needed
  if (RBF_UNSUPPORTED_CHAINS.includes(tx.network)) {
    return { 
      canSpeedUp: false, 
      canCancel: false
    };
  }

  // Check EVM chains - all EVM chains support RBF
  if (RBF_SUPPORTED_CHAINS.includes(tx.network)) {
    return { canSpeedUp: true, canCancel: true };
  }

  // Bitcoin requires opt-in RBF
  if (tx.network === 'bitcoin') {
    if (tx.isRbfEnabled === false) {
      return { 
        canSpeedUp: false, 
        canCancel: false, 
        reason: '此交易未启用 RBF，无法加速' 
      };
    }
    return { canSpeedUp: true, canCancel: true };
  }

  // Default: not supported, hide silently
  return { 
    canSpeedUp: false, 
    canCancel: false
  };
}

/**
 * Check if transaction can be sped up (convenience function)
 */
export function canSpeedUp(tx: Transaction): boolean {
  return getRbfSupport(tx).canSpeedUp;
}

/**
 * Check if transaction can be cancelled (convenience function)
 */
export function canCancel(tx: Transaction): boolean {
  return getRbfSupport(tx).canCancel;
}

/**
 * Calculate speed-up fee options based on current transaction fee
 */
export function calculateSpeedUpFees(
  currentFee: number,
  currentGasAmount: number,
  gasToken: string = 'ETH'
): SpeedUpOption[] {
  const tiers: { tier: SpeedUpTier; multiplier: number; label: string; time: string }[] = [
    { tier: 'low', multiplier: 1.2, label: '慢速', time: '~20分钟' },
    { tier: 'medium', multiplier: 1.5, label: '标准', time: '~5分钟' },
    { tier: 'high', multiplier: 2.0, label: '快速', time: '~1分钟' },
  ];

  return tiers.map(({ tier, multiplier, label, time }) => ({
    tier,
    label,
    multiplier,
    newFee: currentFee * multiplier,
    newGasAmount: currentGasAmount * multiplier,
    additionalFee: currentFee * (multiplier - 1),
    additionalGasAmount: currentGasAmount * (multiplier - 1),
    estimatedTime: time,
  }));
}

/**
 * Calculate cancellation fee (slightly higher than current to ensure replacement)
 */
export function calculateCancelFee(
  currentFee: number,
  currentGasAmount: number
): { fee: number; gasAmount: number } {
  const multiplier = 1.2; // 20% higher to ensure replacement
  return {
    fee: currentFee * multiplier,
    gasAmount: currentGasAmount * multiplier,
  };
}

/**
 * Get the gas token for a given network
 */
export function getGasToken(network: string): string {
  switch (network) {
    case 'ethereum':
      return 'ETH';
    case 'bsc':
      return 'BNB';
    case 'tron':
      return 'TRX';
    case 'solana':
      return 'SOL';
    case 'bitcoin':
      return 'BTC';
    default:
      return 'ETH';
  }
}

/**
 * Format time elapsed since transaction was submitted
 */
export function formatWaitTime(timestamp: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(timestamp).getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return '刚刚';
  if (diffMins < 60) return `${diffMins} 分钟`;
  
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} 小时`;
  
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays} 天`;
}
