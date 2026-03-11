import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';


import { cn } from '@/lib/utils';

const PERIOD_OPTIONS: { label: string; value: 'today' | 'week' | 'month' }[] = [
  { label: '今日', value: 'today' },
  { label: '本周', value: 'week' },
  { label: '本月', value: 'month' },
];

const CHAIN_COLORS: Record<string, string> = {
  ethereum: '#627EEA',
  tron: '#FF0000',
  bsc: '#F0B90B',
  solana: '#9945FF',
};

const BAR_COLORS = ['#3B82F6', '#F59E0B'];

const STATUS_LABELS: Record<string, string> = {
  settled: '已结算',
  failed: '失败',
  pending_approval: '待审批',
  approved: '已批准',
  rejected: '已拒绝',
  expired: '已过期',
  broadcasting: '广播中',
  confirming: '确认中',
};

function formatDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}-${d}`;
}

function isWithinPeriod(date: Date, period: 'today' | 'week' | 'month'): boolean {
  const now = new Date();
  const target = new Date(date);
  const diffMs = now.getTime() - target.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  switch (period) {
    case 'today':
      return diffDays < 1 && target.toDateString() === now.toDateString();
    case 'week':
      return diffDays < 7;
    case 'month':
      return diffDays < 30;
    default:
      return false;
  }
}

export default function SettlementDashboard() {
  const navigate = useNavigate();
  const { getReconciliationSummary, agentTransactions } = useWallet();

  const [period, setPeriod] = useState<'today' | 'week' | 'month'>('month');
  const [showDetails, setShowDetails] = useState(false);

  const summary = useMemo(() => getReconciliationSummary(period), [period, getReconciliationSummary]);

  const filteredTransactions = useMemo(() => {
    return agentTransactions
      .filter(
        (tx) =>
          (tx.status === 'settled' || tx.status === 'failed') &&
          isWithinPeriod(tx.createdAt, period)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 20);
  }, [agentTransactions, period]);

  const trendData = useMemo(
    () =>
      summary.dailyTrend.map((d) => ({
        ...d,
        date: d.date.length > 5 ? d.date.slice(5) : d.date,
      })),
    [summary.dailyTrend]
  );

  return (
    <AppLayout title="结算对账" showNav showBack>
      <div className="px-4 py-4 space-y-4 pb-8">
        {/* Time range selector */}
        <motion.div
          className="flex gap-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          {PERIOD_OPTIONS.map((opt) => (
            <Button
              key={opt.value}
              variant={period === opt.value ? 'default' : 'outline'}
              size="sm"
              onClick={() => setPeriod(opt.value)}
              className="flex-1"
            >
              {opt.label}
            </Button>
          ))}
        </motion.div>

        {/* Summary cards */}
        <motion.div
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.05 }}
        >
          {/* 总交易额 */}
          <div className="card-elevated p-4">
              <p className="text-xs text-muted-foreground">总交易额</p>
              <p className="text-xl font-bold text-foreground mt-1">
                ${summary.totalVolume.toLocaleString()}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.txCount} 笔交易
              </p>
          </div>

          {/* 成功率 */}
          <div className="card-elevated p-4">
              <p className="text-xs text-muted-foreground">成功率</p>
              <p className="text-xl font-bold text-foreground mt-1">
                {summary.successRate}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {summary.settledCount}/{summary.txCount} 已结算
              </p>
          </div>

          {/* 异常交易 */}
          <div className="card-elevated p-4">
              <p className="text-xs text-muted-foreground">异常交易</p>
              <p
                className={cn(
                  'text-xl font-bold mt-1',
                  summary.failedCount > 0 ? 'text-red-500' : 'text-foreground'
                )}
              >
                {summary.failedCount}
              </p>
              <p className="text-xs text-muted-foreground mt-1">需要处理</p>
          </div>

          {/* Gas 消耗 */}
          <div className="card-elevated p-4">
              <p className="text-xs text-muted-foreground">Gas 消耗</p>
              <p className="text-xl font-bold text-foreground mt-1">
                ${summary.totalGasFee.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                净到账 ${summary.netSettled.toLocaleString()}
              </p>
          </div>
        </motion.div>

        {/* Volume trend chart */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <div className="card-elevated p-4">
            <p className="text-sm font-semibold text-foreground mb-3">交易趋势</p>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={trendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11 }}
                  stroke="hsl(var(--muted-foreground))"
                />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="volume"
                  name="交易额"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="failedCount"
                  name="失败笔数"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.1}
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Agent distribution */}
        {summary.byAgent.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.15 }}
          >
            <div className="card-elevated p-4">
              <p className="text-sm font-semibold text-foreground mb-3">Agent 分布</p>
              <ResponsiveContainer width="100%" height={150}>
                <BarChart
                  data={summary.byAgent}
                  layout="vertical"
                  margin={{ top: 0, right: 10, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis
                    type="category"
                    dataKey="agentName"
                    tick={{ fontSize: 11 }}
                    stroke="hsl(var(--muted-foreground))"
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '交易额']}
                  />
                  <Bar dataKey="volume" name="交易额" radius={[0, 4, 4, 0]}>
                    {summary.byAgent.map((_, index) => (
                      <Cell key={`agent-bar-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Chain distribution */}
        {summary.byChain.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.2 }}
          >
            <div className="card-elevated p-4">
              <p className="text-sm font-semibold text-foreground mb-3">链分布</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={summary.byChain}
                    dataKey="volume"
                    nameKey="chain"
                    cx="50%"
                    cy="45%"
                    innerRadius={40}
                    outerRadius={70}
                    paddingAngle={2}
                  >
                    {summary.byChain.map((entry, index) => (
                      <Cell
                        key={`chain-cell-${index}`}
                        fill={CHAIN_COLORS[entry.chain.toLowerCase()] || '#8884d8'}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, '交易额']}
                  />
                  <Legend
                    verticalAlign="bottom"
                    iconType="circle"
                    formatter={(value: string) => {
                      const chainData = summary.byChain.find(
                        (c) => c.chain.toLowerCase() === value.toLowerCase()
                      );
                      return `${value} $${chainData ? chainData.volume.toLocaleString() : 0}`;
                    }}
                    wrapperStyle={{ fontSize: 11 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        )}

        {/* Anomaly alerts */}
        <AnimatePresence>
          {summary.anomalies.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.35, delay: 0.25 }}
            >
              <div className="card-elevated p-4">
                <p className="text-sm font-semibold text-foreground mb-3">异常提醒</p>
                <div className="space-y-2">
                  {summary.anomalies.map((anomaly, index) => (
                    <motion.div
                      key={`anomaly-${index}`}
                      className="flex items-start gap-2 rounded-lg bg-muted/50 p-3"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 + index * 0.05 }}
                    >
                      <AlertTriangle
                        className={cn(
                          'h-4 w-4 mt-0.5 shrink-0',
                          anomaly.severity === 'critical' ? 'text-red-500' : 'text-amber-500'
                        )}
                      />
                      <p className="text-sm text-foreground flex-1">{anomaly.description}</p>
                      <span
                        className={cn(
                          'text-[10px] font-medium px-1.5 py-0.5 rounded-full shrink-0',
                          anomaly.severity === 'critical'
                            ? 'bg-red-500/15 text-red-500'
                            : 'bg-amber-500/15 text-amber-600'
                        )}
                      >
                        {anomaly.severity === 'critical' ? '严重' : '警告'}
                      </span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Transaction table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.3 }}
        >
          <div className="card-elevated p-4">
            <button
              className="flex items-center justify-between w-full"
              onClick={() => setShowDetails((prev) => !prev)}
            >
              <p className="text-sm font-semibold text-foreground">交易明细</p>
              {showDetails ? (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </button>

            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25 }}
                  className="overflow-hidden"
                >
                  <div className="mt-3 space-y-2">
                    {filteredTransactions.length === 0 && (
                      <p className="text-xs text-muted-foreground text-center py-4">
                        暂无交易记录
                      </p>
                    )}
                    {filteredTransactions.map((tx) => (
                      <motion.div
                        key={tx.id}
                        className="flex items-center gap-3 rounded-lg bg-muted/40 p-3 cursor-pointer active:bg-muted/70 transition-colors"
                        onClick={() => navigate(`/agent-review/${tx.id}`)}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-muted-foreground">
                              {formatDate(new Date(tx.createdAt))}
                            </span>
                            <span className="text-xs font-medium text-foreground truncate">
                              {tx.agentName}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-sm font-semibold text-foreground">
                              {tx.amount} {tx.symbol}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                                'bg-blue-500/10 text-blue-600'
                              )}
                            >
                              {tx.network}
                            </span>
                            <span
                              className={cn(
                                'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                                tx.status === 'settled'
                                  ? 'bg-green-500/10 text-green-600'
                                  : 'bg-red-500/10 text-red-500'
                              )}
                            >
                              {STATUS_LABELS[tx.status] || tx.status}
                            </span>
                          </div>
                        </div>
                        {tx.gasFee !== undefined && (
                          <span className="text-[11px] text-muted-foreground shrink-0">
                            Gas ${tx.gasFee.toFixed(2)}
                          </span>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </AppLayout>
  );
}
