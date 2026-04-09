export type StrategyCategory = 'defi_yield' | 'dca' | 'risk' | 'arbitrage' | 'nft' | 'cross_chain';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface StrategyTemplate {
  id: string;
  title: string;
  desc: string;
  symbol: string;
  prompt: string;
  category: StrategyCategory;
  tags: string[];
  chains: string[];
  risk: RiskLevel;
  popularity: number;
  estimatedApy?: string;
  featured?: boolean;
  longDesc?: string;
  suggestedControls?: { label: string; value: string }[];
}

export const categoryLabels: Record<StrategyCategory, string> = {
  defi_yield: 'DeFi 收益',
  dca: '定投策略',
  risk: '风控监控',
  arbitrage: '套利交易',
  nft: 'NFT',
  cross_chain: '跨链',
};

export const riskLabels: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low: { label: '低风险', color: 'text-emerald-700', bg: 'bg-emerald-50' },
  medium: { label: '中风险', color: 'text-amber-700', bg: 'bg-amber-50' },
  high: { label: '高风险', color: 'text-red-700', bg: 'bg-red-50' },
};

export const featuredGradients: Record<StrategyCategory, string> = {
  defi_yield: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
  dca: 'linear-gradient(135deg, #0ea5e9 0%, #6366f1 100%)',
  risk: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 100%)',
  arbitrage: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
  nft: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)',
  cross_chain: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
};

