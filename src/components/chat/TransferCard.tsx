import { useNavigate } from 'react-router-dom';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatAddressShort } from '@/lib/utils';
import type { TransferCardData } from '@/types/chat';
import { useRequireRecovery } from '@/hooks/useRequireRecovery';
import { RecoveryRequiredDrawer } from '@/components/RecoveryRequiredDrawer';
import { useWallet } from '@/contexts/WalletContext';

export function TransferCard({ data }: { data: TransferCardData }) {
  const navigate = useNavigate();
  const { currentWallet } = useWallet();
  const { guard, drawerOpen, setDrawerOpen } = useRequireRecovery();

  const handleGo = () => {
    guard(() => {
      const params = new URLSearchParams({
        to: data.to,
        amount: String(data.amount),
        symbol: data.symbol,
        ...(data.chain ? { chain: data.chain } : {}),
      });
      navigate(`/send?${params.toString()}`);
    });
  };

  return (
    <div className="rounded-xl border bg-card p-3 space-y-3">
      <div className="flex items-center gap-2">
        <Send className="w-4 h-4 text-accent" />
        <span className="text-sm font-medium">转账确认</span>
      </div>

      <div className="space-y-1 text-xs">
        <div className="flex justify-between">
          <span className="text-muted-foreground">收款方</span>
          <span className="font-mono">{formatAddressShort(data.to)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">金额</span>
          <span>{data.amount} {data.symbol}</span>
        </div>
        {data.chain && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">网络</span>
            <span className="capitalize">{data.chain}</span>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <Button variant="ghost" size="sm" className="flex-1 text-xs">取消</Button>
        <Button size="sm" className="flex-1 text-xs bg-accent text-accent-foreground" onClick={handleGo}>
          去转账
        </Button>
      </div>

      <RecoveryRequiredDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        walletName={currentWallet?.name}
      />
    </div>
  );
}
