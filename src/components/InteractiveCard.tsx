import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface InteractiveCardProps {
  children: ReactNode;
  className?: string;
  variant?: 'default' | 'ghost' | 'outline';
  onClick?: () => void;
}

// Reusable card component with consistent tap/press interactions
export function InteractiveCard({
  children,
  className,
  variant = 'default',
  onClick,
}: InteractiveCardProps) {
  const baseStyles = cn(
    'w-full text-left transition-all duration-150',
    variant === 'default' && 'card-elevated',
    variant === 'ghost' && 'rounded-xl',
    variant === 'outline' && 'rounded-xl border border-border',
  );

  return (
    <motion.button
      className={cn(baseStyles, className)}
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
    >
      {children}
    </motion.button>
  );
}

// Wrapper for list items with staggered animations
interface StaggeredListProps {
  children: ReactNode[];
  className?: string;
  staggerDelay?: number;
}

export function StaggeredList({
  children,
  className,
  staggerDelay = 0.05,
}: StaggeredListProps) {
  return (
    <div className={className}>
      {children.map((child, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            delay: index * staggerDelay,
            type: 'spring',
            stiffness: 300,
            damping: 25,
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

// Menu item with consistent interaction patterns
interface MenuItemProps {
  icon: ReactNode;
  label: string;
  badge?: ReactNode;
  onClick?: () => void;
  showDivider?: boolean;
  destructive?: boolean;
}

export function MenuItem({
  icon,
  label,
  badge,
  onClick,
  showDivider = true,
  destructive = false,
}: MenuItemProps) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98, backgroundColor: 'hsl(var(--muted) / 0.5)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        'w-full p-4 flex items-center gap-3 transition-colors',
        'active:bg-muted/50',
        showDivider && 'border-b border-border',
        destructive ? 'text-destructive' : ''
      )}
    >
      <div className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center',
        destructive ? 'bg-destructive/10' : 'bg-muted'
      )}>
        {icon}
      </div>
      <span className={cn(
        'flex-1 text-left font-medium text-sm',
        destructive ? 'text-destructive' : 'text-foreground'
      )}>
        {label}
      </span>
      {badge}
    </motion.button>
  );
}
