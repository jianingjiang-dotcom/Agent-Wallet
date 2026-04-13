// Recipe Marketplace data model — aligned with backend DB schema

export type RecipeCategory = 'defi' | 'payments' | 'social' | 'enterprise' | 'safety' | 'infrastructure';

export interface Recipe {
  id: string;
  slug: string;
  title: string;
  description: string;
  icon: string;
  category: RecipeCategory;
  tags: string[];
  chains: string[];
  author_name: string;
  featured: boolean;
  verified: boolean;
  view_count: number;
  use_count: number;
  content_markdown: string;
  example_prompts: string[];
}

export const categoryLabels: Record<RecipeCategory, string> = {
  defi: 'DeFi',
  payments: 'Payments',
  social: 'Social',
  enterprise: 'Enterprise',
  safety: 'Safety',
  infrastructure: 'Infrastructure',
};

const CHAIN_LABELS: Record<string, string> = {
  ETH: 'Ethereum',
  BASE_ETH: 'Base',
  ARB_ETH: 'Arbitrum',
  OP_ETH: 'Optimism',
  POLY: 'Polygon',
  POLY_ETH: 'Polygon',
  SOL: 'Solana',
  AVAX: 'Avalanche',
  BSC: 'BSC',
  TRON: 'Tron',
};

export function formatChain(chain: string): string {
  return CHAIN_LABELS[chain] ?? chain;
}

