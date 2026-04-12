import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useLanguage, languageOptions, Language } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';

interface LanguageSelectDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function LanguageSelectDrawer({ open, onOpenChange }: LanguageSelectDrawerProps) {
  const { language, setLanguage } = useLanguage();

  const handleSelectLanguage = (lang: Language) => {
    if (lang === language) {
      onOpenChange(false);
      return;
    }
    setLanguage(lang);
    toast.success(lang === 'zh-CN' ? '语言已切换' : 'Language changed');
    onOpenChange(false);
  };

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent>
        <DrawerHeader className="text-center pb-2">
          <DrawerTitle>{language === 'zh-CN' ? '选择语言' : 'Select Language'}</DrawerTitle>
        </DrawerHeader>
        
        <div className="px-4 pb-6">
          <div className="space-y-1">
            {languageOptions.map((option) => (
              <motion.button
                key={option.code}
                onClick={() => handleSelectLanguage(option.code)}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  'w-full p-4 flex items-center justify-between rounded-xl transition-colors active:bg-muted/50',
                  language === option.code && 'bg-accent/10'
                )}
              >
                <span className="font-medium text-foreground">
                  {option.nativeName}
                </span>
                {language === option.code && (
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
