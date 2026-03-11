import { useState, useRef, useCallback, useEffect } from 'react';
import { Send, Square, Mic, Plus, X, Camera, ImageIcon, FileIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
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
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isListening, interimTranscript, start: startListening, stop: stopListening, isSupported: voiceSupported } = useSpeechRecognition();

  const hasText = text.trim().length > 0 || attachment !== null;

  const handleSend = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed && !attachment) return;
    if (disabled) return;
    onSend(trimmed, attachment ?? undefined);
    setText('');
    setAttachment(null);
    setAttachPreviewUrl(null);
    setShowAttachPanel(false);
    // Reset textarea height after clearing text
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

  // Voice input handlers
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

  // Attachment handlers
  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAttachment(file);
    setShowAttachPanel(false);

    // Generate preview for images
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setAttachPreviewUrl(url);
    } else {
      setAttachPreviewUrl(null);
    }

    // Reset input so the same file can be selected again
    e.target.value = '';
  }, []);

  const removeAttachment = useCallback(() => {
    if (attachPreviewUrl) {
      URL.revokeObjectURL(attachPreviewUrl);
    }
    setAttachment(null);
    setAttachPreviewUrl(null);
  }, [attachPreviewUrl]);

  const toggleAttachPanel = useCallback(() => {
    setShowAttachPanel(prev => !prev);
  }, []);

  // Display text: show interim transcript while listening
  const displayText = isListening ? (text + interimTranscript) : text;

  // Auto-resize textarea height based on content
  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [displayText]);

  return (
    <div className="border-t border-border bg-background">
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
                <img
                  src={attachPreviewUrl}
                  alt="preview"
                  className="w-14 h-14 rounded-lg object-cover border border-border"
                />
              ) : (
                <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center border border-border">
                  <FileIcon className="w-6 h-6 text-muted-foreground" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate">{attachment.name}</p>
                <p className="text-[10px] text-muted-foreground">{formatFileSize(attachment.size)}</p>
              </div>
              <button
                onClick={removeAttachment}
                className="p-1 rounded-full hover:bg-muted transition-colors"
              >
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
              <button
                onClick={() => cameraInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                  <Camera className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] text-muted-foreground">相机</span>
              </button>
              <button
                onClick={() => galleryInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center hover:bg-accent/20 transition-colors">
                  <ImageIcon className="w-5 h-5 text-accent" />
                </div>
                <span className="text-[10px] text-muted-foreground">图库</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center gap-1.5"
              >
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
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="*/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Main input row */}
      <div className="flex items-end gap-1.5 px-3 pt-2 pb-1">
        {/* Attach / Close button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={toggleAttachPanel}
          className={cn(
            'h-9 w-9 shrink-0 rounded-full flex items-center justify-center transition-colors mb-0.5',
            showAttachPanel
              ? 'bg-muted text-foreground'
              : 'text-muted-foreground hover:text-foreground hover:bg-muted'
          )}
        >
          <motion.div
            animate={{ rotate: showAttachPanel ? 45 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <Plus className="w-5 h-5" />
          </motion.div>
        </motion.button>

        {/* Textarea */}
        <textarea
          ref={inputRef}
          value={displayText}
          onChange={e => {
            if (!isListening) {
              setText(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder={isListening ? '正在聆听...' : '输入消息...'}
          rows={1}
          disabled={disabled || isLoading || isListening}
          className={cn(
            'flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50 max-h-[84px] overflow-y-auto',
            isListening && 'ring-2 ring-destructive/50 animate-pulse border-destructive/30'
          )}
        />

        {/* Right action button */}
        <motion.div whileTap={{ scale: 0.85 }} transition={{ duration: 0.1 }} className="mb-0.5">
          {isLoading ? (
            /* Stop button */
            <Button
              size="icon"
              variant="destructive"
              onClick={onStop}
              className="h-9 w-9 rounded-full shrink-0"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </Button>
          ) : hasText && !isListening ? (
            /* Send button */
            <Button
              size="icon"
              onClick={handleSend}
              disabled={(!text.trim() && !attachment) || disabled}
              className="h-9 w-9 rounded-full shrink-0"
            >
              <Send className="w-4 h-4" />
            </Button>
          ) : (
            /* Mic button */
            <Button
              size="icon"
              variant={isListening ? 'destructive' : 'ghost'}
              onPointerDown={handleVoiceDown}
              onPointerUp={handleVoiceUp}
              onPointerLeave={handleVoiceUp}
              disabled={!voiceSupported || disabled}
              className={cn(
                'h-9 w-9 rounded-full shrink-0',
                isListening && 'animate-pulse',
                !isListening && 'text-muted-foreground hover:text-foreground'
              )}
            >
              <Mic className="w-4 h-4" />
            </Button>
          )}
        </motion.div>
      </div>
    </div>
  );
}
