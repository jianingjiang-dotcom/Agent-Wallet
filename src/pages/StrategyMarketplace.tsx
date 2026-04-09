import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Users, TrendingUp, Shield } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SearchInput } from '@/components/ui/search-input';
import { CryptoIcon } from '@/components/CryptoIcon';
import { cn } from '@/lib/utils';
import {
  mockStrategies,
  categoryLabels,
  riskLabels,
  featuredGradients,
  type StrategyCategory,
  type StrategyTemplate,
} from '@/lib/mock-strategies';

type FilterCategory = 'all' | StrategyCategory;

const filterItems: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'defi_yield', label: 'DeFi 收益' },
  { id: 'dca', label: '定投' },
  { id: 'risk', label: '风控' },
  { id: 'arbitrage', label: '套利' },
  { id: 'nft', label: 'NFT' },
  { id: 'cross_chain', label: '跨链' },
];

export default function StrategyMarketplace() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<FilterCategory>('all');

  const featured = useMemo(() => mockStrategies.filter(s => s.featured), []);

  const filtered = useMemo(() => {
    let list = mockStrategies;
    if (category !== 'all') list = list.filter(s => s.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(s =>
        s.title.toLowerCase().includes(q) ||
        s.desc.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return list.sort((a, b) => b.popularity - a.popularity);
  }, [category, search]);

  const [featuredIdx, setFeaturedIdx] = useState(0);

  return (
    <AppLayout showBack showNav={false} title="策略广场" showSecurityBanner={false} pageBg="bg-page">

      {/* Search — sticky */}
      <div className="sticky top-0 z-10 px-4 pt-3 pb-2 bg-page">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="搜索策略..."
        />
      </div>

      <div className="pb-8 space-y-5">

        {/* Featured carousel */}
        {!search && (
          <div>
            <div className="flex items-center gap-2 px-4 mb-2">
              <Sparkles className="w-4 h-4 text-primary" strokeWidth={1.5} />
              <span className="text-[13px] font-semibold text-foreground">精选推荐</span>
            </div>
            <div
              className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2"
              style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch', paddingLeft: 16, paddingRight: 16 }}
              onScroll={(e) => {
                const el = e.currentTarget;
                const firstChild = el.children[0] as HTMLElement | undefined;
                const cardW = firstChild?.clientWidth || 300;
                setFeaturedIdx(Math.min(Math.round(el.scrollLeft / (cardW + 12)), featured.length - 1));
              }}
            >
              {featured.map((s) => (
                <div key={s.id} className="snap-start shrink-0" style={{ width: 'calc(100% - 32px)' }}>
                  <FeaturedCard strategy={s} onTap={() => navigate(`/pact-marketplace/${s.id}`)} />
                </div>
              ))}
            </div>
            {featured.length > 1 && (
              <div className="flex justify-center gap-1.5 mt-1">
                {featured.map((_, i) => (
                  <div key={i} className={cn('h-1 rounded-full transition-all duration-300', i === featuredIdx ? 'w-4 bg-primary' : 'w-1 bg-muted-foreground/20')} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Category pills */}
        <div
          className="flex gap-2 overflow-x-auto pl-4 pr-4"
          style={{ scrollbarWidth: 'none', WebkitOverflowScrolling: 'touch' }}
        >
          {filterItems.map(f => (
            <button
              key={f.id}
              onClick={() => setCategory(f.id)}
              className={cn(
                'shrink-0 px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-all border',
                category === f.id
                  ? 'bg-foreground text-background border-foreground'
                  : 'bg-white text-muted-foreground border-border/60'
              )}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Grid */}
        <div className="px-4">
          <AnimatePresence mode="wait">
            {filtered.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="py-16 text-center"
              >
                <Shield className="w-10 h-10 mx-auto text-muted-foreground/20 mb-2" strokeWidth={1.5} />
                <p className="text-[13px] text-muted-foreground">未找到相关策略</p>
              </motion.div>
            ) : (
              <motion.div
                key={`${category}-${search}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-2 gap-3"
              >
                {filtered.map((s, i) => (
                  <StrategyGridCard
                    key={s.id}
                    strategy={s}
                    delay={i * 0.03}
                    onTap={() => navigate(`/pact-marketplace/${s.id}`)}
                  />
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </AppLayout>
  );
}

// ─── Featured Card ─────────────────────────────────────────
function FeaturedCard({ strategy: s, onTap }: { strategy: StrategyTemplate; onTap: () => void }) {
  const risk = riskLabels[s.risk];
  return (
    <div
      onClick={onTap}
      className="relative overflow-hidden rounded-2xl cursor-pointer active:scale-[0.98] transition-transform"
      style={{ background: featuredGradients[s.category], height: 160 }}
    >
      {/* Decorative coin icon */}
      <div className="absolute -right-4 -bottom-4 opacity-[0.15]">
        <CryptoIcon symbol={s.symbol} size="xl" className="!w-24 !h-24" />
      </div>
      <div className="absolute top-3 right-3 opacity-20">
        <div className="w-16 h-16 rounded-full bg-white/20" />
      </div>

      <div className="relative z-10 p-4 h-full flex flex-col justify-between">
        <div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-white/90">
            {categoryLabels[s.category]}
          </span>
          <h3 className="text-[18px] font-bold text-white mt-2 leading-snug">{s.title}</h3>
          <p className="text-[12px] text-white/70 mt-0.5">{s.desc}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-white/90">
            {risk.label}
          </span>
          {s.chains.slice(0, 2).map(c => (
            <span key={c} className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white/20 text-white/90">{c}</span>
          ))}
          {s.estimatedApy && (
            <span className="text-[11px] font-bold text-white ml-auto flex items-center gap-1">
              <TrendingUp className="w-3 h-3" strokeWidth={2} />
              {s.estimatedApy}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Grid Card ─────────────────────────────────────────────
function StrategyGridCard({ strategy: s, delay, onTap }: { strategy: StrategyTemplate; delay: number; onTap: () => void }) {
  const risk = riskLabels[s.risk];
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onTap}
      className="bg-white rounded-2xl p-3.5 border border-border/60 shadow-sm cursor-pointer active:scale-[0.97] transition-transform flex flex-col"
    >
      <CryptoIcon symbol={s.symbol} size="md" className="mb-2.5" />
      <h4 className="text-[13px] font-bold text-foreground leading-snug mb-1">{s.title}</h4>
      <p className="text-[11px] text-muted-foreground line-clamp-2 mb-3 flex-1">{s.desc}</p>
      <div className="flex items-center justify-between">
        <span className={cn('text-[9px] font-medium px-1.5 py-0.5 rounded-full', risk.bg, risk.color)}>
          {risk.label}
        </span>
        <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
          <Users className="w-3 h-3" strokeWidth={1.5} />
          {s.popularity.toLocaleString()}
        </span>
      </div>
    </motion.div>
  );
}
