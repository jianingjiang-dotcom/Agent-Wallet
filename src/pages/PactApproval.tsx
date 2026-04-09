import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FileCheck, Bot, Clock, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { mockPacts } from '@/lib/mock-pacts';
import type { PactStatus } from '@/types/pact';

type TabValue = 'all' | 'pending' | 'active' | 'rejected' | 'completed' | 'expired' | 'revoked';

export default function PactApproval() {
  const navigate = useNavigate();
  const location = useLocation();
  const t = useT();
  const initialTab = (location.state as { defaultTab?: TabValue })?.defaultTab || 'all';
  const [activeTab, setActiveTab] = useState<TabValue>(initialTab);

  const tabs: { value: TabValue; label: string; statuses: PactStatus[] }[] = [
    { value: 'all', label: t.pactApproval.all, statuses: ['pending', 'active', 'rejected', 'completed', 'expired', 'revoked'] },
    { value: 'pending', label: t.pactApproval.pending, statuses: ['pending'] },
    { value: 'active', label: t.pactApproval.active, statuses: ['active'] },
    { value: 'rejected', label: t.pactApproval.rejected, statuses: ['rejected'] },
    { value: 'completed', label: t.pactApproval.completed, statuses: ['completed'] },
    { value: 'expired', label: t.pactApproval.expired, statuses: ['expired'] },
    { value: 'revoked', label: t.pactApproval.revoked, statuses: ['revoked'] },
  ];

  const statusConfig: Record<PactStatus, { label: string; color: string; bg: string }> = {
    pending: { label: t.common.pending, color: 'text-amber-600', bg: 'bg-amber-50' },
    active: { label: t.common.active, color: 'text-blue-600', bg: 'bg-blue-50' },
    completed: { label: t.common.completed, color: 'text-slate-600', bg: 'bg-slate-50' },
    rejected: { label: t.common.rejected, color: 'text-red-600', bg: 'bg-red-50' },
    expired: { label: t.common.expired, color: 'text-muted-foreground', bg: 'bg-muted/50' },
    revoked: { label: t.common.revoked, color: 'text-red-600', bg: 'bg-red-50' },
  };

  const filtered = useMemo(() => {
    const statuses = tabs.find(t => t.value === activeTab)!.statuses;
    return mockPacts
      .filter(p => statuses.includes(p.status))
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [activeTab, t]);

  const pendingCount = mockPacts.filter(p => p.status === 'pending').length;

  return (
    <AppLayout title={t.pactApproval.title} showBack showNav showSecurityBanner={false} pageBg="bg-page">
      <div className="px-4 py-4 space-y-4">
        {/* Tabs */}
        <div className="flex bg-[#F7F8FA] rounded-xl p-1 gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={cn(
                'flex-1 py-2 text-[13px] font-medium rounded-lg transition-all relative',
                activeTab === tab.value
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground'
              )}
            >
              {tab.label}
              {tab.value === 'pending' && pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">
                  {pendingCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Pact list */}
        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="py-16 text-center"
            >
              <FileCheck className="w-12 h-12 mx-auto text-muted-foreground/20 mb-3" strokeWidth={1.5} />
              <p className="text-sm text-muted-foreground">{t.pactApproval.noRecords}</p>
            </motion.div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-3"
            >
              {filtered.map((pact, i) => {
                const status = statusConfig[pact.status];
                return (
                  <motion.div
                    key={pact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => navigate(`/pact/${pact.id}`)}
                    className="bg-white rounded-2xl p-4 border border-border/60 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-[11px] font-medium px-2 py-0.5 rounded-full', status.color, status.bg)}>
                            {status.label}
                          </span>
                        </div>
                        <h3 className="text-[14px] font-bold text-foreground leading-snug mb-1">
                          {pact.title}
                        </h3>
                        <p className="text-[12px] text-muted-foreground line-clamp-2">
                          {pact.description}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" strokeWidth={1.5} />
                    </div>
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}
