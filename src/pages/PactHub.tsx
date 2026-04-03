import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShieldCheck, ChevronRight, Clock, Bot, Zap, Shield } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { mockPacts } from '@/lib/mock-pacts';
import type { PactStatus } from '@/types/pact';

export default function PactHub() {
  const navigate = useNavigate();
  const t = useT();

  const statusConfig: Record<PactStatus, { label: string; color: string; bg: string }> = {
    pending: { label: t.common.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
    approved: { label: t.common.approved, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    active: { label: t.common.active, color: 'text-blue-600', bg: 'bg-blue-50' },
    completed: { label: t.common.completed, color: 'text-slate-600', bg: 'bg-slate-50' },
    rejected: { label: t.common.rejected, color: 'text-red-600', bg: 'bg-red-50' },
    expired: { label: t.common.expired, color: 'text-muted-foreground', bg: 'bg-muted/50' },
  };

  const pendingPacts = useMemo(() => mockPacts.filter(p => p.status === 'pending'), []);
  const activePacts = useMemo(() => mockPacts.filter(p => p.status === 'active' || p.status === 'approved'), []);
  const pendingCount = pendingPacts.length;
  const activeCount = activePacts.length;

  return (
    <AppLayout showNav pageBg="bg-page" title={t.pactHub.title}>
      <div className="px-4 pt-2 space-y-4">

        {/* Summary cards */}
        <div className="flex gap-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 bg-white rounded-2xl p-4 border border-border/60 shadow-sm text-left active:scale-[0.97] transition-transform"
            onClick={() => navigate('/pact-approval', { state: { defaultTab: 'pending' } })}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
                <Clock className="w-4 h-4 text-amber-600" strokeWidth={1.5} />
              </div>
              {pendingCount > 0 && (
                <span className="ml-auto min-w-4 h-4 px-1 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </div>
            <p className="text-[22px] font-bold text-foreground">{pendingCount}</p>
            <p className="text-[12px] text-muted-foreground">{t.pactHub.pending}</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex-1 bg-white rounded-2xl p-4 border border-border/60 shadow-sm text-left active:scale-[0.97] transition-transform"
            onClick={() => navigate('/pact-approval', { state: { defaultTab: 'approved' } })}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
                <Zap className="w-4 h-4 text-blue-600" strokeWidth={1.5} />
              </div>
            </div>
            <p className="text-[22px] font-bold text-foreground">{activeCount}</p>
            <p className="text-[12px] text-muted-foreground">{t.pactHub.active}</p>
          </motion.button>
        </div>

        {/* Quick actions */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl overflow-hidden border border-border/60 shadow-sm"
        >
          <button
            onClick={() => navigate('/pact-approval')}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-medium text-foreground">{t.pactHub.pactApproval}</p>
              <p className="text-[12px] text-muted-foreground">{t.pactHub.pactApprovalDesc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          </button>
          <div className="h-px bg-border/50 mx-4" />
          <button
            onClick={() => navigate('/default-pact')}
            className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/30 transition-colors"
          >
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary" strokeWidth={1.5} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[14px] font-medium text-foreground">{t.pactHub.defaultPactManagement}</p>
              <p className="text-[12px] text-muted-foreground">{t.pactHub.defaultPactManagementDesc}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" strokeWidth={1.5} />
          </button>
        </motion.div>

        {/* Pending pacts - if any */}
        {pendingPacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
          >
            <SectionHeader
              title={t.pactHub.pendingPacts}
              action={
                <button onClick={() => navigate('/pact-approval')} className="text-[12px] text-primary font-medium">
                  {t.pactHub.viewAll}
                </button>
              }
            />
            <div className="space-y-2.5">
              {pendingPacts.map((pact, i) => (
                <motion.div
                  key={pact.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 + i * 0.05 }}
                  onClick={() => navigate(`/pact/${pact.id}`)}
                  className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1 min-w-0">
                      <span className="text-[11px] font-medium px-2 py-0.5 rounded-full text-amber-600 bg-amber-50 inline-block mb-1.5">
                        {t.common.pending}
                      </span>
                      <h3 className="text-[14px] font-semibold text-foreground leading-snug">{pact.title}</h3>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" strokeWidth={1.5} />
                  </div>
                  <p className="text-[12px] text-muted-foreground line-clamp-2 mb-2">{pact.description}</p>
                  <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Bot className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>{pact.agentName}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                      <span>{pact.validityDays} {t.common.days}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Active pacts */}
        {activePacts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
          >
            <SectionHeader title={t.pactHub.activePacts} />
            <div className="space-y-2.5">
              {activePacts.map((pact, i) => {
                const status = statusConfig[pact.status];
                return (
                  <motion.div
                    key={pact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 + i * 0.05 }}
                    onClick={() => navigate(`/pact/${pact.id}`)}
                    className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                        <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full inline-block mb-1.5', status.color, status.bg)}>
                          {status.label}
                        </span>
                        <h3 className="text-[14px] font-semibold text-foreground leading-snug">{pact.title}</h3>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" strokeWidth={1.5} />
                    </div>
                    <p className="text-[12px] text-muted-foreground line-clamp-2 mb-2">{pact.description}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <Bot className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{pact.agentName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" strokeWidth={1.5} />
                        <span>{pact.validityDays} {t.common.days}</span>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Empty state when no pending and no active pacts */}
        {pendingPacts.length === 0 && activePacts.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="py-10 text-center"
          >
            <ShieldCheck className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" strokeWidth={1.5} />
            <p className="text-[14px] text-muted-foreground mb-1">{t.pactHub.noPacts}</p>
            <p className="text-[12px] text-muted-foreground/60 mb-4">{t.pactHub.noPactsDesc}</p>
            <button
              onClick={() => navigate('/assistant')}
              className="text-[13px] text-primary font-medium"
            >
              {t.pactHub.goToAssistant}
            </button>
          </motion.div>
        )}

        <div className="h-6 shrink-0" />
      </div>
    </AppLayout>
  );
}