export const mockRecipes: Recipe[] = [
  {
    id: 'r-aave-v3-lending',
    slug: 'aave-v3-lending',
    title: 'Aave V3 Lending',
    description: 'Deposit collateral into Aave V3 and borrow target assets with automatic health factor calculation and liquidation threshold monitoring. Suitable for leveraged position building or liquidity mining use cases.',
    icon: '🏦',
    category: 'defi',
    tags: ['defi', 'lending', 'aave'],
    chains: ['BASE_ETH', 'ETH'],
    author_name: 'Cobo',
    featured: true,
    verified: true,
    view_count: 1234,
    use_count: 56,
    content_markdown: `## Overview

Deposit collateral into Aave V3 and borrow target assets with automatic health factor calculation and liquidation threshold monitoring. Suitable for leveraged position building or liquidity mining use cases.

## Fact

- aave_v3_pool (BASE_ETH): \`0xA238Dd80C259a72e81d7e4664a9801593F98d1c5\`
- aave_v3_pool (ETH): \`0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2\`
- supported assets (BASE_ETH): USDC, USDbC, WETH, cbETH, wstETH
- supported assets (ETH): USDC, WETH, WBTC, DAI, LINK, cbETH, wstETH
- target_in: aave_v3_pool + token contract
- approve target: token (not pool)
- interest: variable rate; accrues as aTokens automatically
- **coverage**: partial reference; use web search for unlisted tokens, contracts, parameters, or up-to-date addresses

## Typical Flow

**Supply — 2 tx:**
1. \`approve(pool, amount)\` on token contract
2. \`supply(token, amount, onBehalfOf, 0)\` on Pool

**Withdraw — 1 tx:**
1. \`withdraw(token, amount, to)\` on Pool

Interest accrues as aTokens automatically; no claim step needed.

## Safety & Risks

- **Approve must confirm before supply**: Supply reverts if approve is unconfirmed.
- **Variable rates**: APY changes with pool utilization; never assume fixed rate.
- **Utilization risk**: Near 100% utilization may temporarily block withdrawals.
- **Policy denial**: Parse reason (per-tx limit vs daily cap); retry with compliant params.
- **Daily cap**: Reduce amounts proactively before hitting the cap.`,
    example_prompts: [
      'Supply 1000 USDC to Aave V3 on Base',
      'Lend my WETH on Aave to earn interest',
      'Withdraw all my USDC from Aave V3 on Ethereum',
    ],
  },
  {
    id: 'r-compound-v3-lending',
    slug: 'compound-v3-lending',
    title: 'Compound V3 Lending',
    description: 'Supply USDC into Compound V3 Comet markets to earn variable interest natively, or deposit collateral assets to borrow against. Single base asset model with automatic interest accrual and configurable liquidation thresholds.',
    icon: '💰',
    category: 'defi',
    tags: ['defi', 'lending', 'compound'],
    chains: ['BASE_ETH', 'ETH'],
    author_name: 'Cobo',
    featured: false,
    verified: true,
    view_count: 876,
    use_count: 42,
    content_markdown: `## Overview

Supply USDC into Compound V3 Comet markets to earn variable interest natively, or deposit collateral assets to borrow against. Single base asset model with automatic interest accrual and configurable liquidation thresholds.

## Fact

- comet_usdc (BASE_ETH): \`0xb125E6687d4313864e53df431d5425969c15Eb2F\`
- comet_usdc (ETH): \`0xc3d688B66703497DAA19211EEdff47f25384cdc3\`
- base asset: USDC only (earns interest; collateral does not)
- target_in: comet_usdc + USDC contract
- approve target: USDC (not comet)
- **coverage**: partial reference; use web search for unlisted tokens, contracts, parameters, or up-to-date addresses

## Typical Flow

**Supply — 2 tx:**
1. \`approve(comet, amount)\` on USDC contract
2. \`supply(token, amount)\` on Comet

**Withdraw — 1 tx:**
1. \`withdraw(token, amount)\` on Comet

Interest accrues natively on USDC balance in Comet; no aToken or claim step.

## Safety & Risks

- **Approve must confirm before supply**: Supply reverts if approve is unconfirmed.
- **Single base asset**: Only USDC earns interest; collateral does not.
- **Liquidation risk**: Borrowed positions liquidate when collateral drops below threshold. Supply-only (no borrow) = no liquidation risk.
- **Variable rates**: APY changes continuously; do not assume fixed rate.
- **Policy denial**: Parse reason (per-tx limit vs daily cap); retry with compliant params.`,
    example_prompts: [
      'Supply 5000 USDC to Compound V3 on Base',
      'Lend my USDC on Compound to earn interest',
      'Withdraw all my USDC from Compound V3',
    ],
  },
  {
    id: 'r-uniswap-v3-swap',
    slug: 'uniswap-v3-swap',
    title: 'Uniswap V3 Swap',
    description: 'Execute single-hop or multi-hop token swaps through Uniswap V3 concentrated liquidity pools. Supports exact-input and exact-output modes, auto-selects optimal tick ranges, and enables large trades with minimal slippage across EVM-compatible chains.',
    icon: '🦄',
    category: 'defi',
    tags: ['defi', 'swap', 'uniswap', 'trading'],
    chains: ['BASE_ETH', 'ETH'],
    author_name: 'Cobo',
    featured: true,
    verified: true,
    view_count: 2156,
    use_count: 189,
    content_markdown: `## Overview

Execute single-hop or multi-hop token swaps through Uniswap V3 concentrated liquidity pools. Supports exact-input and exact-output modes, auto-selects optimal tick ranges, and enables large trades with minimal slippage across EVM-compatible chains.

## Fact

- swap_router_02 (BASE_ETH): \`0x2626664c2603336E57B271c5C0b26F421741e481\`
- swap_router_02 (ETH): \`0x68b3465833fb72A70ecDF485E0e4C7bD8665Fc45\`
- fee tiers: 100 (0.01%) / 500 (0.05%) / 3000 (0.3%) / 10000 (1%)
- target_in: swap_router_02 + input token contract
- approve target: token (not router)
- gas: BASE_ETH <$0.01 | ETH $5–20+
- **coverage**: partial reference; use web search for unlisted tokens, contracts, parameters, or up-to-date addresses

## Typical Flow

**Single-hop — 2 tx:**
1. \`approve(router, amount)\` on input token
2. \`exactInputSingle({tokenIn, tokenOut, fee, recipient, amountIn, amountOutMinimum, sqrtPriceLimitX96: 0})\` on SwapRouter02

**Multi-hop — 2 tx:**
1. \`approve(router, amount)\` on input token
2. \`exactInput({path: encodePacked(tokenA, fee, tokenB, fee, tokenC), recipient, amountIn, amountOutMinimum})\` on SwapRouter02

Set \`amountOutMinimum\` ≥0.5% (stables), ≥1–2% (volatile). Query pool to confirm fee tier before committing.

## Safety & Risks

- **Approve must confirm before swap**: Unconfirmed approve causes swap revert.
- **Slippage is agent's responsibility**: Policy validates address + USD value only; set \`amountOutMinimum\` correctly.
- **Large swap price impact**: Split large amounts into smaller transactions.
- **Gas cost on ETH**: $5–20+ per swap; avoid small swaps where gas exceeds value.
- **Policy denial**: Parse reason (per-tx or cumulative cap exceeded); retry with compliant amount.`,
    example_prompts: [
      'Swap 500 USDC to ETH on Uniswap',
      'Buy $1000 of ETH using USDC on Base via Uniswap V3',
      'Set up a weekly DCA: buy $200 ETH every Monday using Uniswap',
    ],
  },
  {
    id: 'r-dca-strategy',
    slug: 'dca-strategy',
    title: 'Dollar-Cost Averaging (DCA)',
    description: 'Automated periodic token purchases. Schedule regular buys to smooth out price volatility over time.',
    icon: '📈',
    category: 'defi',
    tags: ['defi', 'dca', 'investment', 'transfer'],
    chains: ['ETH', 'BASE_ETH', 'SOL'],
    author_name: 'Cobo',
    featured: true,
    verified: true,
    view_count: 1832,
    use_count: 134,
    content_markdown: `## Overview

Combines transfer + contract_call to execute periodic token purchases. Agent schedules buys at regular intervals using DEX aggregators or direct swaps.

## Fact

- Supported DEXes: Uniswap V3, Jupiter (Solana), 1inch
- Typical intervals: daily, weekly, bi-weekly
- Requires sufficient stablecoin balance for each period

## Typical Flow

**Weekly DCA — per execution:**
1. Check stablecoin balance ≥ target amount
2. \`approve(router, amount)\` on USDC/USDT
3. \`exactInputSingle(params)\` on DEX router
4. Log execution for tracking

## Safety & Risks

- Ensure sufficient balance before each execution
- Slippage protection per swap
- Consider gas costs relative to DCA amount
- Market conditions don't affect schedule (by design)`,
    example_prompts: [
      'Set up a weekly ETH DCA plan — buy $500 every Monday using Uniswap',
      'DCA into SOL: buy $100 daily using Jupiter on Solana',
      'Create a bi-weekly BTC accumulation plan with $1000 per buy',
    ],
  },
  {
    id: 'r-discord-tip-bot',
    slug: 'discord-tip-bot',
    title: 'Discord Tip Bot',
    description: 'Send token tips to Discord users via bot commands. Supports USDC, ETH and SOL tipping with configurable limits.',
    icon: '💬',
    category: 'social',
    tags: ['social', 'discord', 'tipping', 'transfer'],
    chains: ['BASE_ETH', 'SOL'],
    author_name: 'Community',
    featured: false,
    verified: true,
    view_count: 567,
    use_count: 23,
    content_markdown: `## Overview

transfer on BASE_ETH / SOL. Enables Discord bot to send token tips on behalf of users. Each tip is a direct on-chain transfer with spending caps.

## Fact

- Supported tokens: USDC, ETH (Base), SOL
- Tip range: $0.01 - $100 per tip
- Daily limit: configurable per user

## Typical Flow

**Tip — 1 tx:**
1. \`transfer(recipient, amount, token)\` from user's wallet

**With ERC-20:**
1. \`approve(bot_address, amount)\`
2. \`transferFrom(sender, recipient, amount)\`

## Safety & Risks

- Enforce per-tip and daily spending caps
- Verify recipient address before transfer
- Bot key security is critical
- Consider gas sponsoring for small tips`,
    example_prompts: [
      'Set up a Discord tip bot that sends USDC on Base, max $10 per tip',
      'Enable SOL tipping in my Discord server with $50 daily limit',
    ],
  },
  {
    id: 'r-streaming-payroll',
    slug: 'streaming-payroll',
    title: 'Streaming Payroll',
    description: 'Real-time salary streaming using Superfluid or Sablier. Pay contributors by the second instead of monthly.',
    icon: '💰',
    category: 'payments',
    tags: ['payments', 'payroll', 'streaming', 'contract_call'],
    chains: ['ETH', 'BASE_ETH', 'ARB_ETH'],
    author_name: 'Cobo',
    featured: false,
    verified: true,
    view_count: 432,
    use_count: 18,
    content_markdown: `## Overview

contract_call on ETH / BASE_ETH / ARB_ETH. Create continuous payment streams using Superfluid protocol. Recipients can withdraw accrued funds at any time.

## Fact

- Superfluid Host (BASE_ETH): \`0xcfA132E353cB4E398080B9700609bb008eceB125\`
- Super Token wrapper required for streaming
- Flow rate calculated as: amount per month / seconds per month

## Typical Flow

**Create Stream — 2 tx:**
1. \`approve(superToken, amount)\` — wrap tokens
2. \`createFlow(token, receiver, flowRate)\` on Superfluid Host

**Stop Stream — 1 tx:**
1. \`deleteFlow(token, sender, receiver)\` on Superfluid Host

## Safety & Risks

- Ensure sufficient Super Token balance to maintain stream
- Stream auto-liquidates if balance runs out
- Gas costs for creating/modifying streams
- Consider buffer deposit requirements`,
    example_prompts: [
      'Set up a $5000/month USDC salary stream to 0xabc... on Base',
      'Create streaming payments for 3 team members using Superfluid',
    ],
  },
  {
    id: 'r-cross-chain-bridge',
    slug: 'cross-chain-bridge',
    title: 'Cross-Chain Bridge',
    description: 'Bridge assets between chains using Stargate, Across, or LayerZero. Automatic route optimization for best rates.',
    icon: '🌉',
    category: 'infrastructure',
    tags: ['infrastructure', 'bridge', 'cross-chain', 'contract_call'],
    chains: ['ETH', 'BASE_ETH', 'ARB_ETH', 'OP_ETH'],
    author_name: 'Cobo',
    featured: false,
    verified: true,
    view_count: 876,
    use_count: 67,
    content_markdown: `## Overview

contract_call across multiple EVM chains. Bridge tokens between L1 and L2s using aggregated bridge protocols for optimal fees and speed.

## Fact

- Stargate Router (ETH): \`0x8731d54E9D02c286767d56ac03e8037C07e01e98\`
- Across SpokePool (ETH): \`0x5c7BCd6E7De5423a257D81B442095A1a6ced35C5\`
- Typical bridge time: 1-15 minutes depending on route

## Typical Flow

**Bridge via Stargate — 2 tx:**
1. \`approve(router, amount)\` on source token
2. \`swap(params)\` on Stargate Router

## Safety & Risks

- Verify destination chain and address carefully
- Bridge fees vary by route and congestion
- Large amounts may have liquidity constraints
- Always wait for finality before considering complete`,
    example_prompts: [
      'Bridge 5000 USDC from Ethereum to Base using the cheapest route',
      'Move my ETH from Arbitrum to Optimism',
      'Auto-balance USDC across Ethereum, Base, and Arbitrum — keep $2000 minimum on each',
    ],
  },
  {
    id: 'r-gasless-transfer',
    slug: 'gasless-transfer',
    title: 'Gasless Token Transfer',
    description: 'Send ERC-20 tokens without paying gas using EIP-2612 permit + relayer. User signs, relayer submits.',
    icon: '⛽',
    category: 'infrastructure',
    tags: ['infrastructure', 'gasless', 'permit', 'transfer'],
    chains: ['ETH', 'BASE_ETH'],
    author_name: 'Cobo',
    featured: false,
    verified: true,
    view_count: 654,
    use_count: 41,
    content_markdown: `## Overview

Meta-transaction pattern: user signs an EIP-2612 permit off-chain, relayer submits the transfer on-chain and pays gas. User's token balance decreases, but ETH balance is untouched.

## Fact

- Requires EIP-2612 compatible token (USDC, DAI, etc.)
- Permit signature: v, r, s + deadline + nonce
- Relayer pays gas, may deduct fee from transfer amount

## Typical Flow

**Gasless Transfer — 2 steps:**
1. User signs \`permit(owner, spender, value, deadline, v, r, s)\` off-chain
2. Relayer calls \`permitTransferFrom()\` on-chain

## Safety & Risks

- Verify permit deadline is reasonable
- Check relayer fee before signing
- Nonce management to prevent replay attacks
- Not all tokens support EIP-2612`,
    example_prompts: [
      'Send 100 USDC to 0xabc... without paying gas',
      'Set up gasless transfers for my USDC payments on Base',
    ],
  },
  {
    id: 'r-multisig-cosign',
    slug: 'multisig-cosign',
    title: 'Multi-sig Co-signing',
    description: 'Automate co-signing for Safe (Gnosis) multi-sig wallets. Agent reviews transactions against policy before signing.',
    icon: '🔐',
    category: 'safety',
    tags: ['safety', 'multisig', 'gnosis', 'message_sign'],
    chains: ['ETH', 'BASE_ETH', 'ARB_ETH'],
    author_name: 'Cobo',
    featured: false,
    verified: true,
    view_count: 345,
    use_count: 12,
    content_markdown: `## Overview

message_sign on ETH / BASE_ETH / ARB_ETH. Agent acts as one signer in a Safe multi-sig, automatically co-signing transactions that match predefined policy rules.

## Fact

- Safe Proxy Factory: \`0xa6B71E26C5e0845f74c812102Ca7114b6a896AB2\`
- Signing follows EIP-712 typed data standard
- Agent is non-custodial: cannot initiate, only co-sign

## Typical Flow

**Co-sign — 2 steps:**
1. Monitor Safe transaction queue for pending txs
2. Verify tx matches policy (amount limits, recipient whitelist, contract whitelist)
3. Sign EIP-712 \`SafeTx\` hash if policy passes

## Safety & Risks

- Agent should never be the sole required signer
- Policy engine must be strictly configured
- Monitor for unexpected transaction proposals
- Consider time-lock for large amounts`,
    example_prompts: [
      'Auto co-sign Safe transactions under $1000 to whitelisted addresses',
      'Set up automated multi-sig approval for recurring vendor payments',
    ],
  },
  {
    id: 'r-nft-marketplace',
    slug: 'nft-marketplace-ops',
    title: 'NFT Marketplace Operations',
    description: 'Automate NFT listing, bidding, and floor price monitoring on OpenSea via Seaport protocol.',
    icon: '🖼️',
    category: 'social',
    tags: ['social', 'nft', 'opensea', 'message_sign'],
    chains: ['ETH'],
    author_name: 'Community',
    featured: false,
    verified: false,
    view_count: 256,
    use_count: 8,
    content_markdown: `## Overview

message_sign + contract_call on ETH. Sign EIP-712 Seaport orders for listing, offers, and collection bids. Monitor floor prices and auto-adjust listings.

## Fact

- Seaport 1.5: \`0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC\`
- Order types: Basic, Standard, Advanced
- Supports ERC-721 and ERC-1155

## Typical Flow

**List NFT — 1 sign + 1 tx:**
1. Sign Seaport order (EIP-712) with listing parameters
2. Optional: \`setApprovalForAll(conduit, true)\` if first time

## Safety & Risks

- Verify order parameters carefully before signing
- Set reasonable expiration times
- Monitor for collection-wide offers that may be unfavorable
- Approval should use Seaport conduit, not arbitrary addresses`,
    example_prompts: [
      'List my Bored Ape #1234 on OpenSea for 50 ETH',
      'Monitor floor price of Pudgy Penguins and auto-list above 15 ETH',
    ],
  },
  {
    id: 'r-dao-treasury',
    slug: 'dao-treasury-ops',
    title: 'DAO Treasury Operations',
    description: 'Execute DAO governance proposals — fund allocation, token swaps, and protocol parameter updates via timelock.',
    icon: '🏛️',
    category: 'enterprise',
    tags: ['enterprise', 'dao', 'governance', 'contract_call'],
    chains: ['ETH', 'ARB_ETH'],
    author_name: 'Cobo',
    featured: false,
    verified: true,
    view_count: 198,
    use_count: 5,
    content_markdown: `## Overview

contract_call on ETH / ARB_ETH. Automate the execution of passed DAO proposals through Governor + Timelock contracts. Agent monitors proposal state and executes when ready.

## Fact

- Governor (typical): OpenZeppelin Governor
- Timelock: TimelockController with min delay
- Proposal states: Pending → Active → Succeeded → Queued → Executed

## Typical Flow

**Execute Proposal — 2 tx:**
1. \`queue(targets, values, calldatas, descriptionHash)\` after proposal succeeds
2. \`execute(targets, values, calldatas, descriptionHash)\` after timelock expires

## Safety & Risks

- Double-check proposal content matches community vote
- Timelock delay provides final safety window
- Failed execution requires re-queuing
- Consider gas costs for complex proposals`,
    example_prompts: [
      'Monitor and auto-execute passed DAO proposals on our Governor contract',
      'Set up treasury diversification: swap 10% of ETH to USDC monthly',
    ],
  },
];
