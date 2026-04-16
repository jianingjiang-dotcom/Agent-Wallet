import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, Wrench, ArrowRight, ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockRecipes, categoryLabels, formatChain, type Recipe, type RecipeCategory } from '@/lib/mock-recipes';
import { RecipeIcon } from '@/components/RecipeIcon';

type FilterCategory = 'all' | RecipeCategory;
type SortBy = 'popular' | 'views';

const CATEGORIES: { id: FilterCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'defi', label: 'DeFi' },
  { id: 'payments', label: 'Payments' },
  { id: 'social', label: 'Social' },
  { id: 'enterprise', label: 'Enterprise' },
  { id: 'safety', label: 'Safety' },
  { id: 'infrastructure', label: 'Infrastructure' },
];

const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'popular', label: 'Most Used' },
  { value: 'views', label: 'Most Viewed' },
];

const ITEMS_PER_PAGE = 9;

export default function RecipeMarketplace() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [chainFilter, setChainFilter] = useState('');
  const [category, setCategory] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = mockRecipes;
    if (featuredOnly) list = list.filter(r => r.featured);
    if (category !== 'all') list = list.filter(r => r.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(r =>
        r.title.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.tags.some(t => t.includes(q))
      );
    }
    if (chainFilter.trim()) {
      const c = chainFilter.toLowerCase();
      list = list.filter(r => r.chains.some(ch => ch.toLowerCase().includes(c)));
    }
    list = [...list].sort((a, b) => {
      if (sortBy === 'popular') return b.use_count - a.use_count;
      return b.view_count - a.view_count;
    });
    return list;
  }, [category, search, chainFilter, sortBy, featuredOnly]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#FAFBFC]">

      {/* ══ Hero Section — animated aurora background ══ */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f4fbf7 0%, #eef5f1 30%, #f1f4fb 60%, #f7f3ff 100%)' }}>
        {/* Aurora animation styles — scoped via unique class names */}
        <style>{`
          @keyframes aurora-drift-1 {
            0%   { transform: translate3d(0, 0, 0) scale(1); opacity: 0.7; }
            25%  { transform: translate3d(180px, 120px, 0) scale(1.25); opacity: 0.95; }
            50%  { transform: translate3d(60px, 220px, 0) scale(0.9); opacity: 0.6; }
            75%  { transform: translate3d(-140px, 80px, 0) scale(1.15); opacity: 0.85; }
            100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.7; }
          }
          @keyframes aurora-drift-2 {
            0%   { transform: translate3d(0, 0, 0) scale(1); opacity: 0.55; }
            33%  { transform: translate3d(-220px, 150px, 0) scale(1.3); opacity: 0.9; }
            66%  { transform: translate3d(120px, 260px, 0) scale(0.85); opacity: 0.5; }
            100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.55; }
          }
          @keyframes aurora-drift-3 {
            0%   { transform: translate3d(0, 0, 0) scale(1); opacity: 0.65; }
            30%  { transform: translate3d(180px, -120px, 0) scale(1.2); opacity: 0.95; }
            60%  { transform: translate3d(-100px, -60px, 0) scale(0.95); opacity: 0.55; }
            85%  { transform: translate3d(-180px, 80px, 0) scale(1.1); opacity: 0.8; }
            100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.65; }
          }
          @keyframes aurora-drift-4 {
            0%   { transform: translate3d(0, 0, 0) scale(1); opacity: 0.4; }
            40%  { transform: translate3d(-150px, -100px, 0) scale(1.25); opacity: 0.7; }
            70%  { transform: translate3d(100px, 60px, 0) scale(0.9); opacity: 0.35; }
            100% { transform: translate3d(0, 0, 0) scale(1); opacity: 0.4; }
          }
          .aurora-blob {
            position: absolute;
            border-radius: 9999px;
            filter: blur(80px);
            will-change: transform, opacity;
            pointer-events: none;
            mix-blend-mode: multiply;
          }
          .aurora-blob-1 {
            top: -15%;
            left: -10%;
            width: 780px;
            height: 580px;
            background: radial-gradient(circle, rgba(99, 200, 150, 0.85) 0%, rgba(99, 200, 150, 0) 65%);
            animation: aurora-drift-1 14s ease-in-out infinite;
          }
          .aurora-blob-2 {
            top: 5%;
            right: -15%;
            width: 720px;
            height: 540px;
            background: radial-gradient(circle, rgba(100, 130, 255, 0.8) 0%, rgba(100, 130, 255, 0) 65%);
            animation: aurora-drift-2 18s ease-in-out infinite;
          }
          .aurora-blob-3 {
            bottom: -30%;
            left: 20%;
            width: 660px;
            height: 500px;
            background: radial-gradient(circle, rgba(181, 159, 255, 0.8) 0%, rgba(181, 159, 255, 0) 65%);
            animation: aurora-drift-3 16s ease-in-out infinite;
          }
          .aurora-blob-4 {
            top: 30%;
            left: 35%;
            width: 500px;
            height: 380px;
            background: radial-gradient(circle, rgba(130, 230, 200, 0.6) 0%, rgba(130, 230, 200, 0) 65%);
            animation: aurora-drift-4 20s ease-in-out infinite;
          }
          @media (prefers-reduced-motion: reduce) {
            .aurora-blob-1, .aurora-blob-2, .aurora-blob-3, .aurora-blob-4 { animation: none; }
          }
        `}</style>

        {/* Animated aurora layers */}
        <div className="aurora-blob aurora-blob-1" />
        <div className="aurora-blob aurora-blob-2" />
        <div className="aurora-blob aurora-blob-3" />
        <div className="aurora-blob aurora-blob-4" />

        <div className="max-w-6xl mx-auto px-6 pt-14 pb-8 relative z-10">
          <h1 className="text-4xl md:text-[44px] font-bold text-gray-900 leading-[1.1] tracking-tight max-w-2xl">
            Turn intent into pacts.
          </h1>
          <p className="text-base text-gray-500 max-w-xl leading-relaxed mt-3">
            Curated recipes give your agent the protocol knowledge to act — safely.
          </p>

          {/* ── Search bar ── */}
          <div className="mt-7 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search recipes..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full h-12 pl-12 pr-4 rounded-xl border border-gray-200 bg-white text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all shadow-sm"
            />
          </div>

          {/* ── Category pills ── */}
          <div className="flex flex-wrap gap-2 mt-5">
            {CATEGORIES.map(cat => (
              <button
                key={cat.id}
                onClick={() => { setCategory(cat.id); setPage(1); }}
                className={cn(
                  'px-4 py-2 rounded-full text-sm font-medium transition-all',
                  category === cat.id
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-white/70 text-gray-600 hover:bg-white hover:shadow-sm border border-transparent hover:border-gray-200'
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ══ Results ══ */}
      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* Count + Sort + Featured toggle */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-400">
            {filtered.length} recipe{filtered.length !== 1 ? 's' : ''} found
          </p>
          <div className="flex items-center gap-2">
            {/* Featured toggle */}
            <button
              onClick={() => { setFeaturedOnly(f => !f); setPage(1); }}
              className={cn(
                'flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[13px] font-medium transition-all border',
                featuredOnly
                  ? 'bg-amber-50 text-amber-700 border-amber-300'
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              )}
            >
              <Star className={cn('w-3.5 h-3.5', featuredOnly ? 'text-amber-500 fill-amber-500' : 'text-gray-400')} strokeWidth={1.5} />
              Featured
            </button>
            {/* Divider */}
            <div className="w-px h-4 bg-gray-200" />
            {/* Sort dropdown */}
            <select
              id="recipe-sort"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as SortBy); setPage(1); }}
              className="h-[34px] text-[13px] text-gray-700 bg-white border border-gray-200 rounded-lg px-3 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all hover:border-gray-300 cursor-pointer"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Grid */}
        <AnimatePresence mode="wait">
          {paginated.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-20 text-center border border-dashed border-gray-200 rounded-2xl">
              <p className="text-gray-400 text-base">No recipes matched this filter.</p>
            </motion.div>
          ) : (
            <motion.div
              key={`${category}-${sortBy}-${page}-${search}-${chainFilter}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              {paginated.map((recipe, i) => (
                <RecipeCard key={recipe.id} recipe={recipe} delay={i * 0.04} sortBy={sortBy} onClick={() => navigate(`/recipes/${recipe.slug}`)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-4 mt-10">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              aria-label="Previous page"
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" strokeWidth={2} />
            </button>
            <span className="text-sm tabular-nums text-gray-600">
              <span className="font-semibold text-gray-900">{page}</span>
              <span className="mx-1 text-gray-400">/</span>
              <span>{totalPages}</span>
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              aria-label="Next page"
              className="w-9 h-9 flex items-center justify-center rounded-full text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:text-gray-900 hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        )}
      </div>

      {/* ══ Footer ══ */}
      <footer className="border-t border-gray-100 bg-white mt-10">
        <div className="max-w-6xl mx-auto px-6 py-8 flex items-center justify-between">
          <p className="text-xs text-gray-400">Copyright © 2026 Cobo. All rights reserved.</p>
          <div className="flex items-center gap-4 text-xs text-gray-400">
            <a href="#" className="hover:text-gray-600 transition-colors">Privacy and Cookie Policy</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-600 transition-colors">Security</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Recipe Card ──────────────────────────────────────
function RecipeCard({ recipe, delay, sortBy, onClick }: { recipe: Recipe; delay: number; sortBy: SortBy; onClick: () => void }) {
  // Top-right metric mirrors the active sort, so users see the dimension they're sorting by
  const showUses = sortBy === 'popular';
  const formatNum = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n));
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onClick}
      className="group bg-white border border-gray-150 rounded-2xl p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer relative overflow-hidden"
    >
      {/* Subtle top accent */}
      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/40 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />

      {/* Top row */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <RecipeIcon recipe={recipe} size="md" />
          <div className="min-w-0">
            <h3 className="text-[15px] font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">
              {recipe.title}
              {recipe.featured && (
                <Star className="inline-block w-3.5 h-3.5 text-amber-500 fill-amber-500 ml-1 align-middle relative -top-px" strokeWidth={1.5} title="Featured" />
              )}
            </h3>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                {categoryLabels[recipe.category]}
              </span>
            </div>
          </div>
        </div>
        <div
          className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0"
          title={showUses ? `${recipe.use_count} uses` : `${recipe.view_count.toLocaleString()} views`}
        >
          {showUses ? <Wrench className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showUses ? formatNum(recipe.use_count) : formatNum(recipe.view_count)}
        </div>
      </div>

      {/* Description */}
      <p className="text-[13px] text-gray-500 line-clamp-2 leading-relaxed mb-4">{recipe.description}</p>

      {/* Chain pills */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {recipe.chains.map(chain => (
          <span key={chain} className="text-[10px] font-medium px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-100">
            {formatChain(chain)}
          </span>
        ))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-indigo-100 flex items-center justify-center text-[9px] font-bold text-indigo-600">
            {recipe.author_name[0]}
          </div>
          <span className="text-[11px] text-gray-400">@{recipe.author_name}</span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-indigo-600 font-medium opacity-0 group-hover:opacity-100 transition-opacity">
          View <ArrowRight className="w-3 h-3" />
        </div>
      </div>
    </motion.div>
  );
}
