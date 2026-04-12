

# AI 助手 UI 优化 + 结构化卡片渲染

## 一、UI 细节优化

### 1.1 消息时间戳显示

在每条消息气泡下方添加浅色小字时间戳：
- 用户消息：右对齐，显示 "HH:mm"
- AI 消息：左对齐，显示 "HH:mm"
- 同一分钟内的连续同角色消息只在最后一条显示时间

### 1.2 头像

- AI 消息：左侧显示一个 `MessageSquareText` 图标的圆形头像（accent/10 背景 + accent 色图标），与欢迎区风格一致
- 用户消息：右侧显示 "U" 字母的圆形头像（accent 背景 + 白色文字）
- 头像尺寸 28x28px（w-7 h-7），与气泡顶部对齐

### 1.3 更好的滚动体验

- 当前用 `div` + `overflow-y-auto` 做滚动，改为使用 `smooth` scroll behavior
- 新消息到达时用 `scrollTo({ top: scrollHeight, behavior: 'smooth' })` 平滑滚动
- 添加一个「滚动到底部」的浮动小按钮：当用户往上翻阅时出现，点击回到最新消息

### 1.4 空状态设计优化

- 欢迎区增加渐入动画（使用 framer-motion）
- 快捷操作 pills 添加图标前缀：查余额用 `Wallet` 图标，最近交易用 `ArrowUpDown`，资金风控用 `Shield`，如何收款用 `QrCode`，如何转账用 `Send`，如何保护资产用 `Lock`
- 快捷操作分两行：第一行交易类（3个），第二行问答类（3个）

---

## 二、结构化卡片渲染

### 2.1 卡片类型

创建 5 个独立卡片组件，当 AI 消息的 `card` 字段有值时在文本下方渲染：

| 卡片 | 组件文件 | 触发场景 |
|------|---------|---------|
| 余额卡片 | `BalanceCard.tsx` | 查询余额时 |
| 转账确认卡片 | `TransferCard.tsx` | 要求转账时 |
| 交易记录卡片 | `TransactionCard.tsx` | 查询交易时 |
| 风控摘要卡片 | `RiskSummaryCard.tsx` | 查询风控时 |
| 导航卡片 | `NavigateCard.tsx` | 引导跳转时 |

### 2.2 卡片渲染逻辑

在 `ChatMessage.tsx` 中，AI 消息渲染完 Markdown 内容后，检查 `message.card` 是否存在，存在则渲染对应卡片组件。

### 2.3 Tool Call 触发卡片

在 `AIAssistant.tsx` 中，利用已有的 `onToolCall` 回调。当 AI 调用 tool 时，前端根据 tool 名称和参数，从 WalletContext 中查询数据，构造 `ChatCard` 对象附加到 assistant 消息上。

流程：
1. AI 调用 `query_balance` tool -> 前端从 assets 中过滤 -> 构造 `BalanceCard` 数据 -> 附到消息
2. AI 调用 `prepare_transfer` tool -> 前端构造 `TransferCard` 数据 -> 附到消息
3. AI 调用 `query_transactions` tool -> 前端从 transactions 中取数据 -> 构造 `TransactionCard`
4. AI 调用 `query_fund_risk` tool -> 读取 fundClassification -> 构造 `RiskSummaryCard`
5. AI 调用 `navigate_to` tool -> 构造 `NavigateCard` 数据 -> 附到消息

### 2.4 Edge Function 更新

在 Edge Function 中添加 `tools` 定义，让 AI 模型可以通过 tool calling 触发结构化卡片。包含 5 个 tool：`query_balance`、`query_transactions`、`prepare_transfer`、`navigate_to`、`query_fund_risk`。

---

## 三、各卡片视觉规格

### BalanceCard（余额卡片）
- 圆角卡片 `rounded-xl border bg-card`
- 顶部：币种图标 + 名称 + 总 USD 金额
- 中间：各链余额列表（链名 + 数量 + USD）
- 底部：「查看详情」按钮跳转 `/asset/:symbol`

### TransferCard（转账确认卡片）
- 显示收款方缩写地址、金额、币种、网络
- 底部两个按钮：「取消」（ghost）+ 「去转账」（accent）
- 「去转账」跳转 `/send` 并携带 query params

### TransactionCard（交易记录卡片）
- 最多 5 条记录，每条带方向图标（绿色箭头/红色箭头）
- 显示金额、状态 badge、时间
- 底部「查看全部」按钮跳转 `/history`

### RiskSummaryCard（风控摘要卡片）
- 三列显示：安全（绿）/ 待确认（黄）/ 风险（红）
- 每列显示数量和金额
- 底部「查看详情」跳转资金详情页

### NavigateCard（导航卡片）
- 简洁的按钮样式，显示目标页面名称和箭头
- 点击跳转到对应路由

---

## 四、修改文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `src/components/chat/ChatMessage.tsx` | 修改 | 添加头像、时间戳、卡片渲染 |
| `src/components/chat/QuickActions.tsx` | 修改 | 添加图标、分组布局 |
| `src/pages/AIAssistant.tsx` | 修改 | 添加 tool call 处理、平滑滚动、滚动到底部按钮、欢迎动画 |
| `src/components/chat/BalanceCard.tsx` | 新建 | 余额展示卡片 |
| `src/components/chat/TransferCard.tsx` | 新建 | 转账确认卡片 |
| `src/components/chat/TransactionCard.tsx` | 新建 | 交易记录卡片 |
| `src/components/chat/RiskSummaryCard.tsx` | 新建 | 风控摘要卡片 |
| `src/components/chat/NavigateCard.tsx` | 新建 | 导航引导卡片 |
| `supabase/functions/ai-assistant/index.ts` | 修改 | 添加 tools 定义启用 tool calling |

