import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  onRefresh?: () => void;
  align?: 'center' | 'left';
}

export function SuggestedQuestions({ questions, onSelect, onRefresh, align = 'center' }: SuggestedQuestionsProps) {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = () => {
    if (!onRefresh || isSpinning) return;
    setIsSpinning(true);
    onRefresh();
    setTimeout(() => setIsSpinning(false), 500);
  };

  return (
    <div className={cn("flex flex-col gap-2.5", align === 'left' ? 'items-start' : 'items-center')}>
      {questions.map((q, i) => (
        <motion.button
          key={q}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.25 }}
          onClick={() => onSelect(q)}
          className="px-5 py-2.5 text-sm rounded-full border border-border bg-card text-foreground shadow-sm transition-colors active:bg-muted text-left"
        >
          {q}
        </motion.button>
      ))}
      {onRefresh && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          onClick={handleRefresh}
          className="flex items-center gap-1.5 text-xs text-muted-foreground/60 mt-1 transition-colors"
        >
          <motion.div
            animate={isSpinning ? { rotate: 360 } : { rotate: 0 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
          >
            <RefreshCw className="w-3 h-3" />
          </motion.div>
          刷新建议
        </motion.button>
      )}
    </div>
  );
}
