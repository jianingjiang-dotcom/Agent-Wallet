import { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWallet } from '@/contexts/WalletContext';
import { AgentReviewDrawer } from '@/components/AgentReviewDrawer';

export default function AgentReviewDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { agentTransactions, approveAgentTx, rejectAgentTx } = useWallet();

  const tx = useMemo(() => agentTransactions.find(t => t.id === id) || null, [agentTransactions, id]);

  if (!tx) {
    return (
      <AppLayout title="审核详情" showBack>
        <div className="p-8 text-center text-muted-foreground">交易不存在</div>
      </AppLayout>
    );
  }

  // Reuse the drawer in full-page mode — always open, close navigates back
  return (
    <AgentReviewDrawer
      tx={tx}
      open={true}
      onOpenChange={(open) => { if (!open) navigate(-1); }}
      onApprove={(txId, note) => { approveAgentTx(txId, note); navigate(-1); }}
      onReject={(txId, reason) => { rejectAgentTx(txId, reason); navigate(-1); }}
    />
  );
}