export const mockStrategies: StrategyTemplate[] = [
  // ── DeFi 收益 ──
  {
    id: 'strat-usdc-yield',
    title: 'USDC 收益优化',
    desc: '闲置稳定币自动寻找最优收益',
    symbol: 'USDC',
    prompt: '帮我把闲置的USDC存到收益最高的协议里，每天自动复投。',
    category: 'defi_yield',
    tags: ['被动收入', '稳定币'],
    chains: ['Base', 'Ethereum'],
    risk: 'low',
    popularity: 1243,
    estimatedApy: '~8.5%',
    featured: true,
    longDesc: '自动扫描 Base 和 Ethereum 上的主流借贷协议（Aave、Compound、Morpho 等），将 USDC 存入当前 APY 最高的池子。每日自动领取收益并复投，实现复利效果。当某个协议收益率下降时，自动迁移到更优的协议。',
    suggestedControls: [
      { label: '单笔上限', value: '$5,000' },
      { label: '24h 上限', value: '$10,000' },
      { label: '链限制', value: 'Base, Ethereum' },
    ],
  },
  {
    id: 'strat-usdt-lending',
    title: 'USDT 借贷生息',
    desc: '将 USDT 存入借贷协议赚取利息',
    symbol: 'USDT',
    prompt: '帮我把USDT存到Aave V3上赚利息，选择APY最高的链。',
    category: 'defi_yield',
    tags: ['被动收入', '稳定币'],
    chains: ['Arbitrum', 'Optimism', 'Ethereum'],
    risk: 'low',
    popularity: 876,
    estimatedApy: '~6.2%',
    longDesc: '在多条 EVM 链上比较 Aave V3 的 USDT 存款利率，自动选择最优链存入。支持自动复投和链间迁移。',
    suggestedControls: [
      { label: '单笔上限', value: '$10,000' },
      { label: '24h 上限', value: '$20,000' },
    ],
  },
  {
    id: 'strat-dai-savings',
    title: 'DAI 储蓄利率',
    desc: '利用 MakerDAO DSR 赚取稳定收益',
    symbol: 'DAI',
    prompt: '帮我把DAI存入MakerDAO的DSR储蓄利率合约，自动复投收益。',
    category: 'defi_yield',
    tags: ['被动收入', '稳定币', 'MakerDAO'],
    chains: ['Ethereum'],
    risk: 'low',
    popularity: 534,
    estimatedApy: '~5.0%',
    longDesc: '将 DAI 存入 MakerDAO 的 DSR（DAI Savings Rate）合约，享受协议原生的储蓄利率。利率由 MakerDAO 治理决定，历史上相对稳定。',
    suggestedControls: [
      { label: '单笔上限', value: '$20,000' },
      { label: '链限制', value: '仅 Ethereum' },
    ],
  },
  {
    id: 'strat-lp-farming',
    title: 'LP 流动性挖矿',
    desc: '向 DEX 提供流动性赚取交易手续费',
    symbol: 'UNI',
    prompt: '帮我在Uniswap V3上为ETH/USDC交易对提供流动性，价格区间设置为当前价格上下10%，每天检查并调整。',
    category: 'defi_yield',
    tags: ['流动性', '高收益'],
    chains: ['Ethereum', 'Arbitrum'],
    risk: 'medium',
    popularity: 421,
    estimatedApy: '~15-25%',
    longDesc: '在 Uniswap V3 上为指定交易对提供集中流动性。Agent 会根据价格变动自动调整区间，最大化手续费收入。注意：存在无常损失风险。',
    suggestedControls: [
      { label: '单笔上限', value: '$5,000' },
      { label: '24h 上限', value: '$10,000' },
      { label: '滑点容忍', value: '1%' },
    ],
  },

  // ── 定投策略 ──
  {
    id: 'strat-eth-dca',
    title: 'ETH 定投策略',
    desc: '每周自动定投 ETH，长期积累',
    symbol: 'ETH',
    prompt: '帮我设置一个ETH定投计划，每周一买入500美金的ETH，用Uniswap执行，持续3个月。',
    category: 'dca',
    tags: ['长期持有', '定投'],
    chains: ['Ethereum'],
    risk: 'low',
    popularity: 2156,
    featured: true,
    longDesc: '经典的 Dollar-Cost Averaging 策略。每周一固定时间通过 Uniswap V3 自动买入 $500 的 ETH，平滑入场成本。适合长期看好 ETH 但不想择时的用户。',
    suggestedControls: [
      { label: '单笔上限', value: '$500' },
      { label: '周滚动上限', value: '$500' },
      { label: '滑点容忍', value: '0.5%' },
    ],
  },
  {
    id: 'strat-btc-dca',
    title: 'BTC 定投策略',
    desc: '每日自动定投 BTC，积少成多',
    symbol: 'BTC',
    prompt: '帮我每天自动买入100美金的BTC，用1inch聚合器找最优价格。',
    category: 'dca',
    tags: ['长期持有', '定投'],
    chains: ['Ethereum'],
    risk: 'low',
    popularity: 1832,
    longDesc: '每日自动通过 1inch 聚合器购买 $100 的 WBTC，自动寻找最优兑换路径。适合长期定投 BTC 的用户。',
    suggestedControls: [
      { label: '单笔上限', value: '$100' },
      { label: '24h 上限', value: '$100' },
    ],
  },
  {
    id: 'strat-sol-dca',
    title: 'SOL 定投策略',
    desc: '每周定投 SOL，布局 Solana 生态',
    symbol: 'SOL',
    prompt: '帮我每周三用Jupiter在Solana上买入200美金的SOL。',
    category: 'dca',
    tags: ['长期持有', 'Solana'],
    chains: ['Solana'],
    risk: 'medium',
    popularity: 987,
    longDesc: '通过 Jupiter 聚合器在 Solana 链上定投 SOL。每周三自动执行，适合看好 Solana 生态的用户。',
    suggestedControls: [
      { label: '单笔上限', value: '$200' },
      { label: '周滚动上限', value: '$200' },
    ],
  },

  // ── 风控监控 ──
  {
    id: 'strat-aave-health',
    title: 'Aave V3 借贷风控',
    desc: '监控清算风险，自动补充抵押品',
    symbol: 'AAVE',
    prompt: '监控我的Aave V3借贷仓位，如果健康因子低于1.5就自动补充ETH抵押品，保持安全。',
    category: 'risk',
    tags: ['借贷安全', '自动保护'],
    chains: ['Arbitrum', 'Ethereum'],
    risk: 'low',
    popularity: 654,
    featured: true,
    longDesc: '7×24 监控你的 Aave V3 借贷仓位健康因子。当 HF 降至 1.5 以下时，自动从钱包补充 ETH 抵押品，避免清算。支持 Arbitrum 和 Ethereum 上的仓位。',
    suggestedControls: [
      { label: '单笔上限', value: '$2,000' },
      { label: '24h 上限', value: '$5,000' },
      { label: '每日最大补仓', value: '3 次' },
    ],
  },
  {
    id: 'strat-liquidation-guard',
    title: '清算保护卫士',
    desc: '多协议清算风险统一监控',
    symbol: 'ETH',
    prompt: '监控我在所有借贷协议上的仓位，如果任何一个接近清算就立即补充抵押品或部分还款。',
    category: 'risk',
    tags: ['借贷安全', '多协议'],
    chains: ['Ethereum', 'Arbitrum', 'Base'],
    risk: 'low',
    popularity: 398,
    longDesc: '统一监控你在 Aave、Compound、Morpho 等多个借贷协议上的仓位。当任何仓位接近清算阈值时，自动执行保护操作（补充抵押品或部分还款）。',
    suggestedControls: [
      { label: '单笔上限', value: '$5,000' },
      { label: '24h 上限', value: '$10,000' },
    ],
  },

  // ── 套利交易 ──
  {
    id: 'strat-dex-arb',
    title: 'DEX 价差套利',
    desc: '跨 DEX 自动发现价差并执行套利',
    symbol: 'ETH',
    prompt: '帮我在Ethereum上监控Uniswap和Sushiswap之间的ETH/USDC价差，发现超过0.3%的机会就自动套利。',
    category: 'arbitrage',
    tags: ['套利', '高频'],
    chains: ['Ethereum'],
    risk: 'high',
    popularity: 312,
    longDesc: '持续监控 Uniswap V3 和 SushiSwap V3 之间的 ETH/USDC 价差。当价差超过 0.3%（覆盖 Gas 后仍有利可图）时自动执行套利交易。',
    suggestedControls: [
      { label: '单笔上限', value: '$10,000' },
      { label: '24h 上限', value: '$50,000' },
      { label: '最小利润率', value: '0.3%' },
    ],
  },
  {
    id: 'strat-cross-arb',
    title: '跨链套利',
    desc: '利用不同链之间的价差进行套利',
    symbol: 'USDC',
    prompt: '帮我在Arbitrum和Optimism之间找USDC/USDT的套利机会并自动执行。',
    category: 'arbitrage',
    tags: ['跨链', '套利'],
    chains: ['Arbitrum', 'Optimism'],
    risk: 'high',
    popularity: 187,
    longDesc: '监控 Arbitrum 和 Optimism 上稳定币（USDC/USDT）的价格差异，通过 Stargate 跨链桥执行套利。需要在两条链上都有资金。',
    suggestedControls: [
      { label: '单笔上限', value: '$10,000' },
      { label: '24h 上限', value: '$50,000' },
    ],
  },

  // ── NFT ──
  {
    id: 'strat-nft-listing',
    title: 'NFT 自动挂单',
    desc: 'Agent 代理 OpenSea 上架和报价',
    symbol: 'ETH',
    prompt: '帮我在OpenSea上管理我的NFT，自动签署上架和报价消息，不要做任何转账。',
    category: 'nft',
    tags: ['NFT', 'OpenSea'],
    chains: ['Ethereum'],
    risk: 'low',
    popularity: 256,
    longDesc: '授权 Agent 在 OpenSea 上代理签署 EIP-712 消息，包括创建挂单、接受报价等操作。不涉及直接资金转移，仅限消息签名和 Seaport 合约调用。',
    suggestedControls: [
      { label: '1h 签名上限', value: '10 次' },
      { label: '域名限制', value: 'opensea.io' },
    ],
  },

  // ── 跨链 ──
  {
    id: 'strat-multi-chain-balance',
    title: '多链资产平衡',
    desc: '自动在多条链之间平衡资产分配',
    symbol: 'ETH',
    prompt: '帮我保持Ethereum、Arbitrum和Base三条链上的USDC余额大致相等，当某条链余额低于1000美金时从其他链转过来。',
    category: 'cross_chain',
    tags: ['跨链', '资产管理'],
    chains: ['Ethereum', 'Arbitrum', 'Base'],
    risk: 'medium',
    popularity: 345,
    longDesc: '监控你在多条 EVM 链上的 USDC 余额，当某条链余额低于阈值时，自动通过跨链桥从余额充足的链转移资产，保持多链资金平衡。',
    suggestedControls: [
      { label: '单笔上限', value: '$5,000' },
      { label: '24h 上限', value: '$10,000' },
      { label: '最低余额阈值', value: '$1,000' },
    ],
  },
  {
    id: 'strat-bridge-optimizer',
    title: '跨链桥优化',
    desc: '自动选择最优跨链路径转移资产',
    symbol: 'USDC',
    prompt: '当我需要跨链转USDC时，帮我自动比较Stargate、Across和Hop的费率，选最便宜的执行。',
    category: 'cross_chain',
    tags: ['跨链', '省Gas'],
    chains: ['Ethereum', 'Arbitrum', 'Optimism', 'Base'],
    risk: 'low',
    popularity: 432,
    longDesc: '智能比较多个跨链桥（Stargate、Across、Hop Protocol）的费率和速度，为每次跨链转账自动选择最优路径。帮你节省桥接费用。',
    suggestedControls: [
      { label: '单笔上限', value: '$10,000' },
      { label: '24h 上限', value: '$30,000' },
    ],
  },
];
