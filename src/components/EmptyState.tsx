import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: {
    label: string;
    icon?: LucideIcon;
    onClick: () => void;
  };
  variant?: 'default' | 'success';
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  variant = 'default',
  className,
}: EmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "card-elevated p-8 flex flex-col items-center justify-center text-center",
        className
      )}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className={cn(
          "w-16 h-16 rounded-full flex items-center justify-center mb-4",
          variant === 'success' ? 'bg-success/10' : 'bg-muted/50'
        )}
      >
        <motion.div
          initial={{ rotate: -10 }}
          animate={{ rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        >
          <Icon className={cn(
            "w-8 h-8",
            variant === 'success' ? 'text-success' : 'text-muted-foreground'
          )} />
        </motion.div>
      </motion.div>
      
      <motion.p
        initial={{ opacity: 0, y: 5 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-sm font-medium text-foreground mb-1"
      >
        {title}
      </motion.p>
      
      {description && (
        <motion.p
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-xs text-muted-foreground/70 mb-4 max-w-[200px]"
        >
          {description}
        </motion.p>
      )}
      
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
        >
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={action.onClick}
          >
            {action.icon && <action.icon className="w-3.5 h-3.5" />}
            {action.label}
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
}
