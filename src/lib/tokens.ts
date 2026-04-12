import { ChainId } from '@/types/wallet';

// Available tokens that can be added to wallet
export interface TokenInfo {
  symbol: string;
  name: string;
  networks: ChainId[];
  price: number; // USD price per token
  change24h: number;
  category: 'stablecoin' | 'layer1' | 'layer2' | 'defi' | 'meme' | 'other';
}

// Comprehensive list of popular tokens
export const AVAILABLE_TOKENS: TokenInfo[] = [
// Stablecoins
  { symbol: 'USDT', name: 'Tether USD', networks: ['ethereum', 'tron', 'bsc', 'solana'], price: 1.00, change24h: 0.01, category: 'stablecoin' },
  { symbol: 'USDC', name: 'USD Coin', networks: ['ethereum', 'bsc', 'solana'], price: 1.00, change24h: 0.00, category: 'stablecoin' },
  { symbol: 'DAI', name: 'Dai Stablecoin', networks: ['ethereum'], price: 1.00, change24h: 0.02, category: 'stablecoin' },
  
  // Layer 1
  { symbol: 'BTC', name: 'Bitcoin', networks: ['ethereum'], price: 97500.00, change24h: 1.85, category: 'layer1' },
  { symbol: 'ETH', name: 'Ethereum', networks: ['ethereum'], price: 3500.00, change24h: 2.34, category: 'layer1' },
  { symbol: 'BNB', name: 'BNB', networks: ['bsc'], price: 600.00, change24h: 1.5, category: 'layer1' },
  { symbol: 'SOL', name: 'Solana', networks: ['solana'], price: 185.00, change24h: 3.2, category: 'layer1' },
  { symbol: 'TRX', name: 'Tron', networks: ['tron'], price: 0.11, change24h: -1.2, category: 'layer1' },
  { symbol: 'ADA', name: 'Cardano', networks: ['ethereum'], price: 0.95, change24h: 2.1, category: 'layer1' },
  { symbol: 'AVAX', name: 'Avalanche', networks: ['ethereum'], price: 42.50, change24h: 4.2, category: 'layer1' },
  { symbol: 'DOT', name: 'Polkadot', networks: ['ethereum'], price: 7.80, change24h: 1.8, category: 'layer1' },
  { symbol: 'ATOM', name: 'Cosmos', networks: ['ethereum'], price: 9.20, change24h: 2.5, category: 'layer1' },
  { symbol: 'XRP', name: 'Ripple', networks: ['ethereum'], price: 2.35, change24h: -0.8, category: 'layer1' },
  { symbol: 'LTC', name: 'Litecoin', networks: ['ethereum'], price: 105.00, change24h: 1.2, category: 'layer1' },
  
  // Layer 2
  { symbol: 'MATIC', name: 'Polygon', networks: ['ethereum'], price: 0.52, change24h: 2.8, category: 'layer2' },
  { symbol: 'ARB', name: 'Arbitrum', networks: ['ethereum'], price: 1.15, change24h: 3.5, category: 'layer2' },
  { symbol: 'OP', name: 'Optimism', networks: ['ethereum'], price: 2.10, change24h: 2.9, category: 'layer2' },
  
  // DeFi
  { symbol: 'LINK', name: 'Chainlink', networks: ['ethereum', 'bsc'], price: 18.50, change24h: 1.9, category: 'defi' },
  { symbol: 'UNI', name: 'Uniswap', networks: ['ethereum'], price: 12.80, change24h: 2.2, category: 'defi' },
  { symbol: 'AAVE', name: 'Aave', networks: ['ethereum'], price: 285.00, change24h: 3.1, category: 'defi' },
  { symbol: 'CRV', name: 'Curve DAO', networks: ['ethereum'], price: 0.85, change24h: 1.4, category: 'defi' },
  { symbol: 'MKR', name: 'Maker', networks: ['ethereum'], price: 1650.00, change24h: 2.0, category: 'defi' },
  
  // Meme
  { symbol: 'DOGE', name: 'Dogecoin', networks: ['ethereum', 'bsc'], price: 0.38, change24h: 5.2, category: 'meme' },
  { symbol: 'SHIB', name: 'Shiba Inu', networks: ['ethereum'], price: 0.000024, change24h: 4.1, category: 'meme' },
  { symbol: 'PEPE', name: 'Pepe', networks: ['ethereum'], price: 0.000021, change24h: 8.5, category: 'meme' },
];

// Search tokens by symbol or name
export function searchTokens(query: string): TokenInfo[] {
  if (!query.trim()) return AVAILABLE_TOKENS;
  
  const lowerQuery = query.toLowerCase();
  return AVAILABLE_TOKENS.filter(token => 
    token.symbol.toLowerCase().includes(lowerQuery) ||
    token.name.toLowerCase().includes(lowerQuery)
  );
}

// Get token by symbol
export function getTokenBySymbol(symbol: string): TokenInfo | undefined {
  return AVAILABLE_TOKENS.find(t => t.symbol.toUpperCase() === symbol.toUpperCase());
}

// Category labels
export const CATEGORY_LABELS: Record<string, string> = {
  'stablecoin': '稳定币',
  'layer1': '公链',
  'layer2': 'Layer 2',
  'defi': 'DeFi',
  'meme': 'Meme',
  'other': '其他',
};
