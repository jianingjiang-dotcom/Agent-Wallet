// Wallet Types - No Web3 terminology exposed to users
import { Notification } from './notification';

export type { Notification, NotificationType, NotificationCategory, NotificationPriority } from './notification';

// ============= TSS Node Types =============

export type TSSNodeStatus = 'not_created' | 'created' | 'recovered';

export interface TSSNodeBackupInfo {
  hasCloudBackup: boolean;
  cloudProvider?: 'icloud' | 'google_drive';
  cloudBackupTime?: Date;
  hasLocalBackup: boolean;
  localBackupTime?: Date;
}

export interface TSSNodeInfo {
  status: TSSNodeStatus;
  createdAt?: Date;
  backup: TSSNodeBackupInfo;
}

// Device session status for kick detection
export type DeviceSessionStatus = 'active' | 'kicked' | 'expired';

export interface DeviceKickInfo {
  kickedAt: Date;
  newDeviceName: string;
  newDeviceLocation?: string;
  reason: 'new_device_login' | 'security_revoke';
}

export type WalletStatus =
  | 'not_created'      // S0: No wallet exists
  | 'claimed_no_key'   // S0.5: Claimed but MPC key not yet generated
  | 'created_no_backup' // S1: Created but backup incomplete
  | 'backup_complete'   // S2: Backup done, may need biometric
  | 'fully_secure'      // S3: All security measures complete
  | 'device_risk'       // S4: Root/jailbreak detected
  | 'service_unavailable'; // S5: Cobo service down

export type RiskLevel = 'low' | 'medium' | 'high';
export type RiskColor = 'green' | 'yellow' | 'red';

// Supported chains
export type ChainId = 'all' | 'ethereum' | 'tron' | 'bsc' | 'solana';

// Extended chain type that includes unified EVM for address book
export type AddressBookChainId = 'evm' | 'tron' | 'solana';

// ============= Address System Types =============

// Address system — groups chains by shared address format
export type AddressSystem = 'evm' | 'tron' | 'solana';

// Address selection for filtering assets by address
export type AddressSelection =
  | { mode: 'all' }
  | { mode: 'address'; addressId: string };

// A single address within a wallet
export interface WalletAddress {
  id: string;                    // Unique ID, e.g. 'addr-evm-1'
  system: AddressSystem;         // Which address system
  address: string;               // The actual address string
  label: string;                 // User-visible label, e.g. "EVM 地址 1"
  createdAt: Date;
}

// Address system metadata for UI display
export const ADDRESS_SYSTEMS: { id: AddressSystem; name: string; chains: ChainId[] }[] = [
  { id: 'evm', name: 'EVM', chains: ['ethereum', 'bsc'] },
  { id: 'tron', name: 'Tron', chains: ['tron'] },
  { id: 'solana', name: 'Solana', chains: ['solana'] },
];

export interface ChainInfo {
  id: ChainId;
  name: string;
  shortName: string;
  icon: string;
  color: string;
}

export interface AddressBookChainInfo {
  id: AddressBookChainId;
  name: string;
  shortName: string;
  icon: string;
  color: string;
}

export const SUPPORTED_CHAINS: ChainInfo[] = [
  { id: 'all', name: '全部网络', shortName: 'All', icon: 'all', color: 'hsl(var(--accent))' },
  { id: 'ethereum', name: 'Ethereum', shortName: 'ETH', icon: 'ethereum', color: 'hsl(217 91% 60%)' },
  { id: 'tron', name: 'Tron', shortName: 'TRX', icon: 'tron', color: 'hsl(0 84% 60%)' },
  { id: 'bsc', name: 'BNB Chain', shortName: 'BNB', icon: 'bsc', color: 'hsl(38 92% 50%)' },
  { id: 'solana', name: 'Solana', shortName: 'SOL', icon: 'solana', color: 'hsl(280 80% 60%)' },
];

// Chains available for address book network selection (EVM unified)
export const ADDRESS_BOOK_CHAINS: AddressBookChainInfo[] = [
  { id: 'evm', name: 'EVM', shortName: 'EVM', icon: 'evm', color: 'hsl(217 91% 60%)' },
  { id: 'tron', name: 'Tron', shortName: 'TRX', icon: 'tron', color: 'hsl(0 84% 60%)' },
  { id: 'solana', name: 'Solana', shortName: 'SOL', icon: 'solana', color: 'hsl(280 80% 60%)' },
];

