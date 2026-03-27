import React, { createContext, useContext, useState, useCallback, useRef, ReactNode, useMemo } from 'react';
import {
  Wallet, Asset, Transaction, Contact, Device,
  SecurityConfig, BackupStatus, WalletStatus, WalletState,
  RiskColor, ChainId, AggregatedAsset, ChainAsset, UserInfo, LimitStatus,
  Notification,
  AuthResult, UserType,
  AddressSystem, WalletAddress, buildLegacyAddresses,
  DelegatedAgent, DelegatedAgentStatus, DelegatedAgentRiskConfig,
  AgentTransaction, AgentTxStatus,
  AgentRiskConfig, WalletControlMode,
  AgentPermissions, TssNodeAgentStatus, DEFAULT_AGENT_PERMISSIONS,
  CHAIN_CONFIRMATIONS, ReconciliationSummary,
  AgentTransferRequest, WalletBackupInfo,
  HumanAgent, SetupToken, SETUP_TOKEN_VALIDITY_MS,
  AgentPolicy, DefaultPolicyAction,
} from '@/types/wallet';
import {
  MOCK_WALLET_ADDRESSES,
  generateMultiChainAddresses,
  generateWalletAddresses,
  generateNewWalletAddress,
} from '@/lib/mock-addresses';
import { getAddressSystem } from '@/lib/chain-utils';

// Mock data for demonstration - wallet-specific assets
// Each wallet has its own assets
// Wallet 1: has 2 EVM addresses (addr-evm-1, addr-evm-2) to demo multi-address
const mockAssetsWallet1: Asset[] = [
  // Ethereum chain — EVM 地址 1
  { symbol: 'USDT', name: 'Tether USD', balance: 5500.50, usdValue: 5500.50, change24h: 0.01, icon: 'USDT', network: 'ethereum', addressId: 'addr-evm-1' },
  { symbol: 'USDC', name: 'USD Coin', balance: 3230.00, usdValue: 3230.00, change24h: 0.00, icon: 'USDC', network: 'ethereum', addressId: 'addr-evm-1' },
  { symbol: 'ETH', name: 'Ethereum', balance: 1.45, usdValue: 5075.00, change24h: 2.34, icon: 'ETH', network: 'ethereum', addressId: 'addr-evm-1' },
  { symbol: 'BTC', name: 'Bitcoin', balance: 0.125, usdValue: 12187.50, change24h: 1.85, icon: 'BTC', network: 'ethereum', addressId: 'addr-evm-1' },
  { symbol: 'LINK', name: 'Chainlink', balance: 150, usdValue: 2775.00, change24h: 1.9, icon: 'LINK', network: 'ethereum', addressId: 'addr-evm-1' },
  // Ethereum chain — EVM 地址 2 (second EVM address with some overlapping tokens)
  { symbol: 'USDT', name: 'Tether USD', balance: 3000.00, usdValue: 3000.00, change24h: 0.01, icon: 'USDT', network: 'ethereum', addressId: 'addr-evm-2' },
  { symbol: 'ETH', name: 'Ethereum', balance: 1.0, usdValue: 3500.00, change24h: 2.34, icon: 'ETH', network: 'ethereum', addressId: 'addr-evm-2' },
  // Tron chain
  { symbol: 'USDT', name: 'Tether USD', balance: 2500.00, usdValue: 2500.00, change24h: 0.01, icon: 'USDT', network: 'tron', addressId: 'addr-tron-1' },
  { symbol: 'TRX', name: 'Tron', balance: 5000, usdValue: 550.00, change24h: -1.2, icon: 'TRX', network: 'tron', addressId: 'addr-tron-1' },
  // BSC chain — uses same EVM addresses
  { symbol: 'USDT', name: 'Tether USD', balance: 1580.00, usdValue: 1580.00, change24h: 0.01, icon: 'USDT', network: 'bsc', addressId: 'addr-evm-1' },
  { symbol: 'BNB', name: 'BNB', balance: 3.5, usdValue: 2100.00, change24h: 1.5, icon: 'BNB', network: 'bsc', addressId: 'addr-evm-1' },
  // Solana chain
  { symbol: 'SOL', name: 'Solana', balance: 12.5, usdValue: 2312.50, change24h: 3.2, icon: 'SOL', network: 'solana', addressId: 'addr-sol-1' },
  { symbol: 'USDT', name: 'Tether USD', balance: 1000.00, usdValue: 1000.00, change24h: 0.01, icon: 'USDT', network: 'solana', addressId: 'addr-sol-1' },
  { symbol: 'USDC', name: 'USD Coin', balance: 1500.00, usdValue: 1500.00, change24h: 0.00, icon: 'USDC', network: 'solana', addressId: 'addr-sol-1' },
  // Other
  { symbol: 'MATIC', name: 'Polygon', balance: 2500, usdValue: 1300.00, change24h: 2.8, icon: 'MATIC', network: 'ethereum', addressId: 'addr-evm-1' },
  { symbol: 'DOGE', name: 'Dogecoin', balance: 5000, usdValue: 1900.00, change24h: 5.2, icon: 'DOGE', network: 'bsc', addressId: 'addr-evm-2' },
];

const mockAssetsWallet2: Asset[] = [
  // Ethereum chain - different balances for business wallet
  { symbol: 'USDT', name: 'Tether USD', balance: 25000.00, usdValue: 25000.00, change24h: 0.01, icon: 'USDT', network: 'ethereum', addressId: 'addr-evm-3' },
  { symbol: 'USDC', name: 'USD Coin', balance: 15000.00, usdValue: 15000.00, change24h: 0.00, icon: 'USDC', network: 'ethereum', addressId: 'addr-evm-3' },
  { symbol: 'ETH', name: 'Ethereum', balance: 5.8, usdValue: 20300.00, change24h: 2.34, icon: 'ETH', network: 'ethereum', addressId: 'addr-evm-3' },
  // Tron chain
  { symbol: 'USDT', name: 'Tether USD', balance: 8000.00, usdValue: 8000.00, change24h: 0.01, icon: 'USDT', network: 'tron', addressId: 'addr-tron-2' },
  { symbol: 'TRX', name: 'Tron', balance: 12000, usdValue: 1320.00, change24h: -1.2, icon: 'TRX', network: 'tron', addressId: 'addr-tron-2' },
  // BSC chain
  { symbol: 'BNB', name: 'BNB', balance: 8.2, usdValue: 4920.00, change24h: 1.5, icon: 'BNB', network: 'bsc', addressId: 'addr-evm-3' },
];

// Mock assets for wallet-3 (escaped/self-custody wallet)
const mockAssetsWallet3: Asset[] = [
  { symbol: 'ETH', name: 'Ethereum', balance: 1.85, usdValue: 6475.00, change24h: 2.34, icon: 'ETH', network: 'ethereum', addressId: 'addr-evm-4' },
  { symbol: 'USDT', name: 'Tether USD', balance: 4200.00, usdValue: 4200.00, change24h: 0.01, icon: 'USDT', network: 'ethereum', addressId: 'addr-evm-4' },
  { symbol: 'USDC', name: 'USD Coin', balance: 1500.00, usdValue: 1500.00, change24h: 0.00, icon: 'USDC', network: 'ethereum', addressId: 'addr-evm-4' },
  { symbol: 'BNB', name: 'BNB', balance: 2.3, usdValue: 1380.00, change24h: 1.5, icon: 'BNB', network: 'bsc', addressId: 'addr-evm-4' },
  { symbol: 'USDT', name: 'Tether USD', balance: 800.00, usdValue: 800.00, change24h: 0.01, icon: 'USDT', network: 'tron', addressId: 'addr-tron-3' },
  { symbol: 'USDC', name: 'USD Coin', balance: 800.00, usdValue: 800.00, change24h: 0.00, icon: 'USDC', network: 'solana', addressId: 'addr-sol-3' },
];

// Mock assets for newly created wallets - addressIds will be assigned at creation time
// Uses placeholder 'new-evm-1' etc. which get replaced in createWallet
const mockAssetsNewWallet: Asset[] = [
  // Ethereum chain
  { symbol: 'USDT', name: 'Tether USD', balance: 5000.00, usdValue: 5000.00, change24h: 0.01, icon: 'USDT', network: 'ethereum', addressId: 'new-evm-1' },
  { symbol: 'USDC', name: 'USD Coin', balance: 2000.00, usdValue: 2000.00, change24h: 0.00, icon: 'USDC', network: 'ethereum', addressId: 'new-evm-1' },
  { symbol: 'ETH', name: 'Ethereum', balance: 1.5, usdValue: 5250.00, change24h: 2.34, icon: 'ETH', network: 'ethereum', addressId: 'new-evm-1' },
  // Tron chain
  { symbol: 'USDT', name: 'Tether USD', balance: 3000.00, usdValue: 3000.00, change24h: 0.01, icon: 'USDT', network: 'tron', addressId: 'new-tron-1' },
  { symbol: 'TRX', name: 'Tron', balance: 8000, usdValue: 880.00, change24h: -1.2, icon: 'TRX', network: 'tron', addressId: 'new-tron-1' },
  // BSC chain
  { symbol: 'USDT', name: 'Tether USD', balance: 1200.00, usdValue: 1200.00, change24h: 0.01, icon: 'USDT', network: 'bsc', addressId: 'new-evm-1' },
  { symbol: 'BNB', name: 'BNB', balance: 2.0, usdValue: 1200.00, change24h: 1.5, icon: 'BNB', network: 'bsc', addressId: 'new-evm-1' },
  // Solana chain
  { symbol: 'SOL', name: 'Solana', balance: 5.0, usdValue: 925.00, change24h: 3.2, icon: 'SOL', network: 'solana', addressId: 'new-sol-1' },
  { symbol: 'USDT', name: 'Tether USD', balance: 800.00, usdValue: 800.00, change24h: 0.01, icon: 'USDT', network: 'solana', addressId: 'new-sol-1' },
  { symbol: 'USDC', name: 'USD Coin', balance: 1200.00, usdValue: 1200.00, change24h: 0.00, icon: 'USDC', network: 'solana', addressId: 'new-sol-1' },
];
const mockAssetsWallet4: Asset[] = [
  { symbol: 'USDT', name: 'Tether USD', balance: 25000.00, usdValue: 25000.00, change24h: 0.01, icon: 'USDT', network: 'ethereum', addressId: 'addr-evm-5' },
  { symbol: 'ETH', name: 'Ethereum', balance: 3.2, usdValue: 11200.00, change24h: 2.34, icon: 'ETH', network: 'ethereum', addressId: 'addr-evm-5' },
  { symbol: 'USDC', name: 'USD Coin', balance: 8000.00, usdValue: 8000.00, change24h: 0.00, icon: 'USDC', network: 'ethereum', addressId: 'addr-evm-5' },
  { symbol: 'USDT', name: 'Tether USD', balance: 5000.00, usdValue: 5000.00, change24h: 0.01, icon: 'USDT', network: 'tron', addressId: 'addr-tron-4' },
];

// Wallet ID to assets mapping
const walletAssetsMap: Record<string, Asset[]> = {
  'wallet-1': mockAssetsWallet1,
  'wallet-2': mockAssetsWallet2,
  'wallet-3': mockAssetsWallet3,
  'wallet-4': mockAssetsWallet4,
};

// Helper to get assets for a wallet
export const getAssetsForWallet = (walletId: string): Asset[] => {
  return walletAssetsMap[walletId] || mockAssetsNewWallet;
};

// Helper to get total balance for a wallet
export const getWalletTotalBalance = (walletId: string): number => {
  const assets = getAssetsForWallet(walletId);
  return assets.reduce((sum, a) => sum + a.usdValue, 0);
};

