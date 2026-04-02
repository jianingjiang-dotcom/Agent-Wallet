import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bot, Smartphone, Rocket, ChevronDown, HelpCircle, Copy } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';

const steps = [
  {
    icon: Bot,
    iconBg: 'bg-purple-100 dark:bg-purple-900/30',
    iconColor: 'text-purple-600 dark:text-purple-400',
    title: 'AI 助手创建钱包',
    desc: '您的 AI 助手已经创建好了加密钱包',
  },
  {
    icon: Smartphone,
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    title: '您来认领',
    desc: '在这里输入认领码，钱包就归您管',
  },
  {
    icon: Rocket,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
    title: '开始使用',
    desc: '查看资产、设定规则，AI 助手按您的规矩办事',
  },
];

export default function ClaimIntro() {
  const navigate = useNavigate();
  const [showHelp, setShowHelp] = useState(false);

  return (
    <AppLayout showNav={false} showSecurityBanner={false}>
      <div className="h-full flex flex-col px-6">
        {/* Top section */}
        <div className="flex-1 flex flex-col justify-center">
          {/* Brand + Welcome */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="mb-2"
          >
            <p className="text-sm font-medium text-accent tracking-wide">COBO AGENTIC WALLET</p>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-2xl font-bold text-foreground mb-2"
          >
            欢迎使用
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-sm mb-10 leading-relaxed"
          >
            您的 AI 助手可以帮您操作加密钱包。
            <br />
            这个 App 让您掌握最终控制权。
          </motion.p>

          {/* 3-step flow */}
          <div className="space-y-0">
            {steps.map((step, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
              >
                <div className="flex items-start gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-full ${step.iconBg} flex items-center justify-center shrink-0`}>
                      <step.icon className={`w-5 h-5 ${step.iconColor}`} />
                    </div>
                    {index < steps.length - 1 && (
                      <div className="w-px h-8 bg-border my-1" />
                    )}
                  </div>
                  <div className="pt-1.5 pb-2">
                    <p className="font-semibold text-foreground text-sm">{step.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{step.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="pb-8 space-y-3"
        >
          <Button
            size="lg"
            className="w-full text-base gradient-primary"
            onClick={() => navigate('/claim-wallet')}
          >
            我有认领码，开始认领
          </Button>
          <button
            className="w-full text-center text-sm text-muted-foreground py-2"
            onClick={() => navigate('/home')}
          >
            先看看
          </button>

          {/* "No claim code" expandable help */}
          <div className="pt-1">
            <button
              className="w-full flex items-center justify-center gap-1 text-xs text-primary py-1"
              onClick={() => setShowHelp(!showHelp)}
            >
              <HelpCircle className="w-3.5 h-3.5" />
              还没有认领码？
              <motion.div animate={{ rotate: showHelp ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <ChevronDown className="w-3.5 h-3.5" />
              </motion.div>
            </button>
            <AnimatePresence>
              {showHelp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="mt-2 p-3 bg-muted/50 rounded-xl text-xs leading-relaxed space-y-2">
                    <p className="font-medium text-foreground">在 Agent 环境执行以下指令</p>
                    <div className="relative">
                      <pre className="bg-background rounded-lg p-2.5 pr-9 text-[11px] font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">npx skills add cobosteven/cobo-agent-wallet-manual --skill cobo-agentic-wallet-sandbox --yes --global</pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('npx skills add cobosteven/cobo-agent-wallet-manual --skill cobo-agentic-wallet-sandbox --yes --global');
                        }}
                        className="absolute right-1.5 top-1.5 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
