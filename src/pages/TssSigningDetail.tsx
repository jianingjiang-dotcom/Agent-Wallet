import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ArrowRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { Button } from '@/components/ui/button';
import { DetailRow } from '@/components/ui/detail-row';
import { CryptoIconWithChain } from '@/components/CryptoIconWithChain';
import { CryptoIcon } from '@/components/CryptoIcon';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import type { TssSigningMeta } from '@/types/notification';
import type { ChainId } from '@/types/wallet';

export default function TssSigningDetail() {
  const { todoId } = useParams<{ todoId: string }>();
  const navigate = useNavigate();
  const { todoItems, completeTodo } = useWallet();

  const todo = todoItems.find(t => t.id === todoId);
  if (!todo || todo.metadata.type !== 'tss_signing') {
    return (
      <SwipeBack>
        <AppLayout showNav={false} showBack onBack={() => navigate(-1)} title="交易签名" showSecurityBanner={false}>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">未找到该签名请求</p>
          </div>
        </AppLayout>
      </SwipeBack>
    );
  }

  const meta = todo.metadata as TssSigningMeta;
  const isPending = todo.status === 'pending';

  const handleSign = () => {
    completeTodo(todo.id, 'approved');
  };

  const handleReject = () => {
    completeTodo(todo.id, 'rejected');
  };

  const txTypeLabel = meta.txType === 'transfer' ? '转账' : meta.txType === 'contract_interaction' ? '合约交互' : '消息签名';

  return (
    <SwipeBack>
      <AppLayout showNav={false} showBack onBack={() => navigate(-1)} title="交易签名" showSecurityBanner={false}>
        <div className="flex flex-col h-full">
          <div className="flex-1 px-4 overflow-y-auto">
            {/* Amount display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center pt-8 pb-6"
            >
              {meta.symbol && meta.chainId ? (
                <CryptoIconWithChain symbol={meta.symbol} chainId={meta.chainId as ChainId} size="lg" />
              ) : (
                <CryptoIcon symbol="ETH" size="lg" />
              )}
              {meta.amount && meta.symbol ? (
                <p className="text-2xl font-bold text-foreground mt-4">
                  {meta.amount.toLocaleString()} {meta.symbol}
                </p>
              ) : (
                <p className="text-2xl font-bold text-foreground mt-4">{txTypeLabel}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">交易签名请求</p>
            </motion.div>

            {/* Status card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className={cn(
                'rounded-xl px-4 py-3 mb-4',
                isPending && 'bg-[#FEF3E7] dark:bg-amber-900/20',
                todo.status === 'approved' && 'bg-[#ECFBF2] dark:bg-green-900/20',
                todo.status === 'rejected' && 'bg-[#FBEFF6] dark:bg-red-900/20',
              )}
            >
              <div className="flex items-center gap-2">
                {isPending && <Clock className="w-4 h-4 text-amber-600" strokeWidth={1.5} />}
                {todo.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />}
                {todo.status === 'rejected' && <XCircle className="w-4 h-4 text-red-600" strokeWidth={1.5} />}
                <span className={cn(
                  'text-sm font-medium',
                  isPending && 'text-amber-700',
                  todo.status === 'approved' && 'text-emerald-700',
                  todo.status === 'rejected' && 'text-red-700',
                )}>
                  {isPending ? '等待签名确认' : todo.status === 'approved' ? '已签名' : '已拒绝签名'}
                </span>
              </div>
              {todo.completedAt && !isPending && (
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  {todo.completedAt.toLocaleString('zh-CN')}
                </p>
              )}
            </motion.div>

            {/* Transaction details card */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-xl bg-[#F8F9FC] dark:bg-muted/30 py-4 space-y-4 mb-4"
            >
              <DetailRow
                label="交易类型"
                value={txTypeLabel}
              />
              {meta.amount && meta.symbol && (
                <DetailRow
                  label="金额"
                  value={`${meta.amount.toLocaleString()} ${meta.symbol}`}
                />
              )}
              {meta.toAddress && (
                <DetailRow
                  label="目标地址"
                  value={meta.toAddress}
                  copyValue={meta.toAddress}
                  mono
                />
              )}
            </motion.div>

            {/* Post-action follow-up */}
            {!isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="space-y-3"
              >
                {todo.status === 'approved' && (
                  <button
                    onClick={() => navigate(`/transaction/${meta.txId}`)}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#F8F9FC] dark:bg-muted/30 transition-colors active:bg-muted"
                  >
                    <span className="text-sm text-foreground">查看交易详情</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
                {todo.status === 'rejected' && (
                  <button
                    onClick={() => navigate('/history')}
                    className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl bg-[#F8F9FC] dark:bg-muted/30 transition-colors active:bg-muted"
                  >
                    <span className="text-sm text-foreground">查看交易历史</span>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                )}
              </motion.div>
            )}
          </div>

          {/* Bottom actions */}
          {isPending && (
            <div className="px-4 pb-8 pt-4 flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="flex-1 h-12 text-base font-medium"
                onClick={handleReject}
              >
                拒绝
              </Button>
              <Button
                variant="default"
                size="lg"
                className="flex-1 h-12 text-base font-medium"
                onClick={handleSign}
              >
                签名
              </Button>
            </div>
          )}
        </div>
      </AppLayout>
    </SwipeBack>
  );
}
