import { useState } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface SuggestedQuestionsProps {
  questions: string[];
  onSelect: (question: string) => void;
  onRefresh?: () => void;
}

export function SuggestedQuestions({ questions, onSelect, onRefresh }: SuggestedQuestionsProps) {
  const [isSpinning, setIsSpinning] = useState(false);

  const handleRefresh = () => {
    if (!onRefresh || isSpinning) return;
    setIsSpinning(true);
    onRefresh();
    setTimeout(() => setIsSpinning(false), 500);
  };

  return (
    <div className="flex flex-col items-center gap-2.5">
      {questions.map((q, i) => (
        <motion.button
          key={q}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.1, duration: 0.25 }}
          onClick={() => onSelect(q)}
          className="px-5 py-2.5 text-sm rounded-full border border-border bg-card text-foreground shadow-sm transition-colors active:bg-muted"
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
