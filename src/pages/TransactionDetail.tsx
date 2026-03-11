import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { SUPPORTED_CHAINS, ChainId } from '@/types/wallet';
import { CryptoIcon } from '@/components/CryptoIcon';
import { ChainIcon } from '@/components/ChainIcon';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/PageTransition';
import { DetailRow } from '@/components/ui/detail-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { toast } from '@/lib/toast';
import { RbfActionSection } from '@/components/RbfActionSection';
import { SpeedUpDrawer } from '@/components/SpeedUpDrawer';
import { CancelTxDrawer } from '@/components/CancelTxDrawer';
import { SpeedUpTier } from '@/lib/rbf-utils';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, currentWallet } = useWallet();

  const transaction = transactions.find(tx => tx.id === id);

  // RBF drawer states
  const [speedUpDrawerOpen, setSpeedUpDrawerOpen] = useState(false);
  const [cancelDrawerOpen, setCancelDrawerOpen] = useState(false);

  const handleSpeedUpConfirm = (tier: SpeedUpTier, newFee: number, newGasAmount: number) => {
    setSpeedUpDrawerOpen(false);
    toast.success('加速请求已提交', '新交易正在广播中');
    navigate(-1);
  };

  const handleCancelConfirm = (cancelFee: number, cancelGasAmount: number) => {
    setCancelDrawerOpen(false);
    toast.success('取消请求已提交', '原交易将被替换');
    navigate(-1);
  };

  if (!transaction) {
    return (
      <PageTransition>
        <AppLayout showNav={false} showBack title="交易详情">
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-muted-foreground">交易不存在</p>
          </div>
        </AppLayout>
      </PageTransition>
    );
  }

  const senderAddress = transaction.type === 'receive'
    ? transaction.counterparty
    : (currentWallet?.addresses?.[transaction.network as ChainId] || '');

  const receiverAddress = transaction.type === 'send'
    ? transaction.counterparty
    : (currentWallet?.addresses?.[transaction.network as ChainId] || '');

  const statusConfig = {
    confirmed: { label: '已完成', icon: CheckCircle2, variant: 'success' as const },
    pending: { label: '处理中', icon: Clock, variant: 'warning' as const },
    failed: { label: '失败', icon: XCircle, variant: 'danger' as const },
  };

  const status = statusConfig[transaction.status];
  const typeLabel = transaction.type === 'receive' ? '收款' : '转账';

  return (
    <PageTransition>
      <AppLayout showNav={false} showBack title="交易详情">
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 py-6 space-y-4">

            {/* Amount Section */}
            <div className="text-center py-3">
              <div className="flex items-center justify-center gap-2 mb-1">
                <CryptoIcon symbol={transaction.symbol} size="sm" />
                <span className={cn(
                  'text-2xl font-bold',
                  transaction.type === 'receive' ? 'text-success' : 'text-foreground'
                )}>
                  {transaction.type === 'receive' ? '+' : '-'}{transaction.amount} {transaction.symbol}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">≈ ${transaction.usdValue.toLocaleString()}</p>
              <div className="flex justify-center gap-2 mt-2">
                <StatusBadge variant={status.variant} icon={status.icon}>
                  {typeLabel}{status.label}
                </StatusBadge>
              </div>
            </div>

            {/* Failure Reason */}
            {transaction.status === 'failed' && transaction.failureReason && (
              <div className="status-glow-danger rounded-xl p-3">
                <p className="text-sm font-medium text-destructive mb-1">失败原因</p>
                <p className="text-sm text-muted-foreground">{transaction.failureReason}</p>
              </div>
            )}

            {/* Details Card */}
            <div className="card-elevated rounded-xl divide-y divide-border">
              {/* Sender */}
              <DetailRow
                label="发送方"
                value={
                  transaction.type === 'receive' && transaction.counterpartyLabel
                    ? transaction.counterpartyLabel
                    : `${senderAddress.slice(0, 10)}...${senderAddress.slice(-8)}`
                }
                copyValue={senderAddress}
              />

              {/* Receiver */}
              <DetailRow
                label="收款方"
                value={
                  transaction.type === 'send' && transaction.counterpartyLabel
                    ? transaction.counterpartyLabel
                    : `${receiverAddress.slice(0, 10)}...${receiverAddress.slice(-8)}`
                }
                copyValue={receiverAddress}
              />

              {/* Network */}
              <DetailRow
                label="网络"
                value={SUPPORTED_CHAINS.find(c => c.id === transaction.network)?.name || transaction.network}
                icon={<ChainIcon chainId={transaction.network} size="sm" />}
              />

              {/* Time */}
              <DetailRow
                label="时间"
                value={new Date(transaction.timestamp).toLocaleString('zh-CN')}
              />

              {/* Network Fee */}
              {transaction.fee !== undefined && transaction.fee > 0 && (
                <DetailRow
                  label="网络费用"
                  value={
                    transaction.gasAmount && transaction.gasToken
                      ? `${transaction.gasAmount.toFixed(6)} ${transaction.gasToken}`
                      : `≈ $${transaction.fee.toFixed(2)}`
                  }
                  subValue={
                    transaction.gasAmount && transaction.gasToken
                      ? `≈ $${transaction.fee.toFixed(2)}`
                      : undefined
                  }
                />
              )}

              {/* Confirmations */}
              {transaction.status === 'confirmed' && transaction.confirmations !== undefined && (
                <DetailRow
                  label="确认数"
                  value={`${transaction.confirmations >= 100 ? '100+' : transaction.confirmations} 次确认`}
                />
              )}

              {/* Block Height */}
              {transaction.status === 'confirmed' && transaction.blockHeight && (
                <DetailRow
                  label="区块高度"
                  value={`#${transaction.blockHeight.toLocaleString()}`}
                  mono
                />
              )}

              {/* Memo */}
              {transaction.memo && (
                <DetailRow label="备注" value={transaction.memo} />
              )}

              {/* Transaction Hash */}
              {transaction.txHash && (
                <DetailRow
                  label="交易哈希"
                  value={`${transaction.txHash.slice(0, 10)}...${transaction.txHash.slice(-6)}`}
                  copyValue={transaction.txHash}
                  mono
                  externalLink="#"
                />
              )}
            </div>

            {/* RBF Action Section */}
            {transaction.status === 'pending' && transaction.type === 'send' && (
              <RbfActionSection
                transaction={transaction}
                onSpeedUp={() => setSpeedUpDrawerOpen(true)}
                onCancel={() => setCancelDrawerOpen(true)}
              />
            )}

          </div>
        </div>

        {/* RBF Drawers */}
        <SpeedUpDrawer
          open={speedUpDrawerOpen}
          onOpenChange={setSpeedUpDrawerOpen}
          transaction={transaction}
          onConfirm={handleSpeedUpConfirm}
        />
        <CancelTxDrawer
          open={cancelDrawerOpen}
          onOpenChange={setCancelDrawerOpen}
          transaction={transaction}
          onConfirm={handleCancelConfirm}
        />
      </AppLayout>
    </PageTransition>
  );
}
