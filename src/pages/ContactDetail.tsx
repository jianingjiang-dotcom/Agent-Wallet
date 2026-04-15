import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Send, Edit, Trash2, Copy, Check, ShieldCheck, ShieldOff } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/lib/toast';
import { ChainId } from '@/types/wallet';
import { ChainIcon } from '@/components/ChainIcon';
import { cn, copyToClipboard } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getChainName } from '@/lib/chain-utils';
import { useRequireRecovery } from '@/hooks/useRequireRecovery';
import { RecoveryRequiredDrawer } from '@/components/RecoveryRequiredDrawer';

export default function ContactDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { contacts, removeContact, updateContact, transactions, currentWallet } = useWallet();
  const { guard, drawerOpen, setDrawerOpen } = useRequireRecovery();

  const contact = contacts.find(c => c.id === id);
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!contact) {
    return (
      <AppLayout showNav={false} title="联系人详情" showBack onBack={() => navigate('/profile/contacts')}>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">联系人不存在</p>
        </div>
      </AppLayout>
    );
  }

  // Get transactions with this contact
  const contactTransactions = transactions.filter(
    tx => tx.counterparty.toLowerCase() === contact.address.toLowerCase()
  ).slice(0, 5);

  const handleCopyAddress = async () => {
    const ok = await copyToClipboard(contact.address);
    if (ok) {
      setCopied(true);
      toast.success('已复制', '地址已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  const handleDelete = () => {
    removeContact(contact.id);
    toast.success('联系人已删除', `${contact.name || '未命名地址'} 已从地址簿移除`);
    navigate('/profile/contacts');
  };

  const handleTransfer = () => {
    guard(() => {
      navigate('/send', {
        state: {
          prefilledAddress: contact.address,
          prefilledNetwork: contact.network
        }
      });
    });
  };

  return (
    <AppLayout
      showNav={false}
      title="联系人详情"
      showBack
      onBack={() => navigate('/profile/contacts')}
      rightAction={
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate(`/profile/contacts/edit/${contact.id}`)}
        >
          <Edit className="w-5 h-5" />
        </Button>
      }
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto">
          {/* Header - Name */}
          <div className="px-4 py-6">
            <motion.h2
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-xl font-semibold"
            >
              {contact.name || '未命名地址'}
            </motion.h2>
          </div>

          {/* Address Card */}
          <div className="px-4 mb-4">
            <div className="p-4 rounded-xl bg-card border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <ChainIcon chainId={contact.network as ChainId} size="sm" />
                <span className="text-sm font-medium">{getChainName(contact.network as ChainId)}</span>
              </div>
              <button
                onClick={handleCopyAddress}
                className="w-full flex items-center gap-2 p-3 rounded-xl bg-muted/50 transition-colors"
              >
                <span className="flex-1 font-mono text-sm text-left break-all">
                  {contact.address}
                </span>
                {copied ? (
                  <Check className="w-4 h-4 text-success flex-shrink-0" />
                ) : (
                  <Copy className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                )}
              </button>
            </div>
          </div>

          {/* Whitelist Toggle */}
          <div className="px-4 mb-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">Agent 白名单</h3>
            <button
              onClick={() => {
                updateContact(contact.id, { isWhitelisted: !contact.isWhitelisted });
                if (contact.isWhitelisted) {
                  toast.success('已移除白名单', `${contact.name || contact.address} 已从 Agent 白名单移除`);
                } else {
                  toast.success('已加入白名单', `${contact.name || contact.address} 已加入 Agent 白名单`);
                }
              }}
              className={cn(
                'w-full p-4 rounded-xl border flex items-center gap-3 transition-all active:scale-[0.98]',
                contact.isWhitelisted
                  ? 'bg-success/8 border-success/20'
                  : 'bg-card border-border/50'
              )}
            >
              <div className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center',
                contact.isWhitelisted
                  ? 'bg-success/10'
                  : 'bg-muted'
              )}>
                {contact.isWhitelisted
                  ? <ShieldCheck className="w-5 h-5 text-success" />
                  : <ShieldOff className="w-5 h-5 text-muted-foreground" />
                }
              </div>
              <div className="flex-1 text-left">
                <p className={cn(
                  'text-sm font-medium',
                  contact.isWhitelisted ? 'text-success' : 'text-foreground'
                )}>
                  {contact.isWhitelisted ? '已在白名单中' : '未加入白名单'}
                </p>
                <p className="text-xs text-muted-foreground">
                  {contact.isWhitelisted
                    ? 'Agent 交易到此地址将标记为安全'
                    : '加入白名单后，Agent 交易到此地址风险更低'}
                </p>
              </div>
            </button>
          </div>

          {/* Notes */}
          {contact.notes && (
            <div className="px-4 mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">备注</h3>
              <div className="p-4 rounded-xl bg-card border border-border/50">
                <p className="text-sm">{contact.notes}</p>
              </div>
            </div>
          )}

          {/* Transaction History */}
          {contactTransactions.length > 0 && (
            <div className="px-4 mb-4">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">交易记录</h3>
              <div className="rounded-xl bg-card border border-border/50 overflow-hidden">
                {contactTransactions.map((tx, index) => (
                  <div
                    key={tx.id}
                    className={cn(
                      "flex items-center justify-between p-4",
                      index < contactTransactions.length - 1 && "border-b border-border/50"
                    )}
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {tx.type === 'send' ? '转出' : '转入'} {tx.amount} {tx.symbol}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {formatDistanceToNow(tx.timestamp, { addSuffix: true, locale: zhCN })}
                      </p>
                    </div>
                    <span className={cn(
                      "text-xs px-2 py-1 rounded-full",
                      tx.status === 'confirmed' && "bg-success/10 text-success",
                      tx.status === 'pending' && "bg-warning/10 text-warning",
                      tx.status === 'failed' && "bg-destructive/10 text-destructive"
                    )}>
                      {tx.status === 'confirmed' && '已确认'}
                      {tx.status === 'pending' && '处理中'}
                      {tx.status === 'failed' && '失败'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Delete Action */}
          <div className="px-4 pb-4">
            <Button
              variant="outline"
              className="w-full justify-start gap-3 h-12 text-destructive"
              onClick={() => setShowDeleteDialog(true)}
            >
              <Trash2 className="w-5 h-5" />
              删除联系人
            </Button>
          </div>
        </div>

        {/* Bottom Action */}
        <div className="p-4 border-t border-border/50">
          <Button
            onClick={handleTransfer}
            size="lg"
            className="w-full gap-2"
          >
            <Send className="w-5 h-5" />
            转账给 TA
          </Button>
        </div>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除联系人 "{contact.name || '未命名地址'}" 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <RecoveryRequiredDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        walletName={currentWallet?.name}
      />
    </AppLayout>
  );
}
