// Crypto icon utilities using cryptocurrency-icons CDN
// Source: https://github.com/spothq/cryptocurrency-icons

const CRYPTO_ICONS_CDN = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/svg/color';
const CRYPTO_ICONS_CDN_128 = 'https://cdn.jsdelivr.net/npm/cryptocurrency-icons@0.18.1/128/color';

// Map of symbol to icon filename (lowercase)
const SYMBOL_MAP: Record<string, string> = {
  // Coins
  'ETH': 'eth',
  'BTC': 'btc',
  'USDT': 'usdt',
  'USDC': 'usdc',
  'BNB': 'bnb',
  'TRX': 'trx',
  'SOL': 'sol',
  'MATIC': 'matic',
  'DOGE': 'doge',
  'ADA': 'ada',
  'DOT': 'dot',
  'AVAX': 'avax',
  'LINK': 'link',
  'UNI': 'uni',
  'ATOM': 'atom',
  'XRP': 'xrp',
  'LTC': 'ltc',
  'DAI': 'dai',
  'SHIB': 'shib',
  'ARB': 'arb',
  'OP': 'op',
};

// Chain icons - using native token icons or specific chain icons
// CDN uses lowercase symbol names for icons
const CHAIN_ICON_MAP: Record<string, string> = {
  'ethereum': 'eth',
  'eth': 'eth',
  'tron': 'trx',
  'trx': 'trx',
  'bsc': 'bnb',
  'bnb': 'bnb',
  'polygon': 'matic',
  'arbitrum': 'arb',
  'optimism': 'op',
  'avalanche': 'avax',
  'solana': 'sol',
  'bitcoin': 'btc',
  'btc': 'btc',
};

/**
 * Get SVG icon URL for a cryptocurrency symbol
 */
export function getCryptoIconUrl(symbol: string): string {
  const iconName = SYMBOL_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
  return `${CRYPTO_ICONS_CDN}/${iconName}.svg`;
}

/**
 * Get PNG icon URL for a cryptocurrency symbol (128x128)
 */
export function getCryptoIconPngUrl(symbol: string): string {
  const iconName = SYMBOL_MAP[symbol.toUpperCase()] || symbol.toLowerCase();
  return `${CRYPTO_ICONS_CDN_128}/${iconName}.png`;
}

/**
 * Get icon URL for a blockchain network
 */
export function getChainIconUrl(chainId: string): string {
  const iconName = CHAIN_ICON_MAP[chainId] || chainId;
  return `${CRYPTO_ICONS_CDN}/${iconName}.svg`;
}

/**
 * Fallback icon component for when icon fails to load
 */
export function getIconFallback(symbol: string): string {
  return symbol.slice(0, 2).toUpperCase();
}