// Wallet backup channel info
export interface WalletBackupInfo {
  method: 'cloud' | 'file' | 'none';
  cloudProvider?: 'icloud' | 'google_drive';
  lastBackupTime?: Date;
  fileBackupTime?: Date;
}

// Recovery method types
export type RecoveryMethod =
  | 'scan_device'     // Scan old device (recommended)
  | 'cloud_icloud'    // Cloud recovery (iCloud / Google Drive)
  | 'cloud_google'    // Google Drive recovery (legacy)
  | 'local_file'      // Local backup file recovery
  | 'private_key'     // Private key import (advanced)
  | 'reshare';        // Re-pair with Agent to regenerate key shares

// Wallet origin - how this wallet was created/linked
export type WalletOrigin = 'user_created' | 'agent_linked' | 'claimed';

// Info returned when validating a claim code
export interface ClaimWalletItem {
  walletId: string;
  walletName: string;
  balance: number;
  chains: string[];
}

export interface ClaimWalletInfo {
  walletId: string;
  walletName: string;
  balance: number;
  createdAt: Date;
  agentName: string;
  agentId: string;
  chains: string[];
  addresses: { chain: string; address: string }[];
  /** Multiple wallets associated with this TSS node (for reshare scenarios) */
  wallets?: ClaimWalletItem[];
}

// Info for wallets linked from an external agent
export interface AgentLinkedWalletInfo {
  agentName: string;
  agentId: string;
  linkedAt: Date;
  setupToken: string; // first 8 chars for display
}

export interface Wallet {
  id: string;
  name: string;
  /** @deprecated Use walletAddresses instead. Kept as computed compat layer. */
  addresses: Record<ChainId, string>;
  walletAddresses: WalletAddress[];  // Multi-address support per chain system
  createdAt: Date;
  isBackedUp: boolean;
  /**
   * Device-level flag: whether THIS device has the MPC key share for signing.
   * Default: true. Set to false on a new device after login until recovery completes.
   * When false, wallet is in "view-only" mode — can read but cannot sign.
   */
  isKeyShareRecovered: boolean;
  isBiometricEnabled: boolean;
  // Backup tracking
  backupInfo?: WalletBackupInfo;
  // Agent control mode
  controlMode?: WalletControlMode;
  // Wallet origin
  origin: WalletOrigin;
  agentInfo?: AgentLinkedWalletInfo;
}

// Helper: build legacy addresses Record from walletAddresses (first address per system)
export function buildLegacyAddresses(walletAddresses: WalletAddress[]): Record<ChainId, string> {
  const evmAddr = walletAddresses.find(a => a.system === 'evm')?.address || '';
  const tronAddr = walletAddresses.find(a => a.system === 'tron')?.address || '';
  const solAddr = walletAddresses.find(a => a.system === 'solana')?.address || '';
  return {
    all: '',
    ethereum: evmAddr,
    bsc: evmAddr,    // EVM addresses shared across ethereum and bsc
    tron: tronAddr,
    solana: solAddr,
  };
}

// Helper to check if wallet is agent-linked
export function isAgentLinked(wallet: Wallet | null | undefined): boolean {
  return wallet?.origin === 'agent_linked';
}

export interface Asset {
  symbol: string;
  name: string;
  balance: number;
  usdValue: number;
  change24h: number;
  icon: string;
  network: ChainId; // Which chain this asset is on
  addressId: string; // Which wallet address holds this asset
}

// Aggregated asset for display when viewing "All" chains
/** @deprecated Use ChainAsset instead for per-chain aggregation */
export interface AggregatedAsset {
  symbol: string;
  name: string;
  totalBalance: number;
  totalUsdValue: number;
  change24h: number;
  icon: string;
  chains: { network: ChainId; balance: number; usdValue: number }[];
}

// Per-chain aggregated asset (same token on same chain across multiple addresses)
export interface ChainAsset {
  symbol: string;
  name: string;
  icon: string;
  network: ChainId;
  totalBalance: number;
  totalUsdValue: number;
  change24h: number;
  addressCount: number;
  addresses: {
    addressId: string;
    address: string;
    label: string;
    balance: number;
    usdValue: number;
  }[];
}

// RBF (Replace-By-Fee) record for tracking acceleration/cancellation history
export interface RbfRecord {
  action: 'speedup' | 'cancel';
  oldTxHash: string;
  newTxHash: string;
  oldFee: number;
  newFee: number;
  timestamp: Date;
}

