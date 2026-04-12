import { motion } from 'framer-motion';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NumericKeypadProps {
  onInput: (value: string) => void;
  onDelete: () => void;
  className?: string;
}

const KEYS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', 'delete'],
];

export function NumericKeypad({ onInput, onDelete, className }: NumericKeypadProps) {
  const handleKeyPress = (key: string) => {
    if (key === 'delete') {
      onDelete();
    } else {
      onInput(key);
    }
  };

  return (
    <div className={cn("grid grid-cols-3 gap-2 p-4 bg-muted/30", className)}>
      {KEYS.flat().map((key, index) => (
        <motion.button
          key={key}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleKeyPress(key)}
          className={cn(
            "h-14 rounded-xl text-xl font-medium flex items-center justify-center",
            "bg-secondary border border-border/30",
            key === 'delete' && "text-muted-foreground"
          )}
        >
          {key === 'delete' ? (
            <Delete className="w-6 h-6" />
          ) : (
            <span className="text-foreground">{key}</span>
          )}
        </motion.button>
      ))}
    </div>
  );
}
