/**
 * Mock Address Generator
 * Generates realistic-looking blockchain addresses for demo purposes
 *
 * Address formats:
 * - Ethereum/BSC: 0x + 40 hex chars (42 total)
 * - Tron: T + 33 base58 chars (34 total)
 * - Solana: 32-44 base58 chars (typically 44)
 */

import { AddressSystem, WalletAddress } from '@/types/wallet';

// Base58 character set (no 0, O, I, l)
const BASE58_CHARS = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

// Generate random hex string of specified length
function randomHex(length: number): string {
  const chars = '0123456789abcdef';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)];
  }
  return result;
}

// Generate random base58 string of specified length
function randomBase58(length: number): string {
  let result = '';
  for (let i = 0; i < length; i++) {
    result += BASE58_CHARS[Math.floor(Math.random() * BASE58_CHARS.length)];
  }
  return result;
}

/**
 * Generate a realistic Ethereum/BSC address
 * Format: 0x + 40 lowercase hex characters
 */
export function generateEthAddress(): string {
  return `0x${randomHex(40)}`;
}

/**
 * Generate a realistic Tron address
 * Format: T + 33 base58 characters (34 total)
 */
export function generateTronAddress(): string {
  return `T${randomBase58(33)}`;
}

/**
 * Generate a realistic Solana address
 * Format: 44 base58 characters (typical length)
 */
export function generateSolanaAddress(): string {
  return randomBase58(44);
}

/**
 * Generate an address for a specific address system
 */
export function generateAddressForSystem(system: AddressSystem): string {
  switch (system) {
    case 'evm': return generateEthAddress();
    case 'tron': return generateTronAddress();
    case 'solana': return generateSolanaAddress();
  }
}

// Auto-incrementing ID counter for wallet addresses
let addressIdCounter = 100;

/**
 * Generate initial WalletAddress[] for a new wallet (one address per system)
 */
export function generateWalletAddresses(): WalletAddress[] {
  const now = new Date();
  return [
    {
      id: `addr-evm-${++addressIdCounter}`,
      system: 'evm',
      address: generateEthAddress(),
      label: 'EVM 地址 1',
      createdAt: now,
    },
    {
      id: `addr-tron-${++addressIdCounter}`,
      system: 'tron',
      address: generateTronAddress(),
      label: 'Tron 地址 1',
      createdAt: now,
    },
    {
      id: `addr-sol-${++addressIdCounter}`,
      system: 'solana',
      address: generateSolanaAddress(),
      label: 'Solana 地址 1',
      createdAt: now,
    },
  ];
}

/**
 * Generate a new WalletAddress for a specific system
 * @param system The address system to generate for
 * @param index The 1-based index for this address in its system
 */
export function generateNewWalletAddress(system: AddressSystem, index: number): WalletAddress {
  const systemNames: Record<AddressSystem, string> = {
    evm: 'EVM',
    tron: 'Tron',
    solana: 'Solana',
  };
  return {
    id: `addr-${system}-${++addressIdCounter}`,
    system,
    address: generateAddressForSystem(system),
    label: `${systemNames[system]} 地址 ${index}`,
    createdAt: new Date(),
  };
}

/**
 * @deprecated Use generateWalletAddresses() instead. Kept for backward compat.
 * Generate legacy addresses object for all supported chains
 */
export function generateMultiChainAddresses() {
  const evmAddr = generateEthAddress();
  return {
    all: '',
    ethereum: evmAddr,
    tron: generateTronAddress(),
    bsc: evmAddr,
    solana: generateSolanaAddress(),
  };
}

// Pre-defined realistic addresses for consistent mock data
// Wallet 1: has 2 EVM addresses (to demo multi-address), 1 tron, 1 solana
export const MOCK_WALLET_ADDRESSES: Record<string, WalletAddress[]> = {
  wallet1: [
    { id: 'addr-evm-1', system: 'evm', address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD91', label: 'EVM 地址 1', createdAt: new Date('2024-01-15') },
    { id: 'addr-evm-2', system: 'evm', address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B', label: 'EVM 地址 2', createdAt: new Date('2024-03-20') },
    { id: 'addr-tron-1', system: 'tron', address: 'TN7qZLpmCvTnfbXnYFMBEZAjuZwKyxqvMb', label: 'Tron 地址 1', createdAt: new Date('2024-01-15') },
    { id: 'addr-sol-1', system: 'solana', address: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV', label: 'Solana 地址 1', createdAt: new Date('2024-01-15') },
  ],
  wallet2: [
    { id: 'addr-evm-3', system: 'evm', address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984', label: 'EVM 地址 1', createdAt: new Date('2024-02-10') },
    { id: 'addr-tron-2', system: 'tron', address: 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8', label: 'Tron 地址 1', createdAt: new Date('2024-02-10') },
    { id: 'addr-sol-2', system: 'solana', address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM', label: 'Solana 地址 1', createdAt: new Date('2024-02-10') },
  ],
  wallet3: [
    { id: 'addr-evm-4', system: 'evm', address: '0xBE0eB53F46cd790Cd13851d5EFf43D12404d33E8', label: 'EVM 地址 1', createdAt: new Date('2024-03-05') },
    { id: 'addr-tron-3', system: 'tron', address: 'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE', label: 'Tron 地址 1', createdAt: new Date('2024-03-05') },
    { id: 'addr-sol-3', system: 'solana', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', label: 'Solana 地址 1', createdAt: new Date('2024-03-05') },
  ],
  wallet4: [
    { id: 'addr-evm-5', system: 'evm', address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', label: 'EVM 地址 1', createdAt: new Date('2024-04-01') },
    { id: 'addr-tron-4', system: 'tron', address: 'TPYmHEhy5n8TCEfYGqW2rPxsghSfzghPDn', label: 'Tron 地址 1', createdAt: new Date('2024-04-01') },
    { id: 'addr-sol-4', system: 'solana', address: 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH', label: 'Solana 地址 1', createdAt: new Date('2024-04-01') },
  ],
};

// Mock counterparty addresses for transactions
export const MOCK_COUNTERPARTY_ADDRESSES = {
  ethereum: [
    '0x1234567890abcdef1234567890abcdef12345678',
    '0x7a3F9c2B8e4D1f5A6b3C9e8D7f2A1b4C5d6E7f8A',
    '0xDEF456789012345678901234567890abcdef5678',
    '0xABC789DEF012345678901234567890abcdef1234',
  ],
  tron: [
    'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
    'TN7qZLpmCvTnfbXnYFMBEZAjuZwKyxqvMb',
    'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8',
    'TQn9Y2khEsLJW1ChVWFMSMeRDow5KcbLSE',
  ],
  bsc: [
    '0xBSC8B3392483BA26D65E331dB86D4F430E9B3814',
    '0xBnb1f9840a85d5aF5bf1D1762F925BDADdC42012',
  ],
  solana: [
    '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
    '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    '3Kz9Xm8vNqW2yR5tP7uJ4mL6nB8cD0fG1hI2jK4lM5nO',
  ],
};
