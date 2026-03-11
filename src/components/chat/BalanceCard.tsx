import { useNavigate } from 'react-router-dom';
import { Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { BalanceCardData } from '@/types/chat';

export function BalanceCard({ data }: { data: BalanceCardData }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Wallet className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium">{data.symbol}</span>
        </div>
        <span className="text-sm font-semibold">${data.totalUsd.toLocaleString()}</span>
      </div>

      <div className="space-y-1">
        {data.entries.map((e, i) => (
          <div key={i} className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="capitalize">{e.chain}</span>
            <span>{e.balance.toLocaleString()} ({`$${e.usdValue.toLocaleString()}`})</span>
          </div>
        ))}
      </div>

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-accent"
        onClick={() => navigate(`/asset/${data.symbol}`)}
      >
        查看详情
      </Button>
    </div>
  );
}
