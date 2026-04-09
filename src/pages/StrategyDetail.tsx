import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, TrendingUp, Copy, CheckCircle2, Link2, Shield } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { Button } from '@/components/ui/button';
import { CryptoIcon } from '@/components/CryptoIcon';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { mockStrategies, categoryLabels, riskLabels } from '@/lib/mock-strategies';

export default function StrategyDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [copied, setCopied] = useState(false);

  const strategy = mockStrategies.find(s => s.id === id);

  if (!strategy) {
    return (
      <SwipeBack>
        <AppLayout showBack onBack={() => navigate(-1)} title="策略详情" showNav={false} showSecurityBanner={false}>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">未找到该策略</p>
          </div>
        </AppLayout>
      </SwipeBack>
    );
  }

  const risk = riskLabels[strategy.risk];

  const handleCopy = () => {
    navigator.clipboard.writeText(strategy.prompt);
    toast.success('已复制到剪贴板');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <SwipeBack>
      <AppLayout showBack onBack={() => navigate(-1)} title="策略详情" showNav={false} showSecurityBanner={false} pageBg="bg-page">
        <div className="px-4 py-4 space-y-4" style={{ paddingBottom: 100 }}>

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl border border-border/60 shadow-sm p-5"
          >
            <div className="flex items-center gap-4 mb-4">
              <CryptoIcon symbol={strategy.symbol} size="xl" />
              <div className="flex-1 min-w-0">
                <h1 className="text-[19px] font-bold text-foreground leading-snug">{strategy.title}</h1>
                <p className="text-[13px] text-muted-foreground mt-1">{strategy.desc}</p>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mb-3">
              <span className={cn('text-[10px] font-medium px-2 py-0.5 rounded-full', risk.bg, risk.color)}>
                {risk.label}
              </span>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">
                {categoryLabels[strategy.category]}
              </span>
              {strategy.tags.map(tag => (
                <span key={tag} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-muted/60 text-muted-foreground">
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats */}
            <div className="flex items-center gap-4 text-[12px] text-muted-foreground">
              <div className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" strokeWidth={1.5} />
                <span><span className="font-semibold text-foreground">{strategy.popularity.toLocaleString()}</span> 人使用</span>
              </div>
              {strategy.estimatedApy && (
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-500" strokeWidth={1.5} />
                  <span>预估 APY <span className="font-semibold text-emerald-600">{strategy.estimatedApy}</span></span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Long description */}
          {strategy.longDesc && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-white rounded-2xl border border-border/60 shadow-sm p-5"
            >
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">策略说明</p>
              <p className="text-[13px] text-foreground/80 leading-relaxed">{strategy.longDesc}</p>
            </motion.div>
          )}

          {/* Supported chains */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl border border-border/60 shadow-sm p-5"
          >
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">支持链</p>
            <div className="flex flex-wrap gap-2">
              {strategy.chains.map(chain => (
                <div key={chain} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/40 border border-border/40">
                  <Link2 className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-[12px] font-medium text-foreground">{chain}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Suggested controls */}
          {strategy.suggestedControls && strategy.suggestedControls.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-white rounded-2xl border border-border/60 shadow-sm p-5"
            >
              <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                <Shield className="w-3.5 h-3.5 inline mr-1 -mt-0.5" strokeWidth={1.5} />
                建议风控
              </p>
              <div className="space-y-2">
                {strategy.suggestedControls.map((c, i) => (
                  <div key={i} className="flex items-center justify-between text-[13px]">
                    <span className="text-muted-foreground">{c.label}</span>
                    <span className="font-semibold text-foreground">{c.value}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Prompt preview */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl border border-border/60 shadow-sm p-5"
          >
            <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Prompt 预览</p>
            <div className="flex gap-3">
              <div className="w-[3px] rounded-full bg-primary shrink-0" />
              <p className="text-[14px] text-foreground leading-relaxed">{strategy.prompt}</p>
            </div>
          </motion.div>
        </div>

        {/* Fixed bottom CTA */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-t border-border/50 px-4 pt-3 pb-8" style={{ maxWidth: 430, margin: '0 auto' }}>
          <Button
            size="lg"
            className="w-full text-[14px] font-medium gradient-primary"
            onClick={handleCopy}
          >
            {copied ? (
              <><CheckCircle2 className="w-4 h-4 mr-2" />已复制到剪贴板</>
            ) : (
              <><Copy className="w-4 h-4 mr-2" />复制 Prompt</>
            )}
          </Button>
        </div>
      </AppLayout>
    </SwipeBack>
  );
}
