import { cn } from '@/lib/utils';
import { type Recipe } from '@/lib/mock-recipes';

// ─── Brand-specific icons (official project logos) ─────────────
// For recipes tied to a well-known protocol, render a branded tile
// instead of the generic emoji — boosts recognition and credibility.

type BrandSpec = {
  /** Tile background — usually the brand's primary color */
  tileClass: string;
  /** Inline SVG glyph rendered in white on the tile */
  Glyph: React.FC<{ className?: string }>;
};

const UniswapGlyph: React.FC<{ className?: string }> = ({ className }) => (
  // Simplified Uniswap "U" wordmark — recognizable + clean on small sizes
  <svg viewBox="0 0 24 24" className={className} fill="white" aria-hidden="true">
    <path d="M6 5.5v7.8c0 3.2 2.7 5.7 6 5.7s6-2.5 6-5.7V5.5h-3.4v7.8c0 1.5-1.1 2.6-2.6 2.6s-2.6-1.1-2.6-2.6V5.5H6z" />
  </svg>
);

const BRANDS: Record<string, BrandSpec> = {
  'uniswap-v3-swap': {
    tileClass: 'bg-gradient-to-br from-[#FF007A] to-[#FF4DA6] border-[#FF007A]/20',
    Glyph: UniswapGlyph,
  },
};

// ─── Sizing ───────────────────────────────────────────────────

type Size = 'sm' | 'md' | 'lg';

const SIZE_TILE: Record<Size, string> = {
  sm: 'w-8 h-8 rounded-lg',
  md: 'w-10 h-10 rounded-xl',
  lg: 'w-14 h-14 rounded-2xl',
};
const SIZE_GLYPH: Record<Size, string> = {
  sm: 'w-4 h-4',
  md: 'w-5 h-5',
  lg: 'w-8 h-8',
};
const SIZE_EMOJI: Record<Size, string> = {
  sm: 'text-base',
  md: 'text-xl',
  lg: 'text-3xl',
};

// ─── Component ────────────────────────────────────────────────

export function RecipeIcon({
  recipe,
  size = 'md',
}: {
  recipe: Pick<Recipe, 'slug' | 'icon'>;
  size?: Size;
}) {
  const brand = BRANDS[recipe.slug];

  if (brand) {
    const { tileClass, Glyph } = brand;
    return (
      <div
        className={cn(
          SIZE_TILE[size],
          'flex items-center justify-center border shrink-0',
          tileClass
        )}
      >
        <Glyph className={SIZE_GLYPH[size]} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        SIZE_TILE[size],
        'bg-gray-50 border border-gray-100 flex items-center justify-center shrink-0',
        SIZE_EMOJI[size]
      )}
    >
      {recipe.icon}
    </div>
  );
}
