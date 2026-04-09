import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Clock, Bot, ChevronRight, Shield, FileText, MessageSquare,
  CheckCircle2, XCircle, ShieldCheck, Timer, Fingerprint, ArrowRight,
  TrendingUp, ShieldAlert, Coins, Copy, ChevronDown,
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { cn } from '@/lib/utils';
import { useT } from '@/lib/i18n';
import { mockPacts, mockDefaultPacts } from '@/lib/mock-pacts';
import { getPactHistoryData, type DailyPactData } from '@/lib/mock-pact-history';
import { toast } from '@/lib/toast';
import { CryptoIcon } from '@/components/CryptoIcon';
import type { Pact } from '@/types/pact';

export default function PactHub() {
  const navigate = useNavigate();
  const t = useT();
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [forceEmpty, setForceEmpty] = useState(false); // TODO: 临时测试开关，上线前删除

  const pendingPacts = useMemo(
    () => mockPacts.filter(p => p.status === 'pending' && !dismissedIds.has(p.id)),
    [dismissedIds],
  );
  const activePacts = useMemo(
    () => mockPacts.filter(p => p.status === 'active' || p.status === 'approved'),
    [],
  );
  const historyPacts = useMemo(
    () => mockPacts.filter(p => p.status === 'rejected' || p.status === 'expired' || p.status === 'completed' || p.status === 'revoked' || dismissedIds.has(p.id)),
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
        <div className="flex items-center gap-2">
          {/* TODO: 临时测试按钮，上线前删除 */}
          <button
            onClick={() => setForceEmpty(f => !f)}
            className={cn('px-2 py-0.5 rounded text-[10px] font-medium border', forceEmpty ? 'bg-red-50 text-red-600 border-red-200' : 'bg-muted/50 text-muted-foreground border-border/60')}
          >
            {forceEmpty ? '新用户' : '测试'}
          </button>
          <button onClick={() => navigate('/pact-approval')} className="flex items-center gap-1 text-muted-foreground">
            <FileText className="w-5 h-5" strokeWidth={1.5} />
          </button>
        </div>
      }
    >
      {forceEmpty || (pendingPacts.length === 0 && activePacts.length === 0 && historyPacts.length === 0) ? (
        /* ===== New User Onboarding ===== */
        <PactOnboarding />
      ) : (
        <>
          {/* ===== Marketing Banner — sticky ===== */}
          <div className="sticky top-0 z-10 px-4 pt-2 pb-2 bg-page">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-blue-50/60 dark:bg-blue-900/10">
              <ShieldCheck className="w-4 h-4 text-blue-500/70 shrink-0" strokeWidth={1.5} />
              <p className="text-[12px] text-blue-700/70 dark:text-blue-300/70 leading-relaxed">
                Pact 已守护 <span className="font-semibold text-blue-700 dark:text-blue-300">{mockPacts.length}</span> 个策略，完成 <span className="font-semibold text-blue-700 dark:text-blue-300">{mockPacts.reduce((s, p) => s + (p.exitConditionList?.find(c => c.type === 'tx_count')?.current ?? 0), 0)}</span> 笔交易，累计 <span className="font-semibold text-blue-700 dark:text-blue-300">${mockPacts.reduce((s, p) => s + (p.exitConditionList?.find(c => c.type === 'tx_amount')?.current ?? 0), 0).toLocaleString()}</span>
              </p>
            </div>
          </div>

          <div className="px-4 pb-6 space-y-5">

            {/* ===== Execution History Chart ===== */}
            <PactHistoryChart />

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
          </div>
        </>
      )}
    </AppLayout>
  );
}

