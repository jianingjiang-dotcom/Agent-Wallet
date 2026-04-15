import { useState } from 'react';
import { motion } from 'framer-motion';
import { Bot, Clock, AlertTriangle, Copy, ExternalLink, CheckCircle2, XCircle, RefreshCw, Trash2, Loader2 } from 'lucide-react';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { DetailRow } from '@/components/ui/detail-row';
import { StatusBadge } from '@/components/ui/status-badge';
import { cn, copyToClipboard } from '@/lib/utils';
import { AgentTransaction } from '@/types/wallet';
import { CryptoIcon } from '@/components/CryptoIcon';
import { ChainIcon } from '@/components/ChainIcon';
import { SettlementTimeline } from '@/components/SettlementTimeline';
import { toast } from '@/lib/toast';

interface AgentReviewDrawerProps {
  tx: AgentTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApprove: (txId: string, note?: string) => void;
  onReject: (txId: string, reason: string) => void;
  onRetry?: (txId: string) => void;
  onVoid?: (txId: string) => void;
}

const riskConfig = {
  green: { label: '安全', variant: 'success' as const },
  yellow: { label: '可疑', variant: 'warning' as const },
  red: { label: '高危', variant: 'danger' as const },
};

function formatCountdown(expiresAt: Date): string {
  const diff = expiresAt.getTime() - Date.now();
  if (diff <= 0) return '已过期';
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins} 分钟`;
  const hours = Math.floor(mins / 60);
  return `${hours} 小时 ${mins % 60} 分钟`;
}

export function AgentReviewDrawer({ tx, open, onOpenChange, onApprove, onReject, onRetry, onVoid }: AgentReviewDrawerProps) {
  const [note, setNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [mode, setMode] = useState<'review' | 'reject'>('review');

  if (!tx) return null;

  const risk = riskConfig[tx.riskScore];
  const isPending = tx.status === 'pending_approval';

  const handleCopy = async (text: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      toast.success('已复制');
    } else {
      toast.error('复制失败');
    }
  };

  const handleApprove = () => {
    onApprove(tx.id, note || undefined);
    onOpenChange(false);
    setNote('');
    setMode('review');
  };

  const handleReject = () => {
    if (!rejectReason.trim()) {
      toast.error('请输入拒绝原因');
      return;
    }
    onReject(tx.id, rejectReason);
    onOpenChange(false);
    setRejectReason('');
    setMode('review');
  };

  return (
    <Drawer open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) setMode('review'); }}>
      <DrawerContent className="max-h-[85vh] flex flex-col">
        <DrawerHeader className="pb-2 shrink-0">
          <DrawerTitle>交易审核</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 overflow-y-auto flex-1 min-h-0 space-y-4">
          {/* Amount */}
          <div className="text-center py-3">
            <div className="flex items-center justify-center gap-2 mb-1">
              <CryptoIcon symbol={tx.symbol} size="sm" />
              <span className="text-2xl font-bold">{tx.amount.toLocaleString()} {tx.symbol}</span>
            </div>
            <p className="text-sm text-muted-foreground">≈ ${tx.usdValue.toLocaleString()}</p>
            <StatusBadge variant={risk.variant} className="mt-2">
              {risk.label}
            </StatusBadge>
          </div>

          {/* Risk reasons */}
          {tx.riskReasons && tx.riskReasons.length > 0 && (
            <div className="bg-warning/8 rounded-xl p-3 border border-warning/20">
              <div className="flex items-center gap-1.5 mb-2">
                <AlertTriangle className="w-4 h-4 text-warning" />
                <span className="text-xs font-medium text-warning">风险提示</span>
              </div>
              <ul className="space-y-1">
                {tx.riskReasons.map((r, i) => (
                  <li key={i} className="text-xs text-warning">• {r}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Details */}
          <div className="card-elevated rounded-xl divide-y divide-border">
            <DetailRow label="Agent" value={tx.agentName} icon={<Bot className="w-3.5 h-3.5" />} />
            <DetailRow label="钱包" value={tx.walletName} />
            <DetailRow label="目标地址" value={tx.toLabel || `${tx.toAddress.slice(0, 14)}...${tx.toAddress.slice(-8)}`} copyValue={tx.toAddress} />
            <DetailRow label="网络" value={tx.network} icon={<ChainIcon chainId={tx.network} className="w-4 h-4" />} />
            {tx.memo && <DetailRow label="备注" value={tx.memo} />}
            {isPending && (
              <DetailRow label="剩余时间" value={formatCountdown(tx.expiresAt)} icon={<Clock className="w-3.5 h-3.5 text-warning" />} />
            )}
          </div>

          {/* Completed status details */}
          {!isPending && tx.reviewedBy && (
            <div className="card-elevated rounded-xl divide-y divide-border">
              <DetailRow label="审核人" value={tx.reviewedBy} />
              {tx.reviewNote && <DetailRow label="备注" value={tx.reviewNote} />}
              {tx.rejectionReason && <DetailRow label="拒绝原因" value={tx.rejectionReason} />}
{tx.txHash && <DetailRow label="交易哈希" value={`${tx.txHash.slice(0, 14)}...`} copyValue={tx.txHash} mono />}
            </div>
          )}

          {/* Settlement timeline */}
          <SettlementTimeline tx={tx} />
        </div>

        {/* Sticky action buttons at bottom */}
        {isPending && (
          <div className="shrink-0 border-t border-border bg-background px-4 py-4 space-y-3">
            {mode === 'review' && (
              <>
                <Textarea
                  placeholder="审核备注（可选）"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="resize-none h-16 text-sm"
                />
                <div className="flex gap-2">
                  <Button onClick={handleApprove} className="flex-1 gradient-primary gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> 批准
                  </Button>
                  <Button variant="destructive" onClick={() => setMode('reject')} className="flex-1 gap-1.5">
                    <XCircle className="w-4 h-4" /> 拒绝
                  </Button>
                </div>
              </>
            )}

            {mode === 'reject' && (
              <>
                <Textarea
                  placeholder="请输入拒绝原因（必填）"
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="resize-none h-20 text-sm"
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setMode('review')} className="flex-1">取消</Button>
                  <Button variant="destructive" onClick={handleReject} className="flex-1">确认拒绝</Button>
                </div>
              </>
            )}

          </div>
        )}

        {/* Failed tx actions */}
        {tx.status === 'failed' && onRetry && onVoid && (
          <div className="shrink-0 border-t border-border bg-background px-4 py-4 space-y-3">
            <p className="text-xs text-destructive text-center">{tx.failureReason}</p>
            {tx.retryCount != null && tx.retryCount > 0 && (
              <p className="text-[11px] text-muted-foreground text-center">已重试 {tx.retryCount} 次</p>
            )}
            <div className="flex gap-2">
              <Button onClick={() => { onRetry(tx.id); onOpenChange(false); }} className="flex-1 gradient-primary gap-1.5">
                <RefreshCw className="w-4 h-4" /> 重试
              </Button>
              <Button variant="destructive" onClick={() => { onVoid(tx.id); onOpenChange(false); }} className="flex-1 gap-1.5">
                <Trash2 className="w-4 h-4" /> 作废
              </Button>
            </div>
          </div>
        )}

        {/* Processing state indicator */}
        {(tx.status === 'broadcasting' || tx.status === 'confirming') && (
          <div className="shrink-0 border-t border-border bg-background px-4 py-4">
            <Button disabled className="w-full gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              {tx.status === 'broadcasting' ? '链上广播中...' : `确认中 (${tx.confirmations || 0}/${tx.requiredConfirmations || '?'})`}
            </Button>
          </div>
        )}
      </DrawerContent>
    </Drawer>
  );
}