// Mock transactions per wallet (with risk data for testing)
const mockTransactionsWallet1: Transaction[] = [
  // Pending send transaction on Ethereum - RBF enabled
  {
    id: 'pending-eth-1',
    type: 'send',
    amount: 1,
    symbol: 'ETH',
    usdValue: 3500,
    status: 'pending',
    counterparty: '0x7a3F9c2B8e4D1f5A6b3C9e8D7f2A1b4C5d6E7f8A',
    counterpartyLabel: '',
    timestamp: new Date(),
    txHash: '0x17f65d9a2b3c4e5f6a7b8c9d0e1f2a3b4c5d6e7917af',
    network: 'ethereum',
    fee: 2.5,
    gasPrice: 2.5,
    gasAmount: 0.00072,
    gasToken: 'ETH',
    nonce: 42,
    isRbfEnabled: true,

  },
  // Pending send transaction on BSC - RBF enabled
  {
    id: 'pending-bsc-1',
    type: 'send',
    amount: 500,
    symbol: 'USDT',
    usdValue: 500,
    status: 'pending',
    counterparty: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    counterpartyLabel: 'Exchange Wallet',
    timestamp: new Date(Date.now() - 300000), // 5 mins ago
    txHash: '0xbsc17f65d9a2b3c4e5f6a7b8c9d0e1f2a3b4c5d6e7',
    network: 'bsc',
    fee: 0.5,
    gasPrice: 0.5,
    gasAmount: 0.0012,
    gasToken: 'BNB',
    nonce: 15,
    isRbfEnabled: true,

  },
  {
    id: '1',
    type: 'receive',
    amount: 2500,
    symbol: 'USDT',
    usdValue: 2500,
    status: 'confirmed',
    counterparty: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    counterpartyLabel: 'ABC Trading Co.',
    timestamp: new Date(Date.now() - 3600000),
    txHash: '0xabc123def456789012345678901234567890abcdef',
    network: 'ethereum',
    confirmations: 156,
    blockHeight: 19234567,
    fee: 3.2,
    gasAmount: 0.00091,
    gasToken: 'ETH',
    nonce: 38,
    memo: '货款结算 - 订单号 #20240115',
  },
  {
    id: '2',
    type: 'send',
    amount: 800,
    symbol: 'USDT',
    usdValue: 800,
    status: 'confirmed',
    counterparty: 'TJRabPrwbZy45sbavfcjinPJC18kjpRTv8',
    counterpartyLabel: 'Supplier XYZ',
    timestamp: new Date(Date.now() - 86400000),
    txHash: 'abc123def456789012345678901234567890',
    network: 'tron',
    fee: 2.5,
    gasAmount: 22.5,
    gasToken: 'TRX',
    nonce: 25,

    confirmations: 1250,
    blockHeight: 58912345,
  },
  {
    id: '4',
    type: 'send',
    amount: 1.5,
    symbol: 'BNB',
    usdValue: 900,
    status: 'confirmed',
    counterparty: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    timestamp: new Date(Date.now() - 172800000),
    txHash: '0xbnbtx123456789012345678901234567890abcd',
    network: 'bsc',
    fee: 0.001,

  },
  {
    id: '5',
    type: 'receive',
    amount: 500,
    symbol: 'TRX',
    usdValue: 55,
    status: 'confirmed',
    counterparty: 'TPbBpRXkoxJdQVCLt7jfmCEXXZJxr1ySfL',
    counterpartyLabel: '日常收款',
    timestamp: new Date(Date.now() - 432000000),
    txHash: 'trxtx123456789012345678901234567890abcd',
    network: 'tron',

  },
  // Failed transaction 1 - insufficient gas (today)
  {
    id: 'failed-1',
    type: 'send',
    amount: 1000,
    symbol: 'USDT',
    usdValue: 1000,
    status: 'failed',
    counterparty: '0x9f8F72aA9304c8B593d555F12eF6589cC3A579A2',
    counterpartyLabel: 'External Wallet',
    timestamp: new Date(Date.now() - 3600000), // 1 hour ago
    txHash: '0xfailedtx1234567890abcdef1234567890abcd',
    network: 'ethereum',
    fee: 0,

    failureReason: 'Gas 不足，无法支付网络手续费',
    nonce: 45,
  },
  // Failed transaction 2 - network error (today)
  {
    id: 'failed-2',
    type: 'send',
    amount: 2.5,
    symbol: 'ETH',
    usdValue: 8750,
    status: 'failed',
    counterparty: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    timestamp: new Date(Date.now() - 10800000), // 3 hours ago
    txHash: '0xfailedtx2345678901234567890abcdef12345',
    network: 'ethereum',
    fee: 0,

    failureReason: '合约调用被拒绝，目标地址未接受本次操作',
    nonce: 44,
  },
  // Failed transaction 3 - on Tron network (yesterday)
  {
    id: 'failed-3',
    type: 'send',
    amount: 500,
    symbol: 'USDT',
    usdValue: 500,
    status: 'failed',
    counterparty: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
    counterpartyLabel: 'Partner Ltd.',
    timestamp: new Date(Date.now() - 90000000), // ~1 day ago
    txHash: 'failedhash789012345678901234567890abcd',
    network: 'tron',
    fee: 0,

    failureReason: 'TRX 余额不足，无法提供交易所需的能量。',
    nonce: 12,
  },
  // === Additional mock transactions for lazy loading testing ===
  // Day 3 - Multiple transactions
  {
    id: 'tx-day3-1',
    type: 'receive',
    amount: 1800,
    symbol: 'USDT',
    usdValue: 1800,
    status: 'confirmed',
    counterparty: '0x3fC91A3afd70395Cd496C647d5a6CC9D4B2b7FAD',
    counterpartyLabel: 'DEX 交易',
    timestamp: new Date(Date.now() - 259200000), // 3 days ago
    txHash: '0xday3tx1234567890abcdef1234567890abcdef',
    network: 'ethereum',

    confirmations: 892,
    blockHeight: 19234100,
  },
  {
    id: 'tx-day3-2',
    type: 'send',
    amount: 0.5,
    symbol: 'ETH',
    usdValue: 1750,
    status: 'confirmed',
    counterparty: '0x6B175474E89094C44Da98b954EescdE736c703355',
    counterpartyLabel: 'Gas 费充值',
    timestamp: new Date(Date.now() - 262800000), // 3 days ago + 1 hour
    txHash: '0xday3tx2345678901234567890abcdef1234567',
    network: 'ethereum',

    confirmations: 889,
    blockHeight: 19234050,
    fee: 1.8,
    gasAmount: 0.00051,
    gasToken: 'ETH',
  },
  // Day 4
  {
    id: 'tx-day4-1',
    type: 'receive',
    amount: 3500,
    symbol: 'USDC',
    usdValue: 3500,
    status: 'confirmed',
    counterparty: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    counterpartyLabel: 'Salary',
    timestamp: new Date(Date.now() - 345600000), // 4 days ago
    txHash: '0xday4tx1234567890abcdef1234567890abcdef',
    network: 'ethereum',

    confirmations: 1200,
    blockHeight: 19233500,
  },
  {
    id: 'tx-day4-2',
    type: 'send',
    amount: 200,
    symbol: 'USDT',
    usdValue: 200,
    status: 'confirmed',
    counterparty: 'TN3W4H6rK7e8pq9Z2xY5vC3bM8nL6jK4wQ',
    counterpartyLabel: '朋友转账',
    timestamp: new Date(Date.now() - 349200000), // 4 days ago + 1 hour
    txHash: 'day4trxtx890123456789012345678901234567',
    network: 'tron',

    confirmations: 3500,
    blockHeight: 58900000,
  },
  // Day 5
  {
    id: 'tx-day5-1',
    type: 'receive',
    amount: 2.0,
    symbol: 'BNB',
    usdValue: 1200,
    status: 'confirmed',
    counterparty: '0x8AC76a51cc950d9822D68b83fE1Ad97B32Cd580d',
    timestamp: new Date(Date.now() - 432000000), // 5 days ago
    txHash: '0xday5tx1234567890abcdef1234567890abcdef',
    network: 'bsc',

    confirmations: 28000,
    blockHeight: 35678900,
  },
  {
    id: 'tx-day5-2',
    type: 'send',
    amount: 100,
    symbol: 'USDT',
    usdValue: 100,
    status: 'confirmed',
    counterparty: '0x55d398326f99059fF775485246999027B3197955',
    counterpartyLabel: 'NFT 购买',
    timestamp: new Date(Date.now() - 435600000), // 5 days ago + 1 hour
    txHash: '0xday5tx2345678901234567890abcdef1234567',
    network: 'bsc',

    confirmations: 27950,
    blockHeight: 35678800,
    fee: 0.5,
    gasAmount: 0.0008,
    gasToken: 'BNB',
  },
  // Day 6
  {
    id: 'tx-day6-1',
    type: 'receive',
    amount: 5000,
    symbol: 'USDT',
    usdValue: 5000,
    status: 'confirmed',
    counterparty: '0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9',
    counterpartyLabel: '客户付款',
    timestamp: new Date(Date.now() - 518400000), // 6 days ago
    txHash: '0xday6tx1234567890abcdef1234567890abcdef',
    network: 'ethereum',

    confirmations: 1800,
    blockHeight: 19232000,
  },
  {
    id: 'tx-day6-2',
    type: 'send',
    amount: 1500,
    symbol: 'USDC',
    usdValue: 1500,
    status: 'confirmed',
    counterparty: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    counterpartyLabel: 'DeFi 质押',
    timestamp: new Date(Date.now() - 522000000), // 6 days ago + 1 hour
    txHash: '0xday6tx2345678901234567890abcdef1234567',
    network: 'ethereum',

    confirmations: 1750,
    blockHeight: 19231900,
    fee: 2.8,
    gasAmount: 0.0008,
    gasToken: 'ETH',
  },
  // Day 7
  {
    id: 'tx-day7-1',
    type: 'receive',
    amount: 800,
    symbol: 'TRX',
    usdValue: 88,
    status: 'confirmed',
    counterparty: 'TYASr5UV6HEcXatwdFQfmLVUqQQQMUxHLS',
    counterpartyLabel: '收益提取',
    timestamp: new Date(Date.now() - 604800000), // 7 days ago
    txHash: 'day7trxtx123456789012345678901234567890',
    network: 'tron',

    confirmations: 5000,
    blockHeight: 58800000,
  },
  {
    id: 'tx-day7-2',
    type: 'send',
    amount: 0.8,
    symbol: 'ETH',
    usdValue: 2800,
    status: 'confirmed',
    counterparty: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    counterpartyLabel: 'Swap',
    timestamp: new Date(Date.now() - 608400000), // 7 days ago + 1 hour
    txHash: '0xday7tx2345678901234567890abcdef1234567',
    network: 'ethereum',

    confirmations: 2100,
    blockHeight: 19231000,
    fee: 3.5,
    gasAmount: 0.001,
    gasToken: 'ETH',
  },
  // Week 2 - Day 8-14
  {
    id: 'tx-day8-1',
    type: 'receive',
    amount: 2200,
    symbol: 'USDT',
    usdValue: 2200,
    status: 'confirmed',
    counterparty: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
    counterpartyLabel: '退款',
    timestamp: new Date(Date.now() - 691200000), // 8 days ago
    txHash: '0xday8tx1234567890abcdef1234567890abcdef',
    network: 'ethereum',

    confirmations: 2500,
    blockHeight: 19230000,
  },
  {
    id: 'tx-day9-1',
    type: 'send',
    amount: 500,
    symbol: 'USDT',
    usdValue: 500,
    status: 'confirmed',
    counterparty: '0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45',
    counterpartyLabel: '会员订阅',
    timestamp: new Date(Date.now() - 777600000), // 9 days ago
    txHash: '0xday9tx1234567890abcdef1234567890abcdef',
    network: 'ethereum',

    confirmations: 2900,
    blockHeight: 19229000,
    fee: 2.2,
    gasAmount: 0.00063,
    gasToken: 'ETH',
  },
  {
    id: 'tx-day10-1',
    type: 'receive',
    amount: 0.3,
    symbol: 'ETH',
    usdValue: 1050,
    status: 'confirmed',
    counterparty: '0xE592427A0AEce92De3Edee1F18E0157C05861564',
    counterpartyLabel: '空投',
    timestamp: new Date(Date.now() - 864000000), // 10 days ago
    txHash: '0xday10tx123456789abcdef1234567890abcdef',
    network: 'ethereum',

    confirmations: 3300,
    blockHeight: 19228000,
  },
  {
    id: 'tx-day11-1',
    type: 'send',
    amount: 3.0,
    symbol: 'BNB',
    usdValue: 1800,
    status: 'confirmed',
    counterparty: '0x10ED43C718714eb63d5aA57B78B54704E256024E',
    counterpartyLabel: 'PancakeSwap',
    timestamp: new Date(Date.now() - 950400000), // 11 days ago
    txHash: '0xday11tx123456789abcdef1234567890abcdef',
    network: 'bsc',

    confirmations: 55000,
    blockHeight: 35600000,
    fee: 0.3,
    gasAmount: 0.0005,
    gasToken: 'BNB',
  },
  {
    id: 'tx-day12-1',
    type: 'receive',
    amount: 10000,
    symbol: 'USDC',
    usdValue: 10000,
    status: 'confirmed',
    counterparty: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    counterpartyLabel: '投资收益',
    timestamp: new Date(Date.now() - 1036800000), // 12 days ago
    txHash: '0xday12tx123456789abcdef1234567890abcdef',
    network: 'ethereum',

    confirmations: 3800,
    blockHeight: 19226000,
  },
  {
    id: 'tx-day13-1',
    type: 'send',
    amount: 2000,
    symbol: 'USDT',
    usdValue: 2000,
    status: 'confirmed',
    counterparty: 'TVj7RNVHy6thbM7BWdSe9G6gXwKhjhdNZS',
    counterpartyLabel: '供应商付款',
    timestamp: new Date(Date.now() - 1123200000), // 13 days ago
    txHash: 'day13trxtx12345678901234567890123456789',
    network: 'tron',

    confirmations: 8000,
    blockHeight: 58700000,
    fee: 25,
    gasAmount: 25,
    gasToken: 'TRX',
  },
  {
    id: 'tx-day14-1',
    type: 'receive',
    amount: 1.2,
    symbol: 'ETH',
    usdValue: 4200,
    status: 'confirmed',
    counterparty: '0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6',
    counterpartyLabel: 'UniSwap',
    timestamp: new Date(Date.now() - 1209600000), // 14 days ago
    txHash: '0xday14tx123456789abcdef1234567890abcdef',
    network: 'ethereum',

    confirmations: 4200,
    blockHeight: 19224000,
  },
  // Week 3 - Day 15-21
  {
    id: 'tx-day15-1',
    type: 'send',
    amount: 750,
    symbol: 'USDC',
    usdValue: 750,
    status: 'confirmed',
    counterparty: '0x853d955aCEf822Db058eb8505911ED77F175b99e',
    counterpartyLabel: '服务费',
    timestamp: new Date(Date.now() - 1296000000), // 15 days ago
    txHash: '0xday15tx123456789abcdef1234567890abcdef',
    network: 'ethereum',

    confirmations: 4600,
    blockHeight: 19222000,
    fee: 1.9,
    gasAmount: 0.00054,
    gasToken: 'ETH',
  },
  {
    id: 'tx-day16-1',
    type: 'receive',
    amount: 1500,
    symbol: 'TRX',
    usdValue: 165,
    status: 'confirmed',
    counterparty: 'TKzxdSv2FZKQrEqkKVgp5DcwEXBEKMg2Ax',
    counterpartyLabel: 'Mining 收益',
    timestamp: new Date(Date.now() - 1382400000), // 16 days ago
    txHash: 'day16trxtx12345678901234567890123456789',
    network: 'tron',

    confirmations: 12000,
    blockHeight: 58600000,
  },
  {
    id: 'tx-day17-1',
    type: 'send',
    amount: 0.2,
    symbol: 'ETH',
    usdValue: 700,
    status: 'confirmed',
    counterparty: '0x4d224452801ACEd8B2F0aebE155379bb5D594381',
    counterpartyLabel: 'NFT Mint',
    timestamp: new Date(Date.now() - 1468800000), // 17 days ago
    txHash: '0xday17tx123456789abcdef1234567890abcdef',
    network: 'ethereum',

    confirmations: 5000,
    blockHeight: 19220000,
    fee: 4.5,
    gasAmount: 0.00128,
    gasToken: 'ETH',
  },
  {
    id: 'tx-day18-1',
    type: 'receive',
    amount: 600,
    symbol: 'USDT',
    usdValue: 600,
    status: 'confirmed',
    counterparty: '0x0d4a11d5EEaaC28EC3F61d100daF4d40471f1852',
    counterpartyLabel: '合作分成',
    timestamp: new Date(Date.now() - 1555200000), // 18 days ago
    txHash: '0xday18tx123456789abcdef1234567890abcdef',
    network: 'ethereum',

    confirmations: 5400,
    blockHeight: 19218000,
  },
  {
    id: 'tx-day19-1',
    type: 'send',
    amount: 1.5,
    symbol: 'BNB',
    usdValue: 900,
    status: 'confirmed',
    counterparty: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
    counterpartyLabel: 'Bridge 跨链',
    timestamp: new Date(Date.now() - 1641600000), // 19 days ago
    txHash: '0xday19tx123456789abcdef1234567890abcdef',
    network: 'bsc',

    confirmations: 80000,
    blockHeight: 35500000,
    fee: 0.4,
    gasAmount: 0.0006,
    gasToken: 'BNB',
  },
  {
    id: 'tx-day20-1',
    type: 'receive',
    amount: 4500,
    symbol: 'USDT',
    usdValue: 4500,
    status: 'confirmed',
    counterparty: '0xA69babEF1cA67A37Ffaf7a485DfFF3382056e78C',
    counterpartyLabel: '项目结款',
    timestamp: new Date(Date.now() - 1728000000), // 20 days ago
    txHash: '0xday20tx123456789abcdef1234567890abcdef',
    network: 'ethereum',

    confirmations: 5800,
    blockHeight: 19216000,
  },
];

const mockTransactionsWallet2: Transaction[] = [
  {
    id: 'biz-1',
    type: 'receive',
    amount: 15000,
    symbol: 'USDT',
    usdValue: 15000,
    status: 'confirmed',
    counterparty: '0xCorp...8888',
    counterpartyLabel: 'Corporate Client A',
    timestamp: new Date(Date.now() - 7200000),
    txHash: '0xbiz1...hash',
    network: 'ethereum',

  },
  {
    id: 'biz-2',
    type: 'send',
    amount: 5000,
    symbol: 'USDT',
    usdValue: 5000,
    status: 'confirmed',
    counterparty: 'T8Biz...Tron',
    counterpartyLabel: 'Partner Company',
    timestamp: new Date(Date.now() - 43200000),
    txHash: 'tronbiz...hash',
    network: 'tron',
    fee: 5.0,

  },
  {
    id: 'biz-3',
    type: 'receive',
    amount: 3.5,
    symbol: 'ETH',
    usdValue: 12250,
    status: 'confirmed',
    counterparty: '0xVend...or99',
    counterpartyLabel: 'Vendor Payment',
    timestamp: new Date(Date.now() - 259200000),
    txHash: '0xeth...vendor',
    network: 'ethereum',

  },
];

