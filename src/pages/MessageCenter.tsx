import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Check } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { MessageCard } from '@/components/notifications/MessageCard';
import { TodoCard } from '@/components/notifications/TodoCard';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';
import type { MessageCategory, TodoType } from '@/types/notification';

type MainTab = 'messages' | 'todos';
type MessageFilter = 'all' | MessageCategory;
export default function MessageCenter() {
  const navigate = useNavigate();
  const {
    messages, todoItems,
    unreadMessageCount, pendingTodoCount,
    markMessageAsRead, markAllMessagesAsRead,
  } = useWallet();

  const [mainTab, setMainTab] = useState<MainTab>('messages');
  const [messageFilter, setMessageFilter] = useState<MessageFilter>('all');
  const [todoFilter, setTodoFilter] = useState<TodoFilter>('all');

  // Filtered messages
  const filteredMessages = useMemo(() => {
    const sorted = [...messages].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    if (messageFilter === 'all') return sorted;
    return sorted.filter(m => m.category === messageFilter);
  }, [messages, messageFilter]);

  // Group messages by date
  const groupedMessages = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { label: string; items: typeof filteredMessages }[] = [];
    const todayItems = filteredMessages.filter(m => m.timestamp >= today);
    const yesterdayItems = filteredMessages.filter(m => m.timestamp >= yesterday && m.timestamp < today);
    const earlierItems = filteredMessages.filter(m => m.timestamp < yesterday);

    if (todayItems.length) groups.push({ label: '今天', items: todayItems });
    if (yesterdayItems.length) groups.push({ label: '昨天', items: yesterdayItems });
    if (earlierItems.length) groups.push({ label: '更早', items: earlierItems });
    return groups;
  }, [filteredMessages]);

  // Filtered todos — by type, pending first then completed
  const filteredTodos = useMemo(() => {
    let items = [...todoItems];
    if (todoFilter !== 'all') {
      items = items.filter(t => t.type === todoFilter);
    }
    // pending first (sorted by createdAt desc), then completed (sorted by completedAt desc)
    const pending = items.filter(t => t.status === 'pending').sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    const completed = items.filter(t => t.status !== 'pending').sort((a, b) => (b.completedAt?.getTime() ?? 0) - (a.completedAt?.getTime() ?? 0));
    return [...pending, ...completed];
  }, [todoItems, todoFilter]);

  const messageFilterTabs: { key: MessageFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'transaction', label: '交易' },
    { key: 'pact', label: 'Pact' },
    { key: 'system', label: '系统' },
  ];

  const todoFilterTabs: { key: TodoFilter; label: string }[] = [
    { key: 'all', label: '全部' },
    { key: 'pact_approval', label: 'Pact 审批' },
    { key: 'excess_approval', label: '超额审批' },
    { key: 'tss_signing', label: 'TSS 签名' },
  ];

  return (
    <SwipeBack>
      <AppLayout
        showNav={false}
        showBack
        onBack={() => navigate(-1)}
        title="通知中心"
        showSecurityBanner={false}
        headerRight={
          mainTab === 'messages' && unreadMessageCount > 0 ? (
            <button
              onClick={markAllMessagesAsRead}
              className="flex items-center gap-1 text-xs text-primary"
            >
              <Check className="w-3.5 h-3.5" />
              全部已读
            </button>
          ) : undefined
        }
      >
        <div className="flex flex-col h-full">
          {/* Main Tabs */}
          <div className="flex border-b border-border px-4">
            <button
              onClick={() => setMainTab('messages')}
              className={cn(
                'flex-1 py-3 text-sm font-medium text-center relative transition-colors',
                mainTab === 'messages' ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              消息
              {unreadMessageCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-primary text-primary-foreground">
                  {unreadMessageCount}
                </span>
              )}
              {mainTab === 'messages' && (
                <motion.div
                  layoutId="main-tab-indicator"
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
            <button
              onClick={() => setMainTab('todos')}
              className={cn(
                'flex-1 py-3 text-sm font-medium text-center relative transition-colors',
                mainTab === 'todos' ? 'text-foreground' : 'text-muted-foreground'
              )}
            >
              待办
              {pendingTodoCount > 0 && (
                <span className="ml-1 inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold rounded-full bg-destructive text-destructive-foreground">
                  {pendingTodoCount}
                </span>
              )}
              {mainTab === 'todos' && (
                <motion.div
                  layoutId="main-tab-indicator"
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary rounded-full"
                />
              )}
            </button>
          </div>

          {/* Sub-filters */}
          <div className="px-4 py-2">
            {mainTab === 'messages' ? (
              <div className="flex gap-2">
                {messageFilterTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setMessageFilter(tab.key)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                      messageFilter === tab.key
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex gap-2">
                {todoFilterTabs.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setTodoFilter(tab.key)}
                    className={cn(
                      'px-3 py-1.5 text-xs font-medium rounded-full transition-colors',
                      todoFilter === tab.key
                        ? 'bg-foreground text-background'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <AnimatePresence mode="wait">
              {mainTab === 'messages' ? (
                <motion.div
                  key="messages"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {groupedMessages.length === 0 ? (
                    <div className="pt-20">
                      <EmptyState
                        icon={<Inbox className="w-10 h-10 text-muted-foreground/40" />}
                        title="暂无消息"
                        description="新的消息将在这里显示"
                      />
                    </div>
                  ) : (
                    <div className="px-2">
                      {groupedMessages.map(group => (
                        <div key={group.label}>
                          <p className="px-3 pt-3 pb-1 text-xs font-medium text-muted-foreground">
                            {group.label}
                          </p>
                          {group.items.map(msg => (
                            <MessageCard
                              key={msg.id}
                              message={msg}
                              onRead={markMessageAsRead}
                            />
                          ))}
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="todos"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                >
                  {filteredTodos.length === 0 ? (
                    <div className="pt-20">
                      <EmptyState
                        icon={<Inbox className="w-10 h-10 text-muted-foreground/40" />}
                        title="暂无待办事项"
                        description="新的审批和签名请求将在这里显示"
                      />
                    </div>
                  ) : (
                    <div className="px-4 space-y-3 py-2">
                      {filteredTodos.map(item => (
                        <TodoCard
                          key={item.id}
                          item={item}
                        />
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </AppLayout>
    </SwipeBack>
  );
}
