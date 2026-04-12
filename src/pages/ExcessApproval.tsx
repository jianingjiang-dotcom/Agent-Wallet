import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowRight, CheckCircle2, XCircle, Sparkles } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { Button } from '@/components/ui/button';
import { DetailRow } from '@/components/ui/detail-row';
import { CryptoIconWithChain } from '@/components/CryptoIconWithChain';
import { BiometricVerifyDrawer } from '@/components/BiometricVerifyDrawer';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { mockPacts } from '@/lib/mock-pacts';
import type { ExcessApprovalMeta } from '@/types/notification';
import type { ChainId } from '@/types/wallet';

export default function ExcessApproval() {
  const { todoId } = useParams<{ todoId: string }>();
  const navigate = useNavigate();
  const { todoItems, completeTodo } = useWallet();

  const todo = todoItems.find(t => t.id === todoId);
  if (!todo || todo.metadata.type !== 'excess_approval') {
    return (
      <SwipeBack>
        <AppLayout showNav={false} showBack onBack={() => navigate(-1)} title="Pact 交易" showSecurityBanner={false}>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">未找到该审批记录</p>
          </div>
        </AppLayout>
      </SwipeBack>
    );
  }

  const meta = todo.metadata as ExcessApprovalMeta;
  const isPending = todo.status === 'pending';
  const [biometricOpen, setBiometricOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);

  const handleApprove = () => {
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

  return (
    <SwipeBack>
      <AppLayout showNav={false} showBack onBack={() => navigate(-1)} title="Pact 交易" showSecurityBanner={false}
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
            {/* Amount display */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center pt-8 pb-6"
            >
              <CryptoIconWithChain symbol={meta.symbol} chainId={meta.chainId as ChainId} size="lg" />
              <p className="text-2xl font-bold text-foreground mt-4">
                {meta.amount.toLocaleString()} {meta.symbol}
              </p>
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
                {isPending && <AlertTriangle className="w-4 h-4 text-amber-600" strokeWidth={1.5} />}
                {todo.status === 'approved' && <CheckCircle2 className="w-4 h-4 text-emerald-600" strokeWidth={1.5} />}
                {todo.status === 'rejected' && <XCircle className="w-4 h-4 text-red-600" strokeWidth={1.5} />}
                <span className={cn(
                  'text-sm font-medium',
                  isPending && 'text-amber-700',
                  todo.status === 'approved' && 'text-emerald-700',
                  todo.status === 'rejected' && 'text-red-700',
                )}>
                  {isPending ? '待审批 — 交易金额超出 Pact 限额' : todo.status === 'approved' ? '已批准' : '已拒绝'}
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
                value={meta.txType === 'transfer' ? '转账' : '合约交互'}
              />
              <DetailRow
                label="金额"
                value={`${meta.amount.toLocaleString()} ${meta.symbol}`}
              />
              <DetailRow
                label="目标地址"
                value={meta.toAddress}
                copyValue={meta.toAddress}
                mono
              />
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

            {/* Associated Pact card */}
            {(() => {
              const pact = mockPacts.find(p => p.id === meta.pactId);
              if (!pact) return null;
              const pactStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
                pending: { label: '待审批', color: 'text-amber-600', bg: 'bg-amber-50' },
                active: { label: '生效中', color: 'text-blue-600', bg: 'bg-blue-50' },
                completed: { label: '已完成', color: 'text-slate-600', bg: 'bg-slate-50' },
                rejected: { label: '已拒绝', color: 'text-red-600', bg: 'bg-red-50' },
                expired: { label: '已过期', color: 'text-muted-foreground', bg: 'bg-muted/50' },
                revoked: { label: '已撤回', color: 'text-red-600', bg: 'bg-red-50' },
              };
              const ps = pactStatusConfig[pact.status] || pactStatusConfig.active;
              return (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15 }}
                  className="mb-4"
                >
                  <p className="text-xs text-muted-foreground font-medium mb-2 px-1">关联 Pact</p>
                  <div
                    onClick={() => navigate(`/pact/${meta.pactId}`)}
                    className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', ps.color, ps.bg)}>
                            {ps.label}
                          </span>
                        </div>
                        <h3 className="text-[14px] font-bold text-foreground leading-snug mb-1">{pact.title}</h3>
                        <p className="text-[12px] text-muted-foreground line-clamp-2">{pact.description}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" strokeWidth={1.5} />
                    </div>
                  </div>
                </motion.div>
              );
            })()}
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
                onClick={handleApprove}
              >
                通过
              </Button>
            </div>
          )}
        </div>
      </AppLayout>

      <BiometricVerifyDrawer
        open={biometricOpen}
        onOpenChange={setBiometricOpen}
        title={pendingAction === 'approve' ? '确认通过' : '确认拒绝'}
        description={pendingAction === 'approve' ? '请验证身份以通过此超额交易' : '请验证身份以拒绝此超额交易'}
        onVerified={handleBiometricVerified}
      />
    </SwipeBack>
  );
}
