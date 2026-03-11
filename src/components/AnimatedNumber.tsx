import { useEffect, useRef, useState } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedNumberProps {
  value: number;
  className?: string;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
}

export function AnimatedNumber({
  value,
  className = '',
  decimals = 2,
  prefix = '',
  suffix = '',
  duration = 0.8,
}: AnimatedNumberProps) {
  const spring = useSpring(0, {
    stiffness: 100,
    damping: 30,
    mass: 1,
  });

  const display = useTransform(spring, (current) => {
    const [integer, decimal] = current.toFixed(decimals).split('.');
    const formattedInteger = parseInt(integer).toLocaleString('en-US');
    return { integer: formattedInteger, decimal };
  });

  const [displayValue, setDisplayValue] = useState({ integer: '0', decimal: '00' });

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (v) => {
      setDisplayValue(v);
    });
    return unsubscribe;
  }, [display]);

  return (
    <span className={className}>
      {prefix && <span>{prefix}</span>}
      <motion.span>{displayValue.integer}</motion.span>
      {decimals > 0 && (
        <>
          <span>.</span>
          <motion.span>{displayValue.decimal}</motion.span>
        </>
      )}
      {suffix && <span>{suffix}</span>}
    </span>
  );
}

// Simpler version that just animates opacity on change
interface AnimatedBalanceProps {
  integer: string;
  decimal: string;
  hidden?: boolean;
  integerClassName?: string;
  decimalClassName?: string;
}

export function AnimatedBalance({
  integer,
  decimal,
  hidden = false,
  integerClassName = 'text-3xl font-bold text-foreground',
  decimalClassName = 'text-lg font-medium text-foreground',
}: AnimatedBalanceProps) {
  const prevInteger = useRef(integer);
  const prevDecimal = useRef(decimal);
  const [isChanging, setIsChanging] = useState(false);

  useEffect(() => {
    if (integer !== prevInteger.current || decimal !== prevDecimal.current) {
      setIsChanging(true);
      const timer = setTimeout(() => setIsChanging(false), 300);
      prevInteger.current = integer;
      prevDecimal.current = decimal;
      return () => clearTimeout(timer);
    }
  }, [integer, decimal]);

  if (hidden) {
    return (
      <motion.div
        key="hidden"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-baseline gap-0.5"
      >
        <span className={integerClassName}>$****</span>
        <span className={decimalClassName}>.**</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      key={`${integer}-${decimal}`}
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ 
        opacity: 1, 
        y: 0, 
        scale: 1,
      }}
      transition={{ 
        type: 'spring', 
        stiffness: 300, 
        damping: 25 
      }}
      className="flex items-baseline gap-0.5"
    >
      <motion.span
        className={integerClassName}
        animate={isChanging ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3 }}
      >
        ${integer}
      </motion.span>
      <motion.span
        className={decimalClassName}
        animate={isChanging ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 0.3, delay: 0.05 }}
      >
        .{decimal}
      </motion.span>
    </motion.div>
  );
}
