import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownLeft, ArrowUpRight, AlertTriangle,
  Bell, Info, Gift, Wrench,
  ChevronRight, Inbox, ClipboardCheck, CheckCircle2, XCircle, Bot, Wallet
} from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { useWallet } from '@/contexts/WalletContext';
import { Notification, NotificationCategory, NotificationType } from '@/types/wallet';
import { MessageListSkeleton } from '@/components/skeletons/MessageListSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<string, { title: string; category: NotificationCategory }> = {
  agent:  { title: '审核消息', category: 'agent' },
  system: { title: '系统通知', category: 'system' },
};

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case 'transaction_in':
      return { icon: ArrowDownLeft, color: 'text-success', bg: 'bg-success/10' };
    case 'transaction_out':
      return { icon: ArrowUpRight, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    case 'large_amount':
      return { icon: AlertTriangle, color: 'text-warning', bg: 'bg-warning/10' };
    case 'agent_tx_pending':
      return { icon: ClipboardCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' };
    case 'agent_tx_approved':
    case 'agent_tx_settled':
      return { icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' };
    case 'agent_tx_rejected':
    case 'agent_tx_expired':
      return { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10' };
    case 'agent_tx_failed':
      return { icon: AlertTriangle, color: 'text-red-500', bg: 'bg-red-500/10' };
    case 'agent_tx_broadcasting':
    case 'agent_paused':
    case 'api_key_created':
    case 'api_key_revoked':
      return { icon: Bot, color: 'text-blue-500', bg: 'bg-blue-500/10' };
    case 'system_update':
      return { icon: Bell, color: 'text-muted-foreground', bg: 'bg-muted' };
    case 'maintenance':
      return { icon: Wrench, color: 'text-muted-foreground', bg: 'bg-muted' };
    case 'promotion':
      return { icon: Gift, color: 'text-purple-500', bg: 'bg-purple-500/10' };
    default:
      return { icon: Info, color: 'text-muted-foreground', bg: 'bg-muted' };
  }
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (minutes < 1) return '刚刚';
  if (minutes < 60) return `${minutes}分钟前`;
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
}

function groupByDate(notifications: Notification[]) {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const groups: { label: string; items: Notification[] }[] = [
    { label: '今天', items: [] },
    { label: '昨天', items: [] },
    { label: '更早', items: [] },
  ];
  notifications.forEach(n => {
    const d = new Date(n.timestamp.getFullYear(), n.timestamp.getMonth(), n.timestamp.getDate());
    if (d.getTime() === today.getTime()) groups[0].items.push(n);
    else if (d.getTime() === yesterday.getTime()) groups[1].items.push(n);
    else groups[2].items.push(n);
  });
  return groups.filter(g => g.items.length > 0);
}

export default function MessageCategoryPage() {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const { notifications, markNotificationAsRead, wallets } = useWallet();
  const [isLoading, setIsLoading] = useState(true);

  const config = CATEGORY_CONFIG[type ?? ''];

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const walletNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    wallets.forEach(w => { map[w.id] = w.name; });
    return map;
  }, [wallets]);

  const filtered = useMemo(() => {
    if (!config) return [];
    return notifications.filter(n => n.category === config.category);
  }, [notifications, config]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  const handleClick = (notification: Notification) => {
    if (!notification.isRead) markNotificationAsRead(notification.id);
    if (notification.action?.route) navigate(notification.action.route);
  };

  if (!config) return null;

  return (
    <AppLayout showNav={false} pageBg="bg-page" title={config.title} showBack>
      <SwipeBack>
        <div className="flex flex-col h-full">
          {isLoading ? (
            <MessageListSkeleton count={4} />
          ) : (
            <div className="flex-1 overflow-y-auto">
              {grouped.length === 0 ? (
                <div className="pt-12">
                  <EmptyState icon={Inbox} title="暂无消息" description="所有通知消息都会显示在这里" />
                </div>
              ) : (
                <div className="px-4 pt-4 pb-[72px] no-card-shadow">
                  <AnimatePresence>
                    {grouped.map(group => (
                      <div key={group.label} className="mb-6">
                        <p className="text-xs text-muted-foreground mb-2 px-1">{group.label}</p>
                        <div className="space-y-3">
                          {group.items.map((notification, index) => {
                            const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
                            return (
                              <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className={cn(
                                  'px-4 py-3.5 card-elevated active:bg-muted/40 transition-colors cursor-pointer',
                                  notification.isRead ? 'opacity-60' : ''
                                )}
                                onClick={() => handleClick(notification)}
                              >
                                <div className="flex items-start gap-3">
                                  <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                                    <Icon className={`w-4 h-4 ${color}`} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className={`text-sm font-medium leading-snug ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                                        {notification.title}
                                      </p>
                                      <div className="flex items-center gap-1.5 flex-shrink-0">
                                        {!notification.isRead && (
                                          <div className="w-2 h-2 rounded-full bg-primary" />
                                        )}
                                        <span className="text-[10px] text-muted-foreground">
                                          {formatTime(notification.timestamp)}
                                        </span>
                                      </div>
                                    </div>
                                    {notification.metadata?.walletId && walletNameMap[notification.metadata.walletId] && (
                                      <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground mt-0.5">
                                        <Wallet className="w-2.5 h-2.5" />
                                        {walletNameMap[notification.metadata.walletId]}
                                      </span>
                                    )}
                                    <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                                      {notification.content}
                                    </p>
                                    {notification.action && (
                                      <div className="flex items-center gap-1 mt-2 text-xs text-primary">
                                        <span>{notification.action.label}</span>
                                        <ChevronRight className="w-3 h-3" />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </motion.div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </AnimatePresence>
                </div>
              )}
            </div>
          )}
        </div>
      </SwipeBack>
    </AppLayout>
  );
}
