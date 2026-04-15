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
import type { PactStatus, PolicyRule } from '@/types/pact';

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

// ─── Policy Card ───────────────────────────────────────────
const policyTypeLabels: Record<string, { label: string; color: string; bg: string }> = {
  transfer: { label: 'Transfer', color: 'text-primary', bg: 'bg-primary/10' },
  contract_call: { label: 'Contract Call', color: 'text-primary', bg: 'bg-primary/10' },
  message_sign: { label: 'Message Sign', color: 'text-warning', bg: 'bg-warning/10' },
};

const windowLabels: Record<string, string> = {
  rolling_1h: '1h',
  rolling_24h: '24h',
  rolling_7d: '7d',
  rolling_30d: '30d',
};

function shortenAddr(addr: string) {
  if (addr.length <= 14) return addr;
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function PolicyCard({ policy }: { policy: PolicyRule }) {
  const typeInfo = policyTypeLabels[policy.type] || policyTypeLabels.transfer;
  const { when, deny_if, review_if } = policy.rules;

  // Collect when chips
  const whenChips: { label: string; value: string }[] = [];
  if (when?.chain_in?.length) whenChips.push({ label: '链', value: when.chain_in.join(', ') });
  if (when?.token_in?.length) whenChips.push({ label: 'Token', value: when.token_in.map(t => t.token_id).join(', ') });
  if (when?.destination_address_in?.length) {
    when.destination_address_in.forEach(d => {
      const addr = shortenAddr(d.address);
      whenChips.push({ label: '目标', value: d.label ? `${addr} (${d.label})` : addr });
    });
  }
  if (when?.target_in?.length) {
    when.target_in.forEach(t => {
      const addr = shortenAddr(t.contract_addr);
      whenChips.push({ label: '合约', value: t.label ? `${addr} (${t.label})` : addr });
    });
  }
  if (when?.source_address_in?.length) {
    whenChips.push({ label: '来源', value: when.source_address_in.map(shortenAddr).join(', ') });
  }

  // Collect usage limits
  const limitRows: { window: string; label: string; value: string }[] = [];
  if (deny_if?.usage_limits) {
    for (const [winKey, winVal] of Object.entries(deny_if.usage_limits)) {
      if (!winVal) continue;
      const winLabel = windowLabels[winKey] || winKey;
      if (winVal.amount_usd_gt) limitRows.push({ window: winLabel, label: '金额上限', value: `$${winVal.amount_usd_gt.toLocaleString()}` });
      if (winVal.amount_gt) limitRows.push({ window: winLabel, label: '数量上限', value: `${winVal.amount_gt}` });
      if (winVal.tx_count_gt) limitRows.push({ window: winLabel, label: '笔数上限', value: `${winVal.tx_count_gt}` });
      if (winVal.request_count_gt) limitRows.push({ window: winLabel, label: '请求上限', value: `${winVal.request_count_gt}` });
    }
  }

  // Collect review conditions
  const reviewRows: { label: string; value: string }[] = [];
  if (review_if) {
    if (review_if.amount_usd_gt) reviewRows.push({ label: '单笔超过', value: `> $${review_if.amount_usd_gt.toLocaleString()}` });
    if (review_if.amount_gt) reviewRows.push({ label: '数量超过', value: `> ${review_if.amount_gt}` });
  }

  return (
    <div className="bg-muted/30 rounded-xl p-3.5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-[13px] font-semibold text-foreground">{policy.name}</span>
        <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded', typeInfo.bg, typeInfo.color)}>
          {typeInfo.label}
        </span>
      </div>

      {/* When — chips */}
      {whenChips.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">准入条件</p>
          <div className="flex flex-wrap gap-1.5">
            {whenChips.map((c, i) => (
              <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-white border border-border/60">
                <span className="text-muted-foreground">{c.label}:</span>
                <span className="font-medium text-foreground">{c.value}</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Deny — usage limits */}
      {limitRows.length > 0 && (
        <div className="mb-3">
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">使用限额</p>
          <div className="space-y-1">
            {limitRows.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">
                  <span className="inline-block min-w-[28px] text-[10px] font-bold text-primary/70 mr-1">{r.window}</span>
                  {r.label}
                </span>
                <span className="font-semibold text-foreground tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review conditions */}
      {reviewRows.length > 0 && (
        <div>
          <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-1.5">需审批</p>
          <div className="space-y-1">
            {reviewRows.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-[12px]">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold text-warning tabular-nums">{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
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
    pending: { label: t.common.pending, color: 'text-warning', bg: 'bg-warning/8', icon: Clock },
    active: { label: t.common.active, color: 'text-primary', bg: 'bg-primary/8', icon: Zap },
    completed: { label: t.common.completed, color: 'text-slate-600', bg: 'bg-slate-50', icon: CheckCircle2 },
    rejected: { label: t.common.rejected, color: 'text-destructive', bg: 'bg-destructive/8', icon: XCircle },
    expired: { label: t.common.expired, color: 'text-muted-foreground', bg: 'bg-muted/50', icon: Clock },
    revoked: { label: t.common.revoked, color: 'text-destructive', bg: 'bg-destructive/8', icon: ShieldOff },
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
  const isRunning = pact.status === 'active';
  const showRevoke = isRunning;

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
      confirmClass: 'bg-destructive text-white hover:bg-destructive/90',
    },
    revoke: {
      title: t.pactDetail.confirmRevokeTitle,
      description: t.pactDetail.confirmRevokeDesc,
      confirmLabel: t.pactDetail.confirmRevokeBtn,
      confirmClass: 'bg-destructive text-white hover:bg-destructive/90',
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

            {/* Original prompt — quote style */}
            <div className="flex gap-3 mt-3">
              <div className="w-[3px] rounded-full bg-[#1F32D6] shrink-0" />
              <p className="text-[16px] font-semibold text-foreground leading-relaxed">
                "{pact.userPrompt}"
              </p>
            </div>

            <p className="text-[13px] text-muted-foreground leading-relaxed mt-3">{pact.description}</p>
          </div>

          <div className="h-px bg-border/40 mx-4" />

          {/* Key meta: Agent, Wallet */}
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

        {/* Risk Controls / Policies */}
        <CollapsibleSection title="风控限制" icon={Shield}>
          {pact.policies && pact.policies.length > 0 ? (
            <div className="space-y-3">
              {pact.policies.map((policy, pi) => (
                <PolicyCard key={pi} policy={policy} />
              ))}
            </div>
          ) : (
            <div className="space-y-2">
              {pact.riskControls.map((rc, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-[13px] text-muted-foreground">{rc.label}</span>
                  <span className="text-[13px] font-medium text-foreground">{rc.value}</span>
                </div>
              ))}
            </div>
          )}
        </CollapsibleSection>

        {/* Exit Conditions */}
        <CollapsibleSection title="退出条件" icon={LogOut}>
          {pact.exitConditionList && pact.exitConditionList.length > 0 ? (
            isRunning ? (
              <div className="space-y-4">
                {pact.exitConditionList.map((cond, idx) => {
                  const pct = Math.min((cond.current / cond.target) * 100, 100);
                  const currentDisplay = cond.unit === '$'
                    ? `$${cond.current.toLocaleString()}`
                    : `${cond.current.toLocaleString()}`;
                  const targetDisplay = cond.unit === '$'
                    ? `$${cond.target.toLocaleString()}`
                    : `${cond.target.toLocaleString()}`;
                  return (
                    <div key={idx}>
                      <div className="flex items-baseline justify-between mb-1.5">
                        <span className="text-[13px] text-muted-foreground">{cond.label}</span>
                        <span className="text-[14px] font-semibold text-foreground tabular-nums">
                          {currentDisplay} / {targetDisplay}
                        </span>
                      </div>
                      <div className="h-[6px] rounded-full bg-muted/60 overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{
                            width: `${pct}%`,
                            background: 'linear-gradient(90deg, #1F32D6, #6366F1)',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="space-y-2.5">
                {pact.exitConditionList.map((cond, idx) => {
                  const targetDisplay = cond.unit === '$'
                    ? `$${cond.target.toLocaleString()}`
                    : `${cond.target.toLocaleString()}${cond.unit ? ` ${cond.unit}` : ''}`;
                  return (
                    <div key={idx} className="flex items-center justify-between text-[13px]">
                      <span className="text-muted-foreground">{cond.label}</span>
                      <span className="font-semibold text-foreground tabular-nums">{targetDisplay}</span>
                    </div>
                  );
                })}
              </div>
            )
          ) : (
            <p className="text-[13px] text-foreground/80 leading-relaxed">{pact.exitConditions}</p>
          )}
        </CollapsibleSection>
      </div>

      {/* ===== Fixed bottom action bar ===== */}
      {isPending && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 pt-3 pb-8 flex gap-3" style={{ maxWidth: 430, margin: '0 auto' }}>
          <Button
            variant="outline"
            className="flex-1 h-12 text-[15px] font-semibold border-destructive/20 text-destructive hover:bg-destructive/8"
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
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 pt-3 pb-8" style={{ maxWidth: 430, margin: '0 auto' }}>
          <Button
            variant="outline"
            className="w-full h-12 text-[15px] font-semibold border-destructive/20 text-destructive hover:bg-destructive/8"
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
                  : <AlertTriangle className="w-6 h-6 text-destructive" strokeWidth={1.5} />
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
