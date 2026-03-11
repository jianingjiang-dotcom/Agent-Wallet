import { format, isToday, isYesterday, subDays, isAfter } from 'date-fns';
import { Trash2, MessageSquareText } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ChatSession } from '@/types/chat';
import { cn } from '@/lib/utils';

interface ChatHistoryDrawerProps {
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

export function ChatHistoryDrawer({
  open,
  onOpenChange,
  sessions,
  currentSessionId,
  onSelectSession,
  onDeleteSession,
}: ChatHistoryDrawerProps) {
  const groups = groupSessions(sessions);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-[300px] p-0 flex flex-col [&>button.absolute]:hidden">
        <SheetHeader className="p-4 border-b border-border">
          <SheetTitle className="text-base">聊天记录</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex-1">
          {groups.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <MessageSquareText className="w-10 h-10 mb-3 opacity-30" />
              <p className="text-sm">暂无聊天记录</p>
            </div>
          ) : (
            <div className="p-3 space-y-4">
              {groups.map(g => (
                <div key={g.label}>
                  <p className="text-xs font-medium text-muted-foreground mb-1.5 px-1">{g.label}</p>
                  <div className="space-y-1">
                    {g.items.map(s => (
                      <div
                        key={s.id}
                        className={cn(
                          'group flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors',
                          s.id === currentSessionId
                            ? 'bg-accent/10 text-accent'
                            : 'hover:bg-muted'
                        )}
                        onClick={() => {
                          onSelectSession(s.id);
                          onOpenChange(false);
                        }}
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{s.title}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(s.updatedAt), 'HH:mm')}
                          </p>
                        </div>
                        <button
                          onClick={e => {
                            e.stopPropagation();
                            onDeleteSession(s.id);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 transition-all"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
