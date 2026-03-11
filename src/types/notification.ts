// Notification / Message Center Types

export type NotificationType =
  | 'transaction_in'      // 转入
  | 'transaction_out'     // 转出
  | 'large_amount'        // 大额交易
  | 'system_update'       // 系统更新
  | 'maintenance'         // 维护公告
  | 'promotion'           // 活动推广
  // Agent types
  | 'agent_tx_pending'        // Agent 交易待审批
  | 'agent_tx_approved'       // Agent 交易已批准
  | 'agent_tx_rejected'       // Agent 交易已拒绝
  | 'agent_tx_expired'        // Agent 交易已过期
  | 'agent_tx_broadcasting'   // Agent 交易广播中
  | 'agent_tx_settled'        // Agent 交易已结算
  | 'agent_tx_failed'         // Agent 交易执行失败
  | 'agent_paused'            // Agent 访问已暂停
  | 'api_key_created'         // 新 API 密钥已创建
  | 'api_key_revoked';        // API 密钥已撤销

export type NotificationPriority = 'urgent' | 'normal' | 'low';

export type NotificationCategory = 'transaction' | 'system' | 'agent';

export interface Notification {
  id: string;
  type: NotificationType;
  category: NotificationCategory;
  priority: NotificationPriority;
  title: string;
  content: string;
  timestamp: Date;
  isRead: boolean;
  
  // 可选的操作跳转
  action?: {
    label: string;
    route: string;
  };
  
  // 关联数据
  metadata?: {
    txId?: string;
    amount?: number;
    symbol?: string;
    walletId?: string;
    network?: string;
    // Agent metadata
    agentTxId?: string;
    apiKeyId?: string;
    controlMode?: string;
  };
}
