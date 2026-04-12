/**
 * Vite dev server middleware: proxies /api/ai-chat → Anthropic Messages API.
 *
 * Reads ANTHROPIC_API_KEY from process.env (loaded from .env by Vite).
 * API key stays server-side — never exposed to the browser.
 *
 * In production, the Supabase Edge Function (supabase/functions/ai-assistant)
 * performs the same role.
 */
import type { Plugin } from 'vite';
import type { IncomingMessage, ServerResponse } from 'http';

// ─── Knowledge base (mirrors Edge Function) ─────────────────────────────────

const KNOWLEDGE_BASE = `
## 产品功能知识库 - Cobo 商户钱包

### 收款
- 点击「收款」按钮，选择网络（Ethereum/Tron/BSC/Solana），展示二维码或复制地址
- 确保付款方使用正确的网络转账
- 收到的资金经过 KYT 扫描，分为安全/待确认/风险三类

### 转账
- 点击「转账」按钮，输入收款地址，选择币种网络，输入金额
- 首次向新地址转账建议先小额测试
- 支持 RBF 加速待处理交易

### 支持币种
- 稳定币：USDT、USDC（ERC-20/TRC-20/BEP-20/SPL）
- 主流币：ETH、BNB、TRX、SOL

### 各链确认时间
- Ethereum：1-5分钟 | Tron：1-3分钟 | BNB Chain：15-30秒 | Solana：几秒-1分钟

### 安全设置
- 6位PIN码、生物识别、设备管理、转账限额、白名单

### 钱包管理
- 主钱包(日常交易)、收款钱包(资金隔离)、逃生钱包(自托管)
- 双模式：用户创建钱包（用户签名）与 Agent 关联钱包（Agent 签名，用户提交请求）

### 地址簿
- 添加联系人、设置白名单、按网络分类(EVM/Tron/Solana)
`;

// ─── Anthropic tool definitions ─────────────────────────────────────────────

const tools = [
  {
    name: 'query_balance',
    description: '查询用户的资产余额。当用户询问余额、资产状况时调用。',
    input_schema: {
      type: 'object',
      properties: {
        symbol: { type: 'string', description: '币种 (如 USDT, ETH)，不传则查全部' },
        chain: { type: 'string', description: '网络 (ethereum/tron/bsc/solana)' },
      },
    },
  },
  {
    name: 'query_transactions',
    description: '查询最近的交易记录。当用户询问交易历史时调用。',
    input_schema: {
      type: 'object',
      properties: {
        count: { type: 'number', description: '查询数量，默认 5，最多 5' },
        type: { type: 'string', enum: ['all', 'send', 'receive'], description: '交易类型' },
      },
    },
  },
  {
    name: 'prepare_transfer',
    description: '准备转账（不会直接执行，会在前端生成确认卡片让用户确认）。当用户要求转账时调用。',
    input_schema: {
      type: 'object',
      properties: {
        to: { type: 'string', description: '收款地址' },
        amount: { type: 'number', description: '金额' },
        symbol: { type: 'string', description: '币种' },
        chain: { type: 'string', description: '网络' },
      },
      required: ['to', 'amount', 'symbol'],
    },
  },
  {
    name: 'navigate_to',
    description: '引导用户跳转到产品页面。当用户询问如何操作时，可以引导到对应页面。',
    input_schema: {
      type: 'object',
      properties: {
        page: {
          type: 'string',
          enum: ['send', 'receive', 'history', 'security', 'wallets', 'contacts', 'help'],
          description: '目标页面',
        },
      },
      required: ['page'],
    },
  },
  {
    name: 'query_fund_risk',
    description: '查询收款钱包的资金风控状态。当用户询问资金安全、风控状态时调用。',
    input_schema: {
      type: 'object',
      properties: {
        walletId: { type: 'string', description: '钱包 ID，不传则查当前收款钱包' },
      },
    },
  },
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk: Buffer) => (data += chunk.toString()));
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

interface ChatMsg {
  role: string;
  content: string;
}

function sanitizeMessages(messages: ChatMsg[]): { role: 'user' | 'assistant'; content: string }[] {
  const filtered = messages.filter((m) => m.role === 'user' || m.role === 'assistant');

  const merged: { role: 'user' | 'assistant'; content: string }[] = [];
  for (const m of filtered) {
    const role = m.role as 'user' | 'assistant';
    if (merged.length > 0 && merged[merged.length - 1].role === role) {
      merged[merged.length - 1].content += '\n' + m.content;
    } else {
      merged.push({ role, content: m.content });
    }
  }

  if (merged.length > 0 && merged[0].role !== 'user') {
    merged.unshift({ role: 'user', content: '(继续对话)' });
  }
  if (merged.length === 0) {
    merged.push({ role: 'user', content: '你好' });
  }

  return merged;
}

