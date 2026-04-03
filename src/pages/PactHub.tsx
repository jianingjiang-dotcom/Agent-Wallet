import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Clock, Bot, ChevronRight, Shield, FileText, MessageSquare,
  CheckCircle2, XCircle, ShieldCheck,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { mockPacts, mockDefaultPacts } from '@/lib/mock-pacts';
import { toast } from '@/lib/toast';
import type { Pact } from '@/types/pact';

export default function PactHub() {
  const navigate = useNavigate();
  const t = useT();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const pendingPacts = useMemo(
    () => mockPacts.filter(p => p.status === 'pending' && !dismissedIds.has(p.id)),
    [dismissedIds],
  );
  const activePacts = useMemo(
    () => mockPacts.filter(p => p.status === 'active' || p.status === 'approved'),
    [],
  );
  const historyPacts = useMemo(
    () => mockPacts.filter(p => p.status === 'rejected' || p.status === 'expired' || p.status === 'completed' || dismissedIds.has(p.id)),
    [dismissedIds],
  );

  const defaultPact = mockDefaultPacts[0];

  const handleApproveConfirm = useCallback((id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
    toast.success('Pact 已通过');
  }, []);

  const handleRejectConfirm = useCallback((id: string) => {
    setDismissedIds(prev => new Set(prev).add(id));
    toast.success('Pact 已拒绝');
  }, []);

  return (
    <AppLayout
      showNav
      pageBg="bg-page"
      title="Pact"
      rightAction={
        <button onClick={() => navigate('/pact-approval')} className="flex items-center gap-1 text-muted-foreground">
          <FileText className="w-5 h-5" strokeWidth={1.5} />
        </button>
      }
    >
      <div className="px-4 pt-2 pb-6 space-y-5">

        {/* ===== Pending Section — horizontal carousel ===== */}
        {pendingPacts.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">待审批</span>
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                {pendingPacts.length}
              </span>
            </div>
            <PendingCarousel
              pacts={pendingPacts}
              onTap={(id) => navigate(`/pact/${id}`)}
              onApprove={handleApproveConfirm}
              onReject={handleRejectConfirm}
            />
          </div>
        )}

        {/* ===== Active Pacts (Default Pact pinned at top) ===== */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">执行中</span>
            {activePacts.length > 0 && (
              <span className="text-[11px] text-muted-foreground">{activePacts.length + 1} 个策略</span>
            )}
          </div>
          <div className="space-y-2.5">
            {/* Default Pact — pinned */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate('/default-pact')}
              className="relative overflow-hidden rounded-2xl p-4 border border-primary/20 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
              style={{ background: 'linear-gradient(135deg, rgba(31,50,214,0.06) 0%, rgba(31,50,214,0.02) 100%)' }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-primary/10 text-primary">DEFAULT</span>
                    <span className="text-[10px] text-emerald-600 font-medium flex items-center gap-0.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      始终生效
                    </span>
                  </div>
                  <h3 className="text-[14px] font-bold text-foreground leading-snug">{defaultPact.name}</h3>
                  <p className="text-[12px] text-muted-foreground mt-0.5">{defaultPact.description}</p>
                </div>
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-primary" strokeWidth={1.5} />
                </div>
              </div>
              <div className="flex gap-3 mt-3">
                <div className="text-[11px]"><span className="text-muted-foreground">单笔限额 </span><span className="font-semibold text-foreground">${defaultPact.maxPerTx}</span></div>
                <div className="text-[11px]"><span className="text-muted-foreground">24h 限额 </span><span className="font-semibold text-foreground">${defaultPact.rolling24h}</span></div>
                <div className="text-[11px]"><span className="text-muted-foreground">链 </span><span className="font-semibold text-foreground">{defaultPact.allowedChains.length} 条</span></div>
              </div>
            </motion.div>

            {activePacts.map((pact, i) => (
              <ActivePactCard key={pact.id} pact={pact} delay={i * 0.05} onTap={() => navigate(`/pact/${pact.id}`)} />
            ))}
          </div>
        </div>

        {/* ===== Empty State ===== */}
        {pendingPacts.length === 0 && activePacts.length === 0 && historyPacts.length === 0 && (
          <div className="py-16 text-center">
            <Shield className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" strokeWidth={1.5} />
            <p className="text-sm text-muted-foreground mb-1">暂无 Pact</p>
            <p className="text-xs text-muted-foreground/60 mb-4">前往助手创建你的第一个 Agent 策略</p>
            <button onClick={() => navigate('/assistant')} className="text-sm text-primary font-medium">前往助手 →</button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

// ─── Pending Carousel (horizontal swipe) ────────────────────
function PendingCarousel({
  pacts, onTap, onApprove, onReject,
}: {
  pacts: Pact[];
  onTap: (id: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [confirmAction, setConfirmAction] = useState<{ action: 'approve' | 'reject'; pact: Pact } | null>(null);

  const handleConfirm = () => {
    if (!confirmAction) return;
    if (confirmAction.action === 'approve') onApprove(confirmAction.pact.id);
    else onReject(confirmAction.pact.id);
    setConfirmAction(null);
  };

  return (
    <div>
      {/* Horizontal scroll */}
      <div
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 pb-2"
        style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        onScroll={(e) => {
          const el = e.currentTarget;
          const cardW = el.firstElementChild?.clientWidth || 300;
          setActiveIndex(Math.min(Math.round(el.scrollLeft / (cardW + 12)), pacts.length - 1));
        }}
      >
        {pacts.map((pact) => {
          const remainingMs = pact.createdAt.getTime() + 60 * 60 * 1000 - Date.now();
          const remainingMin = Math.floor(remainingMs / 60000);
          const isExpired = remainingMin <= 0;
          const isUrgent = !isExpired && remainingMin <= 10;

          return (
            <div key={pact.id} className="snap-start shrink-0" style={{ width: 'calc(100% - 32px)' }}>
              <div
                onClick={() => onTap(pact.id)}
                className={cn(
                  'rounded-2xl p-4 border shadow-sm cursor-pointer active:scale-[0.98] transition-transform',
                  isExpired ? 'bg-muted/50 border-border/40 opacity-75' : 'bg-card border-border/60',
                )}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1 min-w-0">
                    <span className={cn(
                      'text-[11px] font-medium px-2 py-0.5 rounded-full inline-block mb-1',
                      isExpired
                        ? 'bg-muted text-muted-foreground'
                        : 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
                    )}>
                      {isExpired ? '已过期' : '待审批'}
                    </span>
                    <h3 className={cn('text-[15px] font-semibold leading-snug', isExpired ? 'text-muted-foreground' : 'text-foreground')}>{pact.title}</h3>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" strokeWidth={1.5} />
                </div>
                <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2 mb-3">{pact.description}</p>
                <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
                  <div className="flex items-center gap-1"><Bot className="w-3.5 h-3.5" strokeWidth={1.5} /><span>{pact.agentName}</span></div>
                  <div className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" strokeWidth={1.5} /><span>有效 {pact.validityDays} 天</span></div>
                </div>

                {/* Countdown / expired status */}
                <div className={cn(
                  'mt-2 text-[11px] font-medium flex items-center gap-1',
                  isExpired ? 'text-muted-foreground mb-2' : isUrgent ? 'text-red-500 mb-4 animate-pulse' : 'text-red-500 mb-4',
                )}>
                  <Clock className="w-3 h-3" strokeWidth={1.5} />
                  {isExpired ? '审批已超时' : `审批剩余 ${remainingMin} 分钟`}
                </div>

                {/* Actions — only show for non-expired */}
                {!isExpired ? (
                  <div className="flex gap-2.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmAction({ action: 'reject', pact }); }}
                      className="flex-1 py-2.5 rounded-xl border-[1.5px] border-red-400 text-red-500 text-[14px] font-semibold active:bg-red-50 transition-colors"
                    >拒绝</button>
                    <button
                      onClick={(e) => { e.stopPropagation(); setConfirmAction({ action: 'approve', pact }); }}
                      className="flex-[2] py-2.5 rounded-xl bg-primary text-white text-[14px] font-semibold shadow-md shadow-primary/30 active:opacity-85 transition-opacity"
                    >通过</button>
                  </div>
                ) : (
                  <button
                    onClick={(e) => { e.stopPropagation(); onReject(pact.id); }}
                    className="w-full py-2.5 text-center text-[13px] text-muted-foreground font-medium rounded-xl bg-muted/50 active:bg-muted transition-colors"
                  >
                    已超时，点击移除
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Dots */}
      {pacts.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {pacts.map((_, i) => (
            <div key={i} className={cn('h-1.5 rounded-full transition-all duration-300', i === activeIndex ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/20')} />
          ))}
        </div>
      )}

      {/* Confirm Drawer */}
      <Drawer open={confirmAction !== null} onOpenChange={(open) => { if (!open) setConfirmAction(null); }}>
        <DrawerContent>
          {confirmAction && (
            <div className="px-4 pt-2 pb-6">
              <h3 className="text-[17px] font-bold text-foreground text-center mb-2">
                {confirmAction.action === 'approve' ? '确认通过此 Pact？' : '确认拒绝此 Pact？'}
              </h3>
              <p className="text-sm text-muted-foreground text-center mb-2">{confirmAction.pact.title}</p>
              <p className="text-xs text-muted-foreground text-center mb-6">
                {confirmAction.action === 'approve'
                  ? '通过后，Agent 将获得相应权限并可立即开始执行策略。'
                  : '拒绝后，Agent 将无法执行此策略。如需重新申请，需提交新的 Pact。'}
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setConfirmAction(null)}>取消</Button>
                <Button
                  className={cn('flex-1', confirmAction.action === 'reject' && 'bg-red-500 hover:bg-red-600')}
                  onClick={handleConfirm}
                >
                  {confirmAction.action === 'approve'
                    ? <><CheckCircle2 className="w-4 h-4 mr-1.5" />确认通过</>
                    : <><XCircle className="w-4 h-4 mr-1.5" />确认拒绝</>
                  }
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}

// ─── Active Pact Card ───────────────────────────────────────
function ActivePactCard({ pact, delay, onTap }: { pact: Pact; delay: number; onTap: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 + delay }}
      onClick={onTap}
      className="bg-card rounded-2xl p-4 border border-border/60 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-foreground leading-snug mb-1">{pact.title}</h3>
          <p className="text-[12px] text-muted-foreground line-clamp-1">{pact.description}</p>
        </div>
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative z-10" />
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <span className="text-[9px] text-emerald-600 font-medium mt-0.5">运行中</span>
        </div>
      </div>
      <div className="flex rounded-xl bg-muted/50 overflow-hidden">
        <div className="flex-1 py-2 px-3 text-center border-r border-border/50">
          <p className="text-[10px] text-muted-foreground mb-0.5">Agent</p>
          <p className="text-[12px] font-semibold text-foreground truncate">{pact.agentName}</p>
        </div>
        <div className="flex-1 py-2 px-3 text-center border-r border-border/50">
          <p className="text-[10px] text-muted-foreground mb-0.5">链</p>
          <p className="text-[12px] font-semibold text-foreground">{pact.chain}</p>
        </div>
        <div className="flex-1 py-2 px-3 text-center">
          <p className="text-[10px] text-muted-foreground mb-0.5">剩余</p>
          <p className="text-[12px] font-semibold text-amber-600">{pact.validityDays}天</p>
        </div>
      </div>
    </motion.div>
  );
}
