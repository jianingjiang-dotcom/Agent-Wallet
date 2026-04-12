/**
 * Wallet Management Page
 *
 * Displays wallets in two tabs: user-created (with backup) and agent-linked.
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, Plus, CheckCircle2, AlertTriangle, Shield, MoreHorizontal,
  Edit3, CloudUpload, Bot, Link2, Key, MapPin
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerFooter,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WalletModeBadge } from '@/components/WalletModeBadge';
import { EmptyState } from '@/components/EmptyState';
import { formatTimeAgo } from '@/lib/tss-node';
import { getWalletTotalBalance } from '@/contexts/WalletContext';
import { isAgentLinked } from '@/types/wallet';

export default function WalletManagementPage() {
  const navigate = useNavigate();
  const { renameWallet, wallets, delegatedAgents } = useWallet();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedWalletForRename, setSelectedWalletForRename] = useState<string | null>(null);
  const [newWalletName, setNewWalletName] = useState('');

  // Split wallets by type
  const userCreatedWallets = wallets.filter(w => !isAgentLinked(w));
  const agentLinkedWallets = wallets.filter(w => isAgentLinked(w));

  // Smart default: show agent tab if no user wallets exist but agent wallets do
  const [activeTab, setActiveTab] = useState<'user' | 'agent'>(
    userCreatedWallets.length === 0 && agentLinkedWallets.length > 0 ? 'agent' : 'user'
  );

  // Count unbacked user wallets
  const unbackedWalletCount = userCreatedWallets.filter(w => !w.isBackedUp).length;

  const handleRenameWallet = (walletId: string, currentName: string) => {
    setSelectedWalletForRename(walletId);
    setNewWalletName(currentName);
    setRenameDialogOpen(true);
  };

  const confirmRename = () => {
    if (newWalletName.trim() && selectedWalletForRename) {
      renameWallet(selectedWalletForRename, newWalletName.trim());
      toast.success(`钱包已重命名为 "${newWalletName.trim()}"`);
      setRenameDialogOpen(false);
      setSelectedWalletForRename(null);
      setNewWalletName('');
    }
  };

  return (
    <AppLayout showNav={false} showBack title="钱包管理">
      <div className="h-full flex flex-col">
        <div className="flex-1 overflow-auto px-4 py-4">
          {/* Tab Switch */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'user' | 'agent')}>
            <TabsList className="w-full mb-4">
              <TabsTrigger value="user" className="flex-1 gap-1.5">
                <Wallet className="w-3.5 h-3.5" /> 我的钱包
              </TabsTrigger>
              <TabsTrigger value="agent" className="flex-1 gap-1.5">
                <Bot className="w-3.5 h-3.5" /> 关联钱包
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* ===== 我的钱包 Tab ===== */}
          {activeTab === 'user' && (
            <>
              {/* Unbacked wallets warning banner */}
              {unbackedWalletCount > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 mb-4 rounded-xl border border-warning/30 bg-warning/5 flex items-center gap-3"
                >
                  <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {unbackedWalletCount} 个钱包未备份
                    </p>
                    <p className="text-xs text-muted-foreground">
                      建议尽快备份以确保资产安全
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Section Header */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-foreground">我的钱包</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-accent h-8 gap-1"
                    onClick={() => navigate('/claim-wallet')}
                  >
                    <Plus className="w-4 h-4" />
                    认领
                  </Button>
                </div>

                {userCreatedWallets.length === 0 ? (
                  <EmptyState
                    icon={Wallet}
                    title="暂无钱包"
                    description="使用配对口令接管 Agent 创建的钱包"
                    action={{
                      label: '认领钱包',
                      icon: Plus,
                      onClick: () => navigate('/claim-wallet'),
                    }}
                  />
                ) : (
                  <div className="space-y-2">
                    {userCreatedWallets.map((wallet, index) => {
                      const balance = getWalletTotalBalance(wallet.id);
                      const activeAgentCount = delegatedAgents.filter(a => a.walletId === wallet.id && a.status === 'active').length;
                      return (
                        <motion.div
                          key={wallet.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="w-full card-elevated p-4 flex items-center gap-3"
                        >
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center shrink-0">
                            <Wallet className="w-6 h-6 text-muted-foreground" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground truncate">{wallet.name}</p>
                              {wallet.isBackedUp ? (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-success/10 text-success shrink-0">
                                  <CheckCircle2 className="w-3 h-3" />
                                  已备份
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-warning/10 text-warning shrink-0">
                                  <AlertTriangle className="w-3 h-3" />
                                  未备份
                                </span>
                              )}
                            </div>
                            {wallet.isBackedUp && wallet.backupInfo && (
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {wallet.backupInfo.method === 'cloud'
                                  ? (wallet.backupInfo.cloudProvider === 'icloud' ? 'iCloud' : 'Google Drive') + ' 备份'
                                  : '本地备份'
                                }
                                {wallet.backupInfo.lastBackupTime && ` · ${formatTimeAgo(wallet.backupInfo.lastBackupTime)}`}
                                {wallet.backupInfo.fileBackupTime && ` · ${formatTimeAgo(wallet.backupInfo.fileBackupTime)}`}
                              </p>
                            )}
                            {activeAgentCount > 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">
                                已委托 {activeAgentCount} 个 Agent
                              </span>
                            )}
                            <p className="text-sm text-muted-foreground mt-0.5">
                              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="shrink-0">
                                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRenameWallet(wallet.id, wallet.name)}>
                                <Edit3 className="w-4 h-4 mr-2" />
                                修改名称
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/wallet/addresses/${wallet.id}`)}>
                                <MapPin className="w-4 h-4 mr-2" />
                                管理地址
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/wallet-backup/${wallet.id}`)}>
                                <CloudUpload className="w-4 h-4 mr-2" />
                                {wallet.isBackedUp ? '管理备份' : '备份钱包'}
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => navigate(`/delegate-agent?wallet=${wallet.id}`)}>
                                <Bot className="w-4 h-4 mr-2" />
                                授权 Agent
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                onClick={() => navigate(`/wallet/export-key/${wallet.id}`)}
                                className="text-destructive focus:text-destructive"
                              >
                                <Key className="w-4 h-4 mr-2" />
                                导出私钥
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>

              {/* MPC Info */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 px-4 py-3 bg-muted/50 rounded-xl border border-border"
              >
                <p className="text-sm font-medium text-foreground mb-1">
                  MPC 多重签名保护
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  您的每个钱包都受到银行级安全保护，私钥分片存储，任何单一方都无法访问您的资产。
                </p>
              </motion.div>
            </>
          )}

          {/* ===== 关联钱包 Tab ===== */}
          {activeTab === 'agent' && (
            <>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-semibold text-foreground">关联钱包</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-purple-600 dark:text-purple-400 h-8 gap-1"
                    onClick={() => navigate('/link-agent-wallet')}
                  >
                    <Link2 className="w-4 h-4" />
                    关联
                  </Button>
                </div>

                {agentLinkedWallets.length === 0 ? (
                  <EmptyState
                    icon={Bot}
                    title="暂无关联钱包"
                    description="关联 Agent 的钱包进行管理"
                    action={{
                      label: '关联钱包',
                      icon: Link2,
                      onClick: () => navigate('/link-agent-wallet'),
                    }}
                  />
                ) : (
                  <div className="space-y-2">
                    {agentLinkedWallets.map((wallet, index) => {
                      const balance = getWalletTotalBalance(wallet.id);
                      return (
                        <motion.div
                          key={wallet.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * index }}
                          className="w-full card-elevated p-4 flex items-center gap-3"
                        >
                          <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900/40 flex items-center justify-center shrink-0">
                            <Bot className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="font-semibold text-foreground truncate">{wallet.name}</p>
                              {wallet.controlMode && (
                                <WalletModeBadge mode={wallet.controlMode} />
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-0.5">
                              {wallet.agentInfo?.agentName || 'Agent'}
                              {wallet.agentInfo?.linkedAt && (
                                <span> · {formatTimeAgo(wallet.agentInfo.linkedAt)}</span>
                              )}
                            </p>
                            <p className="text-sm text-muted-foreground mt-0.5">
                              ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="shrink-0">
                                <MoreHorizontal className="w-5 h-5 text-muted-foreground" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleRenameWallet(wallet.id, wallet.name)}>
                                <Edit3 className="w-4 h-4 mr-2" />
                                修改名称
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            </>
          )}
        </div>
      </div>

      {/* Rename Drawer */}
      <Drawer open={renameDialogOpen} onOpenChange={setRenameDialogOpen}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>修改钱包名称</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-4">
            <Input
              value={newWalletName}
              onChange={(e) => setNewWalletName(e.target.value)}
              placeholder="输入新的钱包名称"
            />
          </div>
          <DrawerFooter className="flex-row gap-2">
            <Button variant="outline" className="flex-1" onClick={() => setRenameDialogOpen(false)}>
              取消
            </Button>
            <Button className="flex-1" onClick={confirmRename}>
              确认
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </AppLayout>
  );
}
