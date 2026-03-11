import type { ChatCard } from '@/types/chat';
import { BalanceCard } from './BalanceCard';
import { TransferCard } from './TransferCard';
import { TransactionCard } from './TransactionCard';
import { NavigateCard } from './NavigateCard';

export function ChatCardRenderer({ card }: { card: ChatCard }) {
  switch (card.type) {
    case 'balance':
      return <BalanceCard data={card.data} />;
    case 'transfer':
      return <TransferCard data={card.data} />;
    case 'transactions':
      return <TransactionCard data={card.data} />;
    case 'navigate':
      return <NavigateCard data={card.data} />;
    default:
      return null;
  }
}
