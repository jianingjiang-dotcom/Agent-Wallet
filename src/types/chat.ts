export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  card?: ChatCard;
  timestamp: number;
  feedback?: 'positive' | 'negative';
  error?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type ChatCard =
  | { type: 'balance'; data: BalanceCardData }
  | { type: 'transfer'; data: TransferCardData }
  | { type: 'transactions'; data: TransactionCardData }
  | { type: 'navigate'; data: NavigateCardData };

export interface BalanceCardData {
  symbol: string;
  entries: { chain: string; balance: number; usdValue: number }[];
  totalUsd: number;
}

export interface TransferCardData {
  to: string;
  amount: number;
  symbol: string;
  chain?: string;
}

export interface TransactionCardData {
  items: {
    id: string;
    type: 'send' | 'receive';
    amount: number;
    symbol: string;
    status: string;
    timestamp: string;
  }[];
}

export interface NavigateCardData {
  page: string;
  label: string;
  path: string;
}
