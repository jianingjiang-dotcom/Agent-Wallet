import { motion, AnimatePresence } from 'framer-motion';
import { Check, Plus, Wallet, Shield, Bot, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { getWalletTotalBalance } from '@/contexts/WalletContext';
import { Wallet as WalletType, isAgentLinked } from '@/types/wallet';
import { useNavigate } from 'react-router-dom';

interface WalletSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateNew: () => void;
}

export function WalletSwitcher({ isOpen, onClose, onCreateNew }: WalletSwitcherProps) {
  const navigate = useNavigate();
  const { currentWallet, switchWallet, wallets } = useWallet();

  const handleSelect = (walletId: string) => {
    if (walletId !== currentWallet?.id) {
      switchWallet(walletId);
    }
    onClose();
  };

  // Wallet item component
  const WalletItem = ({ wallet }: { wallet: WalletType }) => {
    const isActive = wallet.id === currentWallet?.id;
    const balance = getWalletTotalBalance(wallet.id);
    return (
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={() => handleSelect(wallet.id)}
        className={cn(
          "w-full flex items-center gap-3 p-3 rounded-xl transition-colors",
          isActive
            ? "bg-accent/10 border border-accent/30"
            : "bg-muted/30 hover:bg-muted/50"
        )}
      >
        {/* Wallet Icon */}
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
          isActive ? (isAgentLinked(wallet) ? "bg-purple-100 dark:bg-purple-900/40" : "gradient-primary") :
          isAgentLinked(wallet) ? "bg-purple-50 dark:bg-purple-900/20" : "bg-muted"
        )}>
          {isAgentLinked(wallet) ? (
            <Bot className={cn(
              "w-5 h-5",
              isActive ? "text-purple-600 dark:text-purple-400" : "text-purple-500 dark:text-purple-400"
            )} />
          ) : (
            <Wallet className={cn(
              "w-5 h-5",
              isActive ? "text-primary-foreground" : "text-muted-foreground"
            )} />
          )}
        </div>

        {/* Wallet Info */}
        <div className="flex-1 text-left min-w-0">
          <div className="flex items-center gap-1.5">
            <p className={cn(
              "font-medium text-sm truncate",
              isActive ? "text-accent" : "text-foreground"
            )}>
              {wallet.name}
            </p>
            {isAgentLinked(wallet) && (
              <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded shrink-0">
                Agent
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Check Mark */}
        {isActive && (
          <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
            <Check className="w-4 h-4 text-accent-foreground" />
          </div>
        )}
      </motion.button>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-end"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="w-full bg-card rounded-t-2xl p-5 pb-8 max-h-[80vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="w-10 h-1 bg-muted rounded-full mx-auto mb-4 shrink-0" />
            
            {/* Title */}
            <h3 className="text-lg font-semibold text-foreground mb-4 shrink-0">切换钱包</h3>
            
            {/* Scrollable Content */}
            <div className="flex-1 overflow-auto space-y-4 mb-4">
              {/* Wallets List */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">钱包</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{wallets.length} 个</span>
                </div>
                <div className="space-y-2">
                  {wallets.map((wallet) => (
                    <WalletItem key={wallet.id} wallet={wallet} />
                  ))}
                </div>
              </div>
            </div>
            
            {/* Action Buttons */}
            <div className="space-y-2 shrink-0">
              <Button
                size="lg"
                className="w-full"
                onClick={() => { onClose(); onCreateNew(); }}
              >
                <Plus className="w-4 h-4 mr-2" />
                创建钱包
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full"
                onClick={() => { onClose(); navigate('/link-agent-wallet'); }}
              >
                <Link2 className="w-4 h-4 mr-2" />
                关联 Agent 钱包
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
