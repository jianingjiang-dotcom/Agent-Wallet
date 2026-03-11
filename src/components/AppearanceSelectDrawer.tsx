import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';

interface AppearanceSelectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const appearanceOptions = [
  { value: 'light', label: '浅色模式' },
  { value: 'dark', label: '深色模式' },
  { value: 'system', label: '跟随系统' },
];

export function AppearanceSelectDrawer({ open, onOpenChange }: AppearanceSelectDrawerProps) {
  const { theme, setTheme } = useTheme();

  const handleSelect = (value: string) => {
    setTheme(value);
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle>外观显示</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6">
          <div className="space-y-1">
            {appearanceOptions.map((option) => (
              <motion.button
                key={option.value}
                onClick={() => handleSelect(option.value)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full p-4 flex items-center justify-between rounded-xl transition-colors active:bg-muted/50',
                  theme === option.value && 'bg-accent/10'
                )}
              >
                <span className="font-medium text-foreground">{option.label}</span>
                {theme === option.value && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                  >
                    <Check className="w-5 h-5 text-accent" strokeWidth={1.5} />
                  </motion.div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
