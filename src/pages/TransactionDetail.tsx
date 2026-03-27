import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, XCircle, Clock
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { getChainIconUrl } from '@/lib/crypto-icons';
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
        <AppLayout showNav={false} showBack title="交易详情" pageBg="bg-background">
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
  const typeLabel = transaction.type === 'receive' ? '转入' : '转出';

  return (
    <PageTransition>
      <AppLayout showNav={false} showBack title="交易详情" pageBg="bg-background">
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-6 space-y-4" style={{ paddingBottom: '64px' }}>

            {/* Amount Section */}
            <div className="text-center">
              <div className="flex flex-col items-center gap-4 mb-1">
                <div className="relative">
                  <CryptoIcon symbol={transaction.symbol} size="lg" className="!w-12 !h-12" />
                  <img src={getChainIconUrl(transaction.network)} alt={transaction.network} className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white" />
                </div>
                <span className={cn(
                  'text-2xl font-bold',
                  transaction.type === 'receive' ? 'text-success' : 'text-foreground'
                )}>
                  {transaction.type === 'receive' ? '+' : '-'}{transaction.amount} {transaction.symbol}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">${transaction.usdValue.toLocaleString()}</p>
              <div className={cn(
                "mt-6 mx-auto rounded-xl px-4 py-4 text-left",
                transaction.status === 'pending' && "bg-[#FEF3E7] dark:bg-amber-900/20",
                transaction.status === 'confirmed' && "bg-[#ECFBF2] dark:bg-green-900/20",
                transaction.status === 'failed' && "bg-[#FBEFF6] dark:bg-red-900/20"
              )}>
                <span className={cn(
                  "font-medium",
                  transaction.status === 'pending' && "text-[#FA8C16] dark:text-amber-400",
                  transaction.status === 'confirmed' && "text-[#11C45A] dark:text-green-400",
                  transaction.status === 'failed' && "text-[#E74E5A] dark:text-red-400"
                )} style={{ fontSize: '16px', lineHeight: '24px' }}>
                  {typeLabel}{status.label}
                </span>
                {transaction.status === 'failed' && transaction.failureReason && (
                  <p className="text-sm text-[#E74E5A] mt-1">{transaction.failureReason}</p>
                )}
              </div>
            </div>

            {/* Details Card */}
            <div className="rounded-xl flex flex-col gap-6 py-4" style={{ backgroundColor: '#F8F9FC' }}>
              {/* Sender */}
              <DetailRow
                label="发送地址"
                value={
                  transaction.type === 'receive' && transaction.counterpartyLabel
                    ? transaction.counterpartyLabel
                    : `${senderAddress.slice(0, 10)}...${senderAddress.slice(-8)}`
                }
                copyValue={senderAddress}
              />

              {/* Receiver */}
              <DetailRow
                label="收款地址"
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
                icon={<ChainIcon chainId={transaction.network} size="sm" className="!w-5 !h-5" />}
              />

              {/* Network Fee */}
              {transaction.fee !== undefined && transaction.fee > 0 && (
                <DetailRow
                  label="Gas 费"
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
            </div>

            {/* Time & Hash Card */}
            <div className="rounded-xl flex flex-col gap-6 py-4" style={{ backgroundColor: '#F8F9FC' }}>
              <DetailRow
                label="时间"
                value={new Date(transaction.timestamp).toLocaleString('zh-CN')}
              />
              {transaction.txHash && (
                <DetailRow
                  label="交易哈希"
                  value={
                    <span
                      className="text-sm text-foreground font-medium truncate block underline cursor-pointer"
                      style={{ maxWidth: '180px' }}
                      onClick={() => window.open('#', '_blank')}
                    >
                      {`${transaction.txHash.slice(0, 10)}...${transaction.txHash.slice(-6)}`}
                    </span>
                  }
                  copyValue={transaction.txHash}
                />
              )}
            </div>


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
