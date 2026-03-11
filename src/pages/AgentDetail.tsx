import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bot, Copy, Pause, Play, Trash2, ChevronRight, Clock, AlertTriangle, Eye, Send, FileCode, Settings, Pencil } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { BiometricVerifyDrawer } from '@/components/BiometricVerifyDrawer';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { AgentPermissions, AGENT_PERMISSION_LIST, DEFAULT_AGENT_PERMISSIONS } from '@/types/wallet';

const PERM_ICONS: Record<string, React.ComponentType<{ className?: string }>> = { Eye, Send, FileCode, Settings };

const statusConfig: Record<string, { label: string; color: string }> = {
  active: { label: '运行中', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400' },
  paused: { label: '已暂停', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-400' },
  revoked: { label: '已撤销', color: 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400' },
};

const txStatusConfig: Record<string, { label: string; color: string }> = {
  pending_approval: { label: '待审批', color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/40 dark:text-yellow-400' },
  approved: { label: '已批准', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400' },
  settled: { label: '已结算', color: 'text-emerald-600 bg-emerald-100 dark:bg-emerald-900/40 dark:text-emerald-400' },
  failed: { label: '失败', color: 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400' },
  rejected: { label: '已拒绝', color: 'text-red-600 bg-red-100 dark:bg-red-900/40 dark:text-red-400' },
  expired: { label: '已过期', color: 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' },
  broadcasting: { label: '广播中', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400' },
  confirming: { label: '确认中', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/40 dark:text-blue-400' },
};

function formatDate(date?: Date): string {
  if (!date) return '-';
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function truncateAddress(addr: string, front = 6, back = 4): string {
  if (addr.length <= front + back + 3) return addr;
  return `${addr.slice(0, front)}...${addr.slice(-back)}`;
}

export default function AgentDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    getAgentById,
    wallets,
    agentTransactions,
    pauseDelegatedAgent,
    resumeDelegatedAgent,
    revokeAgent,
    updateDelegatedAgentName,
    updateDelegatedAgentPermissions,
  } = useWallet();

  const [revokeDialogOpen, setRevokeDialogOpen] = useState(false);
  const [nameDrawerOpen, setNameDrawerOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [bioDrawerOpen, setBioDrawerOpen] = useState(false);
  const [bioAction, setBioAction] = useState<'pause' | 'revoke' | null>(null);

  const agent = useMemo(() => getAgentById(id || ''), [getAgentById, id]);
  const wallet = useMemo(() => wallets.find(w => w.id === agent?.walletId), [wallets, agent]);

  const recentTransactions = useMemo(() => {
    return agentTransactions
      .filter(tx => tx.agentId === agent?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 5);
  }, [agentTransactions, agent]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => toast.success('已复制'));
  };

  // --- Biometric-guarded pause ---
  const handlePauseClick = () => {
    setBioAction('pause');
    setBioDrawerOpen(true);
  };

  // --- Biometric-guarded revoke (after AlertDialog confirm) ---
  const handleRevokeConfirm = () => {
    setRevokeDialogOpen(false);
    setBioAction('revoke');
    setBioDrawerOpen(true);
  };

  const handleBioVerified = () => {
    if (!agent) return;
    if (bioAction === 'pause') {
      pauseDelegatedAgent(agent.id, '手动暂停');
      toast.success('Agent 已暂停');
    } else if (bioAction === 'revoke') {
      revokeAgent(agent.id);
      toast.success('授权已撤销');
    }
    setBioAction(null);
  };

  const handleResume = () => {
    if (!agent) return;
    resumeDelegatedAgent(agent.id);
    toast.success('Agent 已恢复');
  };

  // --- Name editing ---
  const openNameDrawer = () => {
    if (!agent) return;
    setEditName(agent.agentName);
    setNameDrawerOpen(true);
  };

  const handleSaveName = () => {
    if (!agent) return;
    const trimmed = editName.trim();
    if (!trimmed) {
      toast.error('名称不能为空');
      return;
    }
    updateDelegatedAgentName(agent.id, trimmed);
    setNameDrawerOpen(false);
    toast.success('名称已更新');
  };

  // --- Permission toggling ---
  const togglePermission = (key: keyof AgentPermissions) => {
    if (!agent) return;
    const current = agent.permissions || DEFAULT_AGENT_PERMISSIONS;
    updateDelegatedAgentPermissions(agent.id, { [key]: !current[key] });
  };

  // Agent not found
  if (!agent) {
    return (
      <AppLayout title="Agent 详情" showNav showBack>
        <div className="flex flex-col items-center justify-center p-8 space-y-4">
          <p className="text-muted-foreground">Agent 未找到</p>
          <Button variant="outline" onClick={() => navigate(-1)}>
            返回
          </Button>
        </div>
      </AppLayout>
    );
  }

  const status = statusConfig[agent.status] || statusConfig.active;
  const permissions = agent.permissions || DEFAULT_AGENT_PERMISSIONS;

  return (
    <AppLayout title="Agent 详情" showNav showBack>
      <div className="px-4 py-4 space-y-4">

        {/* A. Header Info Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center flex-shrink-0">
              <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" strokeWidth={1.5} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold truncate">{agent.agentName}</h2>
                <button
                  onClick={openNameDrawer}
                  className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
                <span className={cn('inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium', status.color)}>
                  {status.label}
                </span>
              </div>
              {/* TSS Node Status */}
              <div className="flex items-center gap-1.5 mt-1">
                <span
                  className={cn(
                    'w-2 h-2 rounded-full flex-shrink-0',
                    agent.tssNodeStatus === 'active' ? 'bg-emerald-500' : 'bg-gray-400'
                  )}
                />
                <span className={cn(
                  'text-xs',
                  agent.tssNodeStatus === 'active' ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
                )}>
                  {agent.tssNodeStatus === 'active' ? 'TSS Node 活跃' : 'TSS Node 非活跃'}
                </span>
              </div>
              <div className="flex items-center gap-1 mt-1">
                <span className="font-mono text-xs text-muted-foreground truncate max-w-[200px]">
                  {agent.principalId}
                </span>
                <button
                  onClick={() => handleCopy(agent.principalId)}
                  className="flex-shrink-0 p-1 rounded hover:bg-muted transition-colors"
                >
                  <Copy className="w-3.5 h-3.5 text-muted-foreground" />
                </button>
              </div>
              {wallet && (
                <p className="text-sm text-muted-foreground mt-0.5">{wallet.name}</p>
              )}
            </div>
          </div>
        </motion.div>

        {/* B. Action Buttons Row */}
        {agent.status !== 'revoked' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex gap-3"
          >
            {agent.status === 'active' && (
              <>
                <Button
                  variant="outline"
                  className="flex-1 border-yellow-300 text-yellow-700 hover:bg-yellow-50 dark:border-yellow-700 dark:text-yellow-400 dark:hover:bg-yellow-900/20"
                  onClick={handlePauseClick}
                >
                  <Pause className="w-4 h-4 mr-1.5" />
                  暂停
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setRevokeDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  撤销授权
                </Button>
              </>
            )}
            {agent.status === 'paused' && (
              <>
                <Button
                  className="flex-1"
                  onClick={handleResume}
                >
                  <Play className="w-4 h-4 mr-1.5" />
                  恢复
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={() => setRevokeDialogOpen(true)}
                >
                  <Trash2 className="w-4 h-4 mr-1.5" />
                  撤销授权
                </Button>
              </>
            )}
          </motion.div>
        )}

        {agent.status === 'revoked' && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="card-elevated p-4 flex items-center gap-3 border-red-200 dark:border-red-800"
          >
            <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-600 dark:text-red-400">该 Agent 的授权已被撤销，无法执行任何操作。</p>
          </motion.div>
        )}

        {/* C. Permissions Section (editable with switches) */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="card-elevated p-4 space-y-3"
        >
          <h3 className="text-sm font-semibold">权限</h3>
          <div className="space-y-1">
            {AGENT_PERMISSION_LIST.map(perm => {
              const Icon = PERM_ICONS[perm.icon] || Eye;
              const isOn = permissions[perm.key];
              return (
                <button
                  key={perm.key}
                  onClick={() => togglePermission(perm.key)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/30 transition-colors text-left"
                >
                  <div className={cn(
                    'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                    isOn ? 'bg-accent/10' : 'bg-muted'
                  )}>
                    <Icon className={cn('w-4 h-4', isOn ? 'text-accent' : 'text-muted-foreground')} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={cn('text-sm font-medium', isOn ? 'text-foreground' : 'text-muted-foreground')}>
                      {perm.label}
                    </p>
                    <p className="text-xs text-muted-foreground">{perm.desc}</p>
                  </div>
                  <Switch
                    checked={isOn}
                    onCheckedChange={() => togglePermission(perm.key)}
                    onClick={e => e.stopPropagation()}
                  />
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* D. Risk Control Entry */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <button
            onClick={() => navigate(`/agent-settings?agent=${agent.id}`)}
            className="w-full card-elevated p-4 flex items-center justify-between hover:bg-muted/30 transition-colors"
          >
            <span className="text-sm font-semibold">风控设置</span>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        </motion.div>

        {/* E. Recent Transactions Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="card-elevated p-4 space-y-3"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold">最近交易</h3>
            <button
              onClick={() => navigate('/agent-review')}
              className="text-xs text-primary flex items-center gap-0.5 hover:underline"
            >
              查看全部
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="py-6 text-center text-sm text-muted-foreground">暂无交易记录</div>
          ) : (
            <div className="space-y-2">
              {recentTransactions.map(tx => {
                const txStatus = txStatusConfig[tx.status] || txStatusConfig.pending_approval;
                return (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between py-2 border-b border-border/50 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className={cn('inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium flex-shrink-0', txStatus.color)}>
                        {txStatus.label}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {tx.amount} {tx.symbol}
                        </p>
                        <p className="text-[11px] text-muted-foreground font-mono truncate">
                          {truncateAddress(tx.toAddress)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground flex-shrink-0">
                      <Clock className="w-3 h-3" />
                      {formatDate(tx.createdAt)}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* F. Meta Info Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="card-elevated p-4"
        >
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">创建时间</span>
              <span>{formatDate(agent.createdAt)}</span>
            </div>
            {agent.status === 'paused' && agent.pausedAt && (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">暂停时间</span>
                  <span>{formatDate(agent.pausedAt)}</span>
                </div>
                {agent.pausedReason && (
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">暂停原因</span>
                    <span className="text-yellow-600 dark:text-yellow-400">{agent.pausedReason}</span>
                  </div>
                )}
              </>
            )}
            {agent.status === 'revoked' && agent.revokedAt && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">撤销时间</span>
                <span className="text-red-600 dark:text-red-400">{formatDate(agent.revokedAt)}</span>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      {/* Revoke Confirmation Dialog */}
      <AlertDialog open={revokeDialogOpen} onOpenChange={setRevokeDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认撤销授权</AlertDialogTitle>
            <AlertDialogDescription>
              撤销后，Agent "{agent.agentName}" 将无法再执行任何交易操作。此操作不可恢复。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleRevokeConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              确认撤销
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Biometric Verify Drawer */}
      <BiometricVerifyDrawer
        open={bioDrawerOpen}
        onOpenChange={setBioDrawerOpen}
        title={bioAction === 'pause' ? '验证身份以暂停 Agent' : '验证身份以撤销授权'}
        description={
          bioAction === 'pause'
            ? '暂停后 Agent 将无法执行交易，可随时恢复。'
            : '撤销后 Agent 将永久失去授权，此操作不可恢复。'
        }
        onVerified={handleBioVerified}
      />

      {/* Name Edit Drawer */}
      <Drawer open={nameDrawerOpen} onOpenChange={setNameDrawerOpen}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>编辑 Agent 名称</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm text-muted-foreground">名称（最多 20 个字符）</label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value.slice(0, 20))}
                placeholder="输入 Agent 名称"
                maxLength={20}
              />
              <p className="text-xs text-muted-foreground text-right">{editName.length}/20</p>
            </div>
            <Button className="w-full" onClick={handleSaveName} disabled={!editName.trim()}>
              保存
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </AppLayout>
  );
}
