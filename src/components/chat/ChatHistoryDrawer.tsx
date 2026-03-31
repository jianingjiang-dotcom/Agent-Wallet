import { ReactNode, useState, useRef, useCallback, useEffect } from 'react';
import { isToday, isYesterday, subDays, isAfter } from 'date-fns';
import { Copy, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { EmptyIcon } from '@/components/icons/EmptyIcon';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatSession } from '@/types/chat';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface ChatHistoryDrawerProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sessions: ChatSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onDeleteSession: (id: string) => void;
}

function groupSessions(sessions: ChatSession[]) {
  const groups: { label: string; items: ChatSession[] }[] = [];
  const today: ChatSession[] = [];
  const yesterday: ChatSession[] = [];
  const week: ChatSession[] = [];
  const older: ChatSession[] = [];

  const weekAgo = subDays(new Date(), 7);

  for (const s of sessions) {
    const d = new Date(s.updatedAt);
    if (isToday(d)) today.push(s);
    else if (isYesterday(d)) yesterday.push(s);
    else if (isAfter(d, weekAgo)) week.push(s);
    else older.push(s);
  }

  if (today.length) groups.push({ label: '今天', items: today });
  if (yesterday.length) groups.push({ label: '昨天', items: yesterday });
  if (week.length) groups.push({ label: '7天内', items: week });
  if (older.length) groups.push({ label: '更早', items: older });

  return groups;
}

interface ContextMenuState {
  sessionId: string;
  title: string;
  itemRect: { left: number; top: number; width: number; height: number };
}

