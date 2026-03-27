import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2, XCircle, Clock, ArrowLeft, X
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
import { SpeedUpDrawer } from '@/components/SpeedUpDrawer';
import { CancelTxDrawer } from '@/components/CancelTxDrawer';
import { SpeedUpTier } from '@/lib/rbf-utils';

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { transactions, currentWallet } = useWallet();

  const transaction = transactions.find(tx => tx.id === id);

  // RBF drawer states
  const [speedUpDrawerOpen, setSpeedUpDrawerOpen] = useState(false);
  const [cancelDrawerOpen, setCancelDrawerOpen] = useState(false);
  const [showHashDetail, setShowHashDetail] = useState(false);
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
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
        <button className="flex items-center justify-center w-6 h-6">
          <svg xmlns="http://www.w3.org/2000/svg" width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/><path d="M12 8v6"/><path d="M9 11h6"/></svg>
        </button>
      }>
        <div className="flex-1 overflow-y-auto">
          <div className="px-4 pt-6 space-y-4" style={{ paddingBottom: '64px' }}>

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
                transaction.status === 'pending' && "bg-[#FEF3E7] dark:bg-amber-900/20",
                transaction.status === 'confirmed' && "bg-[#ECFBF2] dark:bg-green-900/20",
                transaction.status === 'failed' && "bg-[#FBEFF6] dark:bg-red-900/20"
              )}>
                <span className={cn(
                  "font-medium",
                  transaction.status === 'pending' && "text-[#FA8C16] dark:text-amber-400",
                  transaction.status === 'confirmed' && "text-[#11C45A] dark:text-green-400",
                  transaction.status === 'failed' && "text-[#E74E5A] dark:text-red-400"
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

              {/* Confirmations */}
              {transaction.status === 'confirmed' && transaction.confirmations !== undefined && (
                <DetailRow
                  label="确认数"
                  value={`${transaction.confirmations >= 100 ? '100+' : transaction.confirmations} 次确认`}
                />
              )}

              {/* Block Height */}
              {transaction.status === 'confirmed' && transaction.blockHeight && (
                <DetailRow
                  label="区块高度"
                  value={`#${transaction.blockHeight.toLocaleString()}`}
                  mono
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
                        setToastMessage('已清除缓存');
                        setTimeout(() => setToastMessage(null), 2000);
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
                        setToastMessage('链接已复制');
                        setTimeout(() => setToastMessage(null), 2000);
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1C1C1C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      复制链接
                    </button>
                  </div>
                </div>
              </DrawerContent>
            </Drawer>

            {/* Toast */}
            <AnimatePresence>
              {toastMessage && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center pointer-events-none z-[200]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-[#1C1C1C]/80 text-white text-sm px-5 py-2.5 rounded-lg">
                    {toastMessage}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </PageTransition>
  );
}