// Mock transactions for wallet-3 (self-custody wallet)
const mockTransactionsWallet3: Transaction[] = [
  {
    id: 'self-1',
    type: 'receive',
    amount: 1.85,
    symbol: 'ETH',
    usdValue: 6475,
    status: 'confirmed',
    counterparty: '0xABC123...DEF456',
    counterpartyLabel: '从 MPC 钱包转入',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    txHash: '0xself1...hash',
    network: 'ethereum',

  },
  {
    id: 'self-2',
    type: 'receive',
    amount: 4200,
    symbol: 'USDT',
    usdValue: 4200,
    status: 'confirmed',
    counterparty: '0xABC123...DEF456',
    counterpartyLabel: '从 MPC 钱包转入',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    txHash: '0xself2...hash',
    network: 'ethereum',

  },
  {
    id: 'self-3',
    type: 'send',
    amount: 500,
    symbol: 'USDT',
    usdValue: 500,
    status: 'confirmed',
    counterparty: '0xExch...ange',
    counterpartyLabel: 'Exchange Deposit',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
    txHash: '0xself3...hash',
    network: 'ethereum',
    fee: 8.5,

  },
  {
    id: 'self-4',
    type: 'receive',
    amount: 2.3,
    symbol: 'BNB',
    usdValue: 1380,
    status: 'confirmed',
    counterparty: '0xBSC...Addr',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    txHash: '0xbsc...hash',
    network: 'bsc',

  },
];

// Wallet ID to transactions mapping
const walletTransactionsMap: Record<string, Transaction[]> = {
  'wallet-1': mockTransactionsWallet1,
  'wallet-2': mockTransactionsWallet2,
  'wallet-3': mockTransactionsWallet3,
};

// Helper to get transactions for a wallet
const getTransactionsForWallet = (walletId: string): Transaction[] => {
  return walletTransactionsMap[walletId] || [];
};

const mockContacts: Contact[] = [
  {
    id: '1',
    name: 'ABC Trading Co.',
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    network: 'ethereum',
    tags: [],
    isOfficial: false,
    isWhitelisted: true,
    lastUsed: new Date(Date.now() - 3600000),
    notes: '长期合作客户',
  },
  {
    id: '2',
    name: 'Supplier XYZ',
    address: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
    network: 'tron',
    tags: [],
    isOfficial: false,
    isWhitelisted: true,
    lastUsed: new Date(Date.now() - 86400000),
  },
  {
    id: '3',
    name: '',
    address: '0x7a3F9c2B8e4D1f5A6b3C9e8D7f2A1b4C5d6E7f8A',
    network: 'ethereum',
    tags: [],
    isOfficial: false,
    isWhitelisted: false,
  },
  {
    id: '4',
    name: 'BSC Partner',
    address: '0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c',
    network: 'bsc',
    tags: [],
    isOfficial: false,
    isWhitelisted: false,
    lastUsed: new Date(Date.now() - 172800000),
  },
  // 新增5条测试数据 - 覆盖不同网络
  {
    id: '5',
    name: 'Solana DeFi Wallet',
    address: '7EcDhSYGxXyscszYEp35KHN8vvw3svAuLKTzXwCFLtV',
    network: 'solana',
    tags: [],
    isOfficial: false,
    isWhitelisted: false,
    lastUsed: new Date(Date.now() - 7200000),
    notes: 'Solana 主网钱包',
  },
  {
    id: '6',
    name: 'Tron 收款地址',
    address: 'TN7qZLpmCvTnfbXnYFMBEZAjuZwKyxqvMb',
    network: 'tron',
    tags: [],
    isOfficial: false,
    isWhitelisted: false,
    lastUsed: new Date(Date.now() - 14400000),
  },
  {
    id: '7',
    name: '',
    address: '0x2B5634C42055806a59e9107ED44D43c426E58258',
    network: 'bsc',
    tags: [],
    isOfficial: false,
    isWhitelisted: false,
    lastUsed: new Date(Date.now() - 259200000),
  },
  {
    id: '8',
    name: '合作方 A 公司财务部',
    address: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    network: 'ethereum',
    tags: [],
    isOfficial: false,
    isWhitelisted: false,
    lastUsed: new Date(Date.now() - 432000000),
    notes: '每月结算使用',
  },
  {
    id: '9',
    name: 'SOL NFT Marketplace',
    address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    network: 'solana',
    tags: [],
    isOfficial: false,
    isWhitelisted: false,
  },
];

const mockDevices: Device[] = [
  {
    id: '1',
    name: 'iPhone 15 Pro',
    model: 'iPhone15,3',
    lastActive: new Date(),
    location: '上海, 中国',
    isCurrent: true,
    status: 'active',
  },
  {
    id: '2',
    name: 'MacBook Pro',
    model: 'MacBookPro18,1',
    lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000),
    location: '北京, 中国',
    isCurrent: false,
    status: 'active',
  },
  {
    id: '3',
    name: 'Windows PC',
    model: 'Windows',
    lastActive: new Date(Date.now() - 24 * 60 * 60 * 1000),
    location: '杭州, 中国',
    isCurrent: false,
    status: 'active',
  },
  {
    id: '4',
    name: 'iPad Pro',
    model: 'iPad13,4',
    lastActive: new Date(Date.now() - 48 * 60 * 60 * 1000),
    location: '深圳, 中国',
    isCurrent: false,
    status: 'active',
  },
];

const defaultSecurityConfig: SecurityConfig = {
  singleTransactionLimit: 10000,
  dailyLimit: 50000,
  monthlyLimit: 200000,
  dailyUsed: 4500,
  monthlyUsed: 18000,
  lastDailyReset: new Date(),
  lastMonthlyReset: new Date(),
  requireSatoshiTest: true,
  whitelistBypass: false,
  highRiskAction: 'block',
};

const defaultBackupStatus: BackupStatus = {
  cloudBackup: false,
  fileBackup: false,
};

// Mock notifications data
const mockNotifications: Notification[] = [
  {
    id: 'notif-3',
    type: 'transaction_in',
    category: 'transaction',
    priority: 'normal',
    title: '收到 500 USDT',
    content: '来自 0x1f98...F984 的转账已确认到账。',
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
    isRead: false,
    action: { label: '查看交易', route: '/transaction/1' },
    metadata: { amount: 500, symbol: 'USDT', txId: '1', walletId: 'wallet-1' },
  },
  {
    id: 'notif-agent-1',
    type: 'agent_tx_pending',
    category: 'agent',
    priority: 'urgent',
    title: 'Trading Bot 提交交易请求',
    content: 'Trading Bot 请求转账 0.5 ETH 至 0xdead...beef，待您审核批准。',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    isRead: false,
    action: { label: '去审核', route: '/agent-review' },
    metadata: { agentTxId: 'atx-1', amount: 0.5, symbol: 'ETH', walletId: 'wallet-1' },
  },
  {
    id: 'notif-agent-2',
    type: 'agent_tx_approved',
    category: 'agent',
    priority: 'normal',
    title: '交易已自动批准',
    content: 'DeFi Agent 发起的 200 USDT 转账已根据规则自动批准执行。',
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    isRead: false,
    action: { label: '查看详情', route: '/agent-review' },
    metadata: { agentTxId: 'atx-3', amount: 200, symbol: 'USDT', controlMode: 'block', walletId: 'wallet-2' },
  },
  {
    id: 'notif-agent-3',
    type: 'agent_tx_settled',
    category: 'agent',
    priority: 'normal',
    title: '交易已结算完成',
    content: 'Payment Agent 的 1,000 USDC 转账已成功结算上链。',
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    isRead: true,
    action: { label: '查看详情', route: '/agent-review' },
    metadata: { agentTxId: 'atx-5', amount: 1000, symbol: 'USDC', walletId: 'wallet-2' },
  },
  {
    id: 'notif-agent-4',
    type: 'agent_tx_failed',
    category: 'agent',
    priority: 'urgent',
    title: '交易执行失败',
    content: 'Trading Bot 的 0.3 ETH 转账执行失败：gas 不足。请选择重试或作废。',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: false,
    action: { label: '去处理', route: '/agent-review' },
    metadata: { agentTxId: 'atx-7', amount: 0.3, symbol: 'ETH', walletId: 'wallet-1' },
  },
  {
    id: 'notif-5',
    type: 'large_amount',
    category: 'transaction',
    priority: 'normal',
    title: '大额转账通知',
    content: '您发起的 10,000 USDT 转账已成功发送至 0xabcd...efgh。',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
    isRead: true,
    action: { label: '查看交易', route: '/transaction/4' },
    metadata: { amount: 10000, symbol: 'USDT', txId: '4', walletId: 'wallet-1' },
  },
  {
    id: 'notif-6',
    type: 'system_update',
    category: 'system',
    priority: 'low',
    title: 'v2.1.0 版本更新',
    content: '新版本已发布，新增多链资产聚合显示、优化转账流程等功能。',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    isRead: true,
  },
  {
    id: 'notif-7',
    type: 'maintenance',
    category: 'system',
    priority: 'normal',
    title: '系统维护通知',
    content: '系统将于 2026年1月25日 02:00-06:00 进行维护升级，届时部分功能可能暂时无法使用。',
    timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000), // 4 days ago
    isRead: true,
  },
  {
    id: 'notif-8',
    type: 'transaction_out',
    category: 'transaction',
    priority: 'normal',
    title: '转账成功',
    content: '向 0x9876...4321 转账 200 USDT 已成功。',
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    isRead: true,
    action: { label: '查看交易', route: '/transaction/2' },
    metadata: { amount: 200, symbol: 'USDT', txId: '2', walletId: 'wallet-2' },
  },
  {
    id: 'notif-tx-2',
    type: 'transaction_in',
    category: 'transaction',
    priority: 'normal',
    title: '收到 1,200 USDC',
    content: '来自 0xA3c7...B821 的转账已确认到账。',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    action: { label: '查看交易', route: '/transaction/10' },
    metadata: { amount: 1200, symbol: 'USDC', txId: '10', walletId: 'wallet-2' },
  },
  {
    id: 'notif-tx-3',
    type: 'transaction_out',
    category: 'transaction',
    priority: 'normal',
    title: '转账已发送',
    content: '向 Binance 充值地址转账 500 USDT，等待链上确认。',
    timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
    isRead: false,
    action: { label: '查看交易', route: '/transaction/11' },
    metadata: { amount: 500, symbol: 'USDT', txId: '11', walletId: 'wallet-1' },
  },
  {
    id: 'notif-tx-4',
    type: 'large_amount',
    category: 'transaction',
    priority: 'high',
    title: '大额转入提醒',
    content: '收到来自 0xFe12...9aB3 的 50,000 USDT 大额转账，请注意核实来源。',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    isRead: false,
    action: { label: '查看交易', route: '/transaction/12' },
    metadata: { amount: 50000, symbol: 'USDT', txId: '12', walletId: 'wallet-1' },
  },
  {
    id: 'notif-tx-5',
    type: 'transaction_in',
    category: 'transaction',
    priority: 'normal',
    title: '收到 0.8 ETH',
    content: '来自 0x2B44...D19c 的 ETH 转账已完成确认，共 12 个区块。',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 - 3 * 60 * 60 * 1000),
    isRead: true,
    action: { label: '查看交易', route: '/transaction/13' },
    metadata: { amount: 0.8, symbol: 'ETH', txId: '13', walletId: 'wallet-3' },
  },
  {
    id: 'notif-tx-6',
    type: 'transaction_out',
    category: 'transaction',
    priority: 'normal',
    title: '转账成功',
    content: '向 OKX 提币地址成功转出 300 USDC。',
    timestamp: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000),
    isRead: true,
    action: { label: '查看交易', route: '/transaction/14' },
    metadata: { amount: 300, symbol: 'USDC', txId: '14', walletId: 'wallet-2' },
  },
  {
    id: 'notif-tx-7',
    type: 'transaction_in',
    category: 'transaction',
    priority: 'normal',
    title: '收到 2.5 BNB',
    content: '来自 0xC091...7E2f 的 BNB 已到账，当前价值约 $875。',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    isRead: true,
    action: { label: '查看交易', route: '/transaction/15' },
    metadata: { amount: 2.5, symbol: 'BNB', txId: '15', walletId: 'wallet-1' },
  },
  {
    id: 'notif-tx-8',
    type: 'large_amount',
    category: 'transaction',
    priority: 'high',
    title: '大额转出提醒',
    content: '您发起的 25,000 USDT 转账已广播至链上，预计 2 分钟内确认。',
    timestamp: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
    isRead: true,
    action: { label: '查看交易', route: '/transaction/16' },
    metadata: { amount: 25000, symbol: 'USDT', txId: '16', walletId: 'wallet-2' },
  },
];
export function aggregateAssets(assets: Asset[]): AggregatedAsset[] {
  const grouped = assets.reduce((acc, asset) => {
    if (!acc[asset.symbol]) {
      acc[asset.symbol] = {
        symbol: asset.symbol,
        name: asset.name,
        totalBalance: 0,
        totalUsdValue: 0,
        change24h: asset.change24h,
        icon: asset.icon,
        chains: [],
      };
    }
    acc[asset.symbol].totalBalance += asset.balance;
    acc[asset.symbol].totalUsdValue += asset.usdValue;
    acc[asset.symbol].chains.push({
      network: asset.network,
      balance: asset.balance,
      usdValue: asset.usdValue,
    });
    return acc;
  }, {} as Record<string, AggregatedAsset>);
  
  return Object.values(grouped).sort((a, b) => b.totalUsdValue - a.totalUsdValue);
}

/**
 * Aggregate assets by chain (same token on same chain across multiple addresses → one row).
 * Does NOT aggregate across chains (USDT on ETH and USDT on Tron = separate rows).
 */
export function aggregateByChain(assets: Asset[], wallet: Wallet | null): ChainAsset[] {
  const grouped = assets.reduce((acc, asset) => {
    const key = `${asset.symbol}-${asset.network}`;
    if (!acc[key]) {
      acc[key] = {
        symbol: asset.symbol,
        name: asset.name,
        icon: asset.icon,
        network: asset.network,
        totalBalance: 0,
        totalUsdValue: 0,
        change24h: asset.change24h,
        addressCount: 0,
        addresses: [],
      };
    }
    acc[key].totalBalance += asset.balance;
    acc[key].totalUsdValue += asset.usdValue;
    const addrInfo = wallet?.walletAddresses?.find(a => a.id === asset.addressId);
    // Avoid duplicate address entries (same addressId already added)
    if (!acc[key].addresses.find(a => a.addressId === asset.addressId)) {
      acc[key].addresses.push({
        addressId: asset.addressId,
        address: addrInfo?.address || '',
        label: addrInfo?.label || '',
        balance: asset.balance,
        usdValue: asset.usdValue,
      });
    } else {
      // Multiple asset entries from same address (shouldn't happen normally, but handle gracefully)
      const existing = acc[key].addresses.find(a => a.addressId === asset.addressId)!;
      existing.balance += asset.balance;
      existing.usdValue += asset.usdValue;
    }
    acc[key].addressCount = acc[key].addresses.length;
    return acc;
  }, {} as Record<string, ChainAsset>);

  return Object.values(grouped).sort((a, b) => b.totalUsdValue - a.totalUsdValue);
}

interface WalletContextType extends WalletState {
  // Auth actions
  login: (provider: 'apple' | 'google' | 'email') => Promise<AuthResult>;
  logout: () => void;
  sendVerificationCode: (email: string) => Promise<void>;
  verifyCode: (email: string, code: string) => Promise<AuthResult>;
  checkPasswordExists: (email: string) => Promise<{ hasPassword: boolean; isNewUser: boolean }>;
  loginWithPassword: (email: string, password: string) => Promise<AuthResult>;
  
