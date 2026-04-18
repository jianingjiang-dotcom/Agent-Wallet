import type { Pact, DefaultPact } from '@/types/pact';

export const mockPacts: Pact[] = [
  {
    id: 'pact-001',
    status: 'expired',
    title: '条件触发 SushiSwap V3 流动性管理',
    description: 'ETH < $2050 时向 WETH/USDC 0.05% 池子添加 0.0001 ETH + 等值 USDC，价格区间 ±5%；ETH > $2060 时撤出全部仓位。若 USDC 不足先通过 SwapRouter 兑换。',
    createdAt: new Date('2026-03-31T11:36:51'),
    agentName: 'Provisioned Agent',
    strategyName: 'SushiSwap V3 条件流动性策略 (Base)',
    chain: 'BASE_ETH',
    validityDays: 30,
    userPrompt: '我想让你帮我在ETH价值低于2050美金的时候帮我执行一笔约0.0001ETH和对应价值的USDC代币投入Sushiswap v3流动性池子的交易，池子地址 https://www.sushi.com/base/pool/v3/0x57713f776e0b0f65ec116912f834e49805480d2，价格区间采用上下5%，如果ETH价格超过 2060美金时，帮我撤回我的全部持仓位。如果执行时发现USDC不够，你先帮我去兑换。',
    permissions: [
      { type: 'write', scope: 'contract call' },
      { type: 'read', scope: 'wallet' },
    ],
    executionSummary: '条件触发流动性管理：ETH < $2050 时向 SushiSwap V3 (WETH/USDC 0.05% on Base) 添加流动性，ETH > $2060 时撤出。',
    contractOps: [
      { label: 'USDC Approve', description: '授权 NonfungiblePositionManager (0x80C7DD17...) 使用 USDC' },
      { label: 'SushiSwap V3 Mint', description: '向 WETH/USDC 池子 (0x57713f77...) mint 仓位，金额 0.0001 ETH + 等值 USDC，价格区间当前价格 ±5%' },
      { label: 'SushiSwap V3 SwapRouter', description: '若 USDC 不足，先从 SwapRouter (0xFB7eF66a...) 兑换' },
      { label: 'decreaseLiquidity + collect', description: 'ETH > $2060 时撤出全部仓位' },
    ],
    riskControls: [
      { label: '单笔 USD 上限', value: '$500' },
      { label: '24h 滚动上限', value: '$1,000' },
      { label: '链限制', value: '仅限 Base 链上 SushiSwap V3 合约' },
      { label: '滑点容忍', value: '1%' },
    ],
    schedule: '持续监控，无特定时间表，条件触发执行，最长授权 30 天。',
    exitConditions: '手动撤销 OR 30天到期',
    riskRules: [
      { name: 'Sushi LP Contracts Allow', type: 'contract_call', chain: 'BASE_ETH', addresses: ['0x80C7DD17...', '0x57713f77...', '0xFB7eF66a...'], action: 'allow' },
    ],
    policies: [
      {
        name: 'SushiSwap 流动性操作',
        type: 'contract_call',
        rules: {
          when: {
            chain_in: ['Base'],
            target_in: [
              { chain_id: 'BASE_ETH', contract_addr: '0x80C7DD17B01855a6D2347444a0FCC36136a314de', label: 'NonfungiblePositionManager' },
              { chain_id: 'BASE_ETH', contract_addr: '0x57713f776e0b0f65ec116912f834e49805480d2', label: 'WETH/USDC Pool' },
              { chain_id: 'BASE_ETH', contract_addr: '0xFB7eF66a7e61224DD6FcD0D7d9C3be5C8B049b9f', label: 'SwapRouter' },
            ],
          },
          deny_if: {
            usage_limits: {
              rolling_24h: { amount_usd_gt: 1000, tx_count_gt: 8 },
            },
          },
          review_if: { amount_usd_gt: 500 },
        },
        priority: 0,
        is_active: true,
      },
    ],
    aiInterpretation: {
      riskLevel: 'medium',
      recommendation: 'approve',
      summary: '基于价格信号管理 SushiSwap V3 流动性：ETH 低于 $2050 时建仓，高于 $2060 时撤仓。',
      points: [
        { icon: 'chart', text: '每次建仓约 0.0001 ETH + 等值 USDC，窄幅 ±5% 区间' },
        { icon: 'shield', text: '仅与 SushiSwap V3 合约交互，其他地址一律拒绝' },
        { icon: 'warning', text: '窄区间意味着价格偏离会频繁触发 rebalance' },
      ],
    },
  },
  {
    id: 'pact-002',
    status: 'pending',
    title: 'ETH 定投策略',
    description: '每周一 9:00 UTC 自动购买 $500 等值的 ETH，使用 Uniswap V3 在 Ethereum 主网执行。',
    createdAt: new Date(Date.now() - 20 * 60 * 1000), // 20 min ago → 40 min remaining
    agentName: 'DCA Agent',
    strategyName: 'ETH Weekly DCA (Ethereum)',
    chain: 'ETH',
    validityDays: 90,
    userPrompt: '帮我设置一个ETH定投计划，每周一买入500美金的ETH，用Uniswap执行，持续3个月。',
    permissions: [
      { type: 'write', scope: 'contract call' },
      { type: 'write', scope: 'transfer' },
      { type: 'read', scope: 'wallet' },
    ],
    executionSummary: '每周一 9:00 UTC 通过 Uniswap V3 购买 $500 ETH，持续 90 天。',
    contractOps: [
      { label: 'USDC Approve', description: '授权 Uniswap Router 使用 USDC' },
      { label: 'Uniswap V3 Swap', description: '将 $500 USDC 兑换为 ETH' },
    ],
    riskControls: [
      { label: '单笔 USD 上限', value: '$500' },
      { label: '周滚动上限', value: '$500' },
      { label: '链限制', value: '仅限 Ethereum 主网' },
      { label: '滑点容忍', value: '0.5%' },
    ],
    schedule: '每周一 9:00 UTC 执行，最长授权 90 天。',
    exitConditions: '手动撤销 OR 90天到期 OR 预算耗尽',
    exitConditionList: [
      { type: 'tx_count', label: '总交易笔数达到', current: 0, target: 50 },
      { type: 'tx_amount', label: '总交易额达到', current: 0, target: 6000, unit: '$' },
      { type: 'duration', label: '生效时间达到', current: 0, target: 90, unit: '天' },
    ],
    riskRules: [
      { name: 'Uniswap Router Allow', type: 'contract_call', chain: 'ETH', addresses: ['0xE592427A...'], action: 'allow' },
    ],
    policies: [
      {
        name: 'Uniswap 交易',
        type: 'contract_call',
        rules: {
          when: {
            chain_in: ['Ethereum'],
            target_in: [{ chain_id: 'ETH', contract_addr: '0xE592427A0AEce92De3Edee1F18E0157C05861564', label: 'Uniswap V3 Router' }],
          },
          deny_if: {
            usage_limits: {
              rolling_24h: { amount_usd_gt: 2000, tx_count_gt: 5 },
            },
          },
          review_if: { amount_usd_gt: 1000 },
        },
        priority: 0,
        is_active: true,
      },
      {
        name: 'ETH 转账',
        type: 'transfer',
        rules: {
          when: {
            chain_in: ['Ethereum'],
            token_in: [{ chain_id: 'ETH', token_id: 'ETH' }],
          },
          deny_if: {
            usage_limits: {
              rolling_24h: { amount_usd_gt: 500, tx_count_gt: 2 },
            },
          },
          review_if: { amount_usd_gt: 500 },
        },
        priority: 1,
        is_active: true,
      },
    ],
    aiInterpretation: {
      riskLevel: 'low',
      recommendation: 'approve',
      summary: '这是一个 ETH 定投策略，每周一自动用 Uniswap V3 买入 $500 ETH，持续 3 个月。',
      points: [
        { icon: 'money', text: '累计投入约 $6,000，分 12 次执行' },
        { icon: 'time', text: '执行窗口仅限周一 UTC 9:00，偏离会被拒绝' },
        { icon: 'warning', text: '价格波动由你承担，无止损保护' },
      ],
    },
  },
  {
    id: 'pact-002b',
    status: 'pending',
    title: 'Base 链 AAVE 自动复投',
    description: '监控 AAVE V3 存款收益，每日自动领取并复投 USDC 收益到 Base 链上最优池。',
    createdAt: new Date(Date.now() - 55 * 60 * 1000), // 55 min ago → 5 min remaining (urgent)
    agentName: 'Yield Optimizer',
    strategyName: 'AAVE V3 Auto-compound (Base)',
    chain: 'BASE_ETH',
    validityDays: 60,
    userPrompt: '帮我把AAVE上Base链的USDC存款收益每天自动复投回去。',
    permissions: [
      { type: 'write', scope: 'contract call' },
      { type: 'read', scope: 'wallet' },
    ],
    executionSummary: '每日检查 AAVE V3 Base 链上的 USDC 收益，自动领取并复投。',
    contractOps: [
      { label: 'Claim Rewards', description: '从 AAVE V3 领取 USDC 收益' },
      { label: 'Re-supply', description: '将收益重新存入 AAVE V3' },
    ],
    riskControls: [
      { label: '单笔 USD 上限', value: '$1,000' },
      { label: '24h 滚动上限', value: '$2,000' },
      { label: '链限制', value: '仅限 Base' },
    ],
    schedule: '每日 00:00 UTC 执行，最长授权 60 天。',
    exitConditions: '手动撤销 OR 60天到期',
    riskRules: [
      { name: 'AAVE V3 Base Allow', type: 'contract_call', chain: 'BASE_ETH', addresses: ['0x794a6135...'], action: 'allow' },
    ],
    policies: [
      {
        name: 'AAVE V3 复投',
        type: 'contract_call',
        rules: {
          when: {
            chain_in: ['Base'],
            target_in: [
              { chain_id: 'BASE_ETH', contract_addr: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', label: 'Aave V3 Pool' },
            ],
          },
          deny_if: {
            usage_limits: {
              rolling_24h: { amount_usd_gt: 2000, tx_count_gt: 3 },
            },
          },
          review_if: { amount_usd_gt: 1000 },
        },
        priority: 0,
        is_active: true,
      },
    ],
    aiInterpretation: {
      riskLevel: 'low',
      recommendation: 'approve',
      summary: '每日自动领取 AAVE V3 Base 上的 USDC 收益并重新存入，实现复利增长。',
      points: [
        { icon: 'chart', text: '预期年化约 3-5%，随市场利率浮动' },
        { icon: 'shield', text: '仅限 Base 链 AAVE 合约，其他操作被拒绝' },
        { icon: 'warning', text: '无强制撤出机制，长期委托存在智能合约风险' },
      ],
    },
  },
  {
    id: 'pact-002c',
    status: 'pending',
    title: 'Solana MEV 套利监控',
    description: '在 Solana 链上监控 Jupiter 聚合器的套利机会，自动执行低风险套利交易。',
    createdAt: new Date(Date.now() - 90 * 60 * 1000), // 90 min ago → already expired
    agentName: 'MEV Scout',
    strategyName: 'Jupiter Arb Monitor (Solana)',
    chain: 'SOL',
    validityDays: 7,
    userPrompt: '帮我在Solana上用Jupiter找套利机会，自动执行，控制好风险。',
    permissions: [
      { type: 'write', scope: 'contract call' },
      { type: 'write', scope: 'transfer' },
      { type: 'read', scope: 'wallet' },
    ],
    executionSummary: '持续监控 Jupiter 聚合器套利机会，自动执行低风险交易。',
    contractOps: [
      { label: 'Jupiter Swap', description: '通过 Jupiter 聚合器执行兑换' },
      { label: 'Token Transfer', description: '将利润转回主钱包' },
    ],
    riskControls: [
      { label: '单笔 USD 上限', value: '$200' },
      { label: '24h 滚动上限', value: '$1,000' },
      { label: '最小利润率', value: '0.3%' },
    ],
    schedule: '持续监控，条件触发执行，最长授权 7 天。',
    exitConditions: '手动撤销 OR 7天到期',
    riskRules: [
      { name: 'Jupiter Router Allow', type: 'contract_call', chain: 'SOL', addresses: ['JUP6...'], action: 'allow' },
    ],
    policies: [
      {
        name: 'Jupiter 套利',
        type: 'contract_call',
        rules: {
          when: {
            chain_in: ['Solana'],
            target_in: [
              { chain_id: 'SOL', contract_addr: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4' },
            ],
          },
          deny_if: {
            usage_limits: {
              rolling_1h: { amount_usd_gt: 200, tx_count_gt: 10 },
              rolling_24h: { amount_usd_gt: 1000, tx_count_gt: 50 },
            },
          },
          review_if: { amount_usd_gt: 200 },
        },
        priority: 0,
        is_active: true,
      },
    ],
  },
  {
    id: 'pact-003',
    status: 'active',
    title: 'Aave V3 借贷管理',
    description: '当 ETH 价格下跌至清算线 120% 时自动补充抵押品，维持健康因子 > 1.5。',
    createdAt: new Date('2026-03-28T14:20:00'),
    agentName: 'Risk Manager Agent',
    strategyName: 'Aave V3 健康因子守护 (Arbitrum)',
    chain: 'ARB_ETH',
    validityDays: 60,
    userPrompt: '监控我的Aave V3借贷仓位，如果健康因子低于1.5就自动补充ETH抵押品，保持安全。',
    permissions: [
      { type: 'write', scope: 'contract call' },
      { type: 'read', scope: 'wallet' },
    ],
    executionSummary: '监控 Aave V3 健康因子，低于 1.5 时自动补充 ETH 抵押品。',
    contractOps: [
      { label: 'Aave Pool Supply', description: '向 Aave V3 Pool 补充 ETH 抵押品' },
      { label: 'WETH Approve', description: '授权 Aave Pool 使用 WETH' },
    ],
    riskControls: [
      { label: '单笔 USD 上限', value: '$2,000' },
      { label: '24h 滚动上限', value: '$5,000' },
      { label: '链限制', value: '仅限 Arbitrum' },
      { label: '最大补仓次数', value: '每日 3 次' },
    ],
    schedule: '持续监控，条件触发执行，最长授权 60 天。',
    exitConditions: '手动撤销 OR 60天到期',
    exitConditionList: [
      { type: 'tx_count', label: '交易笔数', current: 23, target: 50 },
      { type: 'tx_amount', label: '交易金额', current: 4500, target: 20000, unit: '$' },
      { type: 'duration', label: '有效期', current: 15, target: 90, unit: '天' },
    ],
    riskRules: [
      { name: 'Aave V3 Pool Allow', type: 'contract_call', chain: 'ARB_ETH', addresses: ['0x794a61358B...'], action: 'allow' },
    ],
    policies: [
      {
        name: 'Aave V3 合约操作',
        type: 'contract_call',
        rules: {
          when: {
            chain_in: ['Arbitrum'],
            target_in: [
              { chain_id: 'ARB_ETH', contract_addr: '0x794a61358D6845594F94dc1DB02A252b5b4814aD', label: 'Aave V3 Pool' },
              { chain_id: 'ARB_ETH', contract_addr: '0x82aF49447D8a07e3bd95BD0d56f35241523fBab1', label: 'WETH' },
            ],
          },
          deny_if: {
            usage_limits: {
              rolling_24h: { amount_usd_gt: 5000, tx_count_gt: 3 },
            },
          },
          review_if: { amount_usd_gt: 2000 },
        },
        priority: 0,
        is_active: true,
      },
      {
        name: 'ETH 抵押品补充',
        type: 'transfer',
        rules: {
          when: {
            chain_in: ['Arbitrum'],
            token_in: [{ chain_id: 'ARB_ETH', token_id: 'ETH' }],
          },
          deny_if: {
            usage_limits: {
              rolling_24h: { amount_usd_gt: 2000, tx_count_gt: 3 },
            },
          },
          review_if: { amount_usd_gt: 1000 },
        },
        priority: 1,
        is_active: true,
      },
    ],
  },
  {
    id: 'pact-004',
    status: 'rejected',
    title: '跨链套利策略',
    description: '在 Arbitrum 和 Optimism 之间寻找 USDC/USDT 价差套利机会，自动执行跨链交易。',
    createdAt: new Date('2026-03-25T18:45:00'),
    agentName: 'Arb Bot Agent',
    strategyName: '跨链套利 (ARB-OP)',
    chain: 'ARB_ETH',
    validityDays: 14,
    userPrompt: '帮我在Arbitrum和Optimism之间找USDC/USDT的套利机会并自动执行。',
    permissions: [
      { type: 'write', scope: 'contract call' },
      { type: 'write', scope: 'transfer' },
      { type: 'read', scope: 'wallet' },
    ],
    executionSummary: '跨链 USDC/USDT 套利，在 Arbitrum 和 Optimism 间执行。',
    contractOps: [
      { label: 'Bridge Transfer', description: '通过 Stargate 跨链桥转移资产' },
      { label: 'DEX Swap', description: '在目标链上 DEX 执行兑换' },
    ],
    riskControls: [
      { label: '单笔 USD 上限', value: '$10,000' },
      { label: '24h 滚动上限', value: '$50,000' },
      { label: '链限制', value: 'Arbitrum + Optimism' },
      { label: '最小利润', value: '0.1%' },
    ],
    schedule: '持续监控，条件触发执行，最长授权 14 天。',
    exitConditions: '手动撤销 OR 14天到期',
    riskRules: [
      { name: 'Stargate Bridge Allow', type: 'contract_call', chain: 'ARB_ETH', action: 'allow' },
    ],
    policies: [
      {
        name: 'Stargate 跨链桥',
        type: 'contract_call',
        rules: {
          when: {
            chain_in: ['Arbitrum', 'Optimism'],
            target_in: [
              { chain_id: 'ARB_ETH', contract_addr: '0x53Bf833A5d6c4ddA888F69c22C88C9f356a41614', label: 'Stargate Router' },
            ],
          },
          deny_if: {
            usage_limits: {
              rolling_24h: { amount_usd_gt: 50000, tx_count_gt: 20 },
            },
          },
          review_if: { amount_usd_gt: 10000 },
        },
        priority: 0,
        is_active: true,
      },
      {
        name: 'USDC/USDT 转账',
        type: 'transfer',
        rules: {
          when: {
            chain_in: ['Arbitrum', 'Optimism'],
            token_in: [
              { chain_id: 'ARB_ETH', token_id: 'USDC' },
              { chain_id: 'ARB_ETH', token_id: 'USDT' },
            ],
          },
          deny_if: {
            usage_limits: {
              rolling_24h: { amount_usd_gt: 50000, tx_count_gt: 30 },
            },
          },
          review_if: { amount_usd_gt: 10000 },
        },
        priority: 1,
        is_active: true,
      },
    ],
  },
  {
    id: 'pact-005',
    status: 'active',
    title: 'USDC 收益优化',
    description: '将闲置 USDC 存入收益最高的借贷协议，每日自动复投收益。',
    createdAt: new Date('2026-03-29T10:00:00'),
    agentName: 'Yield Agent',
    strategyName: 'USDC 最优收益 (Base)',
    chain: 'BASE_ETH',
    validityDays: 30,
    userPrompt: '帮我把闲置的USDC存到收益最高的协议里，每天自动复投。',
    permissions: [
      { type: 'write', scope: 'contract call' },
      { type: 'read', scope: 'wallet' },
    ],
    executionSummary: '自动将 USDC 存入 Base 链上收益最高的借贷协议，每日复投。',
    contractOps: [
      { label: 'USDC Approve', description: '授权借贷协议使用 USDC' },
      { label: 'Supply', description: '将 USDC 存入协议' },
      { label: 'Claim & Reinvest', description: '领取并复投收益' },
    ],
    riskControls: [
      { label: '单笔 USD 上限', value: '$5,000' },
      { label: '24h 滚动上限', value: '$10,000' },
      { label: '链限制', value: '仅限 Base' },
      { label: '协议限制', value: '仅限审计过的协议' },
    ],
    schedule: '每日 00:00 UTC 检查收益并复投，最长授权 30 天。',
    exitConditions: '手动撤销 OR 30天到期',
    exitConditionList: [
      { type: 'tx_count', label: '交易笔数', current: 8, target: 100 },
      { type: 'tx_amount', label: '交易金额', current: 6200, target: 10000, unit: '$' },
    ],
    riskRules: [
      { name: 'Lending Protocol Allow', type: 'contract_call', chain: 'BASE_ETH', action: 'allow' },
    ],
    policies: [
      {
        name: '借贷协议操作',
        type: 'contract_call',
        rules: {
          when: {
            chain_in: ['Base'],
            target_in: [
              { chain_id: 'BASE_ETH', contract_addr: '0x18cD499E3d7eD42FEb1A2A79b4aF26F95CE5Bfe2', label: 'Aave V3 Pool' },
              { chain_id: 'BASE_ETH', contract_addr: '0x4200000000000000000000000000000000000006', label: 'WETH' },
            ],
          },
          deny_if: {
            usage_limits: {
              rolling_24h: { amount_usd_gt: 10000, tx_count_gt: 10 },
            },
          },
          review_if: { amount_usd_gt: 5000 },
        },
        priority: 0,
        is_active: true,
      },
    ],
  },
  {
    id: 'pact-006',
    status: 'active',
    title: 'NFT 市场签名授权',
    description: '允许 Agent 在 OpenSea 上签署上架和报价消息，不涉及资金转移。',
    createdAt: new Date('2026-04-01T09:00:00'),
    agentName: 'NFT Manager',
    strategyName: 'OpenSea 签名代理 (Ethereum)',
    chain: 'ETH',
    validityDays: 30,
    userPrompt: '帮我在OpenSea上管理我的NFT，自动签署上架和报价消息，不要做任何转账。',
    permissions: [
      { type: 'write', scope: 'message sign' },
      { type: 'write', scope: 'contract call' },
      { type: 'read', scope: 'wallet' },
    ],
    executionSummary: '代理签署 OpenSea 上架/报价的 EIP-712 消息，并调用 Seaport 合约完成挂单。',
    contractOps: [
      { label: 'Seaport Order', description: '调用 Seaport 合约创建/取消订单' },
    ],
    riskControls: [
      { label: '1h 签名上限', value: '10 次' },
      { label: '链限制', value: '仅限 Ethereum' },
      { label: '域名限制', value: 'opensea.io' },
    ],
    schedule: '按需签署，最长授权 30 天。',
    exitConditions: '手动撤销 OR 30天到期',
    exitConditionList: [
      { type: 'tx_count', label: '签名次数', current: 12, target: 200 },
      { type: 'duration', label: '有效期', current: 8, target: 30, unit: '天' },
    ],
    riskRules: [
      { name: 'Seaport Allow', type: 'contract_call', chain: 'ETH', addresses: ['0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC'], action: 'allow' },
    ],
    policies: [
      {
        name: 'OpenSea 消息签名',
        type: 'message_sign',
        rules: {
          when: {
            source_address_in: ['0x742d35Cc6634C0532925a3b844Bc9e7595f2bD18'],
          },
          deny_if: {
            usage_limits: {
              rolling_1h: { request_count_gt: 10 },
            },
          },
          review_if: {},
        },
        priority: 0,
        is_active: true,
      },
      {
        name: 'Seaport 合约调用',
        type: 'contract_call',
        rules: {
          when: {
            chain_in: ['Ethereum'],
            target_in: [
              { chain_id: 'ETH', contract_addr: '0x00000000000000ADc04C56Bf30aC9d3c0aAF14dC', label: 'Seaport 1.5' },
            ],
          },
          deny_if: {
            usage_limits: {
              rolling_24h: { tx_count_gt: 20 },
            },
          },
          review_if: { amount_usd_gt: 500 },
        },
        priority: 1,
        is_active: true,
      },
    ],
  },
];

export const mockDefaultPacts: DefaultPact[] = [
  {
    id: 'dp-001',
    name: '标准交易限额',
    description: '适用于所有 Agent 的默认交易限额和风控规则',
    enabled: true,
    maxPerTx: 500,
    rolling24h: 1000,
    allowedChains: ['ETH', 'BASE_ETH', 'ARB_ETH'],
    allowedTokens: ['ETH', 'USDC', 'USDT'],
    contractWhitelist: [],
    maxValidityDays: 30,
  },
  {
    id: 'dp-002',
    name: '高级 DeFi 策略',
    description: '适用于 DeFi 策略 Agent 的扩展限额',
    enabled: true,
    maxPerTx: 2000,
    rolling24h: 5000,
    allowedChains: ['ETH', 'BASE_ETH', 'ARB_ETH', 'OP_ETH'],
    allowedTokens: ['ETH', 'WETH', 'USDC', 'USDT', 'DAI'],
    contractWhitelist: ['Uniswap V3', 'Aave V3', 'SushiSwap V3'],
    maxValidityDays: 90,
  },
  {
    id: 'dp-003',
    name: '只读监控',
    description: '仅允许读取钱包数据，不允许任何交易操作',
    enabled: false,
    maxPerTx: 0,
    rolling24h: 0,
    allowedChains: ['ETH', 'BASE_ETH', 'ARB_ETH', 'OP_ETH', 'BSC'],
    allowedTokens: [],
    contractWhitelist: [],
    maxValidityDays: 365,
  },
];
