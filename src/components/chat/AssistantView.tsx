import { useRef, useEffect, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { MessageSquareText, ArrowDown, Bot } from 'lucide-react';
import { motion } from 'framer-motion';
import { ChatMessage } from '@/components/chat/ChatMessage';
import { ChatInput } from '@/components/chat/ChatInput';
import { QuickActions } from '@/components/chat/QuickActions';
import { TypingIndicator } from '@/components/chat/TypingIndicator';
import { streamChat } from '@/lib/chat-stream';
import { useWallet } from '@/contexts/WalletContext';
import { cn, generateId } from '@/lib/utils';
import type { ChatMessage as ChatMessageType, ChatCard } from '@/types/chat';
import type { useChatHistory } from '@/hooks/useChatHistory';

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
}

interface AssistantViewProps {
  className?: string;
  chatHistory: ReturnType<typeof useChatHistory>;
  hideNav?: boolean;
  /** Override the safe-area bottom padding on the input (px). When provided, transitions smoothly. */
  inputPaddingBottom?: number;
  /** Extend scroll area below by this many px (used to match page-mode layout during expand transition). */
  scrollBottomOffset?: number;
  /** Hide the gradient behind the input (used during expand transition when the nav wrapper provides its own gradient). */
  hideInputGradient?: boolean;
}

