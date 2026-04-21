import { useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, ArrowLeft, X, Menu, Plus, Sparkles
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { getChainIconUrl } from '@/lib/crypto-icons';
import { SUPPORTED_CHAINS, ChainId } from '@/types/wallet';
import { CryptoIcon } from '@/components/CryptoIcon';
import { ChainIcon } from '@/components/ChainIcon';
import { AppLayout } from '@/components/layout/AppLayout';
import { PageTransition } from '@/components/PageTransition';
import { DetailRow } from '@/components/ui/detail-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { toast } from '@/lib/toast';
import { RbfActionSection } from '@/components/RbfActionSection';
import { Drawer, DrawerContent } from '@/components/ui/drawer';
import { AssistantView } from '@/components/chat/AssistantView';
import { useChatHistory } from '@/hooks/useChatHistory';
import { SpeedUpDrawer } from '@/components/SpeedUpDrawer';
import { CancelTxDrawer } from '@/components/CancelTxDrawer';
import { SpeedUpTier } from '@/lib/rbf-utils';
import { BottomNav } from '@/components/layout/BottomNav';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, currentWallet } = useWallet();

  const transaction = transactions.find(tx => tx.id === id);

  const [chatOpen, setChatOpen] = useState(false);
  const [chatExpanding, setChatExpanding] = useState(false);
  const chatHistory = useChatHistory();

  const handleChatClose = useCallback(() => {
    chatHistory.cleanEmptySessions();
    setChatOpen(false);
  }, [chatHistory]);

  const handleExpandToAssistant = () => {
    setChatExpanding(true);
    // Fade out the drawer overlay so navigate doesn't flash
    requestAnimationFrame(() => {
      const drawerEl = document.querySelector('[data-vaul-drawer]');
      if (drawerEl?.previousElementSibling) {
        const overlay = drawerEl.previousElementSibling as HTMLElement;
        overlay.style.transition = 'opacity 0.3s ease';
        overlay.style.opacity = '0';
      }
    });
    // Wait for expansion + nav animation to finish, then seamlessly switch
    setTimeout(() => {
      navigate('/assistant', { replace: true });
    }, 500);
  };

  // RBF drawer states
  const [speedUpDrawerOpen, setSpeedUpDrawerOpen] = useState(false);
  const [cancelDrawerOpen, setCancelDrawerOpen] = useState(false);
  const [showHashDetail, setShowHashDetail] = useState(false);
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleSpeedUpConfirm = (tier: SpeedUpTier, newFee: number, newGasAmount: number) => {
    setSpeedUpDrawerOpen(false);
    toast.success('加速请求已提交', '新交易正在广播中');
    navigate(-1);
  };

  const handleCancelConfirm = (cancelFee: number, cancelGasAmount: number) => {
    setCancelDrawerOpen(false);
    toast.success('取消请求已提交', '原交易将被替换');
    navigate(-1);
  };

  if (!transaction) {
    return (
      <PageTransition>
        <AppLayout showNav={false} showBack title="交易详情" pageBg="bg-background">
          <div className="flex-1 flex items-center justify-center p-4">
            <p className="text-muted-foreground">交易不存在</p>
          </div>
        </AppLayout>
      </PageTransition>
    );
  }

  const senderAddress = transaction.type === 'receive'
    ? transaction.counterparty
    : (currentWallet?.addresses?.[transaction.network as ChainId] || '');

  const receiverAddress = transaction.type === 'send'
    ? transaction.counterparty
    : (currentWallet?.addresses?.[transaction.network as ChainId] || '');

  const statusConfig = {
    confirmed: { label: '已完成', icon: CheckCircle2, variant: 'success' as const },
    pending: { label: '处理中', icon: Clock, variant: 'warning' as const },
    failed: { label: '失败', icon: XCircle, variant: 'danger' as const },
  };

  const status = statusConfig[transaction.status];
  const typeLabel = transaction.type === 'receive' ? '转入' : '转出';

  return (
    <PageTransition>
      <AppLayout showNav={false} showBack title="交易详情" pageBg="bg-background" rightAction={
        <motion.button
          onClick={() => { chatHistory.cleanEmptySessions(); chatHistory.switchSession(null); setChatOpen(true); }}
          className="relative flex items-center gap-1.5 pl-2 pr-2.5 py-1 rounded-full overflow-hidden active:scale-95 transition-transform"
          style={{
            background: 'linear-gradient(135deg, #7C3AED, #6366F1, #3B82F6)',
            boxShadow: '0 2px 8px rgba(99, 102, 241, 0.4)',
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.92 }}
        >
          <motion.div
            className="absolute inset-0 opacity-30"
            style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 50%, transparent 100%)' }}
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: 'linear' }}
          />
          <Sparkles className="w-3 h-3 text-white relative z-10" strokeWidth={2} />
          <span className="text-[11px] font-semibold text-white relative z-10 tracking-wide">Ask AI</span>
        </motion.button>
      }>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-6 space-y-4" style={{ paddingBottom: transaction.status === 'pending' && transaction.type === 'send' ? '96px' : '64px' }}>

            {/* Amount Section */}
            <div className="text-center">
              <div className="flex flex-col items-center gap-4 mb-1">
                <div className="relative">
                  <CryptoIcon symbol={transaction.symbol} size="lg" className="!w-12 !h-12" />
                  <img src={getChainIconUrl(transaction.network)} alt={transaction.network} className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full border-2 border-white" />
                </div>
                <span className={cn(
                  'text-2xl font-bold',
                  transaction.type === 'receive' ? 'text-success' : 'text-foreground'
                )}>
                  {transaction.type === 'receive' ? '+' : '-'}{transaction.amount} {transaction.symbol}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">${transaction.usdValue.toLocaleString()}</p>
              <div className={cn(
                "mt-6 mx-auto rounded-xl px-4 py-4 text-left",
                transaction.status === 'pending' && "bg-[#FEF3E7]",
                transaction.status === 'confirmed' && "bg-[#ECFBF2] dark:bg-success/900/20",
                transaction.status === 'failed' && "bg-[#FBEFF6]"
              )}>
                <span className={cn(
                  "font-medium",
                  transaction.status === 'pending' && "text-[#FA8C16]",
                  transaction.status === 'confirmed' && "text-[#11C45A] dark:text-green-400",
                  transaction.status === 'failed' && "text-[#E74E5A]"
                )} style={{ fontSize: '16px', lineHeight: '24px' }}>
                  {typeLabel}{status.label}
                </span>
                {transaction.status === 'failed' && transaction.failureReason && (
                  <p className="text-sm text-[#E74E5A] mt-1">{transaction.failureReason}</p>
                )}
              </div>
            </div>

            {/* Details Card */}
            <div className="rounded-xl flex flex-col gap-6 py-4" style={{ backgroundColor: '#F8F9FC' }}>
              {/* Sender */}
              <DetailRow
                label="发送地址"
                value={
                  transaction.type === 'receive' && transaction.counterpartyLabel
                    ? transaction.counterpartyLabel
                    : `${senderAddress.slice(0, 10)}...${senderAddress.slice(-8)}`
                }
                copyValue={senderAddress}
              />

              {/* Receiver */}
              <DetailRow
                label="收款地址"
                value={
                  transaction.type === 'send' && transaction.counterpartyLabel
                    ? transaction.counterpartyLabel
                    : `${receiverAddress.slice(0, 10)}...${receiverAddress.slice(-8)}`
                }
                copyValue={receiverAddress}
              />

              {/* Network */}
              <DetailRow
                label="网络"
                value={SUPPORTED_CHAINS.find(c => c.id === transaction.network)?.name || transaction.network}
                icon={<ChainIcon chainId={transaction.network} size="sm" className="!w-5 !h-5" />}
              />

              {/* Network Fee */}
              {transaction.fee !== undefined && transaction.fee > 0 && (
                <DetailRow
                  label="Gas 费"
                  value={
                    transaction.gasAmount && transaction.gasToken
                      ? `${transaction.gasAmount.toFixed(6)} ${transaction.gasToken}`
                      : `≈ $${transaction.fee.toFixed(2)}`
                  }
                  subValue={
                    transaction.gasAmount && transaction.gasToken
                      ? `≈ $${transaction.fee.toFixed(2)}`
                      : undefined
                  }
                />
              )}


              {/* Memo */}
              {transaction.memo && (
                <DetailRow label="备注" value={transaction.memo} />
              )}
            </div>

            {/* Time & Hash Card */}
            <div className="rounded-xl flex flex-col gap-6 py-4" style={{ backgroundColor: '#F8F9FC' }}>
              <DetailRow
                label="时间"
                value={new Date(transaction.timestamp).toLocaleString('zh-CN')}
              />
              {transaction.txHash && (
                <DetailRow
                  label="交易哈希"
                  value={
                    <span
                      className="text-sm text-foreground font-medium truncate block underline cursor-pointer"
                      style={{ maxWidth: '180px' }}
                      onClick={() => { setRefreshKey(0); setShowHashDetail(true); }}
                    >
                      {`${transaction.txHash.slice(0, 10)}...${transaction.txHash.slice(-6)}`}
                    </span>
                  }
                  copyValue={transaction.txHash}
                />
              )}
            </div>


          </div>
        </div>

        {/* RBF Actions — fixed bottom bar for pending send txs */}
        <RbfActionSection
          transaction={transaction}
          onSpeedUp={() => setSpeedUpDrawerOpen(true)}
          onCancel={() => setCancelDrawerOpen(true)}
        />

        {/* RBF Drawers */}
        <SpeedUpDrawer
          open={speedUpDrawerOpen}
          onOpenChange={setSpeedUpDrawerOpen}
          transaction={transaction}
          onConfirm={handleSpeedUpConfirm}
        />
        <CancelTxDrawer
          open={cancelDrawerOpen}
          onOpenChange={setCancelDrawerOpen}
          transaction={transaction}
          onConfirm={handleCancelConfirm}
        />
        {/* AI Chat Drawer */}
        <Drawer open={chatOpen} onOpenChange={(open) => { if (!open) handleChatClose(); else setChatOpen(true); }}>
          <DrawerContent className={cn("px-0 pb-0 [&>div:first-child]:hidden transition-all duration-300 ease-out", chatExpanding ? "!rounded-none h-[calc(100%-44px)]" : "h-[85vh]")} style={{ border: 'none', boxShadow: 'none', outline: 'none', background: chatExpanding ? '#F8F9FC' : 'transparent' }}>
            {/* Handle bar + Header */}
            <div className={cn("shrink-0 bg-white relative z-20 transition-all duration-300", chatExpanding ? "rounded-none bg-page" : "rounded-t-[20px]")}>
              <div className={cn("flex justify-center pt-2 pb-2 transition-all duration-300 overflow-hidden", chatExpanding ? "opacity-0 h-0 pt-0 pb-0" : "h-auto")}>
                <div className="w-9 h-1 rounded-full bg-[#EDEEF3]" />
              </div>
              <div className="relative flex items-center justify-center px-4 h-[44px]">
                {/* Expand icon → Menu icon crossfade */}
                <button className="absolute left-4 flex items-center justify-center w-6 h-6" onClick={handleExpandToAssistant}>
                  <svg
                    width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    className={cn("absolute transition-opacity duration-300", chatExpanding ? "opacity-0" : "opacity-100")}
                  >
                    <path d="m15 15 6 6"/><path d="m15 9 6-6"/><path d="M21 16v5h-5"/><path d="M21 8V3h-5"/><path d="M3 16v5h5"/><path d="m3 21 6-6"/><path d="M3 8V3h5"/><path d="M9 9 3 3"/>
                  </svg>
                  <Menu
                    className={cn("w-6 h-6 absolute transition-opacity duration-300 pointer-events-none", chatExpanding ? "opacity-100" : "opacity-0")}
                    strokeWidth={1.5}
                    style={{ color: '#000000' }}
                  />
                </button>
                <h3 className="text-[18px] leading-[28px] font-semibold text-foreground">AI 助手</h3>
                {/* Close icon → Plus icon crossfade */}
                <button className="absolute right-4 flex items-center justify-center w-6 h-6" onClick={handleChatClose}>
                  <svg
                    width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                    className={cn("absolute transition-opacity duration-300", chatExpanding ? "opacity-0" : "opacity-100")}
                  >
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                  <Plus
                    className={cn("w-6 h-6 absolute transition-opacity duration-300 pointer-events-none", chatExpanding ? "opacity-100" : "opacity-0")}
                    strokeWidth={1.5}
                    style={{ color: '#000000' }}
                  />
                </button>
              </div>
            </div>
            {/* Chat content + input */}
            {/* Chat content + input */}
            <div className={cn("flex-1 min-h-0 flex flex-col -mt-px transition-colors duration-300", chatExpanding ? "bg-page overflow-visible" : "bg-white overflow-hidden")}>
              <AssistantView chatHistory={chatHistory} hideNav inputPaddingBottom={chatExpanding ? 0 : undefined} scrollBottomOffset={chatExpanding ? 96 : 0} hideInputGradient={chatExpanding} />
            </div>
            {/* Bottom nav - height pushes input up, transform slides nav in (GPU) */}
            <div className="shrink-0 relative" style={{ height: chatExpanding ? 96 : 0, transition: 'height 0.4s cubic-bezier(0.25, 0.1, 0.25, 1)', overflow: 'visible', background: '#FFFFFF' }}>
              {/* Gradient overlays matching AppLayout's BottomNav area exactly */}
              <div className="absolute bottom-0 left-0 right-0 h-[83px] pointer-events-none" style={{ opacity: chatExpanding ? 1 : 0, transition: 'opacity 0.4s ease', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', maskImage: 'linear-gradient(to bottom, transparent, black)', WebkitMaskImage: 'linear-gradient(to bottom, transparent, black)' }} />
              <div className="absolute bottom-0 left-0 right-0 h-[83px] pointer-events-none" style={{ opacity: chatExpanding ? 1 : 0, transition: 'opacity 0.4s ease', background: 'linear-gradient(to bottom, rgba(255,255,255,0), rgba(255,255,255,1))' }} />
              <div
                className="absolute bottom-0 left-0 right-0 z-10"
                style={{ transform: chatExpanding ? 'none' : 'translateY(100%)', opacity: chatExpanding ? 1 : 0, transition: 'transform 0.4s cubic-bezier(0.25, 0.1, 0.25, 1), opacity 0.3s ease' }}
              >
                <BottomNav activeOverride={1} />
              </div>
            </div>
          </DrawerContent>
        </Drawer>
      </AppLayout>

      {/* Transaction Hash Detail Overlay */}
      <AnimatePresence>
        {showHashDetail && transaction?.txHash && (
          <motion.div
            className="absolute inset-0 z-50 bg-background flex flex-col"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'tween', duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            {/* Header */}
            <div className="flex items-center h-11 px-4 relative">
              <button
                onClick={() => setShowHashDetail(false)}
                className="flex items-center justify-center"
              >
                <X className="w-6 h-6 text-foreground" />
              </button>
              <p className="flex-1 text-base font-semibold text-foreground truncate mx-8">
                Transaction {transaction.txHash}
              </p>
              <button className="flex items-center justify-center" onClick={() => setShowMoreDrawer(true)}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M12 13C12.5523 13 13 12.5523 13 12C13 11.4477 12.5523 11 12 11C11.4477 11 11 11.4477 11 12C11 12.5523 11.4477 13 12 13Z" fill="#1C1C1C" stroke="#1C1C1C" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M19 13C19.5523 13 20 12.5523 20 12C20 11.4477 19.5523 11 19 11C18.4477 11 18 11.4477 18 12C18 12.5523 18.4477 13 19 13Z" fill="#1C1C1C" stroke="#1C1C1C" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M5 13C5.55228 13 6 12.5523 6 12C6 11.4477 5.55228 11 5 11C4.44772 11 4 11.4477 4 12C4 12.5523 4.44772 13 5 13Z" fill="#1C1C1C" stroke="#1C1C1C" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            {/* Loading progress bar */}
            <motion.div
              key={`progress-${refreshKey}`}
              className="w-full h-[1.5px] bg-muted overflow-hidden"
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              transition={{ delay: 3, duration: 0.3 }}
            >
              <motion.div
                className="h-full"
                style={{ backgroundColor: '#1F32D6' }}
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 3, ease: 'easeInOut' }}
              />
            </motion.div>

            {/* Content - empty demo */}
            <motion.div
              key={`content-${refreshKey}`}
              className="flex-1 flex items-center justify-center"
              initial={{ backgroundColor: refreshKey > 0 ? '#F8F9FC' : '#FFFFFF' }}
              animate={{ backgroundColor: '#F8F9FC' }}
              transition={refreshKey > 0 ? { duration: 0 } : { delay: 3, duration: 0.3 }}
            >
              <motion.p
                className="text-base leading-6 text-muted-foreground"
                initial={{ opacity: refreshKey > 0 ? 1 : 0 }}
                animate={{ opacity: 1 }}
                transition={refreshKey > 0 ? { duration: 0 } : { delay: 3.3, duration: 0.3 }}
              >
                此处展示区块浏览器页面
              </motion.p>
            </motion.div>

            {/* More actions drawer */}
            <Drawer open={showMoreDrawer} onOpenChange={setShowMoreDrawer}>
              <DrawerContent className="px-0 pb-0">
                <div className="p-4 pb-[50px]">
                  <div className="flex flex-col gap-3">
                    <button
                      className="flex items-center gap-3 w-full text-base font-medium transition-colors leading-6 bg-[#F7F8FA] rounded-2xl p-4"
                      style={{ color: '#1c1c1c' }}
                      onClick={() => {
                        setShowMoreDrawer(false);
                        toast.success('已清除缓存');
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="m16 22-1-4"/><path d="M19 14a1 1 0 0 0 1-1v-1a2 2 0 0 0-2-2h-3a1 1 0 0 1-1-1V4a2 2 0 0 0-4 0v5a1 1 0 0 1-1 1H6a2 2 0 0 0-2 2v1a1 1 0 0 0 1 1"/><path d="M19 14H5l-1.973 6.767A1 1 0 0 0 4 22h16a1 1 0 0 0 .973-1.233z"/><path d="m8 22 1-4"/></svg>
                      清除缓存
                    </button>
                    <button
                      className="flex items-center gap-3 w-full text-base font-medium transition-colors leading-6 bg-[#F7F8FA] rounded-2xl p-4"
                      style={{ color: '#1c1c1c' }}
                      onClick={() => {
                        setShowMoreDrawer(false);
                        setRefreshKey(k => k + 1);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 16h5v5"/></svg>
                      刷新
                    </button>
                    <button
                      className="flex items-center gap-3 w-full text-base font-medium transition-colors leading-6 bg-[#F7F8FA] rounded-2xl p-4"
                      style={{ color: '#1c1c1c' }}
                      onClick={() => {
                        setShowMoreDrawer(false);
                        toast.success('链接已复制');
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      复制链接
                    </button>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>

          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
