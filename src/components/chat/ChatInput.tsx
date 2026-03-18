import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Square, Mic, Plus, X, Camera, ImageIcon, FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { cn } from '@/lib/utils';

interface ChatInputProps {
  onSend: (text: string, attachment?: File) => void;
  onStop?: () => void;
  disabled?: boolean;
  isLoading?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatInput({ onSend, onStop, disabled, isLoading }: ChatInputProps) {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachPreviewUrl, setAttachPreviewUrl] = useState<string | null>(null);
  const [showAttachPanel, setShowAttachPanel] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, interimTranscript, start: startListening, stop: stopListening, isSupported: voiceSupported } = useSpeechRecognition();

  const hasText = text.trim().length > 0 || attachment !== null;
  const isExpanded = isFocused || hasText || isListening;

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    if (disabled) return;
    onSend(trimmed, attachment ?? undefined);
    setText('');
    setAttachment(null);
    setAttachPreviewUrl(null);
    setShowAttachPanel(false);
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
    inputRef.current?.focus();
  }, [text, attachment, disabled, onSend]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleVoiceDown = useCallback(() => {
    if (!voiceSupported || isLoading || disabled) return;
    startListening();
  }, [voiceSupported, isLoading, disabled, startListening]);

  const handleVoiceUp = useCallback(() => {
    if (!isListening) return;
    const finalText = stopListening();
    if (finalText.trim()) {
      setText(prev => prev + finalText.trim());
    }
  }, [isListening, stopListening]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setAttachment(file);
    setShowAttachPanel(false);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setAttachPreviewUrl(url);
    } else {
      setAttachPreviewUrl(null);
    }
    e.target.value = '';
  }, []);

  const removeAttachment = useCallback(() => {
    if (attachPreviewUrl) URL.revokeObjectURL(attachPreviewUrl);
    setAttachment(null);
    setAttachPreviewUrl(null);
  }, [attachPreviewUrl]);

  const toggleAttachPanel = useCallback(() => {
    setShowAttachPanel(prev => !prev);
  }, []);

  const displayText = isListening ? (text + interimTranscript) : text;

  // Auto-resize textarea
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const newHeight = Math.min(el.scrollHeight, 84);
    el.style.height = `${newHeight}px`;
  }, [displayText]);

  // Click outside to collapse
  useEffect(() => {
    if (!isExpanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isExpanded]);

  return (
    <div className="bg-page" ref={containerRef}>
      {/* Attachment preview */}
      <AnimatePresence>
        {attachment && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center gap-3 px-4 pt-2 pb-1">
              {attachPreviewUrl ? (
                <img src={attachPreviewUrl} alt="preview" className="w-14 h-14 rounded-lg object-cover border border-border" />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center border border-border">
                  <FileIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{attachment.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatFileSize(attachment.size)}</p>
              </div>
              <button onClick={removeAttachment} className="p-1 rounded-full hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Attachment options panel */}
      <AnimatePresence>
        {showAttachPanel && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-center gap-6 px-4 py-3">
              <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                  <Camera className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] text-muted-foreground">相机</span>
              </button>
              <button onClick={() => galleryInputRef.current?.click()} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                  <ImageIcon className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] text-muted-foreground">图库</span>
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1.5">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                  <FileIcon className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] text-muted-foreground">文件</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden file inputs */}
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileSelect} className="hidden" />
      <input ref={galleryInputRef} type="file" accept="image/*" onChange={handleFileSelect} className="hidden" />
      <input ref={fileInputRef} type="file" accept="*/*" onChange={handleFileSelect} className="hidden" />

      {/* Main input container */}
      <div className="px-4 py-2">
        <div
          className={cn(
            'bg-card rounded-2xl border border-border/60 transition-all',
            isListening && 'ring-2 ring-destructive/50'
          )}
          style={{ boxShadow: '0 4px 40px rgba(0, 0, 0, 0.02)' }}
          onClick={() => {
            if (!isExpanded) {
              setIsFocused(true);
              inputRef.current?.focus();
            }
          }}
        >
          {isExpanded ? (
            /* ── Expanded: text on top, actions on bottom ── */
            <div className="flex flex-col">
              {/* Text area */}
              <div className="px-4 pt-3">
                <textarea
                  ref={inputRef}
                  value={displayText}
                  onChange={e => { if (!isListening) setText(e.target.value); }}
                  onKeyDown={handleKeyDown}
                  onFocus={() => setIsFocused(true)}
                  placeholder={isListening ? '正在聆听...' : '输入消息...'}
                  rows={1}
                  disabled={disabled || isLoading || isListening}
                  className="w-full resize-none bg-transparent text-sm placeholder:text-muted-foreground focus:outline-none disabled:opacity-50 overflow-y-auto leading-5"
                  style={{ maxHeight: '84px', minHeight: '20px' }}
                  autoFocus
                />
              </div>

              {/* Bottom action row */}
              <div className="flex items-center justify-between px-3 py-2">
                {/* Left: attach */}
                <motion.button
                  whileTap={{ scale: 0.85 }}
                  onClick={toggleAttachPanel}
                  className={cn(
                    'shrink-0 flex items-center justify-center w-6 h-6 transition-colors',
                    showAttachPanel ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <motion.div animate={{ rotate: showAttachPanel ? 45 : 0 }} transition={{ duration: 0.2 }}>
                    <Plus className="w-5 h-5" />
                  </motion.div>
                </motion.button>

                {/* Right: action buttons */}
                <div className="flex items-center gap-2">
                  {isLoading ? (
                    <motion.button whileTap={{ scale: 0.85 }}
                      onClick={onStop}
                      className="w-8 h-8 rounded-full bg-destructive flex items-center justify-center"
                    >
                      <Square className="w-3 h-3 fill-white text-white" />
                    </motion.button>
                  ) : (
                    <>
                      {/* Send button */}
                      {hasText && !isListening && (
                        <motion.button
                          whileTap={{ scale: 0.85 }}
                          onClick={handleSend}
                          disabled={(!text.trim() && !attachment) || disabled}
                          className="w-8 h-8 rounded-full bg-accent flex items-center justify-center disabled:opacity-50"
                        >
                          <Send className="w-4 h-4 text-white" />
                        </motion.button>
                      )}
                      {/* Voice wave / send when no text */}
                      {!hasText && !isListening && (
                        <button
                          onPointerDown={handleVoiceDown}
                          onPointerUp={handleVoiceUp}
                          onPointerLeave={handleVoiceUp}
                          disabled={!voiceSupported || disabled}
                          className={cn(
                            'flex items-center justify-center w-8 h-8 rounded-full transition-colors bg-accent',
                            (!voiceSupported || disabled) && 'opacity-50'
                          )}
                        >
                          <Mic className="w-4 h-4 text-white" />
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ) : (
            /* ── Collapsed: single row ── */
            <div className="flex items-center pl-3 pr-1 gap-2" style={{ minHeight: '40px' }}>
              {/* Attach button */}
              <motion.button
                whileTap={{ scale: 0.85 }}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAttachPanel();
                }}
                className="shrink-0 flex items-center justify-center w-6 h-6 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Plus className="w-5 h-5" />
              </motion.button>

              {/* Placeholder text */}
              <span className="flex-1 text-sm text-muted-foreground select-none">
                {isListening ? '正在聆听...' : '输入消息...'}
              </span>

              {/* Mic button */}
              <motion.div whileTap={{ scale: 0.85 }} transition={{ duration: 0.1 }} className="shrink-0">
                <button
                  onPointerDown={handleVoiceDown}
                  onPointerUp={handleVoiceUp}
                  onPointerLeave={handleVoiceUp}
                  disabled={!voiceSupported || disabled}
                  className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full transition-colors',
                    isListening ? 'bg-destructive animate-pulse' : 'bg-accent',
                    (!voiceSupported || disabled) && 'opacity-50'
                  )}
                >
                  <Mic className="w-4 h-4 text-white" />
                </button>
              </motion.div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
