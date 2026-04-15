import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertOctagon, AlertTriangle, Clock } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { cn } from '@/lib/utils';

const ANNOUNCEMENTS: Record<string, {
  title: string;
  type: 'service_down' | 'chain_congestion';
  timestamp: string;
  content: string;
}> = {
  'ann-service-down': {
    title: '服务暂时不可用',
    type: 'service_down',
    timestamp: '2026-04-12 10:30',
    content: '由于底层链节点升级维护，部分服务暂时不可用。我们正在全力修复中。\n\n受影响的服务：\n· Ethereum 转账\n· 合约交互\n\n预计恢复时间：2026-04-12 12:00\n\n期间您的资产不受影响，请耐心等待。如有紧急需求，请联系客服。',
  },
  'ann-chain-congestion': {
    title: 'Ethereum 网络拥堵',
    type: 'chain_congestion',
    timestamp: '2026-04-12 09:15',
    content: '当前 Ethereum 网络 Gas 价格较高（>80 gwei），交易确认时间可能延长至 10-30 分钟。\n\n建议非紧急交易稍后发送，可选择较低 Gas 费率节省费用。链上资产不受影响。',
  },
};

export default function SystemAnnouncement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const announcement = id ? ANNOUNCEMENTS[id] : null;

  if (!announcement) {
    return (
      <SwipeBack>
        <AppLayout showBack onBack={() => navigate(-1)} title="系统公告" showNav={false} showSecurityBanner={false}>
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">未找到该公告</p>
          </div>
        </AppLayout>
      </SwipeBack>
    );
  }

  const isError = announcement.type === 'service_down';
  const Icon = isError ? AlertOctagon : AlertTriangle;

  return (
    <SwipeBack>
      <AppLayout showBack onBack={() => navigate(-1)} title="系统公告" showNav={false} showSecurityBanner={false} pageBg="bg-page">
        <div className="px-4 py-5">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-card rounded-2xl border border-border/60 shadow-sm p-5"
          >
            {/* Header */}
            <div className="flex items-center gap-3 mb-4">
              <div className={cn(
                'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                isError ? 'bg-destructive/10' : 'bg-warning/10'
              )}>
                <Icon className={cn('w-4.5 h-4.5', isError ? 'text-destructive' : 'text-warning')} strokeWidth={1.5} />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-foreground">{announcement.title}</h2>
                <div className="flex items-center gap-1 mt-0.5">
                  <Clock className="w-3 h-3 text-muted-foreground" strokeWidth={1.5} />
                  <span className="text-[11px] text-muted-foreground">{announcement.timestamp}</span>
                </div>
              </div>
            </div>

            <div className="h-px bg-border/40 mb-4" />

            {/* Content */}
            <div className="space-y-0">
              {announcement.content.split('\n').map((line, i) => (
                <p key={i} className={cn(
                  'text-[13px] leading-relaxed',
                  line.trim() === '' ? 'h-3' : 'text-foreground/80'
                )}>
                  {line}
                </p>
              ))}
            </div>
          </motion.div>
        </div>
      </AppLayout>
    </SwipeBack>
  );
}
