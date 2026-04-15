import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Wallet, Bot, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { useWallet, getWalletTotalBalance } from '@/contexts/WalletContext';
import { isAgentLinked, ADDRESS_SYSTEMS } from '@/types/wallet';

const DEVICE_SEEN_PREFIX = 'device_seen_';

/**
 * Welcome back page — shown once after first login on a new device when
 * any wallet has isKeyShareRecovered=false. User can recover all at once
 * or skip into view-only mode.
 */
export default function WelcomeBackPage() {
  const navigate = useNavigate();
  const { wallets, userInfo } = useWallet();
  const [skipDrawerOpen, setSkipDrawerOpen] = useState(false);

  // Mark this device as "seen" the moment user lands here, so reload won't loop
  useEffect(() => {
    if (userInfo?.uid) {
      localStorage.setItem(`${DEVICE_SEEN_PREFIX}${userInfo.uid}`, '1');
    }
  }, [userInfo?.uid]);

  const unrecoveredWallets = useMemo(
    () => wallets.filter(w => !w.isKeyShareRecovered),
    [wallets]
  );

  const totalBalance = useMemo(
    () => unrecoveredWallets.reduce((sum, w) => sum + getWalletTotalBalance(w.id), 0),
    [unrecoveredWallets]
  );

  // If somehow nothing to recover, bounce to home
  useEffect(() => {
    if (unrecoveredWallets.length === 0) {
      navigate('/home', { replace: true });
    }
  }, [unrecoveredWallets.length, navigate]);

  const handleRecover = () => {
    navigate('/wallet/recovery', { state: { returnTo: '/home' } });
  };

  const handleSkipClick = () => {
    setSkipDrawerOpen(true);
  };

  const handleConfirmSkip = () => {
    setSkipDrawerOpen(false);
    navigate('/home', { replace: true });
  };

  if (unrecoveredWallets.length === 0) return null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col px-6 pt-12 pb-6">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex flex-col items-center text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0.85 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
            className="w-[72px] h-[72px] rounded-[22px] bg-primary/10 flex items-center justify-center mb-5"
          >
            <Sparkles className="w-9 h-9 text-primary" strokeWidth={1.75} />
          </motion.div>

          <h1 className="text-[28px] font-bold text-foreground tracking-tight mb-2">
            Welcome back
          </h1>
          <p className="text-[15px] text-muted-foreground">
            检测到 {unrecoveredWallets.length} 个钱包待恢复
          </p>
        </motion.div>

        {/* Wallet list — Apple grouped style */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="bg-card rounded-2xl overflow-hidden mb-3"
          style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
        >
          {unrecoveredWallets.map((wallet, idx) => {
            const balance = getWalletTotalBalance(wallet.id);
            const agentLinked = isAgentLinked(wallet);
            const systems = Array.from(
              new Set(wallet.walletAddresses.map(a => a.system))
            );
            const systemNames = systems
              .map(s => ADDRESS_SYSTEMS.find(x => x.id === s)?.name || s)
              .join(' · ');
            return (
              <div
                key={wallet.id}
                className={`flex items-center gap-3 px-4 py-3.5 ${
                  idx > 0 ? 'border-t border-border/60' : ''
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                    agentLinked ? 'bg-primary/10' : 'bg-muted'
                  }`}
                >
                  {agentLinked ? (
                    <Bot className="w-5 h-5 text-primary" strokeWidth={1.5} />
                  ) : (
                    <Wallet className="w-5 h-5 text-muted-foreground" strokeWidth={1.5} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-semibold text-foreground truncate">
                    {wallet.name}
                  </p>
                  <p className="text-[12px] text-muted-foreground mt-0.5">
                    {systemNames}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-[15px] font-semibold text-foreground tabular-nums">
                    ${balance.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>
            );
          })}
        </motion.div>

        {/* Total */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="text-center mb-6"
        >
          <p className="text-[12px] text-muted-foreground">
            总资产 ${totalBalance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </motion.div>

        <div className="flex-1" />

        {/* Footer note */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[12px] text-muted-foreground text-center leading-relaxed mb-4 max-w-[300px] mx-auto"
        >
          未恢复的钱包仅可浏览资产，无法发起转账或签名
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="space-y-2.5"
        >
          <Button
            size="lg"
            className="w-full h-12 text-[15px] font-semibold rounded-xl"
            onClick={handleRecover}
          >
            恢复钱包
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="w-full h-12 text-[15px] text-muted-foreground rounded-xl"
            onClick={handleSkipClick}
          >
            稍后再说
          </Button>
        </motion.div>
      </div>

      {/* Skip confirmation drawer */}
      <Drawer open={skipDrawerOpen} onOpenChange={setSkipDrawerOpen}>
        <DrawerContent>
          <DrawerHeader className="sr-only">
            <DrawerTitle>暂不恢复钱包</DrawerTitle>
          </DrawerHeader>

          <div className="px-6 pt-2 pb-6 flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-[68px] h-[68px] rounded-[20px] bg-warning/10 flex items-center justify-center mb-5"
            >
              <EyeOff className="w-8 h-8 text-warning" strokeWidth={1.75} />
            </motion.div>

            <h2 className="text-[22px] font-bold text-foreground tracking-tight mb-2">
              确认进入浏览模式？
            </h2>

            <p className="text-[15px] text-muted-foreground leading-relaxed max-w-[300px] mb-6">
              未恢复的钱包仅可查看资产，<span className="text-foreground font-medium">无法发起转账或签名</span>。你可以随时从"钱包管理"重新发起恢复。
            </p>

            <div className="w-full space-y-2.5">
              <Button
                size="lg"
                className="w-full h-12 text-[15px] font-semibold rounded-xl"
                onClick={() => {
                  setSkipDrawerOpen(false);
                  handleRecover();
                }}
              >
                立即恢复
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="w-full h-12 text-[15px] text-muted-foreground rounded-xl"
                onClick={handleConfirmSkip}
              >
                继续浏览
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
