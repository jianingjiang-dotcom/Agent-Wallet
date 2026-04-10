import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, Clock, ArrowRight, Sparkles, ChevronDown, FileText } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { Button } from '@/components/ui/button';
import { DetailRow } from '@/components/ui/detail-row';
import { CryptoIconWithChain } from '@/components/CryptoIconWithChain';
import { CryptoIcon } from '@/components/CryptoIcon';
import { BiometricVerifyDrawer } from '@/components/BiometricVerifyDrawer';
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
  const [biometricOpen, setBiometricOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  const handleSign = () => {
    setPendingAction('approve');
    setBiometricOpen(true);
  };

  const handleReject = () => {
    setPendingAction('reject');
    setBiometricOpen(true);
  };

  const handleBiometricVerified = () => {
    if (pendingAction === 'approve') completeTodo(todo.id, 'approved');
    else if (pendingAction === 'reject') completeTodo(todo.id, 'rejected');
    setPendingAction(null);
  };

  const txTypeLabel = meta.txType === 'transfer' ? '转账' : meta.txType === 'contract_interaction' ? '合约交互' : '消息签名';
  const isMessageSign = meta.txType === 'message_signing';
  const eip712 = meta.eip712;
  const [msgDetailOpen, setMsgDetailOpen] = useState(false);

  return (
    <SwipeBack>
      <AppLayout showNav={false} showBack onBack={() => navigate(-1)} title="交易签名" showSecurityBanner={false}
        rightAction={
          <motion.button
            onClick={() => navigate('/assistant')}
            className="relative flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full overflow-hidden active:scale-95 transition-transform"
            style={{ background: 'linear-gradient(135deg, #7C3AED, #6366F1, #3B82F6)', boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)' }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.92 }}
          >
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)' }}
              animate={{ x: ['-100%', '200%'] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
            />
            <Sparkles className="w-3 h-3 text-white relative z-10" strokeWidth={2} />
            <span className="text-[11px] font-semibold text-white relative z-10 tracking-wide">Ask AI</span>
          </motion.button>
        }
      >
        <div className="flex flex-col h-full">
          <div className="flex-1 px-4 overflow-y-auto">
            {/* Header display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center pt-8 pb-6"
            >
              {isMessageSign && eip712 ? (
                <>
                  <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                    <FileText className="w-7 h-7 text-blue-600 dark:text-blue-400" strokeWidth={1.5} />
                  </div>
                  <p className="text-xl font-bold text-foreground mt-3 text-center">{eip712.domain.name}</p>
                </>
              ) : (
                <>
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
                    </>
              )}
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
              {isMessageSign && eip712 && (
                <>
                  <DetailRow
                    label="签名类型"
                    value={eip712.primaryType}
                  />
                  <DetailRow
                    label="合约地址"
                    value={eip712.domain.verifyingContract}
                    copyValue={eip712.domain.verifyingContract}
                    mono
                  />
                  <DetailRow
                    label="链"
                    value={eip712.domain.chainId === '0x1' ? 'Ethereum' : `Chain ${eip712.domain.chainId}`}
                  />
                </>
              )}
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
              <DetailRow
                label="推送时间"
                value={todo.createdAt.toLocaleString('zh-CN')}
              />
              {todo.completedAt && !isPending && (
                <DetailRow
                  label="完成时间"
                  value={todo.completedAt.toLocaleString('zh-CN')}
                />
              )}
            </motion.div>

            {/* EIP-712 Message Details — collapsible */}
            {isMessageSign && eip712 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="rounded-xl bg-white dark:bg-card border border-border/60 shadow-sm overflow-hidden mb-4"
              >
                <button
                  onClick={() => setMsgDetailOpen(v => !v)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
                >
                  <FileText className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
                  <span className="flex-1 text-[14px] font-semibold text-foreground">签名详情</span>
                  <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', msgDetailOpen && 'rotate-180')} strokeWidth={1.5} />
                </button>
                <AnimatePresence>
                  {msgDetailOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4">
                        <pre className="text-[12px] font-mono text-foreground/80 bg-[#F8F9FC] dark:bg-muted/30 rounded-lg p-3 overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">
                          {JSON.stringify(eip712.message, null, 2)}
                        </pre>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

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
      <BiometricVerifyDrawer
        open={biometricOpen}
        onOpenChange={setBiometricOpen}
        title={pendingAction === 'approve' ? '确认签名' : '确认拒绝'}
        description={pendingAction === 'approve' ? '请验证身份以签名此交易' : '请验证身份以拒绝此签名请求'}
        onVerified={handleBiometricVerified}
      />
    </SwipeBack>
  );
}
