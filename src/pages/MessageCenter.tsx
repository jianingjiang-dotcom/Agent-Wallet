import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Inbox, Settings } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SwipeBack } from '@/components/SwipeBack';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { Switch } from '@/components/ui/switch';
import { useWallet } from '@/contexts/WalletContext';
import { useNavigate } from 'react-router-dom';
import { MessageCard } from '@/components/notifications/MessageCard';
import { TodoCard } from '@/components/notifications/TodoCard';
import { EmptyState } from '@/components/EmptyState';
import { cn } from '@/lib/utils';

type MainTab = 'messages' | 'todos';

export default function MessageCenter() {
  const navigate = useNavigate();
  const {
    messages, todoItems,
    unreadMessageCount, pendingTodoCount,
    markMessageAsRead, markAllMessagesAsRead,
  } = useWallet();

  const [mainTab, setMainTab] = useState<MainTab>('messages');
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Notification preferences (local state for demo)
  const [msgPrefs, setMsgPrefs] = useState({
    transaction: true,
    pact: true,
    system: true,
  });
  const [todoPrefs, setTodoPrefs] = useState({
    pact_approval: true,
    excess_approval: true,
    tss_signing: true,
  });

  // All messages sorted by time, grouped by date
  const sortedMessages = useMemo(() => {
    return [...messages].sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [messages]);

  const groupedMessages = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { label: string; items: typeof sortedMessages }[] = [];
    const todayItems = sortedMessages.filter(m => m.timestamp >= today);
    const yesterdayItems = sortedMessages.filter(m => m.timestamp >= yesterday && m.timestamp < today);
    const earlierItems = sortedMessages.filter(m => m.timestamp < yesterday);

    if (todayItems.length) groups.push({ label: '今天', items: todayItems });
    if (yesterdayItems.length) groups.push({ label: '昨天', items: yesterdayItems });
    if (earlierItems.length) groups.push({ label: '更早', items: earlierItems });
    return groups;
  }, [sortedMessages]);

  // All todos sorted by createdAt, grouped by date
  const sortedTodos = useMemo(() => {
    return [...todoItems].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }, [todoItems]);

  const groupedTodos = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { label: string; items: typeof sortedTodos }[] = [];
    const todayItems = sortedTodos.filter(t => t.createdAt >= today);
    const yesterdayItems = sortedTodos.filter(t => t.createdAt >= yesterday && t.createdAt < today);
    const earlierItems = sortedTodos.filter(t => t.createdAt < yesterday);

    if (todayItems.length) groups.push({ label: '今天', items: todayItems });
    if (yesterdayItems.length) groups.push({ label: '昨天', items: yesterdayItems });
    if (earlierItems.length) groups.push({ label: '更早', items: earlierItems });
    return groups;
  }, [sortedTodos]);

  return (
    <SwipeBack>
      <AppLayout
        showNav={false}
        showBack
        onBack={() => navigate(-1)}
        title="通知中心"
        showSecurityBanner={false}
        rightAction={
          <button
            onClick={() => setSettingsOpen(true)}
            className="p-1 text-muted-foreground transition-colors"
          >
            <Settings className="w-5 h-5" strokeWidth={1.5} />
          </button>
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
                  {groupedTodos.length === 0 ? (
                    <div className="pt-20">
                      <EmptyState
                        icon={<Inbox className="w-10 h-10 text-muted-foreground/40" />}
                        title="暂无待办事项"
                        description="新的审批和签名请求将在这里显示"
                      />
                    </div>
                  ) : (
                    <div className="px-4">
                      {groupedTodos.map(group => (
                        <div key={group.label}>
                          <p className="px-1 pt-3 pb-2 text-xs font-medium text-muted-foreground">
                            {group.label}
                          </p>
                          <div className="space-y-3">
                            {group.items.map(item => (
                              <TodoCard
                                key={item.id}
                                item={item}
                              />
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </AppLayout>

      {/* Settings Drawer */}
      <Drawer open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DrawerContent>
          <div className="px-6 pt-2 pb-8">
            <h3 className="text-base font-semibold text-foreground mb-5">通知设置</h3>

            {/* 消息提醒 */}
            <p className="text-xs text-muted-foreground font-medium mb-3">消息提醒</p>
            <div className="space-y-0 mb-6">
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground">交易消息</span>
                <Switch checked={msgPrefs.transaction} onCheckedChange={(v) => setMsgPrefs(p => ({ ...p, transaction: v }))} />
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground">Pact 状态变更</span>
                <Switch checked={msgPrefs.pact} onCheckedChange={(v) => setMsgPrefs(p => ({ ...p, pact: v }))} />
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground">系统通知</span>
                <Switch checked={msgPrefs.system} onCheckedChange={(v) => setMsgPrefs(p => ({ ...p, system: v }))} />
              </div>
            </div>

            {/* 待办提醒 */}
            <p className="text-xs text-muted-foreground font-medium mb-3">待办提醒</p>
            <div className="space-y-0 mb-6">
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground">Pact 审批</span>
                <Switch checked={todoPrefs.pact_approval} onCheckedChange={(v) => setTodoPrefs(p => ({ ...p, pact_approval: v }))} />
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground">超额交易审批</span>
                <Switch checked={todoPrefs.excess_approval} onCheckedChange={(v) => setTodoPrefs(p => ({ ...p, excess_approval: v }))} />
              </div>
              <div className="flex items-center justify-between py-3">
                <span className="text-sm text-foreground">交易签名</span>
                <Switch checked={todoPrefs.tss_signing} onCheckedChange={(v) => setTodoPrefs(p => ({ ...p, tss_signing: v }))} />
              </div>
            </div>

            {/* 操作 */}
            <div className="border-t border-border pt-4">
              <button
                onClick={() => { markAllMessagesAsRead(); setSettingsOpen(false); }}
                disabled={unreadMessageCount === 0}
                className={cn(
                  'w-full flex items-center justify-between py-3 text-sm transition-colors',
                  unreadMessageCount > 0 ? 'text-foreground' : 'text-muted-foreground/40'
                )}
              >
                全部标记为已读
                {unreadMessageCount > 0 && (
                  <span className="text-xs text-muted-foreground">{unreadMessageCount} 条未读</span>
                )}
              </button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </SwipeBack>
  );
}
