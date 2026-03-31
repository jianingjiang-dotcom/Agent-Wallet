import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
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
import { Drawer, DrawerContent } from '@/components/ui/drawer';

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
                className="flex items-center gap-1 text-[10px] text-white/50 transition-colors"
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
                className="flex items-center gap-1 text-[10px] text-white/50 transition-colors"
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

  const [showBadSheet, setShowBadSheet] = useState(false);
  const [badTags, setBadTags] = useState<string[]>([]);
  const [badText, setBadText] = useState('');

  const feedbackTags = ['不正确或不完整', '与期望不符', '风格或语气', '速度慢或存在问题', '安全或法律疑惑', '其他'];

  const toggleBadTag = (tag: string) => {
    setBadTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleBadClick = () => {
    if (message.feedback === 'negative') {
      // Already negative — toggle off, no toast
      onFeedback?.(message.id, 'negative');
      return;
    }
    // Open bottom sheet
    setBadTags([]);
    setBadText('');
    setShowBadSheet(true);
  };

  const handleBadSubmit = () => {
    onFeedback?.(message.id, 'negative');
    toast.success('感谢您的反馈');
    setShowBadSheet(false);
  };

  const showActions = !isUser && !isStreaming && !isError && message.content.length > 0;

  // Error message rendering
  if (isError) {
    return (
      <motion.div
        className="flex w-full px-6 justify-start"
        variants={bubbleVariants}
        initial="hidden"
        animate="visible"
        transition={{ duration: 0.25, ease: 'easeOut' }}
      >
        <div className="flex flex-col items-start max-w-[85%]">
          <div className="px-4 py-3 text-sm bg-destructive/5 border border-destructive/20 rounded-xl rounded-bl-md">
            <p className="text-destructive font-medium text-xs mb-1">发送失败</p>
            <p className="text-muted-foreground text-xs">{message.content || '网络错误，请稍后重试'}</p>
          </div>
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1.5 mt-2 px-3 py-1.5 text-xs font-medium rounded-full border border-destructive/30 text-destructive transition-colors"
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
      className={cn('flex w-full px-6', isUser ? 'justify-end' : 'justify-start')}
      variants={bubbleVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.25, ease: 'easeOut' }}
    >
      <div className={cn('flex flex-col', isUser ? 'items-end max-w-[85%]' : 'items-start w-full')}>
        <div
          className={cn(
            'text-[16px] leading-[24px] overflow-hidden max-w-full',
            isUser
              ? 'px-4 py-2.5 bg-[rgba(31,50,214,0.1)] text-foreground rounded-[12px]'
              : 'text-foreground'
          )}
        >
          {isUser ? (
            <p className="whitespace-pre-wrap break-all">{message.content}</p>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none min-w-0 [&_p]:my-[8px] [&_ul]:my-[8px] [&_ol]:my-[8px] [&_li]:my-0.5 [&_h3]:text-[16px] [&_h3]:mt-2 [&_h3]:mb-1 [&_h4]:text-[16px] [&_h4]:mt-2 [&_h4]:mb-1 [&_p]:text-[16px] [&_p]:leading-[24px] [&_li]:text-[16px] [&_li]:leading-[24px]">
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

        {/* Action buttons for last AI message */}
        {!isUser && isLastAssistant && !isStreaming && (
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => {
                copyToClipboard(message.content);
                toast.success('复制成功');
              }}
              className="p-[3px]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#73798B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
            </button>
            <button
              onClick={() => {
                if (message.feedback !== 'positive') {
                  toast.success('感谢您的反馈');
                }
                onFeedback?.(message.id, 'positive');
              }}
              className="p-[3px]"
            >
              {message.feedback === 'positive' ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M4.69043 17.0625H3C2.45299 17.0625 1.92879 16.8448 1.54199 16.458C1.15525 16.0712 0.9375 15.547 0.9375 15V9C0.937544 8.45305 1.15524 7.92875 1.54199 7.54199C1.92878 7.15525 2.45303 6.9375 3 6.9375H4.69043V17.0625ZM9.00684 0.9375C9.44524 0.942929 9.87715 1.04755 10.2695 1.24316C10.6618 1.43878 11.0053 1.72062 11.2734 2.06738C11.5415 2.41414 11.7278 2.81726 11.8184 3.24609C11.9087 3.67417 11.9003 4.11716 11.7959 4.54199L11.2158 6.9375H14.8721C15.1922 6.9375 15.5086 7.0121 15.7949 7.15527C16.0813 7.29845 16.3304 7.5066 16.5225 7.7627C16.7145 8.01872 16.8441 8.31603 16.9014 8.63086C16.9443 8.86722 16.9462 9.10906 16.9062 9.34473L16.8525 9.57715L15.1055 15.5771C14.9805 16.0055 14.7193 16.3826 14.3623 16.6504C14.0054 16.918 13.5711 17.0625 13.125 17.0625H5.69043V6.69922C5.77996 6.61964 5.85551 6.52501 5.90918 6.41699V6.41602L8.49707 1.24805L8.53809 1.17969C8.64354 1.02763 8.8184 0.93521 9.00684 0.9375Z" fill="#73798B"/></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#73798B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z"/><path d="M7 10v12"/></svg>
              )}
            </button>
            <button
              onClick={handleBadClick}
              className="p-[3px]"
            >
              {message.feedback === 'negative' ? (
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><g clipPath="url(#clip0_bad_fill)"><path d="M13.3096 0.937501L15 0.937501C15.547 0.937501 16.0712 1.1552 16.458 1.54199C16.8448 1.92878 17.0625 2.45303 17.0625 3L17.0625 9C17.0625 9.54695 16.8448 10.0713 16.458 10.458C16.0712 10.8448 15.547 11.0625 15 11.0625L13.3096 11.0625L13.3096 0.937501ZM8.99316 17.0625C8.55476 17.0571 8.12285 16.9525 7.73047 16.7568C7.33819 16.5612 6.9947 16.2794 6.72656 15.9326C6.4585 15.5859 6.27221 15.1827 6.18164 14.7539C6.09126 14.3258 6.09966 13.8828 6.2041 13.458L6.78418 11.0625L3.12793 11.0625C2.80776 11.0625 2.49145 10.9879 2.20508 10.8447C1.91875 10.7016 1.66963 10.4934 1.47754 10.2373C1.28555 9.98128 1.15594 9.68397 1.09863 9.36914C1.05566 9.13278 1.05382 8.89094 1.09375 8.65527L1.14746 8.42285L2.89453 2.42285C3.01948 1.99447 3.28073 1.61737 3.6377 1.34961C3.99465 1.082 4.42887 0.9375 4.875 0.937501L12.3096 0.937501L12.3096 11.3008C12.22 11.3804 12.1445 11.475 12.0908 11.583L12.0908 11.584L9.50293 16.752L9.46191 16.8203C9.35646 16.9724 9.1816 17.0648 8.99316 17.0625Z" fill="#73798B"/></g><defs><clipPath id="clip0_bad_fill"><rect width="18" height="18" fill="white" transform="translate(18 18) rotate(-180)"/></clipPath></defs></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#73798B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2H20a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22a3.13 3.13 0 0 1-3-3.88Z"/><path d="M17 14V2"/></svg>
              )}
            </button>
            <button
              onClick={onRegenerate}
              className="p-[3px]"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#73798B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
          </div>
        )}

      </div>

      {/* Bad feedback bottom sheet */}
      <Drawer open={showBadSheet} onOpenChange={setShowBadSheet}>
        <DrawerContent className="px-4 pb-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 mt-4">
            <h3 className="text-[18px] leading-[28px] font-semibold text-foreground">反馈</h3>
            <button onClick={() => setShowBadSheet(false)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          </div>
          {/* Tags */}
          <div className="flex flex-wrap gap-3">
            {feedbackTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleBadTag(tag)}
                className={cn(
                  "px-3 py-2 rounded-[12px] text-[14px] leading-[20px] border transition-colors",
                  badTags.includes(tag)
                    ? "bg-[rgba(31,50,214,0.1)] border-[rgba(31,50,214,0.3)] text-[#1F32D6]"
                    : "bg-white border-[#EDEEF3] text-[#1C1C1C]"
                )}
              >
                {tag}
              </button>
            ))}
          </div>
          {/* Text input */}
          <textarea
            value={badText}
            onChange={e => setBadText(e.target.value)}
            placeholder="分享详细信息（可选）"
            className="w-full h-[140px] px-4 py-3 text-[16px] leading-[24px] rounded-[16px] border border-[#EDEEF3] bg-[#F8F9FC] resize-none focus:outline-none focus:border-[#EDEEF3] placeholder:text-[#B9BCC5] mt-[16px] overflow-y-auto"
          />
          {/* Submit */}
          <button
            onClick={handleBadSubmit}
            disabled={badTags.length === 0 && badText.trim().length === 0}
            className={cn(
              "w-full mt-[18px] py-3 rounded-[12px] text-[14px] leading-[20px] font-medium transition-colors",
              (badTags.length > 0 || badText.trim().length > 0)
                ? "bg-[#1F32D6] text-white"
                : "bg-[#1F32D6] text-white opacity-30"
            )}
          >
            提交
          </button>
        </DrawerContent>
      </Drawer>

    </motion.div>
  );
}
