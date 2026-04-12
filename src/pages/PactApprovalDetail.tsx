import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, CheckCircle2, XCircle, ChevronRight, Sparkles, ShieldCheck, LogOut } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { Button } from '@/components/ui/button';
import { BiometricVerifyDrawer } from '@/components/BiometricVerifyDrawer';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { mockPacts } from '@/lib/mock-pacts';
import type { PactApprovalMeta } from '@/types/notification';

export default function PactApprovalDetail() {
  const { todoId } = useParams<{ todoId: string }>();
  const navigate = useNavigate();
  const { todoItems, completeTodo } = useWallet();

  const todo = todoItems.find(t => t.id === todoId);
  if (!todo || todo.metadata.type !== 'pact_approval') {
    return (
      <SwipeBack>
        <AppLayout showNav={false} showBack onBack={() => navigate(-1)} title="Pact 创建" showSecurityBanner={false}>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">未找到该审批记录</p>
          </div>
        </AppLayout>
      </SwipeBack>
    );
  }

  const meta = todo.metadata as PactApprovalMeta;
  const pact = mockPacts.find(p => p.id === meta.pactId);
  const isPending = todo.status === 'pending';
  const [biometricOpen, setBiometricOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState<'approve' | 'reject' | null>(null);
  const [resultAction, setResultAction] = useState<'approved' | 'rejected' | null>(null);

  const handleApprove = () => {
    setPendingAction('approve');
    setBiometricOpen(true);
  };

  const handleReject = () => {
    setPendingAction('reject');
    setBiometricOpen(true);
  };

  const handleBiometricVerified = () => {
    const action = pendingAction;
    if (action === 'approve') completeTodo(todo.id, 'approved');
    else if (action === 'reject') completeTodo(todo.id, 'rejected');
    setPendingAction(null);
    setResultAction(action === 'approve' ? 'approved' : 'rejected');
    setTimeout(() => navigate(-1), 1000);
  };

  return (
    <SwipeBack>
      <AppLayout showNav={false} showBack onBack={() => navigate(-1)} title="Pact 创建" showSecurityBanner={false}
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
          <div className="flex-1 px-4 overflow-y-auto" style={{ paddingBottom: isPending ? 90 : 24 }}>

            {/* Pact icon + title */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center pt-8 pb-6"
            >
              <div className="w-14 h-14 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center">
                <ShieldCheck className="w-7 h-7 text-violet-600 dark:text-violet-400" strokeWidth={1.5} />
              </div>
              <p className="text-lg font-bold text-foreground mt-3">{meta.intent}</p>
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
                  {isPending ? '待审批 — Agent 请求创建新 Pact' : todo.status === 'approved' ? '已通过' : '已拒绝'}
                </span>
              </div>
            </motion.div>

            {/* Pact summary */}
            {pact && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="rounded-xl bg-[#F8F9FC] dark:bg-muted/30 p-4 mb-4"
              >
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Pact 摘要</p>

                {/* Quote-style prompt */}
                <div className="flex gap-3 mb-3">
                  <div className="w-[3px] rounded-full bg-primary shrink-0" />
                  <p className="text-[14px] font-semibold text-foreground leading-relaxed">
                    "{pact.userPrompt}"
                  </p>
                </div>

                <p className="text-[13px] text-muted-foreground leading-relaxed">{pact.description}</p>

                <div className="h-px bg-border/40 my-3" />
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-[12px]">
                    <span className="text-muted-foreground">推送时间</span>
                    <span className="text-foreground">{todo.createdAt.toLocaleString('zh-CN')}</span>
                  </div>
                  {todo.completedAt && !isPending && (
                    <div className="flex items-center justify-between text-[12px]">
                      <span className="text-muted-foreground">完成时间</span>
                      <span className="text-foreground">{todo.completedAt.toLocaleString('zh-CN')}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* View full Pact detail link */}
            {pact && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                onClick={() => navigate(`/pact/${pact.id}`)}
                className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-card mb-4 active:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className="w-4 h-4 text-primary" strokeWidth={1.5} />
                  <span className="text-[13px] font-medium text-foreground">查看完整 Pact 详情</span>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
              </motion.button>
            )}
          </div>

          {/* Bottom action bar */}
          {isPending && (
            <div className="px-4 pb-8 pt-3 flex gap-3 border-t border-border/50 bg-background/95 backdrop-blur-sm">
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
        description={pendingAction === 'approve' ? '请验证身份以通过此 Pact' : '请验证身份以拒绝此 Pact'}
        onVerified={handleBiometricVerified}
      />

      {/* Result feedback overlay */}
      <AnimatePresence>
        {resultAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background/90 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {resultAction === 'approved' ? (
                <CheckCircle2 className="w-16 h-16 text-emerald-500" />
              ) : (
                <XCircle className="w-16 h-16 text-red-500" />
              )}
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="mt-4 text-lg font-semibold text-foreground"
            >
              {resultAction === 'approved' ? '已通过' : '已拒绝'}
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </SwipeBack>
  );
}
