// TSS Node utility functions
import { TSSNodeInfo, TSSNodeBackupInfo, TSSNodeStatus } from '@/types/wallet';

const TSS_NODE_STORAGE_KEY = 'tss_node_info';

// Default TSS Node state
const defaultTSSNodeInfo: TSSNodeInfo = {
  status: 'not_created',
  backup: {
    hasCloudBackup: false,
    hasLocalBackup: false,
  },
};

// Get TSS Node info from storage
export function getTSSNodeInfo(): TSSNodeInfo {
  const stored = localStorage.getItem(TSS_NODE_STORAGE_KEY);
  if (stored) {
    try {
      const parsed = JSON.parse(stored);
      // Convert date strings back to Date objects
      if (parsed.createdAt) parsed.createdAt = new Date(parsed.createdAt);
      if (parsed.backup?.cloudBackupTime) {
        parsed.backup.cloudBackupTime = new Date(parsed.backup.cloudBackupTime);
      }
      if (parsed.backup?.localBackupTime) {
        parsed.backup.localBackupTime = new Date(parsed.backup.localBackupTime);
      }
      return parsed;
    } catch {
      return defaultTSSNodeInfo;
    }
  }
  return defaultTSSNodeInfo;
}

// Save TSS Node info to storage
export function saveTSSNodeInfo(info: TSSNodeInfo): void {
  localStorage.setItem(TSS_NODE_STORAGE_KEY, JSON.stringify(info));
}

// Create TSS Node
export function createTSSNode(): TSSNodeInfo {
  const info: TSSNodeInfo = {
    status: 'created',
    createdAt: new Date(),
    backup: {
      hasCloudBackup: false,
      hasLocalBackup: false,
    },
  };
  saveTSSNodeInfo(info);
  return info;
}

// Update TSS Node backup status
export function updateTSSNodeBackup(
  backup: Partial<TSSNodeBackupInfo>
): TSSNodeInfo {
  const current = getTSSNodeInfo();
  const updated: TSSNodeInfo = {
    ...current,
    backup: {
      ...current.backup,
      ...backup,
    },
  };
  saveTSSNodeInfo(updated);
  return updated;
}

// Mark TSS Node as recovered
export function markTSSNodeRecovered(): TSSNodeInfo {
  const current = getTSSNodeInfo();
  const updated: TSSNodeInfo = {
    ...current,
    status: 'recovered',
  };
  saveTSSNodeInfo(updated);
  return updated;
}

// Check if TSS Node exists for an account
export function checkTSSNodeExists(): {
  exists: boolean;
  hasCloudBackup: boolean;
  cloudProvider?: 'icloud' | 'google_drive';
  hasLocalBackup: boolean;
  lastBackupTime?: Date;
} {
  const info = getTSSNodeInfo();
  
  return {
    exists: info.status !== 'not_created',
    hasCloudBackup: info.backup.hasCloudBackup,
    cloudProvider: info.backup.cloudProvider,
    hasLocalBackup: info.backup.hasLocalBackup,
    lastBackupTime: info.backup.cloudBackupTime || info.backup.localBackupTime,
  };
}

// Reset TSS Node (for testing)
export function resetTSSNode(): void {
  localStorage.removeItem(TSS_NODE_STORAGE_KEY);
}

// Format time ago for display
export function formatTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor(diffMs / (1000 * 60));

  if (diffDays > 0) {
    return `${diffDays} 天前`;
  } else if (diffHours > 0) {
    return `${diffHours} 小时前`;
  } else if (diffMinutes > 0) {
    return `${diffMinutes} 分钟前`;
  } else {
    return '刚刚';
  }
}
