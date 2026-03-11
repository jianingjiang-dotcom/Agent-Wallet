import { useNavigate } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { TransactionCardData } from '@/types/chat';

const statusMap: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  confirmed: { label: '已确认', variant: 'default' },
  pending: { label: '处理中', variant: 'secondary' },
  failed: { label: '失败', variant: 'destructive' },
};

export function TransactionCard({ data }: { data: TransactionCardData }) {
  const navigate = useNavigate();

  return (
    <div className="rounded-xl border bg-card p-3 space-y-2">
      {data.items.map((tx) => (
        <div key={tx.id} className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            {tx.type === 'receive' ? (
              <ArrowDownLeft className="w-4 h-4 text-green-500" />
            ) : (
              <ArrowUpRight className="w-4 h-4 text-red-500" />
            )}
            <div>
              <span className="text-xs font-medium">
                {tx.type === 'receive' ? '+' : '-'}{tx.amount} {tx.symbol}
              </span>
              <p className="text-[10px] text-muted-foreground">{tx.timestamp}</p>
            </div>
          </div>
          <Badge variant={statusMap[tx.status]?.variant ?? 'outline'} className="text-[10px] h-5">
            {statusMap[tx.status]?.label ?? tx.status}
          </Badge>
        </div>
      ))}

      <Button
        variant="ghost"
        size="sm"
        className="w-full text-xs text-accent"
        onClick={() => navigate('/history')}
      >
        查看全部
      </Button>
    </div>
  );
}