// ─── Pending Carousel (horizontal swipe) ────────────────────
function PendingCarousel({
  pacts, onTap,
}: {
  pacts: Pact[];
  onTap: (id: string) => void;
}) {
  const [activeIndex, setActiveIndex] = useState(0);

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
        {pacts.map((pact) => (
          <div key={pact.id} className="snap-start shrink-0" style={{ width: 'calc(100% - 32px)' }}>
            <div
              onClick={() => onTap(pact.id)}
              className="bg-card rounded-2xl p-4 border border-border/60 shadow-sm cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-medium px-2 py-0.5 rounded-full inline-block mb-1 bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400">
                    待审批
                  </span>
                  <h3 className="text-[15px] font-semibold text-foreground leading-snug">{pact.title}</h3>
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" strokeWidth={1.5} />
              </div>
              <p className="text-[13px] text-muted-foreground leading-relaxed line-clamp-2">{pact.description}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      {pacts.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-2">
          {pacts.map((_, i) => (
            <div key={i} className={cn('h-1.5 rounded-full transition-all duration-300', i === activeIndex ? 'w-4 bg-primary' : 'w-1.5 bg-muted-foreground/20')} />
          ))}
        </div>
      )}

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
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-[14px] font-bold text-foreground leading-snug mb-1">{pact.title}</h3>
          <p className="text-[12px] text-muted-foreground line-clamp-2">{pact.description}</p>
        </div>
        <div className="flex flex-col items-center shrink-0">
          <div className="relative w-7 h-7 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 relative z-10" />
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" style={{ animationDuration: '2s' }} />
          </div>
          <span className="text-[9px] text-emerald-600 font-medium mt-0.5">生效中</span>
        </div>
      </div>
      {pact.exitConditionList && pact.exitConditionList.length > 0 && (
        <div className="mt-3 space-y-3">
          {pact.exitConditionList.map((cond, idx) => {
            const pct = Math.min((cond.current / cond.target) * 100, 100);
            const cur = cond.unit === '$' ? `$${cond.current.toLocaleString()}` : `${cond.current.toLocaleString()}`;
            const tgt = cond.unit === '$' ? `$${cond.target.toLocaleString()}` : `${cond.target.toLocaleString()}`;
            return (
              <div key={idx}>
                <div className="flex items-baseline justify-between mb-1">
                  <span className="text-[11px] text-muted-foreground">{cond.label}</span>
                  <span className="text-[12px] font-semibold text-foreground tabular-nums">{cur} / {tgt}</span>
                </div>
                <div className="h-[5px] rounded-full bg-muted/60 overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #1F32D6, #6366F1)' }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
}

// ─── Prompt Templates ──────────────────────────────────────
const PROMPT_TEMPLATES = [
  {
    id: 'tpl-dca',
    title: 'ETH 定投策略',
    desc: '每周自动定投 ETH，长期积累',
    symbol: 'ETH',
    prompt: '帮我设置一个ETH定投计划，每周一买入500美金的ETH，用Uniswap执行，持续3个月。',
  },
  {
    id: 'tpl-risk',
    title: 'Aave V3 借贷风控',
    desc: '监控清算风险，自动补充抵押品',
    symbol: 'AAVE',
    prompt: '监控我的Aave V3借贷仓位，如果健康因子低于1.5就自动补充ETH抵押品，保持安全。',
  },
  {
    id: 'tpl-yield',
    title: 'USDC 收益优化',
    desc: '闲置稳定币自动寻找最优收益',
    symbol: 'USDC',
    prompt: '帮我把闲置的USDC存到收益最高的协议里，每天自动复投。',
  },
];

// ─── New User Onboarding ───────────────────────────────────
function PactOnboarding() {
  const [drawerTpl, setDrawerTpl] = useState<typeof PROMPT_TEMPLATES[number] | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="px-4 pt-4 pb-8 space-y-5">

      {/* Hero — gradient card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl px-5 pt-6 pb-5"
        style={{ background: 'linear-gradient(145deg, #f0f4ff 0%, #e8ecff 40%, #f5f0ff 100%)' }}
      >
        <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary/[0.06]" />
        <div className="absolute bottom-2 right-8 w-16 h-16 rounded-full bg-indigo-200/30" />
        <div className="relative z-10">
          <div className="w-11 h-11 rounded-xl bg-white/80 shadow-sm flex items-center justify-center mb-4">
            <ShieldCheck className="w-6 h-6 text-primary" strokeWidth={1.5} />
          </div>
          <h2 className="text-[19px] font-bold text-foreground leading-snug mb-1">用 Pact 守护你的资产</h2>
          <p className="text-[13px] text-muted-foreground leading-relaxed">为 Agent 设定边界，让它在你的规则内自主运行</p>
        </div>
      </motion.div>

      {/* Steps — vertical stepper */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.08 }}
        className="bg-card rounded-2xl border border-border/60 shadow-sm p-4"
      >
        {[
          { num: '1', title: '描述策略', desc: '用自然语言告诉 Agent 你想自动执行的交易策略' },
          { num: '2', title: '生成 Pact', desc: 'Agent 自动生成执行计划、风控规则和退出条件' },
          { num: '3', title: '审批运行', desc: '生物识别确认后，Agent 在 Pact 边界内自主运行' },
        ].map((s, i, arr) => (
          <div key={s.num} className="flex gap-3">
            {/* Left: circle + line */}
            <div className="flex flex-col items-center">
              <div className="w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shrink-0">
                <span className="text-[12px] font-bold">{s.num}</span>
              </div>
              {i < arr.length - 1 && <div className="w-[2px] flex-1 bg-primary/15 my-1" />}
            </div>
            {/* Right: text */}
            <div className={i < arr.length - 1 ? 'pb-4' : ''}>
              <p className="text-[14px] font-semibold text-foreground leading-snug">{s.title}</p>
              <p className="text-[12px] text-muted-foreground mt-0.5 leading-relaxed">{s.desc}</p>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Prompt templates */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.16 }}
      >
        <p className="text-[12px] font-semibold text-muted-foreground uppercase tracking-wide mb-2.5">策略模板</p>
        <div className="space-y-2.5">
          {PROMPT_TEMPLATES.map((tpl, i) => (
            <motion.button
              key={tpl.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.22 + i * 0.06 }}
              onClick={() => setDrawerTpl(tpl)}
              className="w-full flex items-center gap-3 p-3.5 bg-card rounded-2xl border border-border/60 shadow-sm active:scale-[0.98] transition-transform text-left"
            >
              <CryptoIcon symbol={tpl.symbol} size="md" />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold text-foreground leading-snug">{tpl.title}</p>
                <p className="text-[12px] text-muted-foreground mt-0.5">{tpl.desc}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" strokeWidth={1.5} />
            </motion.button>
          ))}
        </div>

        {/* Template Drawer */}
        <Drawer open={!!drawerTpl} onOpenChange={(open) => { if (!open) setDrawerTpl(null); }}>
          <DrawerContent>
            {drawerTpl && (
              <div className="px-5 pt-2 pb-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-5">
                  <CryptoIcon symbol={drawerTpl.symbol} size="lg" />
                  <div>
                    <p className="text-[17px] font-bold text-foreground">{drawerTpl.title}</p>
                    <p className="text-[13px] text-muted-foreground mt-0.5">{drawerTpl.desc}</p>
                  </div>
                </div>

                {/* Prompt quote */}
                <div className="flex gap-3 mb-5">
                  <div className="w-[3px] rounded-full bg-primary shrink-0" />
                  <p className="text-[15px] text-foreground leading-relaxed">
                    {drawerTpl.prompt}
                  </p>
                </div>

                {/* Copy button */}
                <Button
                  size="lg"
                  className="w-full text-[14px] font-medium gradient-primary"
                  onClick={() => handleCopy(drawerTpl.id, drawerTpl.prompt)}
                >
                  {copiedId === drawerTpl.id ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      已复制到剪贴板
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 mr-2" />
                      复制 Prompt
                    </>
                  )}
                </Button>
              </div>
            )}
          </DrawerContent>
        </Drawer>
      </motion.div>
    </div>
  );
}

// ─── Execution History Chart ───────────────────────────────
type MetricTab = 'txCount' | 'txAmount';
type TimeRange = '1d' | '7d' | '30d';

const timeRangeLabels: Record<TimeRange, string> = { '1d': '1天', '7d': '7天', '30d': '30天' };

function PactHistoryChart() {
  const [metric, setMetric] = useState<MetricTab>('txCount');
  const [range, setRange] = useState<TimeRange>('7d');
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  const historyData = useMemo(() => getPactHistoryData(), []);

  const rawData = range === '1d' ? historyData.d1 : range === '7d' ? historyData.d7 : historyData.d30;
  // Map to unified 'value' key so Bar doesn't need to remount on metric switch
  const chartData = useMemo(() =>
    rawData.map(d => ({
      ...d,
      value: metric === 'txCount' ? d.totalTxCount : d.totalTxAmount,
    })),
    [rawData, metric],
  );

  const totalValue = chartData.reduce((s, d) => s + (metric === 'txCount' ? d.totalTxCount : d.totalTxAmount), 0);
  const totalLabel = metric === 'txCount'
    ? `${totalValue} 笔`
    : `$${totalValue.toLocaleString()}`;

  // Custom tooltip
  const renderTooltip = useCallback(({ active, payload }: any) => {
    if (!active || !payload?.[0]) return null;
    const data = payload[0].payload as DailyPactData;
    if (data.pacts.length === 0) return null;
    return (
      <div className="bg-white rounded-xl shadow-lg border border-border/60 px-3 py-2.5 min-w-[140px]">
        <p className="text-[11px] text-muted-foreground mb-1.5">{data.date}</p>
        {data.pacts.map((p, i) => (
          <div key={i} className="flex items-center justify-between gap-4 text-[12px] leading-5">
            <span className="text-foreground truncate">{p.pactTitle}</span>
            <span className="text-foreground font-semibold tabular-nums shrink-0">
              {metric === 'txCount' ? `${p.txCount} 笔` : `$${p.txAmount.toLocaleString()}`}
            </span>
          </div>
        ))}
      </div>
    );
  }, [metric]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl border border-border/60 shadow-sm overflow-hidden"
    >
      <div className="px-4 pt-4 pb-2">
        {/* Header: total left + metric tabs right */}
        <div className="flex items-start justify-between mb-1">
          <div>
            <p className="text-[24px] font-bold text-foreground leading-none">{totalLabel}</p>
            <p className="text-[11px] text-muted-foreground mt-1">
              {range === '1d' ? '今日' : range === '7d' ? '近 7 天' : '近 30 天'}累计
            </p>
          </div>
          <div className="flex gap-1">
            {(['txCount', 'txAmount'] as MetricTab[]).map(m => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className={cn(
                  'px-3 py-1 rounded-full text-[12px] font-medium transition-colors',
                  metric === m
                    ? 'bg-foreground text-background'
                    : 'text-muted-foreground'
                )}
              >
                {m === 'txCount' ? '交易笔数' : '交易金额'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="px-2" style={{ height: 140 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 8, left: 8, bottom: 0 }}
            onMouseMove={(state: any) => {
              if (state?.activeTooltipIndex !== undefined) setActiveIdx(state.activeTooltipIndex);
            }}
            onMouseLeave={() => setActiveIdx(null)}
          >
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#9ca3af' }}
              interval={range === '30d' ? 4 : range === '1d' ? 3 : 0}
            />
            <YAxis hide />
            <Tooltip
              content={renderTooltip}
              cursor={{ fill: 'rgba(0,0,0,0.03)', radius: 6 }}
            />
            <Bar
              dataKey="value"
              radius={[4, 4, 0, 0]}
              maxBarSize={range === '30d' ? 8 : range === '1d' ? 6 : 24}
              isAnimationActive={true}
              animationDuration={400}
              animationEasing="ease-out"
            >
              {chartData.map((_, i) => (
                <Cell
                  key={i}
                  fill={activeIdx === i ? '#1F32D6' : '#c7d2fe'}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Time range selector */}
      <div className="flex justify-center gap-1 px-4 pt-1 pb-3">
        {(['1d', '7d', '30d'] as TimeRange[]).map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={cn(
              'px-4 py-1.5 rounded-full text-[11px] font-medium transition-colors',
              range === r
                ? 'bg-slate-100 text-foreground'
                : 'text-muted-foreground'
            )}
          >
            {timeRangeLabels[r]}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
