import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownLeft, ArrowUpRight, AlertTriangle,
  Bell, Info, Gift, Wrench,
  ChevronRight, Inbox, ClipboardCheck, CheckCircle2, XCircle, Bot, Wallet
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { Notification, NotificationCategory, NotificationType } from '@/types/wallet';
import { MessageListSkeleton } from '@/components/skeletons/MessageListSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';

type FilterTab = 'all' | NotificationCategory;

const FILTER_TABS: { key: FilterTab; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'agent', label: '审核' },
  { key: 'transaction', label: '交易' },
  { key: 'system', label: '系统' },
];

// Icon mapping based on notification type
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

// Format timestamp
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

// Group notifications by date
function groupByDate(notifications: Notification[]): { label: string; items: Notification[] }[] {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);

  const groups: { label: string; items: Notification[] }[] = [
    { label: '今天', items: [] },
    { label: '昨天', items: [] },
    { label: '更早', items: [] },
  ];

  notifications.forEach(n => {
    const nDate = new Date(n.timestamp.getFullYear(), n.timestamp.getMonth(), n.timestamp.getDate());
    if (nDate.getTime() === today.getTime()) {
      groups[0].items.push(n);
    } else if (nDate.getTime() === yesterday.getTime()) {
      groups[1].items.push(n);
    } else {
      groups[2].items.push(n);
    }
  });

  return groups.filter(g => g.items.length > 0);
}

export default function MessageCenter() {
  const navigate = useNavigate();
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, unreadNotificationCount, wallets } = useWallet();
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState(true);

  // Map walletId → wallet name for display
  const walletNameMap = useMemo(() => {
    const map: Record<string, string> = {};
    wallets.forEach(w => { map[w.id] = w.name; });
    return map;
  }, [wallets]);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  const filteredNotifications = useMemo(() => {
    let result = notifications;
    if (activeTab !== 'all') {
      result = result.filter(n => n.category === activeTab);
    }
    if (walletFilter !== 'all') {
      result = result.filter(n => n.metadata?.walletId === walletFilter);
    }
    return result;
  }, [notifications, activeTab, walletFilter]);

  const groupedNotifications = useMemo(() => {
    return groupByDate(filteredNotifications);
  }, [filteredNotifications]);

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markNotificationAsRead(notification.id);
    }
    if (notification.action?.route) {
      navigate(notification.action.route);
    }
  };

  return (
    <AppLayout 
      showNav={false} 
      title="消息中心"
      showBack
      rightAction={
        unreadNotificationCount > 0 ? (
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-xs text-primary h-8 px-2"
            onClick={markAllNotificationsAsRead}
          >
            全部已读
          </Button>
        ) : null
      }
    >
      <SwipeBack>
      <div className="flex flex-col h-full">
        {isLoading ? (
          <MessageListSkeleton count={5} showTabs />
        ) : (
          <>
            {/* Filter Tabs - Underline style for secondary filters */}
            <div className="border-b border-border">
              <div className="flex overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                {FILTER_TABS.map(tab => {
                  const count = tab.key === 'all' 
                    ? unreadNotificationCount 
                    : notifications.filter(n => n.category === tab.key && !n.isRead).length;
                  
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={cn(
                        "px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors relative flex items-center gap-1.5",
                        activeTab === tab.key
                          ? "text-accent"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                      {count > 0 && (
                        <span className="min-w-4 h-4 px-1 bg-destructive text-destructive-foreground text-[10px] rounded-full inline-flex items-center justify-center">
                          {count > 99 ? '99+' : count}
                        </span>
                      )}
                      {activeTab === tab.key && (
                        <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-accent rounded-full" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Wallet Filter Pills */}
            {wallets.length > 1 && (
              <div className="flex gap-2 px-4 py-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-b border-border/50">
                <button
                  onClick={() => setWalletFilter('all')}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                    walletFilter === 'all'
                      ? "bg-accent text-white"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  )}
                >
                  全部钱包
                </button>
                {wallets.map(w => (
                  <button
                    key={w.id}
                    onClick={() => setWalletFilter(w.id)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors shrink-0",
                      walletFilter === w.id
                        ? "bg-accent text-white"
                        : "bg-muted text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {w.name}
                  </button>
                ))}
              </div>
            )}

            {/* Notifications List */}
            <div className="flex-1 overflow-y-auto">
              {groupedNotifications.length === 0 ? (
                <div className="pt-12">
                  <EmptyState
                    icon={Inbox}
                    title="暂无消息"
                    description="所有通知消息都会显示在这里"
                  />
                </div>
              ) : (
                <div className="px-4 py-2">
                  <AnimatePresence>
                    {groupedNotifications.map(group => (
                      <div key={group.label} className="mb-4">
                        <p className="text-xs text-muted-foreground mb-2 px-1">{group.label}</p>
                        <div className="space-y-2">
                          {group.items.map((notification, index) => {
                            const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
                            
                            return (
                              <motion.div
                                key={notification.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.03 }}
                                className={`
                                  p-4 rounded-xl bg-card border border-border
                                  ${notification.isRead ? 'opacity-70' : ''}
                                  active:scale-[0.98] transition-transform
                                `}
                                onClick={() => handleNotificationClick(notification)}
                              >
                                <div className="flex items-center gap-3">
                                  {/* Icon - 32px container with 16px icon like toast */}
                                  <div className={`w-8 h-8 rounded-full ${bg} flex items-center justify-center flex-shrink-0`}>
                                    <Icon className={`w-4 h-4 ${color}`} />
                                  </div>
                                  
                                  {/* Content */}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                      <p className={`text-sm font-medium ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
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
          </>
        )}
      </div>
      </SwipeBack>
    </AppLayout>
  );
}
