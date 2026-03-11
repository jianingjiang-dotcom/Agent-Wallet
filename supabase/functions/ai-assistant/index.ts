import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

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
- 失败原因：Gas不足、合约revert、能量不足(Tron)

### 支持币种
- 稳定币：USDT、USDC（ERC-20/TRC-20/BEP-20/SPL）
- 主流币：ETH、BNB、TRX、SOL

### 各链确认时间
- Ethereum：1-5分钟 | Tron：1-3分钟 | BNB Chain：15-30秒 | Solana：几秒-1分钟

### 安全设置
- 6位PIN码、生物识别、设备管理、转账限额、白名单

### 收款钱包与资金隔离
- 收款钱包独立接收外部资金
- KYT扫描分类：安全(绿)、待确认(黄)、风险(红)
- KYT服务商：Chainalysis、TRM Labs、Elliptic

### 资金归集
- 安全资金可归集到主钱包或外部地址，需支付手续费

### 风控管理
- 查看风险交易详情、冻结可疑资金、退回风险资金、解冻确认安全的资金

### TSS密钥备份
- 云端备份(iCloud/Google Drive)、本地文件备份
- 恢复：云端>本地文件>旧设备扫码

### PSP服务商
- 通过授权码连接，管理权限(余额/交易/收款/转账/提现)
- 状态：活跃、暂停、待审核、过期、拒绝

### 钱包管理
- 主钱包(日常交易)、收款钱包(资金隔离)、逃生钱包(自托管)
- 双模式：用户创建钱包（用户签名）与 Agent 关联钱包（Agent 签名，用户提交请求）

### 地址簿
- 添加联系人、设置白名单、按网络分类(EVM/Tron/Solana)
`;

/**
 * Anthropic tool definitions.
 * Format: { name, description, input_schema }
 * (differs from OpenAI's nested { type: "function", function: { name, parameters } })
 */
const tools = [
  {
    name: "query_balance",
    description: "查询用户的资产余额。当用户询问余额、资产状况时调用。",
    input_schema: {
      type: "object",
      properties: {
        symbol: { type: "string", description: "币种 (如 USDT, ETH)，不传则查全部" },
        chain: { type: "string", description: "网络 (ethereum/tron/bsc/solana)" },
      },
    },
  },
  {
    name: "query_transactions",
    description: "查询最近的交易记录。当用户询问交易历史时调用。",
    input_schema: {
      type: "object",
      properties: {
        count: { type: "number", description: "查询数量，默认 5，最多 5" },
        type: { type: "string", enum: ["all", "send", "receive"], description: "交易类型" },
      },
    },
  },
  {
    name: "prepare_transfer",
    description: "准备转账（不会直接执行，会在前端生成确认卡片让用户确认）。当用户要求转账时调用。",
    input_schema: {
      type: "object",
      properties: {
        to: { type: "string", description: "收款地址" },
        amount: { type: "number", description: "金额" },
        symbol: { type: "string", description: "币种" },
        chain: { type: "string", description: "网络" },
      },
      required: ["to", "amount", "symbol"],
    },
  },
  {
    name: "navigate_to",
    description: "引导用户跳转到产品页面。当用户询问如何操作时，可以引导到对应页面。",
    input_schema: {
      type: "object",
      properties: {
        page: {
          type: "string",
          enum: ["send", "receive", "history", "security", "wallets", "contacts", "psp", "risk", "consolidate", "help"],
          description: "目标页面",
        },
      },
      required: ["page"],
    },
  },
  {
    name: "query_fund_risk",
    description: "查询收款钱包的资金风控状态。当用户询问资金安全、风控状态时调用。",
    input_schema: {
      type: "object",
      properties: {
        walletId: { type: "string", description: "钱包 ID，不传则查当前收款钱包" },
      },
    },
  },
];

/**
 * Sanitize messages for the Anthropic Messages API:
 * - Filter out 'system' role (handled separately via `system` param)
 * - Merge consecutive same-role messages (Anthropic requires alternating roles)
 * - Ensure the first message is from 'user'
 */
function sanitizeMessages(
  messages: { role: string; content: string }[]
): { role: "user" | "assistant"; content: string }[] {
  // 1. Keep only user/assistant messages
  const filtered = messages.filter(
    (m) => m.role === "user" || m.role === "assistant"
  );

  // 2. Merge consecutive same-role messages
  const merged: { role: "user" | "assistant"; content: string }[] = [];
  for (const m of filtered) {
    const role = m.role as "user" | "assistant";
    if (merged.length > 0 && merged[merged.length - 1].role === role) {
      merged[merged.length - 1].content += "\n" + m.content;
    } else {
      merged.push({ role, content: m.content });
    }
  }

  // 3. Ensure first message is from user
  if (merged.length > 0 && merged[0].role !== "user") {
    merged.unshift({ role: "user", content: "(继续对话)" });
  }

  // 4. Ensure we have at least one message
  if (merged.length === 0) {
    merged.push({ role: "user", content: "你好" });
  }

  return merged;
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, walletContext } = await req.json();

    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      throw new Error(
        "ANTHROPIC_API_KEY is not configured. Set it via: supabase secrets set ANTHROPIC_API_KEY=sk-ant-..."
      );
    }

    // Build system prompt with wallet context
    const walletState = walletContext
      ? `\n## 当前用户状态\n\`\`\`json\n${JSON.stringify(walletContext, null, 2)}\n\`\`\``
      : "";

    const systemPrompt = `你是 Cobo 商户钱包的 AI 交易助手。你的职责是帮助用户查询资产、理解交易、管理资金风控，并解答产品使用问题。

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

    // Sanitize messages for Anthropic API requirements
    const cleanMessages = sanitizeMessages(messages);

    // Model: configurable via env, defaults to Claude Sonnet 4
    const model = Deno.env.get("ANTHROPIC_MODEL") || "claude-sonnet-4-20250514";

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
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

    if (!response.ok) {
      const status = response.status;

      if (status === 429) {
        return new Response(
          JSON.stringify({ error: "请求过于频繁，请稍后再试" }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (status === 401) {
        return new Response(
          JSON.stringify({ error: "API Key 无效，请检查 ANTHROPIC_API_KEY 配置" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      if (status === 529) {
        return new Response(
          JSON.stringify({ error: "Anthropic API 暂时过载，请稍后再试" }),
          {
            status: 529,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      const errorBody = await response.text();
      console.error("Anthropic API error:", status, errorBody);
      return new Response(
        JSON.stringify({ error: "AI 服务暂时不可用" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Stream the Anthropic SSE response directly to the client
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
