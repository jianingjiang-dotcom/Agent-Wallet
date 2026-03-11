import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatAddressShort(address: string, prefixLen = 6, suffixLen = 4): string {
  if (!address || address.length <= prefixLen + suffixLen) return address;
  return `${address.slice(0, prefixLen)}...${address.slice(-suffixLen)}`;
}

export function formatTxHashShort(hash: string): string {
  if (!hash || hash.length <= 14) return hash;
  return `${hash.slice(0, 10)}...${hash.slice(-4)}`;
}

/**
 * 复制文本到剪贴板，带 execCommand fallback。
 * 在非安全上下文（HTTP / iframe）下 navigator.clipboard 不可用时自动降级。
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 优先使用 Clipboard API
  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // 权限被拒绝或非安全上下文，降级到 execCommand
    }
  }

  // Fallback: 临时 textarea + execCommand
  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    // 避免页面滚动
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '-9999px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}
