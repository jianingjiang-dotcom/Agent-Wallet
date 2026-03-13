import { useState, useCallback, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import {
  MessageSquareText, Copy, RefreshCw, ThumbsUp, ThumbsDown,
  Check, AlertTriangle, RotateCcw,
} from 'lucide-react';
import { motion } from 'framer-motion';
import type { ChatMessage as ChatMessageType } from '@/types/chat';
import { cn, copyToClipboard } from '@/lib/utils';
import { ChatCardRenderer } from './ChatCardRenderer';
import { toast } from '@/lib/toast';
import type { Components } from 'react-markdown';
import { useStreamingText } from '@/hooks/useStreamingText';

interface ChatMessageProps {
  message: ChatMessageType;
  showTimestamp?: boolean;
  isLastAssistant?: boolean;
  isStreaming?: boolean;
  onRegenerate?: () => void;
  onRetry?: () => void;
  onFeedback?: (messageId: string, feedback: 'positive' | 'negative') => void;
}

function formatTime(ts: number) {
  const d = new Date(ts);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

/**
 * Sanitize incomplete markdown during streaming to prevent render glitches.
 * Closes unclosed fenced code blocks, bold/italic markers, and links.
 */
function sanitizeStreamingMarkdown(content: string): string {
  let result = content;

  // Count fenced code blocks (```)
  const fenceMatches = result.match(/```/g);
  if (fenceMatches && fenceMatches.length % 2 !== 0) {
    // Odd number of fences → unclosed code block, close it
    result += '\n```';
  }

  // Count unclosed bold markers (**)
  const boldMatches = result.match(/\*\*/g);
  if (boldMatches && boldMatches.length % 2 !== 0) {
    result += '**';
  }

  // Count unclosed italic markers (single *)
  // Be careful: ** are already handled, so strip those first for counting
  const stripped = result.replace(/\*\*/g, '');
  const italicMatches = stripped.match(/\*/g);
  if (italicMatches && italicMatches.length % 2 !== 0) {
    result += '*';
  }

  // Count unclosed backtick (inline code)
  const backtickMatches = result.match(/(?<!`)`(?!`)/g);
  if (backtickMatches && backtickMatches.length % 2 !== 0) {
    result += '`';
  }

  // Unclosed link: [text]( without closing )
  const linkMatch = result.match(/\[[^\]]*\]\([^)]*$/);
  if (linkMatch) {
    result += ')';
  }

  // Unclosed link text: [ without ]
  const bracketMatch = result.match(/\[[^\]]*$/);
  if (bracketMatch && !result.match(/\[[^\]]*\]\([^)]*$/)) {
    result += ']';
  }

  return result;
}

const bubbleVariants = {
  hidden: { opacity: 0, y: 8, scale: 0.96 },
  visible: { opacity: 1, y: 0, scale: 1 },
};

export function ChatMessage({
  message,
  showTimestamp = true,
  isLastAssistant = false,
  isStreaming = false,
  onRegenerate,
  onRetry,
  onFeedback,
}: ChatMessageProps) {
  const isUser = message.role === 'user';
  const isError = !isUser && message.error;
  const [copied, setCopied] = useState(false);
  const [codeCopied, setCodeCopied] = useState<string | null>(null);

  const handleCopy = async () => {
    const ok = await copyToClipboard(message.content);
    if (ok) {
      setCopied(true);
      toast.success('已复制');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  const handleCodeCopy = useCallback(async (code: string) => {
    const ok = await copyToClipboard(code);
    if (ok) {
      setCodeCopied(code);
      toast.success('代码已复制');
      setTimeout(() => setCodeCopied(null), 2000);
    } else {
      toast.error('复制失败');
    }
  }, []);

  // Smooth typewriter reveal during streaming
  const revealedContent = useStreamingText(message.content, isStreaming);

  // Sanitize the revealed (partial) content to prevent markdown glitches
  const displayContent = useMemo(() => {
    if (isStreaming && revealedContent) {
      return sanitizeStreamingMarkdown(revealedContent);
    }
    return revealedContent;
  }, [isStreaming, revealedContent]);

  // Custom code renderer for syntax highlighting
  const markdownComponents = useMemo<Components>(() => ({
    code({ className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = String(children).replace(/\n$/, '');

      // Fenced code block (has language class or is inside <pre>)
      if (match) {
        return (
          <div className="relative group my-2 min-w-0 overflow-hidden rounded-lg">
            {/* Language label + copy button */}
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#282c34] rounded-t-lg border-b border-white/10">
              <span className="text-[10px] text-white/50 uppercase tracking-wide">{match[1]}</span>
              <button
                onClick={() => handleCodeCopy(codeString)}
                className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 transition-colors"
              >
                {codeCopied === codeString ? (
                  <><Check className="w-3 h-3" /> 已复制</>
                ) : (
                  <><Copy className="w-3 h-3" /> 复制</>
                )}
              </button>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: '0.5rem',
                borderBottomRightRadius: '0.5rem',
                fontSize: '0.75rem',
                padding: '0.75rem',
              }}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }

      // Check if this code element is a child of pre (code block without language)
      // react-markdown wraps fenced code in <pre><code>
      const isBlock = className || codeString.includes('\n');
      if (isBlock) {
        return (
          <div className="relative group my-2 min-w-0 overflow-hidden rounded-lg">
            <div className="flex items-center justify-between px-3 py-1.5 bg-[#282c34] rounded-t-lg border-b border-white/10">
              <span className="text-[10px] text-white/50 uppercase tracking-wide">code</span>
              <button
                onClick={() => handleCodeCopy(codeString)}
                className="flex items-center gap-1 text-[10px] text-white/50 hover:text-white/80 transition-colors"
              >
                {codeCopied === codeString ? (
                  <><Check className="w-3 h-3" /> 已复制</>
                ) : (
                  <><Copy className="w-3 h-3" /> 复制</>
                )}
              </button>
            </div>
            <SyntaxHighlighter
              style={oneDark}
              language="text"
              PreTag="div"
              customStyle={{
                margin: 0,
                borderTopLeftRadius: 0,
                borderTopRightRadius: 0,
                borderBottomLeftRadius: '0.5rem',
                borderBottomRightRadius: '0.5rem',
                fontSize: '0.75rem',
                padding: '0.75rem',
              }}
            >
              {codeString}
            </SyntaxHighlighter>
          </div>
        );
      }

      // Inline code
      return (
        <code className="text-xs px-1 py-0.5 bg-background/50 rounded" {...props}>
          {children}
        </code>
      );
    },
    // Override pre to avoid double wrapping
    pre({ children }) {
      return <>{children}</>;
    },
  }), [codeCopied, handleCodeCopy]);

  const showActions = !isUser && !isStreaming && !isError && message.content.length > 0;

  // Error message rendering
  if (isError) {
    return (
      <motion.div
        className="flex w-full px-4 py-1 justify-start"
        variants={bubbleVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center shrink-0 mt-0.5 mr-2">
          <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
        </div>
        <div className="flex flex-col items-start max-w-[85%]">
          <div className="px-4 py-3 text-sm bg-destructive/5 border border-destructive/20 rounded-2xl rounded-bl-md">
            <p className="text-destructive font-medium text-xs mb-1">发送失败</p>
            <p className="text-muted-foreground text-xs">{message.content || '网络错误，请稍后重试'}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-medium rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              重试
            </button>
          )}
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={cn('flex w-full px-4 py-1', isUser ? 'justify-end' : 'justify-start')}
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      {/* AI Avatar */}
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5 mr-2">
          <MessageSquareText className="w-3.5 h-3.5 text-accent" />
        </div>
      )}

      <div className={cn('flex flex-col', isUser ? 'items-end' : 'items-start', 'max-w-[85%]')}>
        <div
          className={cn(
            'px-4 py-2.5 text-sm leading-relaxed overflow-hidden max-w-full',
            isUser
              ? 'bg-accent text-accent-foreground rounded-2xl rounded-br-md'
              : 'bg-muted text-foreground rounded-2xl rounded-bl-md'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none min-w-0 [&_p]:my-1 [&_ul]:my-1 [&_ol]:my-1 [&_li]:my-0.5 [&_h3]:text-sm [&_h3]:mt-2 [&_h3]:mb-1 [&_h4]:text-sm [&_h4]:mt-2 [&_h4]:mb-1">
              <ReactMarkdown components={markdownComponents}>
                {displayContent}
              </ReactMarkdown>
              {isStreaming && (
                <span className="inline-block w-[2px] h-[1.1em] bg-foreground/80 ml-0.5 rounded-[1px] align-text-bottom animate-cursor-blink" />
              )}
            </div>
          )}
        </div>

        {/* Structured card */}
        {!isUser && message.card && (
          <motion.div
            className="mt-2 w-full"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <ChatCardRenderer card={message.card} />
          </motion.div>
        )}

        {/* Action bar for AI messages */}
        {showActions && (
          <motion.div
            className="flex items-center gap-0.5 mt-1.5 px-1"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2, delay: 0.15 }}
          >
            {/* Copy */}
            <button
              onClick={handleCopy}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
              title="复制"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-success" /> : <Copy className="w-3.5 h-3.5" />}
            </button>

            {/* Regenerate — only on the last AI message */}
            {isLastAssistant && onRegenerate && (
              <button
                onClick={onRegenerate}
                className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
                title="重新生成"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Divider */}
            <div className="w-px h-3 bg-border mx-1" />

            {/* Thumbs up */}
            <button
              onClick={() => onFeedback?.(message.id, 'positive')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                message.feedback === 'positive'
                  ? 'text-success bg-success/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}
              title="有帮助"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>

            {/* Thumbs down */}
            <button
              onClick={() => onFeedback?.(message.id, 'negative')}
              className={cn(
                'p-1.5 rounded-md transition-colors',
                message.feedback === 'negative'
                  ? 'text-destructive bg-destructive/10'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
              )}
              title="无帮助"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}

        {/* Timestamp */}
        {showTimestamp && !showActions && (
          <span className="text-[10px] text-muted-foreground mt-1 px-1">
            {formatTime(message.timestamp)}
          </span>
        )}
        {showTimestamp && showActions && (
          <span className="text-[10px] text-muted-foreground mt-0.5 px-1">
            {formatTime(message.timestamp)}
          </span>
        )}
      </div>

      {/* User Avatar */}
      {isUser && (
        <div className="w-7 h-7 rounded-full bg-accent flex items-center justify-center shrink-0 mt-0.5 ml-2">
          <span className="text-xs font-semibold text-accent-foreground">U</span>
        </div>
      )}
    </motion.div>
  );
}