export function ChatHistoryDrawer({
  children,
  open,
  onOpenChange,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
}: ChatHistoryDrawerProps) {
  const groups = groupSessions(sessions);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const showContextMenu = useCallback((target: HTMLElement, sessionId: string, title: string) => {
    const rect = target.getBoundingClientRect();
    setContextMenu({
      sessionId,
      title,
      itemRect: { left: rect.left, top: rect.top, width: rect.width, height: rect.height },
    });
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent, sessionId: string, title: string) => {
    clearLongPress();
    const target = e.currentTarget as HTMLElement;
    longPressTimer.current = setTimeout(() => {
      showContextMenu(target, sessionId, title);
      longPressTimer.current = null;
    }, 500);
  }, [clearLongPress, showContextMenu]);

  const handlePointerUp = useCallback(() => {
    clearLongPress();
  }, [clearLongPress]);

  const handleCopyId = useCallback(() => {
    if (!contextMenu) return;
    navigator.clipboard.writeText(contextMenu.sessionId).catch(() => {});
    toast.success('复制成功');
    setContextMenu(null);
  }, [contextMenu]);

  const handleDelete = useCallback(() => {
    if (!contextMenu) return;
    setDeleteConfirm(contextMenu.sessionId);
    setContextMenu(null);
  }, [contextMenu]);

  const confirmDelete = useCallback(() => {
    if (!deleteConfirm) return;
    onDeleteSession(deleteConfirm);
    setDeleteConfirm(null);
    toast.success('删除成功');
  }, [deleteConfirm, onDeleteSession]);

  const cancelDelete = useCallback(() => {
    setDeleteConfirm(null);
  }, []);

  // Close context menu on click outside
  useEffect(() => {
    if (!contextMenu) return;
    const handleClick = (e: PointerEvent) => {
      const target = e.target as Node;
      if (menuRef.current?.contains(target)) return;
      if (overlayRef.current?.contains(target)) {
        setContextMenu(null);
        return;
      }
      setContextMenu(null);
    };
    // Use a small delay to avoid closing immediately
    const timer = setTimeout(() => {
      document.addEventListener('pointerdown', handleClick);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('pointerdown', handleClick);
    };
  }, [contextMenu]);

  // Close context menu when drawer closes
  useEffect(() => {
    if (!open) setContextMenu(null);
  }, [open]);

  const isSelected = (id: string) => id === currentSessionId;

  return (
    <div className="h-full relative overflow-hidden">
      {/* Main content - always in place, never pushed */}
      {children}

      {/* Overlay backdrop */}
      <div
        className={cn(
          "fixed inset-0 z-30 bg-black transition-opacity duration-300 ease-in-out",
          open ? "opacity-[0.4] pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Drawer panel - slides in from left, overlays on top */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-40 w-[70%] bg-background transition-transform duration-300 ease-in-out flex flex-col",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="h-[44px] shrink-0" />
        <div className="flex items-center h-[44px] px-5 shrink-0">
          <h2 className="text-[18px] leading-[28px] font-semibold">对话记录</h2>
        </div>

        <ScrollArea className="flex-1">
          {groups.length === 0 ? (
            <div className="flex items-center justify-center" style={{ height: 'calc(100vh - 44px - 44px)' }}>
              <div style={{ marginTop: '-15vh' }}>
                <EmptyState customIcon={<EmptyIcon />} title="暂无对话记录" />
              </div>
            </div>
          ) : (
            <div className="px-2 py-2 space-y-1">
              {groups.map(g => (
                <div key={g.label}>
                  <div className="space-y-1">
                    {g.items.map(s => (
                      <div
                        key={s.id}
                        className={cn(
                          'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all select-none',
                          (contextMenu ? contextMenu.sessionId === s.id : isSelected(s.id)) ? 'bg-[rgba(31,50,214,0.1)]' : ''
                        )}
                        onClick={() => {
                          if (!contextMenu) {
                            onSelectSession(s.id);
                            onOpenChange(false);
                          }
                        }}
                        onPointerDown={(e) => handlePointerDown(e, s.id, s.title)}
                        onPointerUp={handlePointerUp}
                        onPointerLeave={handlePointerUp}
                        onContextMenu={(e) => {
                          e.preventDefault();
                          showContextMenu(e.currentTarget as HTMLElement, s.id, s.title);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className={cn(
                            "text-[16px] leading-[24px] truncate",
                            (contextMenu ? contextMenu.sessionId === s.id : isSelected(s.id))
                              ? "font-medium text-[#1F32D6]"
                              : "text-[#1c1c1c]"
                          )}>{s.title}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>

      {/* Long-press context menu */}
      {contextMenu && (
        <>
          {/* Invisible overlay to catch outside clicks */}
          <div
            ref={overlayRef}
            className="fixed inset-0 z-50"
            onClick={() => setContextMenu(null)}
          />
          {/* Action menu below the item */}
          <div
            ref={menuRef}
            className="fixed z-50 bg-white rounded-[12px] overflow-hidden p-4 flex flex-col gap-4 border border-[#EDEEF3]"
            style={{
              left: 8,
              top: contextMenu.itemRect.top + contextMenu.itemRect.height + 8,
              minWidth: 160,
              boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.08)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="w-full flex items-center gap-2 text-[16px] leading-[24px] font-medium text-[#1c1c1c] active:bg-muted/50 transition-colors"
              onClick={handleCopyId}
            >
              <div className="w-5 h-5 flex items-center justify-center"><Copy className="w-[18px] h-[18px] text-[#1c1c1c]" strokeWidth={1.5} /></div>
              复制对话 ID
            </button>
            <button
              className="w-full flex items-center gap-2 text-[16px] leading-[24px] font-medium text-[#E74E5A] active:bg-muted/50 transition-colors"
              onClick={handleDelete}
            >
              <div className="w-5 h-5 flex items-center justify-center"><Trash2 className="w-[18px] h-[18px]" strokeWidth={1.5} /></div>
              删除
            </button>
          </div>
        </>
      )}

      {/* Delete confirmation dialog */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={cancelDelete}>
          <div
            className="bg-white rounded-[16px] w-[270px] overflow-hidden"
            style={{ boxShadow: '0px 6px 24px rgba(0, 0, 0, 0.12)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-6 pt-5 pb-4 text-center">
              <p className="text-[16px] leading-[22px] font-semibold text-[#1c1c1c]">删除对话</p>
              <p className="text-[14px] leading-[20px] text-[#8E8E93] mt-2">确定要删除这条对话记录吗？此操作不可撤销。</p>
            </div>
            <div className="flex border-t border-[#EDEEF3]">
              <button
                className="flex-1 py-3 text-[16px] leading-[22px] font-medium text-[#1c1c1c] border-r border-[#EDEEF3] active:bg-muted/50 transition-colors"
                onClick={cancelDelete}
              >
                取消
              </button>
              <button
                className="flex-1 py-3 text-[16px] leading-[22px] font-medium text-[#E74E5A] active:bg-muted/50 transition-colors"
                onClick={confirmDelete}
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
