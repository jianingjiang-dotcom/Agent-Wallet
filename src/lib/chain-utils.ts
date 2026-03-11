/**
 * Chain Utilities - Unified helper functions for blockchain networks
 * 
 * Supported chains:
 * - Ethereum (ETH)
 * - Tron (TRX)
 * - Solana (SOL)
 * - BNB Chain (BNB)
 * - EVM (unified Ethereum + BSC for address book)
 */

import { ChainId, AddressBookChainId, AddressSystem, WalletAddress, Wallet, SUPPORTED_CHAINS } from '@/types/wallet';

type AnyChainId = ChainId | AddressBookChainId;

/**
 * Get chain full name (e.g., "Ethereum", "BNB Chain")
 */
export function getChainName(chainId: AnyChainId): string {
  if (chainId === 'evm') return 'EVM';
  return SUPPORTED_CHAINS.find(c => c.id === chainId)?.name || chainId;
}

/**
 * Get chain short name (e.g., "ETH", "BNB")
 */
export function getChainShortName(chainId: AnyChainId): string {
  if (chainId === 'evm') return 'EVM';
  return SUPPORTED_CHAINS.find(c => c.id === chainId)?.shortName || chainId;
}

/**
 * Get chain label for address book and compact displays
 * Uses full chain names instead of abbreviations
 */
export function getChainLabel(chainId: AnyChainId): string {
  if (chainId === 'ethereum' || chainId === 'bsc' || chainId === 'evm') return 'EVM';
  if (chainId === 'tron') return 'Tron';
  if (chainId === 'solana') return 'Solana';
  return getChainName(chainId);
}

/**
 * Validate address format for a specific chain
 */
export function validateAddress(address: string, chainId: AnyChainId): boolean {
  if (!address) return false;
  
  // EVM chains (Ethereum, BSC, or unified EVM)
  if (chainId === 'ethereum' || chainId === 'bsc' || chainId === 'evm') {
    return /^0x[a-fA-F0-9]{40}$/.test(address);
  }
  
  // Tron
  if (chainId === 'tron') {
    return /^T[a-zA-Z0-9]{33}$/.test(address);
  }
  
  // Solana (Base58, 32-44 characters)
  if (chainId === 'solana') {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
  
  return false;
}

/**
 * Get address placeholder text for input fields
 */
export function getAddressPlaceholder(chainId: AnyChainId): string {
  if (chainId === 'tron') return 'T...';
  if (chainId === 'solana') return 'Base58 地址...';
  return '0x...';
}

/**
 * Get the gas/fee token for a specific chain
 */
export function getGasToken(chainId: AnyChainId): string {
  switch (chainId) {
    case 'ethereum': return 'ETH';
    case 'bsc': return 'BNB';
    case 'evm': return 'ETH';
    case 'tron': return 'TRX';
    case 'solana': return 'SOL';
    default: return chainId.toUpperCase();
  }
}

/**
 * Check if a chain supports EVM (Ethereum Virtual Machine)
 */
export function isEVMChain(chainId: AnyChainId): boolean {
  return chainId === 'ethereum' || chainId === 'bsc' || chainId === 'evm';
}

/**
 * Map a ChainId to its AddressSystem
 * EVM chains (ethereum, bsc) share the same address system
 */
export function getAddressSystem(chainId: ChainId | AddressBookChainId): AddressSystem {
  if (chainId === 'ethereum' || chainId === 'bsc' || chainId === 'evm') return 'evm';
  if (chainId === 'tron') return 'tron';
  return 'solana';
}

/**
 * Get all wallet addresses for a specific chain
 * (finds addresses matching the chain's address system)
 */
export function getAddressesForChain(wallet: Wallet | null | undefined, chainId: ChainId): WalletAddress[] {
  if (!wallet?.walletAddresses) return [];
  const system = getAddressSystem(chainId);
  return wallet.walletAddresses.filter(a => a.system === system);
}

/**
 * Get the system display name
 */
export function getSystemName(system: AddressSystem): string {
  switch (system) {
    case 'evm': return 'EVM';
    case 'tron': return 'Tron';
    case 'solana': return 'Solana';
  }
}
