export type PactStatus = 'pending' | 'rejected' | 'expired' | 'active' | 'completed' | 'revoked';

export interface PactPermission {
  type: 'write' | 'read';
  scope: string;
}

export interface PactRiskControl {
  label: string;
  value: string;
}

export interface PactContractOp {
  label: string;
  description: string;
}

export interface Pact {
  id: string;
  status: PactStatus;
  title: string;
  description: string;
  createdAt: Date;
  agentName: string;
  strategyName: string;
  chain: string;
  validityDays: number;
  userPrompt: string;
  permissions: PactPermission[];
  executionSummary: string;
  contractOps: PactContractOp[];
  riskControls: PactRiskControl[];
  schedule: string;
  exitConditions: string;
  exitConditionList?: ExitCondition[];
  riskRules: PactRiskRule[];
  policies?: PolicyRule[];
  /** AI-generated plain-language interpretation of this Pact */
  aiInterpretation?: AIInterpretation;
}

export type AIPointIcon = 'money' | 'time' | 'warning' | 'shield' | 'chart';
export type AIRiskLevel = 'low' | 'medium' | 'high';
export type AIRecommendation = 'approve' | 'reject' | 'revise';

export interface AIInterpretationPoint {
  icon: AIPointIcon;
  text: string;
}

export interface AIInterpretation {
  /** Risk assessment */
  riskLevel: AIRiskLevel;
  /** Action recommendation */
  recommendation: AIRecommendation;
  /** One-sentence summary of what this Pact does */
  summary: string;
  /** 2-3 key points (risks, costs, constraints) */
  points: AIInterpretationPoint[];
}

export type ExitConditionType = 'tx_count' | 'tx_amount' | 'duration';

export interface ExitCondition {
  type: ExitConditionType;
  label: string;
  current: number;
  target: number;
  unit?: string;
}

export interface PactRiskRule {
  name: string;
  type: string;
  chain: string;
  addresses?: string[];
  action?: 'allow' | 'deny';
}

// ─── Policy Rule types ─────────────────────────────
export type PolicyType = 'transfer' | 'contract_call' | 'message_sign';

export interface UsageLimitWindow {
  amount_gt?: number;
  amount_usd_gt?: number;
  tx_count_gt?: number;
  request_count_gt?: number;
}

export interface PolicyWhen {
  chain_in?: string[];
  token_in?: { chain_id: string; token_id: string }[];
  destination_address_in?: { chain_id: string; address: string; label?: string }[];
  target_in?: { chain_id: string; contract_addr: string; function_id?: string; label?: string }[];
  source_address_in?: string[];
}

export interface PolicyDenyIf {
  usage_limits?: {
    rolling_1h?: UsageLimitWindow;
    rolling_24h?: UsageLimitWindow;
    rolling_7d?: UsageLimitWindow;
    rolling_30d?: UsageLimitWindow;
  };
}

export interface PolicyReviewIf {
  amount_gt?: number;
  amount_usd_gt?: number;
  chain_in?: string[];
  token_in?: { chain_id: string; token_id: string }[];
  destination_address_in?: { chain_id: string; address: string }[];
  target_in?: { chain_id: string; contract_addr: string }[];
}

export interface PolicyRule {
  name: string;
  type: PolicyType;
  rules: {
    when?: PolicyWhen;
    deny_if?: PolicyDenyIf;
    review_if?: PolicyReviewIf;
  };
  priority: number;
  is_active: boolean;
}

export interface DefaultPact {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  maxPerTx: number;
  rolling24h: number;
  allowedChains: string[];
  allowedTokens: string[];
  contractWhitelist: string[];
  maxValidityDays: number;
}
