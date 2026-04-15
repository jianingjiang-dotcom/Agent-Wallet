/**
 * Wallet Management Page
 *
 * Displays all wallets in a unified list (no tab split).
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet, Plus, AlertTriangle, MoreHorizontal,
  Edit3, Key, MapPin, Shield, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
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
import { EmptyState } from '@/components/EmptyState';
import { formatTimeAgo } from '@/lib/tss-node';
import { getWalletTotalBalance } from '@/contexts/WalletContext';

export default function WalletManagementPage() {
  const navigate = useNavigate();
  const { renameWallet, wallets } = useWallet();

  const [renameDialogOpen, setRenameDialogOpen] = useState(false);
  const [selectedWalletForRename, setSelectedWalletForRename] = useState<string | null>(null);
  const [newWalletName, setNewWalletName] = useState('');

  // Global backup status
  const backedUpWallets = wallets.filter(w => w.isBackedUp);
  const unbackedWalletCount = wallets.length - backedUpWallets.length;
  const globalBackupInfo = backedUpWallets.length > 0 ? backedUpWallets[0].backupInfo : null;
  const allBackedUp = wallets.length > 0 && unbackedWalletCount === 0;
  const hasAnyBackup = backedUpWallets.length > 0;

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

          {/* Global backup status card */}
          {wallets.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => navigate('/wallet-backup/all')}
              className="p-3 mb-4 rounded-xl bg-card flex items-center gap-3 cursor-pointer active:bg-muted/60 transition-colors"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                allBackedUp ? 'bg-success/10' : 'bg-warning/10'
              }`}>
                {allBackedUp
                  ? <Shield className="w-4.5 h-4.5 text-success" />
                  : <AlertTriangle className="w-4.5 h-4.5 text-warning" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">
                  {allBackedUp
                    ? '所有钱包已备份'
                    : hasAnyBackup
                      ? `${unbackedWalletCount} 个新钱包未纳入备份`
                      : '钱包未备份'
                  }
                </p>
                <p className="text-xs text-muted-foreground">
                  {globalBackupInfo
                    ? `${globalBackupInfo.method === 'cloud'
                        ? (globalBackupInfo.cloudProvider === 'icloud' ? 'iCloud' : 'Google Drive')
                        : '本地文件'
                      }${globalBackupInfo.lastBackupTime ? ` · ${formatTimeAgo(globalBackupInfo.lastBackupTime)}` : ''}`
                    : '建议立即备份以确保资产安全'
                  }
                </p>
              </div>
              <div className="shrink-0 flex items-center gap-1">
                {!allBackedUp && (
                  <span className="text-xs font-medium text-warning">
                    {hasAnyBackup ? '重新备份' : '立即备份'}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
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
              <h2 className="font-semibold text-foreground">全部钱包</h2>
              <Button
                variant="ghost"
                size="sm"
                className="text-accent h-8 gap-1"
                onClick={() => navigate('/claim-wallet')}
              >
                <Plus className="w-4 h-4" />
                配对
              </Button>
            </div>

            {wallets.length === 0 ? (
              <EmptyState
                icon={Wallet}
                title="暂无钱包"
                description="使用配对口令接管钱包"
                action={{
                  label: '配对钱包',
                  icon: Plus,
                  onClick: () => navigate('/claim-wallet'),
                }}
              />
            ) : (
              <div className="space-y-2">
                {wallets.map((wallet, index) => {
                  const balance = getWalletTotalBalance(wallet.id);
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
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="font-semibold text-foreground truncate">{wallet.name}</p>
                          {!wallet.isKeyShareRecovered && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[11px] font-medium bg-warning/10 text-warning shrink-0">
                              <AlertTriangle className="w-3 h-3" />
                              未恢复
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      {!wallet.isKeyShareRecovered && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 px-3 text-xs font-medium shrink-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/wallet/recovery', { state: { returnTo: '/profile/wallets' } });
                          }}
                        >
                          恢复
                        </Button>
                      )}
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