  // Wallet actions
  createWallet: (name: string) => Promise<Wallet>;
  switchWallet: (walletId: string) => void;
  renameWallet: (walletId: string, newName: string) => void;
  
  // Backup actions
  setPin: (pin: string) => Promise<boolean>;
  enableBiometric: () => Promise<boolean>;
  completeCloudBackup: (provider: 'icloud' | 'google_drive') => Promise<boolean>;
  completeFileBackup: (password: string) => Promise<boolean>;
  backupWallet: (walletId: string, backupInfo: WalletBackupInfo, password?: string) => Promise<boolean>;
  verifyBackupPassword: (walletId: string, password: string) => boolean;

  // Transaction actions
  sendTransaction: (to: string, amount: number, symbol: string, network: ChainId, memo?: string) => Promise<string>;
  scanAddressRisk: (address: string) => Promise<{ score: RiskColor; reasons: string[] }>;
  
  // Limit actions
  getLimitStatus: () => LimitStatus;
  checkTransferLimit: (amount: number) => { allowed: boolean; reason?: string };
  
  // Contact actions
  addContact: (contact: Omit<Contact, 'id'>) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  removeContact: (id: string) => void;
  
  // Device actions
  addDevice: (device: Device) => void;
  removeDevice: (id: string) => void;
  
  // Asset actions
  addToken: (symbol: string, name: string, network: ChainId, price: number, change24h: number) => void;
  removeToken: (symbol: string, network?: ChainId) => void;
  
  // Security config
  updateSecurityConfig: (config: Partial<SecurityConfig>) => void;
  
  // Onboarding state
  onboardingStep: number;
  setOnboardingStep: (step: number) => void;
  
  // Notification actions
  notifications: Notification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  
  // TSS Node actions
  hasTSSNode: boolean;
  tssNodeInfo: { hasCloudBackup: boolean; cloudProvider?: string; hasLocalBackup: boolean } | null;
  checkTSSNodeExists: () => Promise<{ exists: boolean; hasCloudBackup: boolean; cloudProvider?: string; hasLocalBackup: boolean }>;
  recoverTSSNode: (method: 'cloud' | 'local_file' | 'old_device', password?: string) => Promise<void>;
  createTSSNode: () => Promise<void>;

