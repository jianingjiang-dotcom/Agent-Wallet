import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Eye, CheckCircle2, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { mockRecipes, categoryLabels, formatChain, type Recipe, type RecipeCategory } from '@/lib/mock-recipes';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type FilterCategory = 'all' | RecipeCategory;
type SortBy = 'popular' | 'newest' | 'views';

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
  { value: 'newest', label: 'Newest' },
];

const ITEMS_PER_PAGE = 9;

export default function RecipeMarketplace() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [chainFilter, setChainFilter] = useState('');
  const [category, setCategory] = useState<FilterCategory>('all');
  const [sortBy, setSortBy] = useState<SortBy>('popular');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let list = mockRecipes;
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
      if (sortBy === 'views') return b.view_count - a.view_count;
      // newest: rely on mock array order (first inserted = newest)
      return mockRecipes.indexOf(a) - mockRecipes.indexOf(b);
    });
    return list;
  }, [category, search, chainFilter, sortBy]);

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  return (
    <div className="min-h-screen bg-[#FAFBFC]">

      {/* ══ Hero Section ══ */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f0faf4 0%, #e8f4f0 30%, #eef2fb 60%, #f5f0ff 100%)' }}>
        {/* Decorative blobs */}
        <div className="absolute top-0 right-0 w-[500px] h-[400px] opacity-30" style={{ background: 'radial-gradient(circle at 70% 30%, rgba(99, 200, 150, 0.3) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 left-1/3 w-[400px] h-[300px] opacity-20" style={{ background: 'radial-gradient(circle, rgba(100, 130, 255, 0.2) 0%, transparent 60%)' }} />

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

        {/* Count + Sort */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-gray-400">
            {filtered.length} recipe{filtered.length !== 1 ? 's' : ''} found
          </p>
          <div className="flex items-center gap-2">
            <label htmlFor="recipe-sort" className="text-sm text-gray-400">Sort by</label>
            <select
              id="recipe-sort"
              value={sortBy}
              onChange={(e) => { setSortBy(e.target.value as SortBy); setPage(1); }}
              className="text-sm text-gray-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-400 transition-all hover:border-gray-300 cursor-pointer"
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
                <RecipeCard key={recipe.id} recipe={recipe} delay={i * 0.04} onClick={() => navigate(`/recipes/${recipe.slug}`)} />
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pagination */}
        {totalPages > 0 && (
          <div className="flex items-center justify-between mt-10 p-4 border border-gray-100 rounded-xl bg-white">
            <p className="text-sm text-gray-500">Page {page} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 disabled:opacity-30 hover:bg-gray-50 transition-colors"
              >
                Next
              </button>
            </div>
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
function RecipeCard({ recipe, delay, onClick }: { recipe: Recipe; delay: number; onClick: () => void }) {
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
          <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-xl border border-gray-100">
            {recipe.icon}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h3 className="text-[15px] font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors leading-snug">{recipe.title}</h3>
              {recipe.verified && (
                <TooltipProvider>
                  <Tooltip delayDuration={150}>
                    <TooltipTrigger asChild>
                      <span
                        onClick={(e) => e.stopPropagation()}
                        className="inline-flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-help shrink-0"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" strokeWidth={2.5} />
                        Verified
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-[220px]">
                      <p className="text-xs leading-relaxed">Reviewed and audited by Cobo.</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600">
                {categoryLabels[recipe.category]}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-gray-400 shrink-0">
          <Eye className="w-3.5 h-3.5" />
          {recipe.view_count >= 1000 ? `${(recipe.view_count / 1000).toFixed(1)}k` : recipe.view_count}
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
