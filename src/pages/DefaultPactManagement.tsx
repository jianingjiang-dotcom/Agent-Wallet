import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, DollarSign, Link2, Timer, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SectionHeader } from '@/components/ui/section-header';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { mockDefaultPacts } from '@/lib/mock-pacts';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { toast } from '@/lib/toast';
import { useT } from '@/lib/i18n';
import type { DefaultPact } from '@/types/pact';

function PactRuleCard({ pact, onToggle, onTap, t }: { pact: DefaultPact; onToggle: (enabled: boolean) => void; onTap: () => void; t: ReturnType<typeof useT> }) {
  return (
    <motion.div
      className="bg-white rounded-2xl overflow-hidden border border-border/60 shadow-sm"
      whileTap={{ scale: 0.98 }}
    >
      {/* Toggle row — top strip, visually separate */}
      <div className="flex items-center justify-between px-4 pt-3.5 pb-0">
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-[11px] font-medium px-2 py-0.5 rounded-full',
            pact.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-muted text-muted-foreground'
          )}>
            {pact.enabled ? t.common.enabled : t.common.disabled}
          </span>
        </div>
        <Switch
          checked={pact.enabled}
          onCheckedChange={onToggle}
        />
      </div>

      {/* Main tappable card body */}
      <div
        onClick={onTap}
        className="px-4 pt-2.5 pb-4 cursor-pointer active:bg-muted/30 transition-colors"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-[15px] font-semibold text-foreground mb-1">{pact.name}</h3>
            <p className="text-[13px] text-muted-foreground leading-relaxed mb-3">{pact.description}</p>

            {/* Key limits */}
            <div className="flex flex-wrap gap-2">
              {pact.maxPerTx > 0 && (
                <span className="text-[11px] bg-blue-50 text-blue-600 px-2 py-1 rounded-md flex items-center gap-1">
                  <DollarSign className="w-3 h-3" strokeWidth={1.5} />
                  {t.defaultPact.perTx} ${pact.maxPerTx.toLocaleString()}
                </span>
              )}
              {pact.rolling24h > 0 && (
                <span className="text-[11px] bg-purple-50 text-purple-600 px-2 py-1 rounded-md flex items-center gap-1">
                  <Timer className="w-3 h-3" strokeWidth={1.5} />
                  {t.defaultPact.rolling24h} ${pact.rolling24h.toLocaleString()}
                </span>
              )}
              <span className="text-[11px] bg-slate-50 text-slate-600 px-2 py-1 rounded-md flex items-center gap-1">
                <Link2 className="w-3 h-3" strokeWidth={1.5} />
                {pact.allowedChains.length} {t.defaultPact.chains}
              </span>
              {pact.maxPerTx === 0 && (
                <span className="text-[11px] bg-amber-50 text-amber-600 px-2 py-1 rounded-md">
                  {t.common.readOnly}
                </span>
              )}
            </div>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/50 shrink-0 mt-1" strokeWidth={1.5} />
        </div>
      </div>
    </motion.div>
  );
}

export default function DefaultPactManagement() {
  const t = useT();
  const [pacts, setPacts] = useState(mockDefaultPacts);
  const [selectedPact, setSelectedPact] = useState<DefaultPact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleToggle = (id: string, enabled: boolean) => {
    setPacts(prev => prev.map(p => p.id === id ? { ...p, enabled } : p));
    toast.success(enabled ? t.defaultPact.ruleEnabled : t.defaultPact.ruleDisabled);
  };

  const openDetail = (pact: DefaultPact) => {
    setSelectedPact(pact);
    setDrawerOpen(true);
  };

  return (
    <AppLayout title={t.defaultPact.title} showBack showNav showSecurityBanner={false} pageBg="bg-page">
      <div className="px-4 py-4 space-y-4">
        {/* Description */}
        <motion.div
          className="bg-primary/5 rounded-xl p-4 flex items-start gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Shield className="w-4.5 h-4.5 text-primary shrink-0 mt-0.5" strokeWidth={1.5} />
          <p className="text-[13px] text-foreground/70 leading-relaxed">
            {t.defaultPact.description}
          </p>
        </motion.div>

        {/* Pact rules list */}
        <div>
          <SectionHeader title={t.defaultPact.rulesTitle} />
          <div className="space-y-3">
            {pacts.map((pact, i) => (
              <motion.div
                key={pact.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <PactRuleCard
                  pact={pact}
                  onToggle={(enabled) => handleToggle(pact.id, enabled)}
                  onTap={() => openDetail(pact)}
                  t={t}
                />
              </motion.div>
            ))}
          </div>
        </div>

        <div className="h-6 shrink-0" />
      </div>

      {/* Detail Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[85vh]">
          {selectedPact && (
            <div className="px-4 py-4 space-y-4 overflow-y-auto">
              <div className="flex items-center justify-between">
                <h3 className="text-[17px] font-bold text-foreground">{selectedPact.name}</h3>
                <span className={cn(
                  'text-[11px] font-medium px-2 py-0.5 rounded-full',
                  selectedPact.enabled ? 'bg-emerald-50 text-emerald-600' : 'bg-muted text-muted-foreground'
                )}>
                  {selectedPact.enabled ? t.common.enabled : t.common.disabled}
                </span>
              </div>

              <p className="text-[13px] text-muted-foreground">{selectedPact.description}</p>

              {/* Limits */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-3">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{t.defaultPact.drawerLimitsTitle}</p>
                <div className="flex justify-between py-1">
                  <span className="text-[13px] text-muted-foreground">{t.defaultPact.perTxLimit}</span>
                  <span className="text-[13px] font-medium text-foreground">
                    {selectedPact.maxPerTx > 0 ? `$${selectedPact.maxPerTx.toLocaleString()}` : t.defaultPact.noTxAllowed}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[13px] text-muted-foreground">{t.defaultPact.rolling24hLimit}</span>
                  <span className="text-[13px] font-medium text-foreground">
                    {selectedPact.rolling24h > 0 ? `$${selectedPact.rolling24h.toLocaleString()}` : '-'}
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-[13px] text-muted-foreground">{t.defaultPact.maxValidity}</span>
                  <span className="text-[13px] font-medium text-foreground">{selectedPact.maxValidityDays} {t.common.days}</span>
                </div>
              </div>

              {/* Allowed chains */}
              <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{t.defaultPact.allowedChains}</p>
                <div className="flex flex-wrap gap-2">
                  {selectedPact.allowedChains.map(chain => (
                    <span key={chain} className="text-[12px] bg-white px-2.5 py-1 rounded-md text-foreground border border-border/50">
                      {chain}
                    </span>
                  ))}
                </div>
              </div>

              {/* Allowed tokens */}
              {selectedPact.allowedTokens.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{t.defaultPact.allowedTokens}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPact.allowedTokens.map(token => (
                      <span key={token} className="text-[12px] bg-white px-2.5 py-1 rounded-md text-foreground border border-border/50">
                        {token}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Contract whitelist */}
              {selectedPact.contractWhitelist.length > 0 && (
                <div className="bg-muted/30 rounded-xl p-4 space-y-2">
                  <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider">{t.defaultPact.contractWhitelist}</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPact.contractWhitelist.map(contract => (
                      <span key={contract} className="text-[12px] bg-white px-2.5 py-1 rounded-md text-foreground border border-border/50">
                        {contract}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pb-4">
                <Button className="w-full h-12 text-[15px] font-semibold" onClick={() => setDrawerOpen(false)}>
                  {t.defaultPact.close}
                </Button>
              </div>
            </div>
          )}
        </DrawerContent>
      </Drawer>
    </AppLayout>
  );
}
