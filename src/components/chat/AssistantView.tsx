import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { MessageSquareText, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { QuickActions } from '@/components/chat/QuickActions';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { ChatHistoryDrawer } from '@/components/chat/ChatHistoryDrawer';
import { useChatHistory } from '@/hooks/useChatHistory';
import { streamChat } from '@/lib/chat-stream';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import type { ChatMessage as ChatMessageType, ChatCard } from '@/types/chat';

const PAGE_MAP: Record<string, { label: string; path: string }> = {
  send: { label: '转账', path: '/send' },
  receive: { label: '收款', path: '/receive' },
  history: { label: '交易记录', path: '/history' },
  security: { label: '安全设置', path: '/security' },
  wallets: { label: '钱包管理', path: '/wallet-management' },
  contacts: { label: '地址簿', path: '/contacts' },
  help: { label: '帮助中心', path: '/help' },
};

export interface AssistantViewHandle {
  startNewSession: () => void;
  openHistory: () => void;
}

export const AssistantView = forwardRef<AssistantViewHandle, { className?: string }>(
  function AssistantView({ className }, ref) {
    const {
      sessions, currentSession, currentSessionId,
      startNewSession, switchSession, addMessage,
      updateLastAssistantMessage, persistCurrent,
      deleteSession, setCardOnLastAssistant,
      removeLastAssistantMessage, setMessageFeedback,
    } = useChatHistory();

    const { currentWallet, assets, transactions } = useWallet();
    const [isLoading, setIsLoading] = useState(false);
    const [historyOpen, setHistoryOpen] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    const messages = currentSession?.messages ?? [];

    // Expose actions to parent via ref
    useImperativeHandle(ref, () => ({
      startNewSession,
      openHistory: () => setHistoryOpen(true),
    }));

    // Smooth scroll to bottom
    const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
      if (scrollRef.current) {
        scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior });
      }
    }, []);

    useEffect(() => {
      scrollToBottom('smooth');
    }, [messages, isLoading, scrollToBottom]);

    // Show/hide scroll-to-bottom button
    useEffect(() => {
      const el = scrollRef.current;
      if (!el) return;
      const onScroll = () => {
        const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
        setShowScrollBtn(distFromBottom > 100);
      };
      el.addEventListener('scroll', onScroll, { passive: true });
      return () => el.removeEventListener('scroll', onScroll);
    }, []);

    const buildWalletContext = useCallback(() => {
      return {
        currentWallet: currentWallet ? {
          name: currentWallet.name,
          purpose: currentWallet.purpose,
        } : null,
        assets: assets.map(a => ({
          symbol: a.symbol,
          balance: a.balance,
          usdValue: a.usdValue,
          network: a.network,
        })),
        recentTransactions: transactions.slice(0, 10).map(tx => ({
          type: tx.type,
          amount: tx.amount,
          symbol: tx.symbol,
          status: tx.status,
          timestamp: tx.timestamp,
          counterpartyLabel: tx.counterpartyLabel,
        })),
      };
    }, [currentWallet, assets, transactions]);

    // Tool call handler: builds ChatCard from tool name + args
    const handleToolCall = useCallback((name: string, args: Record<string, unknown>) => {
      let card: ChatCard | undefined;

      if (name === 'query_balance') {
        const symbol = (args.symbol as string)?.toUpperCase();
        const filtered = symbol
          ? assets.filter(a => a.symbol === symbol)
          : assets;

        const grouped: Record<string, { entries: { chain: string; balance: number; usdValue: number }[]; totalUsd: number }> = {};
        for (const a of filtered) {
          if (!grouped[a.symbol]) grouped[a.symbol] = { entries: [], totalUsd: 0 };
          grouped[a.symbol].entries.push({ chain: a.network, balance: a.balance, usdValue: a.usdValue });
          grouped[a.symbol].totalUsd += a.usdValue;
        }

        const firstSymbol = Object.keys(grouped)[0];
        if (firstSymbol) {
          card = {
            type: 'balance',
            data: { symbol: firstSymbol, entries: grouped[firstSymbol].entries, totalUsd: grouped[firstSymbol].totalUsd },
          };
        }
      } else if (name === 'query_transactions') {
        const count = Math.min((args.count as number) || 5, 5);
        const typeFilter = args.type as string;
        let filtered = transactions;
        if (typeFilter && typeFilter !== 'all') {
          filtered = transactions.filter(t => t.type === typeFilter);
        }
        card = {
          type: 'transactions',
          data: {
            items: filtered.slice(0, count).map(tx => ({
              id: tx.id,
              type: tx.type as 'send' | 'receive',
              amount: tx.amount,
              symbol: tx.symbol,
              status: tx.status,
              timestamp: new Date(tx.timestamp).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
            })),
          },
        };
      } else if (name === 'prepare_transfer') {
        card = {
          type: 'transfer',
          data: {
            to: args.to as string,
            amount: args.amount as number,
            symbol: args.symbol as string,
            chain: args.chain as string | undefined,
          },
        };
      } else if (name === 'navigate_to') {
        const page = args.page as string;
        const info = PAGE_MAP[page];
        if (info) {
          card = { type: 'navigate', data: { page, label: info.label, path: info.path } };
        }
      }

      if (card) {
        setCardOnLastAssistant(card);
      }
    }, [assets, transactions, setCardOnLastAssistant]);

    const sendMessage = useCallback(async (text: string, _attachment?: File) => {
      if (!currentSessionId) {
        startNewSession();
      }

      const userMsg: ChatMessageType = {
        id: crypto.randomUUID(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      addMessage(userMsg);
      setIsLoading(true);

      const historyMsgs = [...(currentSession?.messages ?? []), userMsg]
        .slice(-20)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      let assistantContent = '';

      const controller = streamChat({
        messages: historyMsgs,
        walletContext: buildWalletContext(),
        onDelta: (chunk) => {
          assistantContent += chunk;
          updateLastAssistantMessage(assistantContent);
        },
        onToolCall: handleToolCall,
        onDone: () => {
          setIsLoading(false);
          abortRef.current = null;
          persistCurrent();
        },
        onError: (err) => {
          setIsLoading(false);
          abortRef.current = null;
          // Add an inline error message instead of just a toast
          addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: err,
            timestamp: Date.now(),
            error: true,
          });
          persistCurrent();
        },
      });

      abortRef.current = controller;
    }, [currentSession, currentSessionId, startNewSession, addMessage, updateLastAssistantMessage, persistCurrent, buildWalletContext, handleToolCall]);

    const handleStop = useCallback(() => {
      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
        setIsLoading(false);
        persistCurrent();
      }
    }, [persistCurrent]);

    const handleRegenerate = useCallback(() => {
      // Find the last user message before the last assistant message
      const msgs = currentSession?.messages ?? [];
      let lastUserMsg: ChatMessageType | null = null;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'user') {
          lastUserMsg = msgs[i];
          break;
        }
      }
      if (!lastUserMsg) return;

      // Remove the last assistant message and re-send
      removeLastAssistantMessage();

      // Re-send using the last user message content
      setIsLoading(true);

      const historyMsgs = msgs
        .filter(m => m.role === 'user' || (m.role === 'assistant' && m !== msgs[msgs.length - 1]))
        .slice(-20)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      let assistantContent = '';

      const controller = streamChat({
        messages: historyMsgs,
        walletContext: buildWalletContext(),
        onDelta: (chunk) => {
          assistantContent += chunk;
          updateLastAssistantMessage(assistantContent);
        },
        onToolCall: handleToolCall,
        onDone: () => {
          setIsLoading(false);
          abortRef.current = null;
          persistCurrent();
        },
        onError: (err) => {
          setIsLoading(false);
          abortRef.current = null;
          addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: err,
            timestamp: Date.now(),
            error: true,
          });
          persistCurrent();
        },
      });

      abortRef.current = controller;
    }, [currentSession, addMessage, removeLastAssistantMessage, updateLastAssistantMessage, persistCurrent, buildWalletContext, handleToolCall]);

    // Retry: remove the error message and re-send the last user message
    const handleRetry = useCallback(() => {
      const msgs = currentSession?.messages ?? [];
      // Find last user message
      let lastUserMsg: ChatMessageType | null = null;
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].role === 'user') {
          lastUserMsg = msgs[i];
          break;
        }
      }
      if (!lastUserMsg) return;

      // Remove the error assistant message
      removeLastAssistantMessage();

      // Re-send
      setIsLoading(true);
      const historyMsgs = msgs
        .filter(m => !(m.role === 'assistant' && m.error))
        .slice(-20)
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      let assistantContent = '';
      const controller = streamChat({
        messages: historyMsgs,
        walletContext: buildWalletContext(),
        onDelta: (chunk) => {
          assistantContent += chunk;
          updateLastAssistantMessage(assistantContent);
        },
        onToolCall: handleToolCall,
        onDone: () => {
          setIsLoading(false);
          abortRef.current = null;
          persistCurrent();
        },
        onError: (err) => {
          setIsLoading(false);
          abortRef.current = null;
          addMessage({
            id: crypto.randomUUID(),
            role: 'assistant',
            content: err,
            timestamp: Date.now(),
            error: true,
          });
          persistCurrent();
        },
      });
      abortRef.current = controller;
    }, [currentSession, addMessage, removeLastAssistantMessage, updateLastAssistantMessage, persistCurrent, buildWalletContext, handleToolCall]);

    const handleFeedback = useCallback((messageId: string, feedback: 'positive' | 'negative') => {
      setMessageFeedback(messageId, feedback);
    }, [setMessageFeedback]);

    const showWelcome = messages.length === 0;

    // Determine which message is the last assistant message (for regenerate button)
    const lastAssistantIdx = (() => {
      for (let i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === 'assistant') return i;
      }
      return -1;
    })();

    return (
      <div className={cn('flex-1 flex flex-col min-h-0 relative', className)}>
        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth">
          {showWelcome && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="px-4 pt-6 pb-2"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center">
                  <MessageSquareText className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <h2 className="text-base font-semibold">你好！我是你的交易助手</h2>
                  <p className="text-xs text-muted-foreground">你可以用自然语言查询资产、了解产品功能</p>
                </div>
              </div>
              <QuickActions onAction={sendMessage} />
            </motion.div>
          )}

          <div className="py-2 space-y-1">
            {messages.map((msg, idx) => {
              const next = messages[idx + 1];
              const showTs = !next || next.role !== msg.role ||
                Math.floor(msg.timestamp / 60000) !== Math.floor(next.timestamp / 60000);
              const isLastAst = idx === lastAssistantIdx;
              const isStreamingThis = isLoading && isLastAst && msg.role === 'assistant';
              return (
                <ChatMessage
                  key={msg.id}
                  message={msg}
                  showTimestamp={showTs}
                  isLastAssistant={isLastAst && !isLoading}
                  isStreaming={isStreamingThis}
                  onRegenerate={handleRegenerate}
                  onRetry={msg.error ? handleRetry : undefined}
                  onFeedback={handleFeedback}
                />
              );
            })}
            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && (
              <div className="flex justify-start px-4">
                <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mr-2">
                  <MessageSquareText className="w-3.5 h-3.5 text-accent" />
                </div>
                <div className="bg-muted rounded-2xl rounded-bl-md">
                  <TypingIndicator />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && (
          <button
            onClick={() => scrollToBottom()}
            className="absolute bottom-16 right-4 w-8 h-8 rounded-full bg-card border shadow-md flex items-center justify-center z-10 hover:bg-muted transition-colors"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        )}

        {/* Input */}
        <ChatInput
          onSend={sendMessage}
          onStop={handleStop}
          disabled={false}
          isLoading={isLoading}
        />

        {/* History Drawer */}
        <ChatHistoryDrawer
          open={historyOpen}
          onOpenChange={setHistoryOpen}
          sessions={sessions}
          currentSessionId={currentSessionId}
          onSelectSession={switchSession}
          onDeleteSession={deleteSession}
        />
      </div>
    );
  }
);