export interface Transaction {
  id: string;
  type: 'send' | 'receive';
  amount: number;
  symbol: string;
  usdValue: number;
  status: 'pending' | 'confirmed' | 'failed';
  counterparty: string;
  counterpartyLabel?: string;
  timestamp: Date;
  txHash: string;
  network: string;
  fee?: number;
  memo?: string;
  // Confirmation & block info
  confirmations?: number;           // Number of block confirmations
  blockHeight?: number;             // Block number where tx was included
  // Failure info
  failureReason?: string;           // Reason for failed transactions
  // RBF (Replace-By-Fee) fields
  isRbfEnabled?: boolean;           // Whether RBF is enabled (for BTC opt-in RBF)
  originalTxHash?: string;          // If this is a replacement tx, the original tx hash
  replacedByTxHash?: string;        // If replaced, the new tx hash
  rbfHistory?: RbfRecord[];         // History of RBF operations
  nonce?: number;                   // EVM transaction nonce
  gasPrice?: number;                // Current gas price in USD
  gasAmount?: number;               // Gas token amount (e.g., ETH amount)
  gasToken?: string;                // Gas token symbol (e.g., 'ETH', 'BNB')
}

export interface Contact {
  id: string;
  name: string;
  address: string;
  network: string;
  tags: string[];
  isOfficial: boolean;
  isWhitelisted: boolean;
  lastUsed?: Date;
  notes?: string;
}

export interface Device {
  id: string;
  name: string;
  model: string;
  lastActive: Date;
  location?: string;
  isCurrent: boolean;
  status: 'active' | 'pending' | 'revoked';
}

export interface SecurityConfig {
  singleTransactionLimit: number;
  dailyLimit: number;
  monthlyLimit: number;
  dailyUsed: number;
  monthlyUsed: number;
  lastDailyReset: Date;
  lastMonthlyReset: Date;
  requireSatoshiTest: boolean;
  whitelistBypass: boolean;
  highRiskAction: 'block' | 'warn';
}

export interface LimitStatus {
  singleLimit: number;
  dailyLimit: number;
  dailyUsed: number;
  dailyRemaining: number;
  monthlyLimit: number;
  monthlyUsed: number;
  monthlyRemaining: number;
}

export interface BackupStatus {
  cloudBackup: boolean;
  cloudProvider?: 'icloud' | 'google_drive';
  lastBackupDate?: Date;
  fileBackup: boolean;
  passkeyBackup: boolean;
}

// User info
export interface UserInfo {
  email: string;
  avatar?: string;
  nickname?: string;
  uid?: string;
}

// ============= Auth Types =============

// User type for routing after login
export type UserType = 'new' | 'returning_with_wallet' | 'returning_without_wallet';

// Auth result returned from login/verify
export interface AuthResult {
  userType: UserType;
  isDeviceAuthorized: boolean;
  hasExistingWallets: boolean;
  hasPassword?: boolean; // Whether user has set a password
}

// ============= Human Agent Types =============

/** Agent delegation status in the human's agent list */
export type HumanAgentDelegationStatus = 'not_delegated' | 'delegated' | 'paused' | 'revoked';

/** An agent belonging to the current human (linked via owner ID) */
export interface HumanAgent {
  principalId: string;
  displayName?: string;
  delegationStatus: HumanAgentDelegationStatus;
  delegatedAgentId?: string;
  delegatedWalletId?: string;
  createdAt: Date;
}

/** Setup token status */
export type SetupTokenStatus = 'active' | 'expired' | 'used';

/** Setup token for creating new agents externally */
export interface SetupToken {
  token: string;
  status: SetupTokenStatus;
  createdAt: Date;
  expiresAt: Date;
}

/** Setup token validity duration */
export const SETUP_TOKEN_VALIDITY_MS = 15 * 60 * 1000; // 15 minutes

// ============= Agent / Delegation Types =============

// Wallet control mode for agent scenarios
// block = 通过风控→放行，不通过→直接拦截
// manual_review = 通过风控→放行，不通过→人工审批（App 内）
export type WalletControlMode = 'block' | 'manual_review';

// TSS Node status per agent
export type TssNodeAgentStatus = 'active' | 'inactive';

// Delegated Agent - user delegates their own wallet to an external agent via Principal ID
export type DelegatedAgentStatus = 'active' | 'paused' | 'revoked';

export interface DelegatedAgent {
  id: string;
  walletId: string;                // 委托的用户钱包 ID（仅 user_created 钱包）
  principalId: string;             // 外部 Agent 的 Principal ID
  agentName: string;               // 用户给的名称
  status: DelegatedAgentStatus;
  createdAt: Date;
  pausedAt?: Date;
  pausedReason?: string;
  revokedAt?: Date;
  permissions: AgentPermissions;   // 权限（独立于风控）
  tssNodeStatus: TssNodeAgentStatus; // TSS Node 运行状态
  riskConfig: DelegatedAgentRiskConfig;
}