  // ============= Delegated Agent actions =============
  delegatedAgents: DelegatedAgent[];
  agentTransactions: AgentTransaction[];
  pendingAgentTxCount: number;
  // Delegated Agent CRUD
  delegateAgent: (walletId: string, principalId: string, agentName: string, permissions?: Partial<AgentPermissions>, riskConfig?: Partial<DelegatedAgentRiskConfig>) => Promise<DelegatedAgent>;
  revokeAgent: (agentId: string) => void;
  getAgentsForWallet: (walletId: string) => DelegatedAgent[];
  getAgentById: (agentId: string) => DelegatedAgent | undefined;
  pauseDelegatedAgent: (agentId: string, reason?: string) => void;
  resumeDelegatedAgent: (agentId: string) => void;
  updateDelegatedAgentRiskConfig: (agentId: string, config: Partial<DelegatedAgentRiskConfig>) => void;
  updateDelegatedAgentName: (agentId: string, newName: string) => void;
  updateDelegatedAgentPermissions: (agentId: string, permissions: Partial<AgentPermissions>) => void;
  // Policy-based risk control methods
  addPolicy: (agentId: string, policy: Omit<AgentPolicy, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updatePolicy: (agentId: string, policyId: string, updates: Partial<AgentPolicy>) => void;
  removePolicy: (agentId: string, policyId: string) => void;
  reorderPolicies: (agentId: string, orderedPolicyIds: string[]) => void;
  togglePolicyEnabled: (agentId: string, policyId: string) => void;
  updateDefaultAction: (agentId: string, action: DefaultPolicyAction) => void;
  getAgentTxByAgent: (agentId: string) => AgentTransaction[];
  // Agent transaction review
  approveAgentTx: (txId: string, note?: string) => void;
  rejectAgentTx: (txId: string, reason: string) => void;
  getPendingAgentTxs: () => AgentTransaction[];
  getAgentTxByWallet: (walletId: string) => AgentTransaction[];
  // Agent risk config
  getAgentRiskConfig: (walletId: string) => AgentRiskConfig | undefined;
  updateWalletControlMode: (walletId: string, mode: WalletControlMode) => void;
  updateAgentRiskConfig: (walletId: string, config: Partial<AgentRiskConfig>) => void;
  enableAgent: (walletId: string) => void;
  disableAgent: (walletId: string) => void;
  pauseAgent: (walletId: string, reason?: string) => void;
  resumeAgent: (walletId: string) => void;
  pauseAllAgents: (reason?: string) => void;
  addWhitelistAddress: (walletId: string, address: string, label: string, network: ChainId) => void;
  removeWhitelistAddress: (walletId: string, address: string) => void;
  addBlacklistAddress: (walletId: string, address: string, label: string, reason: string) => void;
  removeBlacklistAddress: (walletId: string, address: string) => void;
  // Settlement tracking
  startSettlement: (txId: string) => void;
  retryFailedTx: (txId: string) => void;
  voidFailedTx: (txId: string) => void;
  getProcessingTxs: () => AgentTransaction[];
  getFailedTxs: () => AgentTransaction[];
  getSettledTxs: () => AgentTransaction[];
  // Reconciliation
  getReconciliationSummary: (period: 'today' | 'week' | 'month') => ReconciliationSummary;

  // ============= Human Agent (Setup Token) =============
  humanAgents: HumanAgent[];
  currentSetupToken: SetupToken | null;
  fetchHumanAgents: () => Promise<void>;
  generateSetupToken: () => Promise<SetupToken>;
  addMockHumanAgent: (agent: HumanAgent) => void;

  // Agent-linked wallet (Mode 2)
  linkAgentWallet: (token: string) => Promise<Wallet>;
  agentTransferRequests: AgentTransferRequest[];
  submitAgentRequest: (request: Omit<AgentTransferRequest, 'id' | 'createdAt' | 'status' | 'walletName'>) => Promise<AgentTransferRequest>;
  getAgentRequestsForWallet: (walletId: string) => AgentTransferRequest[];

  // Address management
  addAddress: (walletId: string, system: AddressSystem) => Promise<WalletAddress>;
  renameAddress: (walletId: string, addressId: string, newLabel: string) => void;

  // Dev mode
  devModeLogin: () => void;
}

const WalletContext = createContext<WalletContextType | null>(null);

export function WalletProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [currentWallet, setCurrentWallet] = useState<Wallet | null>(null);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [backupPasswords, setBackupPasswords] = useState<Record<string, string>>({});
  const [assets, setAssets] = useState<Asset[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [devices, setDevices] = useState<Device[]>([]);
  const [securityConfig, setSecurityConfig] = useState<SecurityConfig>(defaultSecurityConfig);
  const [backupStatus, setBackupStatus] = useState<BackupStatus>(defaultBackupStatus);
  const [walletStatus, setWalletStatus] = useState<WalletStatus>('not_created');
  const [hasPin, setHasPin] = useState(false);
  const [hasBiometric, setHasBiometric] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

  // Delegated Agent state
  const [delegatedAgents, setDelegatedAgents] = useState<DelegatedAgent[]>([]);
  const [agentTransactions, setAgentTransactions] = useState<AgentTransaction[]>([]);
  const [agentTransferRequests, setAgentTransferRequests] = useState<AgentTransferRequest[]>([]);
  const [agentRiskConfigs, setAgentRiskConfigs] = useState<AgentRiskConfig[]>([]);

  // Human Agent state
  const [humanAgents, setHumanAgents] = useState<HumanAgent[]>([]);
  const [currentSetupToken, setCurrentSetupToken] = useState<SetupToken | null>(null);

  // Computed pending agent tx count
  const pendingAgentTxCount = useMemo(() => {
    return agentTransactions.filter(tx => tx.status === 'pending_approval').length;
  }, [agentTransactions]);

  // Computed notification count (only transaction + system, exclude agent)
  const unreadNotificationCount = useMemo(() => {
    return notifications.filter(n => !n.isRead && n.category !== 'agent').length;
  }, [notifications]);

  const markNotificationAsRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    ));
  }, []);

  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  // Mock user data - can be toggled for testing different user types
  // Set to false to test existing user with wallets, true for new user onboarding
  const [mockIsNewUser] = useState(false);
  
  const setupExistingUser = useCallback(() => {
    const mockUserInfo: UserInfo = {
      email: 'sarah.chen@gmail.com',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
      nickname: 'Sarah Chen',
      uid: 'UID_8824563147',
    };
    setUserInfo(mockUserInfo);
    
    const mockWallets: Wallet[] = [
      {
        id: 'wallet-1',
        name: '我的钱包',
        walletAddresses: MOCK_WALLET_ADDRESSES.wallet1,
        addresses: buildLegacyAddresses(MOCK_WALLET_ADDRESSES.wallet1),
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        isBackedUp: true,
        isBiometricEnabled: true,
        controlMode: 'manual_review',
        origin: 'user_created',
        backupInfo: {
          method: 'cloud',
          cloudProvider: 'icloud',
          lastBackupTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      },
      {
        id: 'wallet-2',
        name: '商务钱包',
        walletAddresses: MOCK_WALLET_ADDRESSES.wallet2,
        addresses: buildLegacyAddresses(MOCK_WALLET_ADDRESSES.wallet2),
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        isBackedUp: true,
        isBiometricEnabled: false,
        controlMode: 'manual_review',
        origin: 'user_created',
        backupInfo: {
          method: 'cloud',
          cloudProvider: 'google_drive',
          lastBackupTime: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        },
      },
      {
        id: 'wallet-3',
        name: '备用钱包',
        walletAddresses: MOCK_WALLET_ADDRESSES.wallet3,
        addresses: buildLegacyAddresses(MOCK_WALLET_ADDRESSES.wallet3),
        createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        isBackedUp: false,
        isBiometricEnabled: true,
        controlMode: 'block',
        origin: 'user_created',
      },
      {
        id: 'wallet-4',
        name: 'Agent 交易钱包',
        walletAddresses: MOCK_WALLET_ADDRESSES.wallet4,
        addresses: buildLegacyAddresses(MOCK_WALLET_ADDRESSES.wallet4),
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        isBackedUp: false,
        isBiometricEnabled: true,
        controlMode: 'manual_review',
        origin: 'agent_linked',
        agentInfo: {
          agentName: 'AlphaTrader Bot',
          agentId: 'agent-alpha-001',
          linkedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
          setupToken: 'at_setup_',
        },
      },
    ];
    
    setWallets(mockWallets);
    setCurrentWallet(mockWallets[0]);
    setAssets(getAssetsForWallet('wallet-1'));
    setTransactions(getTransactionsForWallet('wallet-1'));
    setContacts(mockContacts);
    setDevices(mockDevices);
    setWalletStatus('fully_secure');
    setHasPin(true);
    setHasBiometric(true);
    // Mock backup passwords for already backed-up wallets
    setBackupPasswords({ 'wallet-1': 'Abc12345', 'wallet-2': 'Abc12345' });

    // ============= Mock Delegated Agent Data =============
    const mockDelegatedAgents: DelegatedAgent[] = [
      {
        id: 'dagent-1',
        walletId: 'wallet-1',
        principalId: 'abc12-defgh-ijklm-nopqr-stuvw',
        agentName: 'Trading Bot',
        status: 'active',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
        permissions: { readBalance: true, transfer: true, contractCall: true, walletManage: false },
        tssNodeStatus: 'active',
        riskConfig: {
          defaultAction: 'deny' as DefaultPolicyAction,
          policies: [
            {
              id: 'policy-1',
              name: '基础转账限额',
              type: 'transfer_rules' as const,
              effect: 'allow' as const,
              enabled: true,
              priority: 0,
              createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
              config: {
                maxValuePerTx: 10000,
                maxValuePerDay: 50000,
                maxCountPerDay: 30,
                maxCountPerHour: 5,
              },
            },
            {
              id: 'policy-2',
              name: '白名单地址',
              type: 'address_rules' as const,
              effect: 'allow' as const,
              enabled: true,
              priority: 1,
              createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
              config: {
                addresses: [
                  { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78', label: 'Binance Hot Wallet', network: 'ethereum' as const },
                  { address: '0x28C6c06298d514Db089934071355E5743bf21d60', label: 'Binance Deposit', network: 'bsc' as const },
                ],
              },
            },
            {
              id: 'policy-3',
              name: '仅允许稳定币',
              type: 'token_rules' as const,
              effect: 'allow' as const,
              enabled: true,
              priority: 2,
              createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
              config: {
                tokens: [
                  { symbol: 'USDT', name: 'Tether USD' },
                  { symbol: 'USDC', name: 'USD Coin' },
                ],
              },
            },
          ],
          currentDailyVolume: 6490,
          currentDailyTxCount: 12,
        },
      },
      {
        id: 'dagent-2',
        walletId: 'wallet-2',
        principalId: 'xyz98-abcde-fghij-klmno-pqrst',
        agentName: 'Payment Agent',
        status: 'active',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        permissions: { readBalance: true, transfer: true, contractCall: false, walletManage: false },
        tssNodeStatus: 'active',
        riskConfig: {
          defaultAction: 'deny' as DefaultPolicyAction,
          policies: [
            {
              id: 'policy-4',
              name: '支付转账限额',
              type: 'transfer_rules' as const,
              effect: 'allow' as const,
              enabled: true,
              priority: 0,
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              config: {
                maxValuePerTx: 5000,
                maxValuePerDay: 20000,
                maxCountPerDay: 50,
              },
            },
            {
              id: 'policy-5',
              name: '仅允许 EVM 链',
              type: 'chain_rules' as const,
              effect: 'allow' as const,
              enabled: true,
              priority: 1,
              createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
              config: {
                chains: ['ethereum', 'bsc'],
              },
            },
            {
              id: 'policy-6',
              name: '黑名单地址',
              type: 'address_rules' as const,
              effect: 'deny' as const,
              enabled: true,
              priority: 2,
              createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
              config: {
                addresses: [
                  { address: '0xBadAddr123...', label: '可疑地址', network: 'ethereum' as const },
                ],
              },
            },
          ],
          currentDailyVolume: 3200,
          currentDailyTxCount: 8,
        },
      },
      {
        id: 'dagent-3',
        walletId: 'wallet-2',
        principalId: 'old99-agent-revkd-xxxxx-yyyyy',
        agentName: 'Old Integration',
        status: 'revoked',
        createdAt: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        revokedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        permissions: { readBalance: true, transfer: true, contractCall: false, walletManage: false },
        tssNodeStatus: 'inactive',
        riskConfig: {
          defaultAction: 'allow' as DefaultPolicyAction,
          policies: [],
          currentDailyVolume: 0,
          currentDailyTxCount: 0,
        },
      },
    ];
    setDelegatedAgents(mockDelegatedAgents);

    // ============= Mock Human Agent Data =============
    const mockHumanAgents: HumanAgent[] = [
      {
        principalId: 'abc12-defgh-ijklm-nopqr-stuvw',
        displayName: 'Trading Bot',
        delegationStatus: 'delegated',
        delegatedAgentId: 'dagent-1',
        delegatedWalletId: 'wallet-1',
        createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      },
      {
        principalId: 'xyz98-abcde-fghij-klmno-pqrst',
        displayName: 'Payment Agent',
        delegationStatus: 'delegated',
        delegatedAgentId: 'dagent-2',
        delegatedWalletId: 'wallet-2',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      },
      {
        principalId: 'new42-agent-ready-tobnd-setup',
        displayName: 'Analytics Agent',
        delegationStatus: 'not_delegated',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      },
    ];
    setHumanAgents(mockHumanAgents);

    const mockAgentTxs: AgentTransaction[] = [
      {
        id: 'atx-1',
        walletId: 'wallet-1',
        walletName: '我的钱包',
        agentName: 'Trading Bot',
        agentId: 'dagent-1',
        toAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78',
        toLabel: 'Binance Hot Wallet',
        amount: 2500,
        symbol: 'USDT',
        network: 'ethereum',
        usdValue: 2500,
        status: 'pending_approval',
        createdAt: new Date(Date.now() - 15 * 60 * 1000),
        expiresAt: new Date(Date.now() + 45 * 60 * 1000),
        riskScore: 'green',
        memo: '自动交易结算',
      },
      {
        id: 'atx-2',
        walletId: 'wallet-2',
        walletName: '商务钱包',
        agentName: 'Payment Agent',
        agentId: 'dagent-2',
        toAddress: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        amount: 8500,
        symbol: 'USDT',
        network: 'ethereum',
        usdValue: 8500,
        status: 'pending_approval',
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        expiresAt: new Date(Date.now() + 55 * 60 * 1000),
        riskScore: 'yellow',
        riskReasons: ['目标地址交易历史较短', '单笔金额超过日常均值'],
        memo: '供应商结算',
      },
      {
        id: 'atx-3',
        walletId: 'wallet-1',
        walletName: '我的钱包',
        agentName: 'Trading Bot',
        agentId: 'dagent-1',
        toAddress: '0x28C6c06298d514Db089934071355E5743bf21d60',
        toLabel: 'Binance Deposit',
        amount: 150,
        symbol: 'USDT',
        network: 'bsc',
        usdValue: 150,
        status: 'approved',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
        reviewedBy: '自动放行（低于阈值 $500）',
        riskScore: 'green',
        txHash: '0xabc123def456...',
        executedAt: new Date(Date.now() - 1.5 * 60 * 60 * 1000),
      },
      {
        id: 'atx-4',
        walletId: 'wallet-2',
        walletName: '商务钱包',
        agentName: 'Payment Agent',
        agentId: 'dagent-2',
        toAddress: '0xSuspiciousAddr123...',
        amount: 15000,
        symbol: 'USDC',
        network: 'ethereum',
        usdValue: 15000,
        status: 'rejected',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 5.5 * 60 * 60 * 1000),
        reviewedBy: 'Sarah Chen',
        rejectionReason: '目标地址存在可疑活动，需进一步确认',
        riskScore: 'red',
        riskReasons: ['目标地址关联制裁实体', 'OFAC 黑名单匹配'],
      },
      {
        id: 'atx-5',
        walletId: 'wallet-1',
        walletName: '我的钱包',
        agentName: 'Trading Bot',
        agentId: 'dagent-1',
        toAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78',
        toLabel: 'Binance Hot Wallet',
        amount: 1200,
        symbol: 'ETH',
        network: 'ethereum',
        usdValue: 3840,
        status: 'settled',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        reviewedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
        reviewedBy: 'Sarah Chen',
        reviewNote: '已审核通过',
        riskScore: 'green',
        txHash: '0xdef789abc012...',
        executedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
      },
      {
        id: 'atx-6',
        walletId: 'wallet-2',
        walletName: '商务钱包',
        agentName: 'Payment Agent',
        agentId: 'dagent-2',
        toAddress: '0xExpiredTarget456...',
        amount: 3000,
        symbol: 'USDT',
        network: 'tron',
        usdValue: 3000,
        status: 'expired',
        createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        expiresAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        riskScore: 'yellow',
        riskReasons: ['新创建地址，交易历史不足'],
      },
      {
        id: 'atx-7',
        walletId: 'wallet-1',
        walletName: '我的钱包',
        agentName: 'Trading Bot',
        agentId: 'dagent-1',
        toAddress: '0x28C6c06298d514Db089934071355E5743bf21d60',
        toLabel: 'Binance Deposit',
        amount: 5000,
        symbol: 'USDT',
        network: 'ethereum',
        usdValue: 5000,
        status: 'pending_approval',
        createdAt: new Date(Date.now() - 8 * 60 * 1000),
        expiresAt: new Date(Date.now() + 52 * 60 * 1000),
        riskScore: 'green',
        memo: 'DCA 定投转账',
      },
    ];

    // Historical settled/failed transactions for reconciliation dashboard (past 30 days)
    const historyData: Array<{ days: number; agent: string; agentId: string; wallet: string; walletName: string; to: string; toLabel: string; amt: number; sym: string; net: string; risk: RiskColor; status: AgentTxStatus; gas?: number; fail?: string }> = [
      { days: 1, agent: 'Trading Bot', agentId: 'dagent-1', wallet: 'wallet-1', walletName: '我的钱包', to: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78', toLabel: 'Binance Hot Wallet', amt: 3200, sym: 'USDT', net: 'ethereum', risk: 'green', status: 'settled', gas: 2.15 },
      { days: 1, agent: 'Payment Agent', agentId: 'dagent-2', wallet: 'wallet-2', walletName: '商务钱包', to: '0xdAC17F958D2ee523a2206206994597C13D831ec7', toLabel: '', amt: 750, sym: 'USDT', net: 'bsc', risk: 'green', status: 'settled', gas: 0.35 },
      { days: 2, agent: 'Trading Bot', agentId: 'dagent-1', wallet: 'wallet-1', walletName: '我的钱包', to: '0x28C6c06298d514Db089934071355E5743bf21d60', toLabel: 'Binance Deposit', amt: 5500, sym: 'USDT', net: 'ethereum', risk: 'green', status: 'settled', gas: 3.20 },
      { days: 2, agent: 'Payment Agent', agentId: 'dagent-2', wallet: 'wallet-2', walletName: '商务钱包', to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', toLabel: '', amt: 12000, sym: 'USDC', net: 'ethereum', risk: 'yellow', status: 'settled', gas: 4.80 },
      { days: 3, agent: 'Trading Bot', agentId: 'dagent-1', wallet: 'wallet-1', walletName: '我的钱包', to: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78', toLabel: 'Binance Hot Wallet', amt: 1800, sym: 'USDT', net: 'bsc', risk: 'green', status: 'settled', gas: 0.28 },
      { days: 3, agent: 'Trading Bot', agentId: 'dagent-1', wallet: 'wallet-1', walletName: '我的钱包', to: '0x28C6c06298d514Db089934071355E5743bf21d60', toLabel: 'Binance Deposit', amt: 400, sym: 'USDT', net: 'tron', risk: 'green', status: 'settled', gas: 0.12 },
      { days: 4, agent: 'Payment Agent', agentId: 'dagent-2', wallet: 'wallet-2', walletName: '商务钱包', to: '0xdAC17F958D2ee523a2206206994597C13D831ec7', toLabel: '', amt: 6800, sym: 'USDT', net: 'ethereum', risk: 'green', status: 'settled', gas: 2.90 },
      { days: 4, agent: 'Trading Bot', agentId: 'dagent-1', wallet: 'wallet-1', walletName: '我的钱包', to: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78', toLabel: 'Binance Hot Wallet', amt: 2200, sym: 'USDT', net: 'solana', risk: 'green', status: 'failed', fail: 'Nonce 冲突，交易被拒绝' },
      { days: 5, agent: 'Payment Agent', agentId: 'dagent-2', wallet: 'wallet-2', walletName: '商务钱包', to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', toLabel: '', amt: 9500, sym: 'USDC', net: 'ethereum', risk: 'green', status: 'settled', gas: 3.45 },
      { days: 6, agent: 'Trading Bot', agentId: 'dagent-1', wallet: 'wallet-1', walletName: '我的钱包', to: '0x28C6c06298d514Db089934071355E5743bf21d60', toLabel: 'Binance Deposit', amt: 3600, sym: 'USDT', net: 'bsc', risk: 'green', status: 'settled', gas: 0.42 },
      { days: 7, agent: 'Payment Agent', agentId: 'dagent-2', wallet: 'wallet-2', walletName: '商务钱包', to: '0xdAC17F958D2ee523a2206206994597C13D831ec7', toLabel: '', amt: 4200, sym: 'USDT', net: 'tron', risk: 'green', status: 'settled', gas: 0.18 },
      { days: 8, agent: 'Trading Bot', agentId: 'dagent-1', wallet: 'wallet-1', walletName: '我的钱包', to: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78', toLabel: 'Binance Hot Wallet', amt: 7800, sym: 'USDT', net: 'ethereum', risk: 'green', status: 'settled', gas: 3.10 },
      { days: 10, agent: 'Payment Agent', agentId: 'dagent-2', wallet: 'wallet-2', walletName: '商务钱包', to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', toLabel: '', amt: 15000, sym: 'USDC', net: 'ethereum', risk: 'yellow', status: 'settled', gas: 5.60 },
      { days: 12, agent: 'Trading Bot', agentId: 'dagent-1', wallet: 'wallet-1', walletName: '我的钱包', to: '0x28C6c06298d514Db089934071355E5743bf21d60', toLabel: 'Binance Deposit', amt: 950, sym: 'USDT', net: 'tron', risk: 'green', status: 'settled', gas: 0.08 },
      { days: 14, agent: 'Payment Agent', agentId: 'dagent-2', wallet: 'wallet-2', walletName: '商务钱包', to: '0xdAC17F958D2ee523a2206206994597C13D831ec7', toLabel: '', amt: 2800, sym: 'USDT', net: 'bsc', risk: 'green', status: 'failed', fail: 'Gas 费用不足，交易无法广播' },
      { days: 16, agent: 'Trading Bot', agentId: 'dagent-1', wallet: 'wallet-1', walletName: '我的钱包', to: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78', toLabel: 'Binance Hot Wallet', amt: 4100, sym: 'USDT', net: 'ethereum', risk: 'green', status: 'settled', gas: 1.95 },
      { days: 20, agent: 'Payment Agent', agentId: 'dagent-2', wallet: 'wallet-2', walletName: '商务钱包', to: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', toLabel: '', amt: 8200, sym: 'USDC', net: 'ethereum', risk: 'green', status: 'settled', gas: 3.85 },
      { days: 22, agent: 'Trading Bot', agentId: 'dagent-1', wallet: 'wallet-1', walletName: '我的钱包', to: '0x28C6c06298d514Db089934071355E5743bf21d60', toLabel: 'Binance Deposit', amt: 1500, sym: 'USDT', net: 'solana', risk: 'green', status: 'settled', gas: 0.05 },
      { days: 25, agent: 'Payment Agent', agentId: 'dagent-2', wallet: 'wallet-2', walletName: '商务钱包', to: '0xdAC17F958D2ee523a2206206994597C13D831ec7', toLabel: '', amt: 6300, sym: 'USDT', net: 'ethereum', risk: 'green', status: 'settled', gas: 2.70 },
      { days: 28, agent: 'Trading Bot', agentId: 'dagent-1', wallet: 'wallet-1', walletName: '我的钱包', to: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78', toLabel: 'Binance Hot Wallet', amt: 11000, sym: 'USDT', net: 'ethereum', risk: 'green', status: 'settled', gas: 4.20 },
    ];

    const historyTxs: AgentTransaction[] = historyData.map((d, i) => {
      const createdAt = new Date(Date.now() - d.days * 24 * 60 * 60 * 1000 + Math.random() * 8 * 60 * 60 * 1000);
      const base: AgentTransaction = {
        id: `atx-h${i + 1}`,
        walletId: d.wallet, walletName: d.walletName,
        agentName: d.agent, agentId: d.agentId,
        toAddress: d.to, toLabel: d.toLabel || undefined,
        amount: d.amt, symbol: d.sym, network: d.net as ChainId, usdValue: d.amt,
        status: d.status, createdAt, expiresAt: new Date(createdAt.getTime() + 60 * 60 * 1000),
        riskScore: d.risk, reviewedAt: new Date(createdAt.getTime() + 120000), reviewedBy: 'Sarah Chen',
      };
      if (d.status === 'settled') {
        const required = CHAIN_CONFIRMATIONS[d.net] || 12;
        base.txHash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        base.executedAt = new Date(createdAt.getTime() + 120000);
        base.broadcastAt = new Date(createdAt.getTime() + 122000);
        base.confirmations = required;
        base.requiredConfirmations = required;
        base.settledAt = new Date(createdAt.getTime() + 122000 + required * 1000);
        base.gasFee = d.gas;
        base.blockNumber = Math.floor(Math.random() * 1000000) + 19000000;
      }
      if (d.status === 'failed') {
        base.failedAt = new Date(createdAt.getTime() + 124000);
        base.failureReason = d.fail;
        base.retryCount = 0;
      }
      return base;
    });

    setAgentTransactions([...mockAgentTxs, ...historyTxs]);

    // Mock agent transfer requests (Mode 2 - user requests agent to execute)
    const mockAgentRequests: AgentTransferRequest[] = [
      {
        id: 'areq-1',
        walletId: 'wallet-4',
        walletName: 'Agent 交易钱包',
        toAddress: '0x7a3F9c2B8e4D1f5A6b3C9e8D7f2A1b4C5d6E7f8A',
        toLabel: 'Binance Hot Wallet',
        amount: 2000,
        symbol: 'USDT',
        network: 'ethereum',
        usdValue: 2000,
        status: 'pending',
        createdAt: new Date(Date.now() - 10 * 60 * 1000),
      },
      {
        id: 'areq-2',
        walletId: 'wallet-4',
        walletName: 'Agent 交易钱包',
        toAddress: '0xDEF456789012345678901234567890abcdef5678',
        amount: 0.5,
        symbol: 'ETH',
        network: 'ethereum',
        usdValue: 1750,
        status: 'completed',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30000),
        completedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 120000),
        txHash: '0xabc123def456789012345678901234567890abcd',
      },
      {
        id: 'areq-3',
        walletId: 'wallet-4',
        walletName: 'Agent 交易钱包',
        toAddress: '0xABC789DEF012345678901234567890abcdef1234',
        amount: 5000,
        symbol: 'USDT',
        network: 'ethereum',
        usdValue: 5000,
        memo: '供应商付款',
        status: 'rejected',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        respondedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000 + 60000),
        rejectionReason: '超出每日限额',
      },
      {
        id: 'areq-4',
        walletId: 'wallet-4',
        walletName: 'Agent 交易钱包',
        toAddress: '0x1234567890abcdef1234567890abcdef12345678',
        amount: 1500,
        symbol: 'USDC',
        network: 'ethereum',
        usdValue: 1500,
        status: 'executing',
        createdAt: new Date(Date.now() - 5 * 60 * 1000),
        respondedAt: new Date(Date.now() - 3 * 60 * 1000),
      },
    ];
    setAgentTransferRequests(mockAgentRequests);

    const mockAgentRiskConfigs: AgentRiskConfig[] = [
      {
        walletId: 'wallet-1',
        agentEnabled: true,
        isPaused: false,
        controlMode: 'manual_review',
        maxTxPerMinute: 5,
        maxTxPerHour: 30,
        maxDailyVolume: 50000,
        currentDailyVolume: 6490,
        whitelistedAddresses: [
          { address: '0x742d35Cc6634C0532925a3b844Bc9e7595f2bD78', label: 'Binance Hot Wallet', network: 'ethereum' },
          { address: '0x28C6c06298d514Db089934071355E5743bf21d60', label: 'Binance Deposit', network: 'bsc' },
        ],
        blacklistedAddresses: [],
        onlyWhitelist: false,
      },
      {
        walletId: 'wallet-2',
        agentEnabled: true,
        isPaused: false,
        controlMode: 'manual_review',
        maxTxPerMinute: 3,
        maxTxPerHour: 20,
        maxDailyVolume: 100000,
        currentDailyVolume: 11500,
        whitelistedAddresses: [],
        blacklistedAddresses: [
          { address: '0xSuspiciousAddr123...', label: '可疑地址', reason: '关联制裁实体' },
        ],
        onlyWhitelist: false,
      },
      {
        walletId: 'wallet-3',
        agentEnabled: false,
        isPaused: false,
        controlMode: 'block',
        maxTxPerMinute: 10,
        maxTxPerHour: 60,
        maxDailyVolume: 200000,
        currentDailyVolume: 0,
        whitelistedAddresses: [],
        blacklistedAddresses: [],
        onlyWhitelist: false,
      },
      {
        walletId: 'wallet-4',
        agentEnabled: true,
        isPaused: false,
        controlMode: 'manual_review',
        maxTxPerMinute: 5,
        maxTxPerHour: 30,
        maxDailyVolume: 80000,
        currentDailyVolume: 3750,
        whitelistedAddresses: [],
        blacklistedAddresses: [],
        onlyWhitelist: false,
      },
    ];
    setAgentRiskConfigs(mockAgentRiskConfigs);
  }, []);

  const sendVerificationCode = useCallback(async (email: string): Promise<void> => {
    // Simulate sending verification code
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Verification code sent to ${email}`);
    // In production, this would call an API to send the code
  }, []);

  // Check if user has set a password for the email
  const checkPasswordExists = useCallback(async (email: string): Promise<{ hasPassword: boolean; isNewUser: boolean }> => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Mock: Users with specific email patterns have password set
    // In production, this would call an API to check
    const hasPassword = email.includes('test') || email.includes('demo') || !mockIsNewUser;
    const isNewUser = mockIsNewUser;
    
    return { hasPassword, isNewUser };
  }, [mockIsNewUser]);

  // Login with password
  const loginWithPassword = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock: Accept any password with length >= 6 for testing
    if (password.length < 6) {
      throw new Error('密码错误');
    }

    setIsAuthenticated(true);

    if (mockIsNewUser) {
      const mockUserInfo: UserInfo = {
        email,
        nickname: email.split('@')[0],
      };
      setUserInfo(mockUserInfo);
      setWalletStatus('not_created');
      
      return {
        userType: 'new',
        isDeviceAuthorized: true,
        hasExistingWallets: false,
      };
    } else {
      setupExistingUser();
      
      return {
        userType: 'returning_with_wallet',
        isDeviceAuthorized: true,
        hasExistingWallets: true,
      };
    }
  }, [mockIsNewUser, setupExistingUser]);

  const verifyCode = useCallback(async (email: string, code: string): Promise<AuthResult> => {
    // Simulate verification delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock: Accept any 6-digit code for testing
    if (code.length !== 6) {
      throw new Error('Invalid code');
    }

    setIsAuthenticated(true);

    // Determine user type based on mockIsNewUser flag
    if (mockIsNewUser) {
      // New user - no wallets
      const mockUserInfo: UserInfo = {
        email,
        nickname: email.split('@')[0],
      };
      setUserInfo(mockUserInfo);
      setWalletStatus('not_created');
      
      return {
        userType: 'new',
        isDeviceAuthorized: true,
        hasExistingWallets: false,
      };
    } else {
      // Existing user with wallets
      setupExistingUser();
      
      return {
        userType: 'returning_with_wallet',
        isDeviceAuthorized: true,
        hasExistingWallets: true,
      };
    }
  }, [mockIsNewUser, setupExistingUser]);

  const login = useCallback(async (provider: 'apple' | 'google' | 'email'): Promise<AuthResult> => {
    // Simulate login delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsAuthenticated(true);
    
    if (mockIsNewUser) {
      const mockUserInfo: UserInfo = {
        email: 'newuser@example.com',
        nickname: 'New User',
      };
      setUserInfo(mockUserInfo);
      setWalletStatus('not_created');
      
      return {
        userType: 'new',
        isDeviceAuthorized: true,
        hasExistingWallets: false,
      };
    } else {
      setupExistingUser();
      
      return {
        userType: 'returning_with_wallet',
        isDeviceAuthorized: true,
        hasExistingWallets: true,
      };
    }
  }, [mockIsNewUser, setupExistingUser]);

  // Dev mode login - instant login with existing user data for testing
  const devModeLogin = useCallback(() => {
    setIsAuthenticated(true);
    setupExistingUser();
  }, [setupExistingUser]);

  const logout = useCallback(() => {
    setIsAuthenticated(false);
    setUserInfo(null);
    setCurrentWallet(null);
    setWallets([]);
    setAssets([]);
    setTransactions([]);
    setWalletStatus('not_created');
    setHasPin(false);
    setHasBiometric(false);
    setOnboardingStep(0);
  }, []);

  const createWallet = useCallback(async (name: string): Promise<Wallet> => {
    // Simulate MPC key generation
    await new Promise(resolve => setTimeout(resolve, 3000));

    const timestamp = Date.now();
    const newAddresses = generateWalletAddresses();
    const newWallet: Wallet = {
      id: `wallet-${timestamp}`,
      name,
      walletAddresses: newAddresses,
      addresses: buildLegacyAddresses(newAddresses),
      createdAt: new Date(),
      isBackedUp: false,
      isBiometricEnabled: hasBiometric,
      origin: 'user_created',
    };

    // Map placeholder addressIds in mock assets to real ones
    const evmAddrId = newAddresses.find(a => a.system === 'evm')?.id || '';
    const tronAddrId = newAddresses.find(a => a.system === 'tron')?.id || '';
    const solAddrId = newAddresses.find(a => a.system === 'solana')?.id || '';
    const mappedAssets = mockAssetsNewWallet.map(a => ({
      ...a,
      addressId: a.addressId === 'new-evm-1' ? evmAddrId
        : a.addressId === 'new-tron-1' ? tronAddrId
        : a.addressId === 'new-sol-1' ? solAddrId
        : a.addressId,
    }));

    // Register new wallet in the assets map with sample assets for testing
    walletAssetsMap[newWallet.id] = mappedAssets;
    walletTransactionsMap[newWallet.id] = [];

    setWallets(prev => [...prev, newWallet]);
    setCurrentWallet(newWallet);
    setAssets(getAssetsForWallet(newWallet.id));
    setTransactions(getTransactionsForWallet(newWallet.id));
    setContacts(mockContacts);
    setDevices(mockDevices);
    setWalletStatus('created_no_backup');

    return newWallet;
  }, [hasBiometric]);

  const addAddress = useCallback(async (walletId: string, system: AddressSystem): Promise<WalletAddress> => {
    // Simulate biometric check + key generation
    await new Promise(resolve => setTimeout(resolve, 1500));

    const wallet = wallets.find(w => w.id === walletId);
    if (!wallet) throw new Error('Wallet not found');

    // Count existing addresses for this system
    const existingCount = wallet.walletAddresses.filter(a => a.system === system).length;
    const newAddr = generateNewWalletAddress(system, existingCount + 1);

    // Update wallet in state
    const updatedWalletAddresses = [...wallet.walletAddresses, newAddr];
    const updatedWallet: Wallet = {
      ...wallet,
      walletAddresses: updatedWalletAddresses,
      addresses: buildLegacyAddresses(updatedWalletAddresses),
    };

    setWallets(prev => prev.map(w => w.id === walletId ? updatedWallet : w));
    if (currentWallet?.id === walletId) {
      setCurrentWallet(updatedWallet);
    }

    // Generate some mock assets for the new address
    const mockNewAddrAssets: Asset[] = [];
    if (system === 'evm') {
      mockNewAddrAssets.push(
        { symbol: 'USDT', name: 'Tether USD', balance: 500.00, usdValue: 500.00, change24h: 0.01, icon: 'USDT', network: 'ethereum', addressId: newAddr.id },
        { symbol: 'ETH', name: 'Ethereum', balance: 0.1, usdValue: 350.00, change24h: 2.34, icon: 'ETH', network: 'ethereum', addressId: newAddr.id },
      );
    } else if (system === 'tron') {
      mockNewAddrAssets.push(
        { symbol: 'USDT', name: 'Tether USD', balance: 300.00, usdValue: 300.00, change24h: 0.01, icon: 'USDT', network: 'tron', addressId: newAddr.id },
        { symbol: 'TRX', name: 'Tron', balance: 1000, usdValue: 110.00, change24h: -1.2, icon: 'TRX', network: 'tron', addressId: newAddr.id },
      );
    } else {
      mockNewAddrAssets.push(
        { symbol: 'SOL', name: 'Solana', balance: 1.0, usdValue: 185.00, change24h: 3.2, icon: 'SOL', network: 'solana', addressId: newAddr.id },
        { symbol: 'USDT', name: 'Tether USD', balance: 200.00, usdValue: 200.00, change24h: 0.01, icon: 'USDT', network: 'solana', addressId: newAddr.id },
      );
    }

    // Add to assets map
    const existingAssets = walletAssetsMap[walletId] || [];
    walletAssetsMap[walletId] = [...existingAssets, ...mockNewAddrAssets];

    // Refresh assets if this is the current wallet
    if (currentWallet?.id === walletId) {
      setAssets(walletAssetsMap[walletId]);
    }

    return newAddr;
  }, [wallets, currentWallet]);

  const switchWallet = useCallback((walletId: string) => {
    const wallet = wallets.find(w => w.id === walletId);
    if (wallet) {
      setCurrentWallet(wallet);
      // Load wallet-specific assets and transactions
      setAssets(getAssetsForWallet(walletId));
      setTransactions(getTransactionsForWallet(walletId));
    }
  }, [wallets]);

  const renameWallet = useCallback((walletId: string, newName: string) => {
    setWallets(prev => prev.map(w =>
      w.id === walletId ? { ...w, name: newName } : w
    ));
    // If renaming current wallet, also update currentWallet
    if (currentWallet?.id === walletId) {
      setCurrentWallet(prev => prev ? { ...prev, name: newName } : null);
    }
  }, [currentWallet?.id]);

  const renameAddress = useCallback((walletId: string, addressId: string, newLabel: string) => {
    const updateAddresses = (w: Wallet): Wallet => ({
      ...w,
      walletAddresses: w.walletAddresses.map(a =>
        a.id === addressId ? { ...a, label: newLabel } : a
      ),
    });
    setWallets(prev => prev.map(w =>
      w.id === walletId ? updateAddresses(w) : w
    ));
    if (currentWallet?.id === walletId) {
      setCurrentWallet(prev => prev ? updateAddresses(prev) : null);
    }
  }, [currentWallet?.id]);

  // Link an agent-created wallet via setup token (Mode 2)
  const linkAgentWallet = useCallback(async (token: string): Promise<Wallet> => {
    // Simulate token validation
    await new Promise(resolve => setTimeout(resolve, 1500));
    if (!token.trim()) {
      throw new Error('请输入设置令牌');
    }

    const timestamp = Date.now();
    const agentAddresses = generateWalletAddresses();
    const newWallet: Wallet = {
      id: `wallet-${timestamp}`,
      name: 'Agent 钱包',
      walletAddresses: agentAddresses,
      addresses: buildLegacyAddresses(agentAddresses),
      createdAt: new Date(),
      isBackedUp: false,
      isBiometricEnabled: hasBiometric,
      origin: 'agent_linked',
      controlMode: 'manual_review',
      agentInfo: {
        agentName: 'Trading Agent',
        agentId: `agent-${timestamp}`,
        linkedAt: new Date(),
        setupToken: token.slice(0, 8),
      },
    };

    // Map placeholder addressIds
    const evmId = agentAddresses.find(a => a.system === 'evm')?.id || '';
    const tronId = agentAddresses.find(a => a.system === 'tron')?.id || '';
    const solId = agentAddresses.find(a => a.system === 'solana')?.id || '';
    walletAssetsMap[newWallet.id] = mockAssetsNewWallet.map(a => ({
      ...a,
      addressId: a.addressId === 'new-evm-1' ? evmId
        : a.addressId === 'new-tron-1' ? tronId
        : a.addressId === 'new-sol-1' ? solId
        : a.addressId,
    }));
    walletTransactionsMap[newWallet.id] = [];

    setWallets(prev => [...prev, newWallet]);
    setCurrentWallet(newWallet);
    setAssets(getAssetsForWallet(newWallet.id));
    setTransactions(getTransactionsForWallet(newWallet.id));
    return newWallet;
  }, [hasBiometric]);

  // Submit a transfer request to agent (Mode 2)
  const submitAgentRequest = useCallback(async (
    request: Omit<AgentTransferRequest, 'id' | 'createdAt' | 'status' | 'walletName'>
  ): Promise<AgentTransferRequest> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    const wallet = wallets.find(w => w.id === request.walletId);
    const newRequest: AgentTransferRequest = {
      ...request,
      id: `areq-${Date.now()}`,
      walletName: wallet?.name || 'Agent 钱包',
      status: 'pending',
      createdAt: new Date(),
    };
    setAgentTransferRequests(prev => [newRequest, ...prev]);
    return newRequest;
  }, [wallets]);

  const getAgentRequestsForWallet = useCallback((walletId: string): AgentTransferRequest[] => {
    return agentTransferRequests.filter(r => r.walletId === walletId);
  }, [agentTransferRequests]);




  const setPin = useCallback(async (pin: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    setHasPin(true);
    return true;
  }, []);

  const enableBiometric = useCallback(async (): Promise<boolean> => {
    // Simulate biometric enrollment
    await new Promise(resolve => setTimeout(resolve, 1000));
    setHasBiometric(true);
    return true;
  }, []);

  const completeCloudBackup = useCallback(async (provider: 'icloud' | 'google_drive'): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setBackupStatus({
      cloudBackup: true,
      cloudProvider: provider,
      lastBackupDate: new Date(),
      fileBackup: false,
    });
    
    if (currentWallet) {
      setCurrentWallet({ ...currentWallet, isBackedUp: true });
      setWallets(prev => prev.map(w => 
        w.id === currentWallet.id ? { ...w, isBackedUp: true } : w
      ));
    }
    
    setWalletStatus('fully_secure');
    return true;
  }, [currentWallet]);

  const completeFileBackup = useCallback(async (password: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setBackupStatus(prev => ({
      ...prev,
      fileBackup: true,
    }));
    
    if (!backupStatus.cloudBackup) {
      setWalletStatus('backup_complete');
    }
    
    return true;
  }, [backupStatus.cloudBackup]);

  const backupWallet = useCallback(async (walletId: string, info: WalletBackupInfo, password?: string): Promise<boolean> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    setWallets(prev => prev.map(w =>
      w.id === walletId ? { ...w, isBackedUp: true, backupInfo: info } : w
    ));
    if (currentWallet?.id === walletId) {
      setCurrentWallet(prev => prev ? { ...prev, isBackedUp: true, backupInfo: info } : null);
    }
    // Only store password for local/file backups
    if (password) {
      setBackupPasswords(prev => ({ ...prev, [walletId]: password }));
    }
    return true;
  }, [currentWallet?.id]);

  const verifyBackupPassword = useCallback((walletId: string, password: string): boolean => {
    return backupPasswords[walletId] === password;
  }, [backupPasswords]);

  const sendTransaction = useCallback(async (to: string, amount: number, symbol: string, network: ChainId, memo?: string): Promise<string> => {
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const txHash = `0x${Math.random().toString(16).slice(2)}`;
    
    // Determine gas token and approximate gas amount based on network
    const gasConfig: Record<ChainId, { token: string; amount: number; feeUsd: number }> = {
      ethereum: { token: 'ETH', amount: 0.00072, feeUsd: 2.5 },
      tron: { token: 'TRX', amount: 22.5, feeUsd: 2.5 },
      bsc: { token: 'BNB', amount: 0.0012, feeUsd: 0.5 },
      solana: { token: 'SOL', amount: 0.00025, feeUsd: 0.05 },
      all: { token: 'ETH', amount: 0.00072, feeUsd: 2.5 },
    };
    
    const gas = gasConfig[network] || gasConfig.ethereum;
    
    // Find the asset to get USD value
    const asset = assets.find(a => a.symbol === symbol && a.network === network);
    const usdValue = asset ? (amount * asset.usdValue / asset.balance) : amount;
    
    const newTx: Transaction = {
      id: `tx-${Date.now()}`,
      type: 'send',
      amount,
      symbol,
      usdValue,
      status: 'pending',
      counterparty: to,
      timestamp: new Date(),
      txHash,
      network,
      fee: gas.feeUsd,
      gasAmount: gas.amount,
      gasToken: gas.token,
      nonce: Math.floor(Math.random() * 100),
      isRbfEnabled: network !== 'tron' && network !== 'solana',
      memo,
  
    };
    
    // Add transaction to wallet-specific map
    if (currentWallet) {
      if (!walletTransactionsMap[currentWallet.id]) {
        walletTransactionsMap[currentWallet.id] = [];
      }
      walletTransactionsMap[currentWallet.id] = [newTx, ...walletTransactionsMap[currentWallet.id]];
    }
    
    setTransactions(prev => [newTx, ...prev]);
    
    // Update balance
    setAssets(prev => prev.map(a => 
      (a.symbol === symbol && a.network === network) ? { ...a, balance: a.balance - amount, usdValue: a.usdValue - (amount * a.usdValue / a.balance) } : a
    ));
    
    return txHash;
  }, [assets, currentWallet]);

  const scanAddressRisk = useCallback(async (address: string): Promise<{ score: RiskColor; reasons: string[] }> => {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate risk scanning
    const random = Math.random();
    if (random > 0.9) {
      return { score: 'red', reasons: ['Associated with known mixer service', 'Sanctioned entity connection'] };
    } else if (random > 0.7) {
      return { score: 'yellow', reasons: ['Limited transaction history', 'New address'] };
    }
    return { score: 'green', reasons: [] };
  }, []);

  const addContact = useCallback((contact: Omit<Contact, 'id'>) => {
    const newContact: Contact = {
      ...contact,
      id: `contact-${Date.now()}`,
    };
    setContacts(prev => [...prev, newContact]);
  }, []);

  const updateContact = useCallback((id: string, updates: Partial<Contact>) => {
    setContacts(prev => prev.map(c => 
      c.id === id ? { ...c, ...updates } : c
    ));
  }, []);

  const removeContact = useCallback((id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
  }, []);

  const addDevice = useCallback((device: Device) => {
    setDevices(prev => [...prev, device]);
  }, []);

  const removeDevice = useCallback((id: string) => {
    setDevices(prev => prev.filter(d => d.id !== id));
  }, []);

  const updateSecurityConfig = useCallback((config: Partial<SecurityConfig>) => {
    setSecurityConfig(prev => ({ ...prev, ...config }));
  }, []);

  const addToken = useCallback((symbol: string, name: string, network: ChainId, price: number, change24h: number) => {
    // Check if token already exists on this network
    const exists = assets.some(a => a.symbol === symbol && a.network === network);
    if (exists) return;

    // Find the first address for this network's system
    const system = getAddressSystem(network);
    const addr = currentWallet?.walletAddresses?.find((a: WalletAddress) => a.system === system);

    const newAsset: Asset = {
      symbol,
      name,
      balance: 0,
      usdValue: 0,
      change24h,
      icon: symbol,
      network,
      addressId: addr?.id || '',
    };
    setAssets(prev => [...prev, newAsset]);
  }, [assets, currentWallet]);

  const removeToken = useCallback((symbol: string, network?: ChainId) => {
    setAssets(prev => {
      if (network) {
        // Remove from specific network
        return prev.filter(a => !(a.symbol === symbol && a.network === network));
      }
      // Remove from all networks
      return prev.filter(a => a.symbol !== symbol);
    });
  }, []);

  const getLimitStatus = useCallback((): LimitStatus => {
    return {
      singleLimit: securityConfig.singleTransactionLimit,
      dailyLimit: securityConfig.dailyLimit,
      dailyUsed: securityConfig.dailyUsed,
      dailyRemaining: securityConfig.dailyLimit - securityConfig.dailyUsed,
      monthlyLimit: securityConfig.monthlyLimit,
      monthlyUsed: securityConfig.monthlyUsed,
      monthlyRemaining: securityConfig.monthlyLimit - securityConfig.monthlyUsed,
    };
  }, [securityConfig]);

  const checkTransferLimit = useCallback((amount: number): { allowed: boolean; reason?: string } => {
    if (amount > securityConfig.singleTransactionLimit) {
      return { allowed: false, reason: `超出单笔限额 $${securityConfig.singleTransactionLimit.toLocaleString()}` };
    }
    const dailyRemaining = securityConfig.dailyLimit - securityConfig.dailyUsed;
    if (amount > dailyRemaining) {
      return { allowed: false, reason: `超出今日剩余额度 $${dailyRemaining.toLocaleString()}` };
    }
    const monthlyRemaining = securityConfig.monthlyLimit - securityConfig.monthlyUsed;
    if (amount > monthlyRemaining) {
      return { allowed: false, reason: `超出本月剩余额度 $${monthlyRemaining.toLocaleString()}` };
    }
    return { allowed: true };
  }, [securityConfig]);

  // TSS Node state and methods
  const [hasTSSNode, setHasTSSNode] = useState(true); // Mock: existing user has TSS Node
  const [tssNodeInfo, setTssNodeInfo] = useState<{ hasCloudBackup: boolean; cloudProvider?: string; hasLocalBackup: boolean } | null>({
    hasCloudBackup: true,
    cloudProvider: 'icloud',
    hasLocalBackup: true,
  });

  const checkTSSNodeExists = useCallback(async () => {
    // Mock: simulate checking server for existing TSS Node
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      exists: hasTSSNode,
      hasCloudBackup: tssNodeInfo?.hasCloudBackup ?? false,
      cloudProvider: tssNodeInfo?.cloudProvider,
      hasLocalBackup: tssNodeInfo?.hasLocalBackup ?? false,
    };
  }, [hasTSSNode, tssNodeInfo]);

  const recoverTSSNode = useCallback(async (method: 'cloud' | 'local_file' | 'old_device', password?: string) => {
    // Mock: simulate TSS Node recovery
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Simulate recovery success
    setHasTSSNode(true);
  }, []);

  const createTSSNodeFn = useCallback(async () => {
    // Mock: simulate TSS Node creation
    await new Promise(resolve => setTimeout(resolve, 1500));
    setHasTSSNode(true);
    setTssNodeInfo({
      hasCloudBackup: false,
      hasLocalBackup: false,
    });
  }, []);

  // ============= Delegated Agent Methods =============

  const delegateAgent = useCallback(async (walletId: string, principalId: string, agentName: string, permissions?: Partial<AgentPermissions>, riskConfig?: Partial<DelegatedAgentRiskConfig>): Promise<DelegatedAgent> => {
    await new Promise(resolve => setTimeout(resolve, 1500));
    // Mock failure: DeFi Agent always fails to demonstrate error handling on result page
    if (principalId === 'defi7-swap0-agent-ready-00001') {
      throw new Error('Agent 验证超时，请稍后重试');
    }
    // Check if agent is already delegated to another wallet (active or paused count as delegated)
    const existingDelegation = delegatedAgents.find(
      da => da.principalId === principalId && da.status !== 'revoked'
    );
    if (existingDelegation && existingDelegation.walletId !== walletId) {
      throw new Error('该 Agent 已被其他钱包授权，无法重复授权');
    }
    const defaultRiskConfig: DelegatedAgentRiskConfig = {
      defaultAction: 'deny',
      policies: [],
      currentDailyVolume: 0,
      currentDailyTxCount: 0,
      ...riskConfig,
    };
    const newAgent: DelegatedAgent = {
      id: `dagent-${Date.now()}`,
      walletId,
      principalId,
      agentName,
      status: 'active',
      createdAt: new Date(),
      permissions: { ...DEFAULT_AGENT_PERMISSIONS, ...permissions },
      tssNodeStatus: 'active',
      riskConfig: defaultRiskConfig,
    };
    setDelegatedAgents(prev => [...prev, newAgent]);
    // Also update humanAgents delegation status
    setHumanAgents(prev => prev.map(ha =>
      ha.principalId === principalId
        ? { ...ha, delegationStatus: 'delegated' as const, delegatedAgentId: newAgent.id, delegatedWalletId: walletId }
        : ha
    ));
    return newAgent;
  }, [delegatedAgents]);

  const revokeAgent = useCallback((agentId: string) => {
    setDelegatedAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'revoked' as DelegatedAgentStatus, revokedAt: new Date() } : a));
  }, []);

  const getAgentsForWallet = useCallback((walletId: string) => {
    return delegatedAgents.filter(a => a.walletId === walletId);
  }, [delegatedAgents]);

  const getAgentById = useCallback((agentId: string) => {
    return delegatedAgents.find(a => a.id === agentId);
  }, [delegatedAgents]);

  const pauseDelegatedAgent = useCallback((agentId: string, reason?: string) => {
    setDelegatedAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'paused' as DelegatedAgentStatus, pausedAt: new Date(), pausedReason: reason || '手动暂停' } : a));
  }, []);

  const resumeDelegatedAgent = useCallback((agentId: string) => {
    setDelegatedAgents(prev => prev.map(a => a.id === agentId ? { ...a, status: 'active' as DelegatedAgentStatus, pausedAt: undefined, pausedReason: undefined } : a));
  }, []);

  const updateDelegatedAgentRiskConfig = useCallback((agentId: string, config: Partial<DelegatedAgentRiskConfig>) => {
    setDelegatedAgents(prev => prev.map(a => a.id === agentId ? { ...a, riskConfig: { ...a.riskConfig, ...config } } : a));
  }, []);

  const updateDelegatedAgentName = useCallback((agentId: string, newName: string) => {
    setDelegatedAgents(prev => prev.map(a => a.id === agentId ? { ...a, agentName: newName } : a));
  }, []);

  const updateDelegatedAgentPermissions = useCallback((agentId: string, permissions: Partial<AgentPermissions>) => {
    setDelegatedAgents(prev => prev.map(a => a.id === agentId ? { ...a, permissions: { ...a.permissions, ...permissions } } : a));
  }, []);

  // ============= Policy-based Risk Control Methods =============

  const addPolicy = useCallback((agentId: string, policy: Omit<AgentPolicy, 'id' | 'createdAt' | 'updatedAt'>) => {
    const now = new Date();
    const newPolicy = {
      ...policy,
      id: 'policy-' + Date.now(),
      createdAt: now,
      updatedAt: now,
    } as AgentPolicy;
    setDelegatedAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, riskConfig: { ...a.riskConfig, policies: [...a.riskConfig.policies, newPolicy] } } : a
    ));
  }, []);

  const updatePolicy = useCallback((agentId: string, policyId: string, updates: Partial<AgentPolicy>) => {
    setDelegatedAgents(prev => prev.map(a =>
      a.id === agentId ? {
        ...a,
        riskConfig: {
          ...a.riskConfig,
          policies: a.riskConfig.policies.map(p =>
            p.id === policyId ? { ...p, ...updates, updatedAt: new Date() } as AgentPolicy : p
          ),
        },
      } : a
    ));
  }, []);

  const removePolicy = useCallback((agentId: string, policyId: string) => {
    setDelegatedAgents(prev => prev.map(a =>
      a.id === agentId ? {
        ...a,
        riskConfig: {
          ...a.riskConfig,
          policies: a.riskConfig.policies
            .filter(p => p.id !== policyId)
            .map((p, idx) => ({ ...p, priority: idx })),
        },
      } : a
    ));
  }, []);

  const reorderPolicies = useCallback((agentId: string, orderedPolicyIds: string[]) => {
    setDelegatedAgents(prev => prev.map(a => {
      if (a.id !== agentId) return a;
      const policyMap = new Map(a.riskConfig.policies.map(p => [p.id, p]));
      const reordered = orderedPolicyIds
        .map((id, idx) => {
          const p = policyMap.get(id);
          return p ? { ...p, priority: idx } : null;
        })
        .filter(Boolean) as AgentPolicy[];
      return { ...a, riskConfig: { ...a.riskConfig, policies: reordered } };
    }));
  }, []);

  const togglePolicyEnabled = useCallback((agentId: string, policyId: string) => {
    setDelegatedAgents(prev => prev.map(a =>
      a.id === agentId ? {
        ...a,
        riskConfig: {
          ...a.riskConfig,
          policies: a.riskConfig.policies.map(p =>
            p.id === policyId ? { ...p, enabled: !p.enabled, updatedAt: new Date() } as AgentPolicy : p
          ),
        },
      } : a
    ));
  }, []);

  const updateDefaultAction = useCallback((agentId: string, action: DefaultPolicyAction) => {
    setDelegatedAgents(prev => prev.map(a =>
      a.id === agentId ? { ...a, riskConfig: { ...a.riskConfig, defaultAction: action } } : a
    ));
  }, []);

  const getAgentTxByAgent = useCallback((agentId: string) => {
    return agentTransactions.filter(tx => tx.agentId === agentId);
  }, [agentTransactions]);

  // ============= Human Agent Methods =============

  const fetchHumanAgents = useCallback(async () => {
    // Simulate API call to refresh agent list
    await new Promise(resolve => setTimeout(resolve, 800));
    // In a real app, this would fetch from the server
    // For mock, we sync humanAgents delegation status with delegatedAgents
    setHumanAgents(prev => prev.map(ha => {
      const da = delegatedAgents.find(d => d.principalId === ha.principalId);
      if (da) {
        return {
          ...ha,
          delegationStatus: da.status === 'active' ? 'delegated' : da.status === 'paused' ? 'paused' : da.status === 'revoked' ? 'revoked' : ha.delegationStatus,
          delegatedAgentId: da.id,
          delegatedWalletId: da.walletId,
        } as HumanAgent;
      }
      return ha;
    }));
  }, [delegatedAgents]);

  const generateSetupToken = useCallback(async (): Promise<SetupToken> => {
    // If there's a valid (non-expired) token, return it
    if (currentSetupToken && currentSetupToken.status === 'active' && currentSetupToken.expiresAt.getTime() > Date.now()) {
      return currentSetupToken;
    }
    await new Promise(resolve => setTimeout(resolve, 300));
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const tokenStr = Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
    const formatted = `st_${tokenStr.slice(0, 8)}-${tokenStr.slice(8, 16)}-${tokenStr.slice(16, 24)}-${tokenStr.slice(24)}`;
    const now = new Date();
    const token: SetupToken = {
      token: formatted,
      status: 'active',
      createdAt: now,
      expiresAt: new Date(now.getTime() + SETUP_TOKEN_VALIDITY_MS),
    };
    setCurrentSetupToken(token);
    return token;
  }, [currentSetupToken]);

  const addMockHumanAgent = useCallback((agent: HumanAgent) => {
    setHumanAgents(prev => {
      if (prev.some(a => a.principalId === agent.principalId)) return prev;
      return [...prev, agent];
    });
  }, []);

  // Settlement simulation refs
  const settlementTimers = useRef<Map<string, NodeJS.Timeout[]>>(new Map());

  const startSettlement = useCallback((txId: string) => {
    // Clear any existing timers for this tx
    const existing = settlementTimers.current.get(txId);
    if (existing) existing.forEach(t => clearTimeout(t));
    const timers: NodeJS.Timeout[] = [];

    // Phase 1: broadcasting after 2s
    timers.push(setTimeout(() => {
      setAgentTransactions(prev => {
        const tx = prev.find(t => t.id === txId);
        if (!tx || tx.status !== 'approved') return prev;
        // 15% chance of broadcast failure
        if (Math.random() < 0.15) {
          return prev.map(t => t.id === txId ? { ...t, status: 'failed' as AgentTxStatus, failedAt: new Date(), failureReason: Math.random() > 0.5 ? 'Gas 费用不足，交易无法广播' : 'Nonce 冲突，请重试' } : t);
        }
        const hash = `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
        return prev.map(t => t.id === txId ? { ...t, status: 'broadcasting' as AgentTxStatus, txHash: hash, broadcastAt: new Date() } : t);
      });

      // Phase 2: confirming after another 2s
      timers.push(setTimeout(() => {
        setAgentTransactions(prev => {
          const tx = prev.find(t => t.id === txId);
          if (!tx || tx.status !== 'broadcasting') return prev;
          const required = CHAIN_CONFIRMATIONS[tx.network] || 12;
          // 10% chance of confirmation failure
          if (Math.random() < 0.1) {
            return prev.map(t => t.id === txId ? { ...t, status: 'failed' as AgentTxStatus, failedAt: new Date(), failureReason: '合约执行回滚 (Reverted)', confirmations: 0, requiredConfirmations: required } : t);
          }
          return prev.map(t => t.id === txId ? { ...t, status: 'confirming' as AgentTxStatus, confirmations: 0, requiredConfirmations: required } : t);
        });

        // Phase 3: increment confirmations every 1s
        let confirmCount = 0;
        const confirmInterval = setInterval(() => {
          confirmCount++;
          setAgentTransactions(prev => {
            const tx = prev.find(t => t.id === txId);
            if (!tx || tx.status !== 'confirming') { clearInterval(confirmInterval); return prev; }
            const required = tx.requiredConfirmations || 12;
            if (confirmCount >= required) {
              clearInterval(confirmInterval);
              const gasFee = parseFloat((Math.random() * 5 + 0.5).toFixed(2));
              const blockNum = Math.floor(Math.random() * 1000000) + 19000000;
              return prev.map(t => t.id === txId ? { ...t, status: 'settled' as AgentTxStatus, confirmations: required, settledAt: new Date(), gasFee, blockNumber: blockNum } : t);
            }
            return prev.map(t => t.id === txId ? { ...t, confirmations: confirmCount } : t);
          });
        }, 1000);
        timers.push(confirmInterval as unknown as NodeJS.Timeout);
      }, 2000));
    }, 2000));

    settlementTimers.current.set(txId, timers);
  }, []);

  const approveAgentTx = useCallback((txId: string, note?: string) => {
    setAgentTransactions(prev => prev.map(tx =>
      tx.id === txId ? { ...tx, status: 'approved' as AgentTxStatus, reviewedAt: new Date(), reviewedBy: 'Sarah Chen', reviewNote: note, executedAt: new Date() } : tx
    ));
    // Trigger settlement simulation
    setTimeout(() => startSettlement(txId), 100);
  }, [startSettlement]);

  const rejectAgentTx = useCallback((txId: string, reason: string) => {
    setAgentTransactions(prev => prev.map(tx =>
      tx.id === txId ? { ...tx, status: 'rejected' as AgentTxStatus, reviewedAt: new Date(), reviewedBy: 'Sarah Chen', rejectionReason: reason } : tx
    ));
  }, []);

  const retryFailedTx = useCallback((txId: string) => {
    setAgentTransactions(prev => prev.map(tx =>
      tx.id === txId ? { ...tx, status: 'approved' as AgentTxStatus, failedAt: undefined, failureReason: undefined, retryCount: (tx.retryCount || 0) + 1 } : tx
    ));
    setTimeout(() => startSettlement(txId), 100);
  }, [startSettlement]);

  const voidFailedTx = useCallback((txId: string) => {
    setAgentTransactions(prev => prev.map(tx =>
      tx.id === txId ? { ...tx, status: 'rejected' as AgentTxStatus, reviewedAt: new Date(), reviewedBy: 'Sarah Chen', rejectionReason: '交易执行失败后作废' } : tx
    ));
  }, []);

  const getPendingAgentTxs = useCallback(() => {
    return agentTransactions.filter(tx => tx.status === 'pending_approval');
  }, [agentTransactions]);

  const getAgentTxByWallet = useCallback((walletId: string) => {
    return agentTransactions.filter(tx => tx.walletId === walletId);
  }, [agentTransactions]);

  const getAgentRiskConfig = useCallback((walletId: string) => {
    return agentRiskConfigs.find(c => c.walletId === walletId);
  }, [agentRiskConfigs]);

  const updateWalletControlMode = useCallback((walletId: string, mode: WalletControlMode) => {
    setWallets(prev => prev.map(w => w.id === walletId ? { ...w, controlMode: mode } : w));
    setAgentRiskConfigs(prev => prev.map(c => c.walletId === walletId ? { ...c, controlMode: mode } : c));
    if (currentWallet?.id === walletId) {
      setCurrentWallet(prev => prev ? { ...prev, controlMode: mode } : prev);
    }
  }, [currentWallet]);

  const updateAgentRiskConfig = useCallback((walletId: string, config: Partial<AgentRiskConfig>) => {
    setAgentRiskConfigs(prev => prev.map(c => c.walletId === walletId ? { ...c, ...config } : c));
  }, []);

  const enableAgent = useCallback((walletId: string) => {
    setAgentRiskConfigs(prev => prev.map(c => c.walletId === walletId ? { ...c, agentEnabled: true } : c));
  }, []);

  const disableAgent = useCallback((walletId: string) => {
    setAgentRiskConfigs(prev => prev.map(c => c.walletId === walletId ? { ...c, agentEnabled: false, isPaused: false } : c));
  }, []);

  const pauseAgent = useCallback((walletId: string, reason?: string) => {
    setAgentRiskConfigs(prev => prev.map(c => c.walletId === walletId ? { ...c, isPaused: true, pausedAt: new Date(), pausedReason: reason || '手动暂停' } : c));
  }, []);

  const resumeAgent = useCallback((walletId: string) => {
    setAgentRiskConfigs(prev => prev.map(c => c.walletId === walletId ? { ...c, isPaused: false, pausedAt: undefined, pausedReason: undefined } : c));
  }, []);

  const pauseAllAgents = useCallback((reason?: string) => {
    setAgentRiskConfigs(prev => prev.map(c => ({ ...c, isPaused: true, pausedAt: new Date(), pausedReason: reason || '全局紧急暂停' })));
  }, []);

  const addWhitelistAddress = useCallback((walletId: string, address: string, label: string, network: ChainId) => {
    setAgentRiskConfigs(prev => prev.map(c => c.walletId === walletId ? { ...c, whitelistedAddresses: [...c.whitelistedAddresses, { address, label, network }] } : c));
  }, []);

  const removeWhitelistAddress = useCallback((walletId: string, address: string) => {
    setAgentRiskConfigs(prev => prev.map(c => c.walletId === walletId ? { ...c, whitelistedAddresses: c.whitelistedAddresses.filter(a => a.address !== address) } : c));
  }, []);

  const addBlacklistAddress = useCallback((walletId: string, address: string, label: string, reason: string) => {
    setAgentRiskConfigs(prev => prev.map(c => c.walletId === walletId ? { ...c, blacklistedAddresses: [...c.blacklistedAddresses, { address, label, reason }] } : c));
  }, []);

  const removeBlacklistAddress = useCallback((walletId: string, address: string) => {
    setAgentRiskConfigs(prev => prev.map(c => c.walletId === walletId ? { ...c, blacklistedAddresses: c.blacklistedAddresses.filter(a => a.address !== address) } : c));
  }, []);

  const getProcessingTxs = useCallback(() => {
    return agentTransactions.filter(tx => tx.status === 'broadcasting' || tx.status === 'confirming');
  }, [agentTransactions]);

  const getFailedTxs = useCallback(() => {
    return agentTransactions.filter(tx => tx.status === 'failed');
  }, [agentTransactions]);

  const getSettledTxs = useCallback(() => {
    return agentTransactions.filter(tx => tx.status === 'settled');
  }, [agentTransactions]);

  const getReconciliationSummary = useCallback((period: 'today' | 'week' | 'month'): ReconciliationSummary => {
    const now = new Date();
    const startDate = new Date();
    if (period === 'today') startDate.setHours(0, 0, 0, 0);
    else if (period === 'week') startDate.setDate(now.getDate() - 7);
    else startDate.setDate(now.getDate() - 30);

    const filtered = agentTransactions.filter(tx => tx.createdAt >= startDate);
    const terminal = filtered.filter(tx => ['settled', 'failed', 'rejected', 'expired'].includes(tx.status));
    const settled = filtered.filter(tx => tx.status === 'settled');
    const failed = filtered.filter(tx => tx.status === 'failed');
    const processing = filtered.filter(tx => ['pending_approval', 'approved', 'broadcasting', 'confirming'].includes(tx.status));

    const totalVolume = settled.reduce((s, tx) => s + tx.usdValue, 0);
    const totalGasFee = settled.reduce((s, tx) => s + (tx.gasFee || 0), 0);
    const successRate = terminal.length > 0 ? Math.round((settled.length / terminal.length) * 100) : 100;

    // By Agent
    const agentMap = new Map<string, { volume: number; count: number; settled: number; total: number }>();
    filtered.forEach(tx => {
      const entry = agentMap.get(tx.agentName) || { volume: 0, count: 0, settled: 0, total: 0 };
      entry.count++;
      entry.total++;
      if (tx.status === 'settled') { entry.volume += tx.usdValue; entry.settled++; }
      agentMap.set(tx.agentName, entry);
    });
    const byAgent = Array.from(agentMap.entries()).map(([name, d]) => ({
      agentName: name, volume: d.volume, count: d.count, successRate: d.total > 0 ? Math.round((d.settled / d.total) * 100) : 0,
    }));

    // By Chain
    const chainMap = new Map<string, { volume: number; count: number }>();
    settled.forEach(tx => {
      const entry = chainMap.get(tx.network) || { volume: 0, count: 0 };
      entry.volume += tx.usdValue; entry.count++;
      chainMap.set(tx.network, entry);
    });
    const byChain = Array.from(chainMap.entries()).map(([chain, d]) => ({ chain, ...d }));

    // Daily trend
    const dayMap = new Map<string, { volume: number; count: number; failedCount: number }>();
    const days = period === 'today' ? 1 : period === 'week' ? 7 : 30;
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(); d.setDate(d.getDate() - i);
      dayMap.set(d.toISOString().slice(0, 10), { volume: 0, count: 0, failedCount: 0 });
    }
    filtered.forEach(tx => {
      const key = tx.createdAt.toISOString().slice(0, 10);
      const entry = dayMap.get(key);
      if (entry) {
        entry.count++;
        if (tx.status === 'settled') entry.volume += tx.usdValue;
        if (tx.status === 'failed') entry.failedCount++;
      }
    });
    const dailyTrend = Array.from(dayMap.entries()).map(([date, d]) => ({ date, ...d }));

    // Anomalies
    const anomalies: ReconciliationSummary['anomalies'] = [];
    if (failed.length > 0 && terminal.length > 0 && (failed.length / terminal.length) > 0.2) {
      anomalies.push({ type: 'high_failure_rate', description: `失败率 ${Math.round((failed.length / terminal.length) * 100)}%，超过 20% 阈值`, severity: 'critical' });
    }
    byAgent.forEach(a => {
      if (a.successRate < 80 && a.count >= 3) {
        anomalies.push({ type: 'agent_low_success', description: `${a.agentName} 成功率仅 ${a.successRate}%`, severity: 'warning' });
      }
    });
    settled.forEach(tx => {
      if (tx.gasFee && tx.usdValue > 0 && (tx.gasFee / tx.usdValue) > 0.05) {
        anomalies.push({ type: 'high_gas', description: `交易 ${tx.id.slice(0, 8)} Gas 费占比 ${Math.round((tx.gasFee / tx.usdValue) * 100)}%`, severity: 'warning' });
      }
    });

    return {
      period, totalVolume, txCount: filtered.length, settledCount: settled.length,
      failedCount: failed.length, pendingCount: processing.length, successRate,
      totalGasFee, netSettled: totalVolume - totalGasFee,
      byAgent, byChain, dailyTrend, anomalies,
    };
  }, [agentTransactions]);

  const value = {
    isAuthenticated,
    userInfo,
    currentWallet,
    wallets,
    assets,
    transactions,
    contacts,
    devices,
    securityConfig,
    backupStatus,
    walletStatus,
    hasPin,
    hasBiometric,
    login,
    logout,
    sendVerificationCode,
    verifyCode,
    checkPasswordExists,
    loginWithPassword,
    createWallet,
    switchWallet,
    renameWallet,
    setPin,
    enableBiometric,
    completeCloudBackup,
    completeFileBackup,
    backupWallet,
    verifyBackupPassword,
    sendTransaction,
    scanAddressRisk,
    getLimitStatus,
    checkTransferLimit,
    addContact,
    updateContact,
    removeContact,
    addDevice,
    removeDevice,
    addToken,
    removeToken,
    updateSecurityConfig,
    onboardingStep,
    setOnboardingStep,
    notifications,
    unreadNotificationCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    // TSS Node
    hasTSSNode,
    tssNodeInfo,
    checkTSSNodeExists,
    recoverTSSNode,
    createTSSNode: createTSSNodeFn,
    // Delegated Agent
    delegatedAgents,
    agentTransactions,
    pendingAgentTxCount,
    delegateAgent,
    revokeAgent,
    getAgentsForWallet,
    getAgentById,
    pauseDelegatedAgent,
    resumeDelegatedAgent,
    updateDelegatedAgentRiskConfig,
    updateDelegatedAgentName,
    updateDelegatedAgentPermissions,
    addPolicy,
    updatePolicy,
    removePolicy,
    reorderPolicies,
    togglePolicyEnabled,
    updateDefaultAction,
    getAgentTxByAgent,
    approveAgentTx,
    rejectAgentTx,
    getPendingAgentTxs,
    getAgentTxByWallet,
    getAgentRiskConfig,
    updateWalletControlMode,
    updateAgentRiskConfig,
    enableAgent,
    disableAgent,
    pauseAgent,
    resumeAgent,
    pauseAllAgents,
    addWhitelistAddress,
    removeWhitelistAddress,
    addBlacklistAddress,
    removeBlacklistAddress,
    // Settlement tracking
    startSettlement,
    retryFailedTx,
    voidFailedTx,
    getProcessingTxs,
    getFailedTxs,
    getSettledTxs,
    getReconciliationSummary,
    // Human Agent
    humanAgents,
    currentSetupToken,
    fetchHumanAgents,
    generateSetupToken,
    addMockHumanAgent,
    // Agent-linked wallet (Mode 2)
    linkAgentWallet,
    agentTransferRequests,
    submitAgentRequest,
    getAgentRequestsForWallet,
    // Address management
    addAddress,
    renameAddress,
    // Dev mode
    devModeLogin,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