function buildSystemPrompt(walletContext?: Record<string, unknown>): string {
  const walletState = walletContext
    ? `\n## 当前用户状态\n\`\`\`json\n${JSON.stringify(walletContext, null, 2)}\n\`\`\``
    : '';

  return `你是 Cobo 商户钱包的 AI 交易助手。你的职责是帮助用户查询资产、理解交易、管理资金风控，并解答产品使用问题。

## 安全规则
- 你不能直接执行任何交易。如果用户要求转账，请使用 prepare_transfer 工具。
- 你不能修改任何安全设置。引导用户前往对应设置页面。
- 不要泄露完整的钱包地址，使用缩写显示。
- 如果用户询问的内容超出产品范围，礼貌告知并引导回产品功能。

## 工具使用规则
- 当用户查询余额时，调用 query_balance 工具，前端会展示余额卡片
- 当用户查询交易记录时，调用 query_transactions 工具，前端会展示交易列表卡片
- 当用户要求转账时，调用 prepare_transfer 工具，前端会展示转账确认卡片
- 当用户询问如何操作某功能时，调用 navigate_to 工具引导跳转
- 当用户查询资金风控状态时，调用 query_fund_risk 工具
- 调用工具的同时，你也应该用文字简要说明结果

${walletState}

${KNOWLEDGE_BASE}

## 回复要求
- 使用中文回复
- 保持简洁友好，语气专业但不生硬
- 涉及金额时使用准确数字
- 当用户询问操作方法时，给出清晰的步骤说明
- 当用户询问余额等可以从上下文获取的信息时，直接使用上下文数据回答
- 使用 Markdown 格式化回复，适当使用列表、粗体等
- 回复长度适中，不要过于冗长`;
}

// ─── Vite plugin ────────────────────────────────────────────────────────────

export function anthropicProxy(options?: { apiKey?: string }): Plugin {
  const resolvedApiKey = options?.apiKey;

  return {
    name: 'anthropic-dev-proxy',
    configureServer(server) {
      server.middlewares.use('/api/ai-chat', async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
        // Only handle POST
        if (req.method === 'OPTIONS') {
          res.writeHead(204, {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
          });
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          next();
          return;
        }

        const apiKey = resolvedApiKey || process.env.ANTHROPIC_API_KEY;
        if (!apiKey) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY 未配置。请在 .env 文件中添加 ANTHROPIC_API_KEY=sk-ant-...' }));
          return;
        }

        try {
          const body = await readBody(req);
          const { messages, walletContext } = JSON.parse(body);

          const systemPrompt = buildSystemPrompt(walletContext);
          const cleanMessages = sanitizeMessages(messages || []);
          const model = process.env.ANTHROPIC_MODEL || 'claude-sonnet-4-20250514';

          const anthropicResp = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'x-api-key': apiKey,
              'anthropic-version': '2023-06-01',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model,
              max_tokens: 4096,
              system: systemPrompt,
              messages: cleanMessages,
              tools,
              stream: true,
            }),
          });

          if (!anthropicResp.ok) {
            const status = anthropicResp.status;
            let errorMsg = 'AI 服务暂时不可用';

            if (status === 401) errorMsg = 'API Key 无效，请检查 .env 中的 ANTHROPIC_API_KEY';
            else if (status === 429) errorMsg = '请求过于频繁，请稍后再试';
            else if (status === 529) errorMsg = 'Anthropic API 暂时过载，请稍后再试';
            else {
              const errBody = await anthropicResp.text();
              console.error(`[ai-proxy] Anthropic API error ${status}:`, errBody);
            }

            res.writeHead(status >= 400 && status < 600 ? status : 500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: errorMsg }));
            return;
          }

          // Stream the Anthropic SSE response to the client
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
          });

          const reader = (anthropicResp.body as ReadableStream<Uint8Array>).getReader();
          try {
            while (true) {
              const { done, value } = await reader.read();
              if (done) break;
              res.write(Buffer.from(value));
            }
          } finally {
            reader.releaseLock();
          }
          res.end();
        } catch (e) {
          console.error('[ai-proxy] Error:', e);
          if (!res.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
          }
          res.end(JSON.stringify({ error: e instanceof Error ? e.message : '代理服务错误' }));
        }
      });
    },
  };
}