export const AssistantView = forwardRef<AssistantViewHandle, AssistantViewProps>(
  function AssistantView({ className, chatHistory, hideNav = false, inputPaddingBottom, scrollBottomOffset, hideInputGradient }, ref) {
    const {
      currentSession, currentSessionId,
      startNewSession, addMessage,
      updateLastAssistantMessage, persistCurrent,
      setCardOnLastAssistant,
      removeLastAssistantMessage, setMessageFeedback,
    } = chatHistory;

    const { currentWallet, assets, transactions, userInfo } = useWallet();
    const userName = userInfo?.nickname || userInfo?.email?.split('@')[0] || '用户';
    const [isLoading, setIsLoading] = useState(false);
    const [showScrollBtn, setShowScrollBtn] = useState(false);
    const [inputHeight, setInputHeight] = useState(59);
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputWrapperRef = useRef<HTMLDivElement>(null);
    const abortRef = useRef<AbortController | null>(null);

    // Track input container height changes and auto-scroll only if already at bottom
    useEffect(() => {
      const el = inputWrapperRef.current;
      if (!el) return;
      const observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          setInputHeight(entry.contentRect.height);
          // Only auto-scroll if user is near the bottom
          const scrollEl = scrollRef.current;
          if (scrollEl) {
            const distFromBottom = scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight;
            if (distFromBottom < 150) {
              requestAnimationFrame(() => {
                scrollEl.scrollTo({ top: scrollEl.scrollHeight, behavior: 'smooth' });
              });
            }
          }
        }
      });
      observer.observe(el);
      return () => observer.disconnect();
    }, []);

    const messages = currentSession?.messages ?? [];

    // Expose actions to parent via ref
    useImperativeHandle(ref, () => ({
      startNewSession,
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

    const mockResponses: Record<string, string> = {
      '你好': '你好！我是你的智能钱包助手 🤖\n\n我可以帮你：\n- 查询钱包余额和资产\n- 发起转账和收款\n- 查看交易记录\n- 管理钱包安全设置\n\n请问有什么可以帮你的？',
      '余额': '根据当前钱包数据，你的资产概况如下：\n\n**USDT** — 12,500.00 USDT（≈ $12,500）\n**ETH** — 3.25 ETH（≈ $6,175）\n**BTC** — 0.15 BTC（≈ $9,450）\n\n总资产约 **$28,125**。如需查看更多详情，可以前往钱包页面。',
      '转账': '好的，请提供以下信息来发起转账：\n\n1. **收款地址** — 对方的钱包地址\n2. **转账金额** — 如 100 USDT\n3. **网络** — 如 Ethereum、Tron 等\n\n或者你可以直接前往转账页面操作。需要我引导你去转账页面吗？',
    };

    const getDefaultResponse = (input: string) => {
      return `收到你的消息："${input}"\n\n这是一个模拟回复。我目前处于演示模式，暂未接入真实的大语言模型。\n\n在正式版本中，我将能够：\n- 理解你的自然语言指令\n- 智能分析你的钱包数据\n- 提供个性化的建议\n\n如需体验完整功能，请联系管理员配置 AI 服务。`;
    };

    const sendMessage = useCallback(async (text: string, _attachment?: File) => {
      const userMsg: ChatMessageType = {
        id: generateId(),
        role: 'user',
        content: text,
        timestamp: Date.now(),
      };
      addMessage(userMsg);
      setIsLoading(true);

      // Show typing indicator for a brief moment before streaming
      const thinkingDelay = setTimeout(() => {
        // Mock streaming response
        const response = mockResponses[text.trim()] || getDefaultResponse(text);
        const chars = Array.from(response);
        let assistantContent = '';
        let i = 0;

        const streamInterval = setInterval(() => {
          if (i < chars.length) {
            const chunkSize = Math.floor(Math.random() * 3) + 1;
            const chunk = chars.slice(i, i + chunkSize).join('');
            assistantContent += chunk;
            updateLastAssistantMessage(assistantContent);
            i += chunkSize;
          } else {
            clearInterval(streamInterval);
            setIsLoading(false);
            persistCurrent();
          }
        }, 30);

        abortRef.current = { abort: () => { clearInterval(streamInterval); setIsLoading(false); } } as unknown as AbortController;
      }, 1200);

      abortRef.current = { abort: () => { clearTimeout(thinkingDelay); setIsLoading(false); } } as unknown as AbortController;
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
      setIsLoading(true);

      const thinkingDelay = setTimeout(() => {
        // Mock streaming response
        const response = mockResponses[lastUserMsg!.content.trim()] || getDefaultResponse(lastUserMsg!.content);
        const chars = Array.from(response);
        let assistantContent = '';
        let i = 0;

        const streamInterval = setInterval(() => {
          if (i < chars.length) {
            const chunkSize = Math.floor(Math.random() * 3) + 1;
            const chunk = chars.slice(i, i + chunkSize).join('');
            assistantContent += chunk;
            updateLastAssistantMessage(assistantContent);
            i += chunkSize;
          } else {
            clearInterval(streamInterval);
            setIsLoading(false);
            persistCurrent();
          }
        }, 30);

        abortRef.current = { abort: () => { clearInterval(streamInterval); setIsLoading(false); } } as unknown as AbortController;
      }, 1200);

      abortRef.current = { abort: () => { clearTimeout(thinkingDelay); setIsLoading(false); } } as unknown as AbortController;
    }, [currentSession, removeLastAssistantMessage, updateLastAssistantMessage, persistCurrent]);

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
      setIsLoading(true);

      const thinkingDelay = setTimeout(() => {
        // Mock streaming response
        const response = mockResponses[lastUserMsg!.content.trim()] || getDefaultResponse(lastUserMsg!.content);
        const chars = Array.from(response);
        let assistantContent = '';
        let i = 0;

        const streamInterval = setInterval(() => {
          if (i < chars.length) {
            const chunkSize = Math.floor(Math.random() * 3) + 1;
            const chunk = chars.slice(i, i + chunkSize).join('');
            assistantContent += chunk;
            updateLastAssistantMessage(assistantContent);
            i += chunkSize;
          } else {
            clearInterval(streamInterval);
            setIsLoading(false);
            persistCurrent();
          }
        }, 30);

        abortRef.current = { abort: () => { clearInterval(streamInterval); setIsLoading(false); } } as unknown as AbortController;
      }, 1200);

      abortRef.current = { abort: () => { clearTimeout(thinkingDelay); setIsLoading(false); } } as unknown as AbortController;
    }, [currentSession, removeLastAssistantMessage, updateLastAssistantMessage, persistCurrent]);

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
      <div className={cn('flex-1 min-h-0 relative', className)}>
        {/* Messages area - extends behind input & nav */}
        <div
          ref={scrollRef}
          className="absolute inset-0 overflow-y-auto scroll-smooth"
          style={{ bottom: hideNav ? -(scrollBottomOffset ?? 0) : -96, transition: scrollBottomOffset !== undefined ? 'bottom 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)' : undefined }}
        >
          {showWelcome && (
            <div className="flex flex-col items-center justify-center h-full" style={{ marginTop: '-20%' }}>
              <span className="text-[24px] leading-[32px] font-bold text-foreground">
                {(() => {
                  const hour = new Date().getHours();
                  const greeting = hour < 12 ? '上午好' : hour < 18 ? '下午好' : '晚上好';
                  return `${greeting}，${userName}`;
                })()}
              </span>
            </div>
          )}
          {!showWelcome && <div className="pt-4 space-y-[24px]" style={{ paddingBottom: inputHeight + 48 + (hideNav ? 34 : 88) }}>
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
              <div className="flex justify-start px-6">
                <TypingIndicator />
              </div>
            )}
          </div>}
        </div>

        {/* Scroll to bottom button */}
        {showScrollBtn && !showWelcome && (
          <div className="absolute left-1/2 -translate-x-1/2 z-20" style={{ bottom: inputHeight + (hideNav ? 34 : 0) + 8 }}>
            <button
              onClick={() => scrollToBottom()}
              className="w-9 h-9 rounded-full bg-white/60 backdrop-blur-xl shadow-[0_2px_20px_0_rgba(0,0,0,0.08),inset_0_0_0_1px_rgba(255,255,255,0.9)] flex items-center justify-center transition-colors"
            >
              <ArrowDown className="w-[18px] h-[18px] [&]:!stroke-[2px]" />
            </button>
          </div>
        )}

        {/* Input - floating at bottom above content */}
        <div
          ref={inputWrapperRef}
          className="absolute bottom-0 left-0 right-0 z-10"
          style={hideNav ? { paddingBottom: inputPaddingBottom ?? 34, transition: inputPaddingBottom !== undefined ? 'padding-bottom 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)' : undefined } : undefined}
        >
          {/* Gradient background with blur behind input */}
          {hideNav && !hideInputGradient && (
            <div className="absolute bottom-0 left-0 right-0 h-[97px] -z-10 pointer-events-none">
              <div className="absolute inset-0 backdrop-blur-xl" style={{ maskImage: 'linear-gradient(to bottom, transparent, black)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)' }} />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))' }} />
            </div>
          )}
          <ChatInput
            onSend={sendMessage}
            onStop={handleStop}
            disabled={false}
            isLoading={isLoading}
          />
        </div>

      </div>
    );
  }
);
