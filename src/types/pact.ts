export type PactStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'active' | 'completed' | 'revoked';

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
