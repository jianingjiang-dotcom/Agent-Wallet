import type { Message, TodoItem } from '@/types/notification';

// ============================
// Mock Messages
// ============================

export const mockMessages: Message[] = [
  // Transaction — transfer (outgoing, matches tx-day3-2)
  {
    id: 'msg-tx-1',
    category: 'transaction',
    subType: 'transfer',
    title: '转账',
    summary: '接收方 0x6B17...3355',
    amount: '-0.5 ETH',
    status: { label: '成功', variant: 'success' },
    timestamp: new Date(Date.now() - 25 * 60 * 1000),
    isRead: false,
    route: '/transaction/tx-day3-2',
    icon: { type: 'crypto', symbol: 'ETH', chainId: 'ethereum' },
  },
  // Transaction — contract interaction (matches tx-day5-1)
  {
    id: 'msg-tx-2',
    category: 'transaction',
    subType: 'contract_interaction',
    title: '合约交互',
    summary: '合约 0x3fC9...7FAD',
    amount: '-200 USDT',
    status: { label: '成功', variant: 'success' },
    timestamp: new Date(Date.now() - 10 * 60 * 1000),
    isRead: false,
    route: '/transaction/tx-day5-1',
    icon: { type: 'crypto', symbol: 'USDT', chainId: 'ethereum' },
  },
  // Transaction — transfer (incoming, matches tx-day3-1)
  {
    id: 'msg-tx-3',
    category: 'transaction',
    subType: 'transfer',
    title: '收款',
    summary: '发送方 0x3fC9...7FAD',
    amount: '+1,800 USDT',
    status: { label: '成功', variant: 'success' },
    timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000),
    isRead: true,
    route: '/transaction/tx-day3-1',
    icon: { type: 'crypto', symbol: 'USDT', chainId: 'ethereum' },
  },
  // Transaction — message signing (matches tx-day4-2)
  {
    id: 'msg-tx-4',
    category: 'transaction',
    subType: 'message_signing',
    title: '消息签名',
    summary: 'OpenSea',
    status: { label: '成功', variant: 'success' },
    timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000),
    isRead: true,
    route: '/transaction/tx-day4-2',
    icon: { type: 'generic' },
  },
  // Transaction — transfer (failed, matches tx-day6-2)
  {
    id: 'msg-tx-5',
    category: 'transaction',
    subType: 'transfer',
    title: '转账',
    summary: '接收方 0xdAC1...1eC7',
    amount: '-0.001 ETH',
    status: { label: '失败', variant: 'error' },
    timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000),
    isRead: true,
    route: '/transaction/tx-day6-2',
    icon: { type: 'crypto', symbol: 'ETH', chainId: 'ethereum' },
  },

  // Pact messages — IDs and statuses match mock-pacts.ts
  {
    id: 'msg-pact-1',
    category: 'pact',
    subType: 'pact_activated',
    title: 'Pact',
    summary: '允许 Yield Agent 将闲置 USDC 存入收益最高的借贷协议',
    status: { label: '已批准', variant: 'success' },
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
    isRead: false,
    route: '/pact/pact-005',
    icon: { type: 'generic' },
  },
  {
    id: 'msg-pact-2',
    category: 'pact',
    subType: 'pact_rejected',
    title: 'Pact',
    summary: '允许 Arb Bot Agent 在 Arbitrum 和 Optimism 之间执行跨链套利',
    status: { label: '已拒绝', variant: 'error' },
    timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
    isRead: true,
    route: '/pact/pact-004',
    icon: { type: 'generic' },
  },
  {
    id: 'msg-pact-3',
    category: 'pact',
    subType: 'pact_expired',
    title: 'Pact',
    summary: '允许 Provisioned Agent 执行 SushiSwap V3 条件流动性管理',
    status: { label: '已过期', variant: 'muted' },
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
    isRead: true,
    route: '/pact/pact-001',
    icon: { type: 'generic' },
  },

  // System messages
  {
    id: 'msg-sys-1',
    category: 'system',
    subType: 'backup_reminder',
    title: '钱包尚未备份',
    summary: '建议立即备份以防止资产丢失',
    status: { label: '待处理', variant: 'warning' },
    timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
    isRead: false,
    route: '/wallet-backup/wallet-1',
    icon: { type: 'generic' },
  },
  {
    id: 'msg-sys-2',
    category: 'system',
    subType: 'upgrade_prompt',
    title: '新版本可用 v2.1.0',
    summary: '修复了已知问题，提升了性能',
    status: { label: '更新', variant: 'info' },
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    isRead: true,
    route: '/profile/help',
    icon: { type: 'generic' },
  },
];

// ============================
// Mock Todos
// ============================

export const mockTodoItems: TodoItem[] = [
  // Pact approvals
  {
    id: 'todo-pact-1',
    type: 'pact_approval',
    title: 'Pact 审批',
    summary: '每周自动购买 $500 等值 ETH',
    status: 'pending',
    createdAt: new Date(Date.now() - 30 * 60 * 1000),
    route: '/pact/pact-002',
    metadata: {
      type: 'pact_approval',
      agentName: 'DCA Agent',
      agentId: 'agent-001',
      walletName: 'Trading Wallet',
      pactId: 'pact-002',
      intent: '每周自动购买 $500 等值 ETH',
    },
  },
  {
    id: 'todo-pact-2',
    type: 'pact_approval',
    title: 'Pact 审批',
    summary: '监控 Aave V3 健康因子并自动补充抵押品',
    status: 'approved',
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 3.5 * 60 * 60 * 1000),
    route: '/pact/pact-003',
    metadata: {
      type: 'pact_approval',
      agentName: 'Risk Manager Agent',
      agentId: 'agent-002',
      walletName: 'Trading Wallet',
      pactId: 'pact-003',
      intent: '监控 Aave V3 健康因子并自动补充抵押品',
    },
  },

  // Excess approval
  {
    id: 'todo-excess-1',
    type: 'excess_approval',
    title: '超额交易',
    summary: '接收方 0xab12...cd34',
    status: 'pending',
    createdAt: new Date(Date.now() - 15 * 60 * 1000),
    route: '/excess-approval/todo-excess-1',
    metadata: {
      type: 'excess_approval',
      txType: 'transfer',
      amount: 5000,
      symbol: 'USDT',
      chainId: 'ethereum',
      toAddress: '0xab12...cd34',
      pactId: 'pact-001',
      pactName: 'DeFi 套利策略',
    },
  },

  // TSS signing
  {
    id: 'todo-tss-1',
    type: 'tss_signing',
    title: '交易签名',
    summary: '接收方 0x7a25...3f8d',
    status: 'pending',
    createdAt: new Date(Date.now() - 5 * 60 * 1000),
    route: '/tss-signing/todo-tss-1',
    metadata: {
      type: 'tss_signing',
      txType: 'transfer',
      amount: 1.5,
      symbol: 'ETH',
      chainId: 'ethereum',
      toAddress: '0x7a25...3f8d',
      txId: 'tx-005',
    },
  },
  {
    id: 'todo-tss-2',
    type: 'tss_signing',
    title: '交易签名',
    summary: '接收方 0xdead...beef',
    status: 'approved',
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    completedAt: new Date(Date.now() - 1.8 * 60 * 60 * 1000),
    route: '/tss-signing/todo-tss-2',
    metadata: {
      type: 'tss_signing',
      txType: 'transfer',
      amount: 200,
      symbol: 'USDT',
      chainId: 'ethereum',
      toAddress: '0xdAC1...1eC7',
      txId: 'tx-tss-signed',
    },
  },
];
