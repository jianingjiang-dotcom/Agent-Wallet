import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowDownLeft, ArrowUpRight, AlertTriangle,
  Bell, Info, Gift, Wrench,
  ChevronRight, ChevronDown, ChevronUp, Inbox, ClipboardCheck, CheckCircle2, XCircle, Bot,
  Wallet, Eraser, Check, ArrowLeftRight, Filter, ShieldCheck
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { Notification, NotificationCategory, NotificationType, AgentTransaction } from '@/types/wallet';
import { MessageListSkeleton } from '@/components/skeletons/MessageListSkeleton';
import { EmptyState } from '@/components/EmptyState';
import { AgentTxCard } from '@/components/AgentTxCard';
import { AgentReviewDrawer } from '@/components/AgentReviewDrawer';
import { toast } from '@/lib/toast';
import { cn } from '@/lib/utils';


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
  const { notifications, markNotificationAsRead, markAllNotificationsAsRead, unreadNotificationCount, wallets, agentTransactions, approveAgentTx, rejectAgentTx, retryFailedTx, voidFailedTx } = useWallet();
  const [activeTab, setActiveTab] = useState<'messages' | 'todo'>('messages');
  const [messageSubTab, setMessageSubTab] = useState<'all' | 'transaction' | 'system'>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [walletFilterOpen, setWalletFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTx, setSelectedTx] = useState<AgentTransaction | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsedGroups, setCollapsedGroups] = useState<Set<string>>(new Set());

  // Pending agent transactions grouped by agent
  const pendingTxs = useMemo(() => {
    return agentTransactions
      .filter(tx => tx.status === 'pending_approval')
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [agentTransactions]);

  const groupedPending = useMemo(() => {
    const groups = new Map<string, AgentTransaction[]>();
    for (const tx of pendingTxs) {
      const key = tx.agentName || tx.agentId;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(tx);
    }
    return Array.from(groups.entries()).map(([name, txs]) => ({
      name,
      txs,
      totalUsd: txs.reduce((s, tx) => s + tx.usdValue, 0),
      allSafe: txs.every(tx => tx.riskScore === 'green'),
    }));
  }, [pendingTxs]);

  const toggleGroupCollapse = (name: string) => {
    setCollapsedGroups(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

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

  const systemNotifications = useMemo(() => {
    return notifications.filter(n => n.category === 'system');
  }, [notifications]);

  const filteredNotifications = useMemo(() => {
    let result = notifications.filter(n => n.category === 'transaction');
    if (walletFilter !== 'all') {
      result = result.filter(n => n.metadata?.walletId === walletFilter);
    }
    return result;
  }, [notifications, walletFilter]);

  const allMessageNotifications = useMemo(() => {
    let result = notifications.filter(n => n.category === 'transaction' || n.category === 'system');
    if (walletFilter !== 'all') {
      result = result.filter(n => !n.metadata?.walletId || n.metadata.walletId === walletFilter);
    }
    return result.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [notifications, walletFilter]);

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
      pageBg="bg-page"
      title="通知中心"
      showBack
      titleSuffix={
        <button
          onClick={() => {
            if (unreadNotificationCount > 0) {
              markAllNotificationsAsRead();
              toast.success('已清除全部未读');
            } else {
              toast.info('暂无未读消息');
            }
          }}
          className="flex items-center justify-center"
        >
          <Eraser style={{ width: 14, height: 14, color: '#000000' }} strokeWidth={1.5} />
        </button>
      }
      rightAction={undefined}
    >
      <SwipeBack>
      <div className="flex flex-col h-full relative">
        {/* Tab bar */}
        <div className="flex items-center border-b border-border mx-4">
          {(['messages', 'todo'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "flex-1 h-[44px] text-[14px] leading-[20px] font-medium transition-colors relative text-center flex items-center justify-center",
                activeTab === tab ? "text-primary" : "text-muted-foreground"
              )}
            >
              {tab === 'messages' ? '消息' : `待办${pendingTxs.length > 0 ? ` (${pendingTxs.length})` : ''}`}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          ))}
        </div>

        {/* Wallet dropdown — full-width with backdrop */}
        <AnimatePresence>
          {wallets.length > 1 && walletFilterOpen && (
            <>
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="absolute inset-0 z-40 bg-black/50"
                style={{ top: 0 }}
                onClick={() => setWalletFilterOpen(false)}
              />
              {/* Full-width dropdown */}
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15 }}
                className="absolute top-0 left-0 right-0 z-50 bg-page border-b border-border shadow-md py-2 rounded-b-xl"
              >
                {[{ id: 'all', name: '全部钱包' }, ...wallets].map((w, i) => (
                  <button
                    key={w.id}
                    onClick={() => { setWalletFilter(w.id); setWalletFilterOpen(false); }}
                    className={cn(
                      "w-full px-4 py-2.5 text-sm text-left flex items-center gap-2 transition-colors",
                      walletFilter === w.id ? "text-accent font-medium" : "text-foreground"
                    )}
                  >
                    <Wallet className={cn("w-4 h-4 shrink-0", walletFilter === w.id ? "text-accent" : "text-muted-foreground")} />
                    <span className="flex-1">{w.name}</span>
                    {walletFilter === w.id && <Check className="w-4 h-4 shrink-0 text-accent" />}
                  </button>
                ))}
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {activeTab === 'messages' ? (
          <>
          {isLoading ? (
            <MessageListSkeleton count={5} showTabs />
          ) : (
            <div className="flex-1 overflow-y-auto">
              {/* 二级 sub-tab: 交易通知 / 系统通知 */}
              <div className="flex items-center px-4 py-4 gap-3">
                {(['all', 'transaction', 'system'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setMessageSubTab(tab)}
                    className={cn(
                      "flex-1 h-8 text-[12px] leading-[16px] rounded-full transition-colors",
                      messageSubTab === tab
                        ? "bg-primary text-primary-foreground font-medium"
                        : "bg-[#F7F8FA] text-[#000000]"
                    )}
                  >
                    {tab === 'all' ? '全部' : tab === 'transaction' ? '交易通知' : '系统通知'}
                  </button>
                ))}
              </div>
              <div className="px-4 pt-0 pb-[72px] no-card-shadow space-y-3">
                {(() => {
                  const displayList = messageSubTab === 'all' ? allMessageNotifications : messageSubTab === 'transaction' ? filteredNotifications : systemNotifications;
                  const emptyTitle = messageSubTab === 'all' ? '暂无消息' : messageSubTab === 'transaction' ? '暂无交易通知' : '暂无系统通知';
                  const emptyDesc = messageSubTab === 'all' ? '所有通知消息都会显示在这里' : messageSubTab === 'transaction' ? '所有交易通知都会显示在这里' : '所有系统通知都会显示在这里';

                  if (displayList.length === 0) {
                    return (
                      <div className="pt-12">
                        <EmptyState icon={Inbox} title={emptyTitle} description={emptyDesc} />
                      </div>
                    );
                  }

                  return (
                    <AnimatePresence>
                      {displayList.map((notification, index) => {
                        const { icon: Icon, color, bg } = getNotificationIcon(notification.type);
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            className={cn(
                              "px-4 py-3.5 card-elevated active:bg-muted/40 transition-colors cursor-pointer",
                              notification.isRead ? 'opacity-60' : ''
                            )}
                            onClick={() => handleNotificationClick(notification)}
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
                                <div className="flex items-center gap-1 mt-2">
                                  <span className="text-xs text-accent font-medium">查看详情</span>
                                  <ChevronRight className="w-3 h-3 text-accent" />
                                </div>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  );
                })()}
              </div>
            </div>
          )}
          </>
        ) : (
          /* 待办 Tab */
          <div className="flex-1 overflow-y-auto">
            {pendingTxs.length === 0 ? (
              <div className="pt-12">
                <EmptyState
                  icon={Inbox}
                  title="暂无待办"
                  description="所有待办事项都会显示在这里"
                />
              </div>
            ) : (
              <div className="px-4 pt-4 pb-[72px] space-y-4 no-card-shadow">
                {groupedPending.map((group) => {
                  const isCollapsed = collapsedGroups.has(group.name);
                  return (
                    <div key={group.name}>
                      {/* Group header */}
                      <button
                        onClick={() => toggleGroupCollapse(group.name)}
                        className="w-full flex items-center gap-2 py-2 text-left"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[14px] leading-[20px] font-semibold text-foreground truncate">{group.name}</span>
                            <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-medium">
                              {group.txs.length} 笔
                            </span>
                            {group.allSafe && (
                              <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 font-medium">
                                <ShieldCheck className="w-3 h-3" />
                                安全
                              </span>
                            )}
                          </div>
                          <span className="text-[14px] leading-[20px] text-muted-foreground">
                            ${group.totalUsd.toLocaleString()}
                          </span>
                        </div>
                        {isCollapsed ? (
                          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                        ) : (
                          <ChevronUp className="w-4 h-4 text-muted-foreground shrink-0" />
                        )}
                      </button>

                      {/* Group transactions */}
                      <AnimatePresence>
                        {!isCollapsed && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="card-elevated overflow-hidden"
                          >
                            {group.txs.map((tx, i) => (
                              <motion.div
                                key={tx.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className={i !== group.txs.length - 1 ? 'border-b border-border/60' : ''}
                              >
                                <AgentTxCard
                                  tx={tx}
                                  className="bg-transparent rounded-none"
                                  onClick={() => {
                                    setSelectedTx(tx);
                                    setDrawerOpen(true);
                                  }}
                                />
                              </motion.div>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Agent Review Drawer */}
      <AgentReviewDrawer
        tx={selectedTx}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onApprove={(txId, note) => {
          approveAgentTx(txId, note);
          setDrawerOpen(false);
        }}
        onReject={(txId, reason) => {
          rejectAgentTx(txId, reason);
          setDrawerOpen(false);
        }}
        onRetry={(txId) => retryFailedTx(txId)}
        onVoid={(txId) => voidFailedTx(txId)}
      />
      </SwipeBack>
    </AppLayout>
  );
}