// Agent 权限项
export interface AgentPermissions {
  readBalance: boolean;     // 读余额
  transfer: boolean;        // 发起转账
  contractCall: boolean;    // 合约调用
  walletManage: boolean;    // 钱包管理
}

export const AGENT_PERMISSION_LIST: { key: keyof AgentPermissions; label: string; desc: string; icon: string }[] = [
  { key: 'readBalance',  label: '读取余额', desc: '查询钱包资产余额',   icon: 'Eye' },
  { key: 'transfer',     label: '发起转账', desc: '发起代币转账交易',   icon: 'Send' },
  { key: 'contractCall', label: '合约调用', desc: '调用智能合约方法',   icon: 'FileCode' },
  { key: 'walletManage', label: '钱包管理', desc: '管理地址和代币列表', icon: 'Settings' },
];

export const DEFAULT_AGENT_PERMISSIONS: AgentPermissions = {
  readBalance: true,
  transfer: true,
  contractCall: false,
  walletManage: false,
};

// ============= Policy-Based Risk Control Types =============

export type PolicyType =
  | 'transfer_rules' | 'contract_call_rules'
  | 'address_rules' | 'token_rules' | 'chain_rules';

export type PolicyEffect = 'allow' | 'deny';
export type DefaultPolicyAction = 'allow' | 'deny';

// Base policy fields shared by all policy types
export interface PolicyBase {
  id: string;
  name: string;
  type: PolicyType;
  effect: PolicyEffect;
  enabled: boolean;
  priority: number;          // lower number = higher priority, evaluated first
  createdAt: Date;
  updatedAt: Date;
}

// ---------- TransferRules 转账规则 ----------
export interface TransferRulesConfig {
  maxValuePerTx?: number;         // 单笔上限 USD
  maxValuePerHour?: number;
  maxValuePerDay?: number;
  maxValuePerWeek?: number;
  maxValuePerMonth?: number;
  maxCountPerHour?: number;       // 次数限制
  maxCountPerDay?: number;
  maxCountPerWeek?: number;
  maxCountPerMonth?: number;
}
export interface TransferRulesPolicy extends PolicyBase {
  type: 'transfer_rules';
  config: TransferRulesConfig;
}

// ---------- ContractCallRules 合约调用规则 ----------
export interface ContractCallEntry {
  contractAddress: string;
  label?: string;
  functions?: string[];           // function selectors/names; empty = all
  network: ChainId;
}
export interface ContractCallRulesConfig {
  contracts: ContractCallEntry[];
  maxValuePerTx?: number;
  maxCountPerDay?: number;
}
export interface ContractCallRulesPolicy extends PolicyBase {
  type: 'contract_call_rules';
  config: ContractCallRulesConfig;
}

// ---------- AddressRules 地址规则 ----------
export interface AddressEntry {
  address: string;
  label?: string;
  network: ChainId;
}
export interface AddressRulesConfig {
  addresses: AddressEntry[];
}
export interface AddressRulesPolicy extends PolicyBase {
  type: 'address_rules';
  config: AddressRulesConfig;
}

// ---------- TokenRules 代币规则 ----------
export interface TokenEntry {
  symbol: string;
  name?: string;
  network?: ChainId;
}
export interface TokenRulesConfig {
  tokens: TokenEntry[];
}
export interface TokenRulesPolicy extends PolicyBase {
  type: 'token_rules';
  config: TokenRulesConfig;
}

// ---------- ChainRules 链规则 ----------
export interface ChainRulesConfig {
  chains: Exclude<ChainId, 'all'>[];
}
export interface ChainRulesPolicy extends PolicyBase {
  type: 'chain_rules';
  config: ChainRulesConfig;
}

// Union type for all policies
export type AgentPolicy =
  | TransferRulesPolicy
  | ContractCallRulesPolicy
  | AddressRulesPolicy
  | TokenRulesPolicy
  | ChainRulesPolicy;

// Policy type metadata for UI display
export const POLICY_TYPE_META: { type: PolicyType; label: string; description: string; icon: string }[] = [
  { type: 'transfer_rules', label: '转账规则', description: '限制转账金额和频率', icon: 'ArrowUpDown' },
  { type: 'contract_call_rules', label: '合约调用规则', description: '限制合约调用范围和频率', icon: 'FileCode' },
  { type: 'address_rules', label: '地址规则', description: '允许或拒绝特定地址', icon: 'MapPin' },
  { type: 'token_rules', label: '代币规则', description: '允许或拒绝特定代币', icon: 'Coins' },
  { type: 'chain_rules', label: '链规则', description: '允许或拒绝特定链', icon: 'Link' },
];

