import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, Clock, ChevronDown, Shield, FileText, AlertTriangle,
  CheckCircle2, XCircle, Zap, Calendar, LogOut, ShieldOff,
  Pencil, Eye, Sparkles, Wallet,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { mockPacts } from '@/lib/mock-pacts';
import { toast } from '@/lib/toast';
import { useT } from '@/lib/i18n';
import type { PactStatus } from '@/types/pact';

function CollapsibleSection({ title, icon: Icon, defaultOpen = false, children }: {
  title: string;
  icon: typeof Shield;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-border/60 shadow-sm">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <Icon className="w-4 h-4 text-primary shrink-0" strokeWidth={1.5} />
        <span className="flex-1 text-[14px] font-semibold text-foreground">{title}</span>
        <ChevronDown className={cn('w-4 h-4 text-muted-foreground transition-transform', open && 'rotate-180')} strokeWidth={1.5} />
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 pt-0">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function PactDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const t = useT();
  const pact = mockPacts.find(p => p.id === id);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'revoke' | null>(null);

  const statusConfig: Record<PactStatus, { label: string; color: string; bg: string; icon: typeof CheckCircle2 }> = {
    pending: { label: t.common.pending, color: 'text-amber-600', bg: 'bg-amber-50', icon: Clock },
    approved: { label: t.common.approved, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CheckCircle2 },
    active: { label: t.common.active, color: 'text-blue-600', bg: 'bg-blue-50', icon: Zap },
    completed: { label: t.common.completed, color: 'text-slate-600', bg: 'bg-slate-50', icon: CheckCircle2 },
    rejected: { label: t.common.rejected, color: 'text-red-600', bg: 'bg-red-50', icon: XCircle },
    expired: { label: t.common.expired, color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Clock },
  };

  if (!pact) {
    return (
      <AppLayout title={t.pactDetail.title} showBack showNav showSecurityBanner={false}>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">{t.pactDetail.notFound}</p>
        </div>
      </AppLayout>
    );
  }

  const status = statusConfig[pact.status];
  const StatusIcon = status.icon;
  const isPending = pact.status === 'pending';
  const showRevoke = pact.status === 'active' || pact.status === 'approved';

  const handleConfirm = () => {
    if (confirmAction === 'approve') toast.success(t.pactDetail.pactApproved);
    else if (confirmAction === 'reject') toast.success(t.pactDetail.pactRejected);
    else if (confirmAction === 'revoke') toast.success(t.pactDetail.pactRevoked);
    setConfirmAction(null);
    navigate('/pact');
  };

  const confirmConfig = {
    approve: {
      title: t.pactDetail.confirmApproveTitle,
      description: t.pactDetail.confirmApproveDesc,
      confirmLabel: t.pactDetail.confirmApproveBtn,
      confirmClass: 'bg-primary text-white hover:bg-primary/90',
    },
    reject: {
      title: t.pactDetail.confirmRejectTitle,
      description: t.pactDetail.confirmRejectDesc,
      confirmLabel: t.pactDetail.confirmRejectBtn,
      confirmClass: 'bg-red-600 text-white hover:bg-red-700',
    },
    revoke: {
      title: t.pactDetail.confirmRevokeTitle,
      description: t.pactDetail.confirmRevokeDesc,
      confirmLabel: t.pactDetail.confirmRevokeBtn,
      confirmClass: 'bg-red-600 text-white hover:bg-red-700',
    },
  };

  return (
    <AppLayout
      title={t.pactDetail.title}
      showBack
      showNav={false}
      showSecurityBanner={false}
      pageBg="bg-page"
      rightAction={
        <motion.button
          onClick={() => navigate('/assistant')}
          className="relative flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full overflow-hidden active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #6366F1, #3B82F6)',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
        >
          {/* Shimmer overlay */}
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
      <div className="px-4 py-4 space-y-3" style={{ paddingBottom: isPending || showRevoke ? 90 : 24 }}>

        {/* ===== Header card: Status + Key info ===== */}
        <motion.div
          className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Status bar */}
          <div className="px-4 pt-4 pb-3">
            <div className="flex items-center gap-2 mb-3">
              <StatusIcon className={cn('w-4 h-4', status.color)} strokeWidth={1.5} />
              <span className={cn('text-[12px] font-medium px-2 py-0.5 rounded-full', status.color, status.bg)}>
                {status.label}
              </span>
            </div>

            <h2 className="text-[17px] font-bold text-foreground leading-snug mb-2">{pact.title}</h2>
            <p className="text-[13px] text-muted-foreground leading-relaxed">{pact.description}</p>
          </div>

          <div className="h-px bg-border/40 mx-4" />

          {/* Key meta: Agent, Wallet, Validity */}
          <div className="px-4 py-3.5 space-y-2.5">
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Bot className="w-3.5 h-3.5" strokeWidth={1.5} />
                Agent
              </span>
              <span className="font-medium text-foreground">{pact.agentName}</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5" strokeWidth={1.5} />
                Wallet
              </span>
              <span className="font-medium text-foreground">主钱包</span>
            </div>
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                有效期
              </span>
              <span className="font-medium text-foreground">{pact.validityDays} 天</span>
            </div>
          </div>
        </motion.div>

        {/* ===== Original prompt ===== */}
        <motion.div
          className="bg-white rounded-2xl border border-border/60 shadow-sm px-4 py-3.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <p className="text-[12px] text-muted-foreground mb-2 font-medium">原始指令</p>
          <div className="bg-muted/30 rounded-lg p-3">
            <p className="text-[13px] text-foreground/80 leading-relaxed italic">
              "{pact.userPrompt}"
            </p>
          </div>
        </motion.div>

        {/* ===== Agent Permissions ===== */}
        <motion.div
          className="bg-white rounded-2xl border border-border/60 shadow-sm px-4 py-3.5"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[12px] text-muted-foreground mb-2.5 font-medium">Agent 权限</p>
          <div className="space-y-2">
            {pact.permissions.map((perm, i) => {
              const isWrite = perm.type === 'write';
              const permLabel = t.pactDetail.permLabels?.[perm.scope as keyof typeof t.pactDetail.permLabels] ?? perm.scope;
              return (
                <div key={i} className="flex items-center gap-2.5 text-[13px]">
                  <div className={cn(
                    'w-7 h-7 rounded-full flex items-center justify-center shrink-0',
                    isWrite ? 'bg-blue-50' : 'bg-slate-50',
                  )}>
                    {isWrite
                      ? <Pencil className="w-3.5 h-3.5 text-blue-500" strokeWidth={1.5} />
                      : <Eye className="w-3.5 h-3.5 text-slate-400" strokeWidth={1.5} />
                    }
                  </div>
                  <span className="text-foreground/80">{permLabel}</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* ===== Collapsible sections ===== */}

        {/* Execution Plan */}
        <CollapsibleSection title="执行计划" icon={FileText}>
          <div className="space-y-4">
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">概要</p>
              <p className="text-[13px] text-foreground/80 leading-relaxed">{pact.executionSummary}</p>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">合约操作</p>
              <div className="space-y-2">
                {pact.contractOps.map((op, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="text-[13px] text-foreground/60 mt-0.5">•</span>
                    <div>
                      <span className="text-[13px] font-medium text-foreground">{op.label}: </span>
                      <span className="text-[13px] text-foreground/70">{op.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">执行计划</p>
              <p className="text-[13px] text-foreground/80 leading-relaxed">{pact.schedule}</p>
            </div>
          </div>
        </CollapsibleSection>

        {/* Risk Controls */}
        <CollapsibleSection title="风控限制" icon={Shield}>
          <div className="space-y-2">
            {pact.riskControls.map((rc, i) => (
              <div key={i} className="flex items-center justify-between py-1.5">
                <span className="text-[13px] text-muted-foreground">{rc.label}</span>
                <span className="text-[13px] font-medium text-foreground">{rc.value}</span>
              </div>
            ))}
            {/* Risk rules */}
            {pact.riskRules.length > 0 && (
              <div className="pt-2 space-y-2">
                {pact.riskRules.map((rule, i) => (
                  <div key={i} className="bg-muted/30 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        'text-[10px] font-bold px-1.5 py-0.5 rounded',
                        rule.action === 'deny' ? 'bg-red-100 text-red-700' : 'bg-emerald-100 text-emerald-700',
                      )}>
                        {rule.action === 'deny' ? '拒绝' : '允许'}
                      </span>
                      <span className="text-[12px] font-semibold text-foreground">{rule.name}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground space-y-0.5">
                      <p>链: {rule.chain} · 类型: {rule.type}</p>
                      {rule.addresses && <p>地址: {rule.addresses.join(', ')}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CollapsibleSection>

        {/* Exit Conditions */}
        <CollapsibleSection title="退出条件" icon={LogOut}>
          <p className="text-[13px] text-foreground/80 leading-relaxed">{pact.exitConditions}</p>
        </CollapsibleSection>
      </div>

      {/* ===== Fixed bottom action bar ===== */}
      {isPending && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 py-3 flex gap-3" style={{ maxWidth: 430, margin: '0 auto' }}>
          <Button
            variant="outline"
            className="flex-1 h-12 text-[15px] font-semibold border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => setConfirmAction('reject')}
          >
            拒绝
          </Button>
          <Button
            className="flex-1 h-12 text-[15px] font-semibold"
            onClick={() => setConfirmAction('approve')}
          >
            通过
          </Button>
        </div>
      )}
      {showRevoke && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 py-3" style={{ maxWidth: 430, margin: '0 auto' }}>
          <Button
            variant="outline"
            className="w-full h-12 text-[15px] font-semibold border-red-200 text-red-600 hover:bg-red-50"
            onClick={() => setConfirmAction('revoke')}
          >
            <ShieldOff className="w-4 h-4 mr-2" strokeWidth={1.5} />
            撤销 Pact
          </Button>
        </div>
      )}

      {/* Confirmation Drawer */}
      <Drawer open={confirmAction !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <DrawerContent>
          {confirmAction && (
            <div className="px-6 pt-2 pb-8 space-y-4">
              <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-muted/50 mb-2">
                {confirmAction === 'approve'
                  ? <CheckCircle2 className="w-6 h-6 text-primary" strokeWidth={1.5} />
                  : <AlertTriangle className="w-6 h-6 text-red-500" strokeWidth={1.5} />
                }
              </div>
              <h3 className="text-[17px] font-bold text-foreground text-center">
                {confirmConfig[confirmAction].title}
              </h3>
              <p className="text-[13px] text-muted-foreground text-center leading-relaxed">
                {confirmConfig[confirmAction].description}
              </p>
              <div className="bg-muted/30 rounded-xl p-3 space-y-2">
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">Pact</span>
                  <span className="font-medium text-foreground">{pact.title}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">Agent</span>
                  <span className="font-medium text-foreground">{pact.agentName}</span>
                </div>
                <div className="flex justify-between text-[12px]">
                  <span className="text-muted-foreground">有效期</span>
                  <span className="font-medium text-foreground">{pact.validityDays} 天</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-12 text-[15px] font-semibold" onClick={() => setConfirmAction(null)}>
                  取消
                </Button>
                <Button className={cn('flex-1 h-12 text-[15px] font-semibold', confirmConfig[confirmAction].confirmClass)} onClick={handleConfirm}>
                  {confirmConfig[confirmAction].confirmLabel}
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </AppLayout>
  );
}
