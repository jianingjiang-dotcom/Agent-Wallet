import { motion } from 'framer-motion';
import { Shield, Bot, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { cn } from '@/lib/utils';

const modes = [
  {
    id: 'create',
    icon: Shield,
    title: '创建钱包',
    description: '创建 MPC 安全钱包，由您完全控制签名',
    features: ['自主签名', '多重备份', '委托 Agent'],
    color: 'border-accent bg-accent/5',
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    route: '/onboarding?new=true',
  },
  {
    id: 'link',
    icon: Bot,
    title: '关联 Agent 钱包',
    description: '关联 Agent 已创建的钱包，由 Agent 签名执行',
    features: ['Agent 签名', '风控审批', '实时监控'],
    color: 'border-purple-500 bg-purple-50 dark:bg-purple-950/30',
    iconBg: 'bg-purple-100 dark:bg-purple-900/40',
    iconColor: 'text-purple-600 dark:text-purple-400',
    route: '/link-agent-wallet',
  },
];

export default function ModeSelection() {
  const navigate = useNavigate();

  return (
    <AppLayout showNav={false} showSecurityBanner={false}>
      <div className="h-full flex flex-col px-4 py-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">选择钱包模式</h1>
          <p className="text-sm text-muted-foreground">
            您可以之后在设置中添加其他类型的钱包
          </p>
        </motion.div>

        {/* Mode Cards */}
        <div className="flex-1 flex flex-col gap-4">
          {modes.map((mode, index) => {
            const Icon = mode.icon;
            return (
              <motion.button
                key={mode.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => navigate(mode.route)}
                className={cn(
                  'w-full p-5 rounded-xl border-2 text-left transition-all',
                  mode.color
                )}
              >
                <div className="flex items-start gap-4">
                  <div className={cn(
                    'w-12 h-12 rounded-full flex items-center justify-center shrink-0',
                    mode.iconBg
                  )}>
                    <Icon className={cn('w-6 h-6', mode.iconColor)} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-base text-foreground">{mode.title}</h3>
                      <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{mode.description}</p>
                    <div className="flex gap-2 mt-3">
                      {mode.features.map(f => (
                        <span
                          key={f}
                          className="text-[11px] px-2 py-0.5 rounded-full bg-background/60 text-muted-foreground border border-border/50"
                        >
                          {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </AppLayout>
  );
}