// Risk config embedded in each DelegatedAgent（风控配置，基于策略）
export interface DelegatedAgentRiskConfig {
  defaultAction: DefaultPolicyAction;   // 无策略匹配时的默认动作
  policies: AgentPolicy[];              // 策略列表，按 priority 排序
  currentDailyVolume: number;           // 保留用于展示统计
  currentDailyTxCount: number;
}

// Agent transaction status (审核 + 链上结算)
export type AgentTxStatus =
  | 'pending_approval' | 'approved' | 'rejected' | 'expired'
  | 'broadcasting' | 'confirming' | 'settled' | 'failed';

// Required confirmations per chain
export const CHAIN_CONFIRMATIONS: Record<string, number> = {
  ethereum: 12,
  tron: 19,
  bsc: 15,
  solana: 1,
};

export interface AgentTransaction {
  id: string;
  walletId: string;
  walletName: string;
  // Agent info
  agentName: string;
  agentId: string;         // References DelegatedAgent.id
  // Transaction details
  toAddress: string;
  toLabel?: string;
  amount: number;
  symbol: string;
  network: ChainId;
  usdValue: number;
  memo?: string;
  // Approval flow
  status: AgentTxStatus;
  createdAt: Date;
  expiresAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  // Notes
  reviewNote?: string;
  rejectionReason?: string;
  // Risk assessment
  riskScore: RiskColor;
  riskReasons?: string[];
  // After approval
  txHash?: string;
  executedAt?: Date;
  // Settlement tracking
  broadcastAt?: Date;
  confirmations?: number;
  requiredConfirmations?: number;
  settledAt?: Date;
  failedAt?: Date;
  failureReason?: string;
  retryCount?: number;
  gasFee?: number;
  blockNumber?: number;
}

// Agent transfer request - user requests agent to execute a transfer (Mode 2)
export type AgentRequestStatus = 'pending' | 'accepted' | 'rejected' | 'executing' | 'completed' | 'failed';

export interface AgentTransferRequest {
  id: string;
  walletId: string;
  walletName: string;
  // Request details
  toAddress: string;
  toLabel?: string;
  amount: number;
  symbol: string;
  network: ChainId;
  usdValue: number;
  memo?: string;
  // Status tracking
  status: AgentRequestStatus;
  createdAt: Date;
  respondedAt?: Date;
  completedAt?: Date;
  // Agent response
  rejectionReason?: string;
  txHash?: string;
}

// Agent risk configuration per wallet (legacy - kept for backward compatibility)
export interface AgentRiskConfig {
  walletId: string;
  // Agent access control
  agentEnabled: boolean;
  isPaused: boolean;
  pausedAt?: Date;
  pausedReason?: string;
  // Control mode
  controlMode: WalletControlMode;
  // Velocity controls
  maxTxPerMinute: number;
  maxTxPerHour: number;
  maxDailyVolume: number;       // USD
  currentDailyVolume: number;   // USD
  // Address controls
  whitelistedAddresses: { address: string; label: string; network: ChainId }[];
  blacklistedAddresses: { address: string; label: string; reason: string }[];
  onlyWhitelist: boolean;
}

// Reconciliation summary for dashboard
export interface ReconciliationSummary {
  period: 'today' | 'week' | 'month';
  totalVolume: number;
  txCount: number;
  settledCount: number;
  failedCount: number;
  pendingCount: number;
  successRate: number;
  totalGasFee: number;
  netSettled: number;
  byAgent: { agentName: string; volume: number; count: number; successRate: number }[];
  byChain: { chain: string; volume: number; count: number }[];
  dailyTrend: { date: string; volume: number; count: number; failedCount: number }[];
  anomalies: { type: string; description: string; severity: 'warning' | 'critical' }[];
}

// App-level state
export interface WalletState {
  isAuthenticated: boolean;
  userInfo: UserInfo | null;
  currentWallet: Wallet | null;
  wallets: Wallet[];
  assets: Asset[];
  transactions: Transaction[];
  contacts: Contact[];
  devices: Device[];
  securityConfig: SecurityConfig;
  backupStatus: BackupStatus;
  walletStatus: WalletStatus;
  hasPin: boolean;
  hasBiometric: boolean;
}
