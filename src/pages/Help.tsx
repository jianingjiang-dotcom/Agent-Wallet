import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, CreditCard, Send, Shield, Coins, Clock,
  MessageCircle, Mail, Phone, FileText, Lock, Info, ChevronRight, X
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';

const faqItems = [
  {
    id: 'receive',
    icon: CreditCard,
    question: '如何收款？',
    answer: `您可以通过以下步骤接收数字货币：

1. 点击底部"收款"按钮
2. 选择要收款的网络（如 Ethereum）
3. 向付款方展示二维码或复制地址
4. 等待付款方完成转账

⚠️ 请确保付款方使用正确的网络转账，否则资产可能无法到账。`,
  },
  {
    id: 'send',
    icon: Send,
    question: '如何转账？',
    answer: `转账步骤如下：

1. 点击底部"转账"按钮
2. 输入或扫描收款地址
3. 选择要转账的币种和网络
4. 输入转账金额
5. 确认交易信息并完成身份验证

💡 建议首次向新地址转账时先进行小额测试。`,
  },
  {
    id: 'security',
    icon: Shield,
    question: '如何保护我的资产？',
    answer: `我们提供多层安全保护：

• 设置强密码和支付密码
• 启用生物识别（指纹/面容）
• 定期检查授权设备
• 开启大额交易提醒
• 使用白名单功能
• 注意防范钓鱼攻击

如遇可疑情况，请立即联系客服。`,
  },
  {
    id: 'tokens',
    icon: Coins,
    question: '支持哪些数字货币？',
    answer: `目前支持的主流币种包括：

• 稳定币：USDT、USDC
• 主流币：ETH、BNB、TRX
• 以及其他 ERC-20、BEP-20、TRC-20 代币

我们持续添加新币种支持，敬请关注更新。`,
  },
  {
    id: 'time',
    icon: Clock,
    question: '转账需要多长时间？',
    answer: `转账时间取决于网络拥堵程度：

• Tron (TRX): 通常 1-3 分钟
• Ethereum (ETH): 通常 1-5 分钟
• BNB Chain: 通常 15-30 秒

网络拥堵时可能需要更长时间。您可以通过交易详情查看实时状态。`,
  },
];

const contactItems = [
  {
    icon: MessageCircle,
    title: '在线客服',
    description: '工作时间 9:00-21:00',
    action: '立即咨询',
  },
  {
    icon: Mail,
    title: '发送邮件',
    description: 'support@example.com',
    action: '发送',
  },
  {
    icon: Phone,
    title: '电话支持',
    description: '400-xxx-xxxx',
    action: '拨打',
  },
];

const moreItems = [
  { icon: FileText, label: '用户协议', path: '/terms' },
  { icon: Lock, label: '隐私政策', path: '/privacy' },
  { icon: Info, label: '关于我们', path: '/about' },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredFaq = searchQuery
    ? faqItems.filter(
        item =>
          item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.answer.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : faqItems;

  return (
    <AppLayout showNav={false} title="帮助与支持" showBack>
      <div className="px-4 py-4 space-y-4">
        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索帮助内容..."
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </motion.div>

        {/* FAQ */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">常见问题</h3>
          <div className="card-elevated overflow-hidden">
            <Accordion type="single" collapsible className="w-full">
              {filteredFaq.map((item) => {
                const Icon = item.icon;
                return (
                  <AccordionItem key={item.id} value={item.id} className="border-b border-border last:border-b-0">
                    <AccordionTrigger className="px-3 py-3 hover:no-underline hover:bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                          <Icon className="w-4 h-4 text-accent" />
                        </div>
                        <span className="text-sm font-medium text-left">{item.question}</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-4">
                      <div className="pl-11 text-sm text-muted-foreground whitespace-pre-line">
                        {item.answer}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
            
            {filteredFaq.length === 0 && (
              <div className="p-8 text-center">
                <p className="text-sm text-muted-foreground">未找到相关问题</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Contact Us */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">联系我们</h3>
          <div className="card-elevated overflow-hidden">
            {contactItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.title}
                  className={cn(
                    'w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors',
                    index !== contactItems.length - 1 && 'border-b border-border'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.description}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* More */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">更多</h3>
          <div className="card-elevated overflow-hidden">
            {moreItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  className={cn(
                    'w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors',
                    index !== moreItems.length - 1 && 'border-b border-border'
                  )}
                >
                  <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <span className="flex-1 text-left text-sm font-medium">{item.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Version Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center py-4"
        >
          <p className="text-xs text-muted-foreground">版本 1.0.0 (Build 100)</p>
        </motion.div>
      </div>
    </AppLayout>
  );
}
