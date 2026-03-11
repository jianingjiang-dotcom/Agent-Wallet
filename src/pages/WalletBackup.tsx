import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  CloudUpload, Cloud, HardDrive, CheckCircle2, ChevronRight,
  Upload, Eye, EyeOff, AlertTriangle, Loader2, Lock,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/lib/toast';
import { formatTimeAgo } from '@/lib/tss-node';

export default function WalletBackupPage() {
  const { id: walletId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { wallets, backupWallet, verifyBackupPassword } = useWallet();

  const wallet = wallets.find(w => w.id === walletId);

  const [backupType, setBackupType] = useState<'cloud' | 'local' | null>(null);
  const [showVerifyPassword, setShowVerifyPassword] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [oldPassword, setOldPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifyError, setVerifyError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  if (!wallet) {
    return (
      <AppLayout showNav={false} title="备份钱包" showBack>
        <div className="flex items-center justify-center h-full">
          <p className="text-muted-foreground">钱包不存在</p>
        </div>
      </AppLayout>
    );
  }

  const validatePassword = () => {
    if (password.length < 8 || password.length > 32) return '密码需要 8-32 位';
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) return '密码必须包含字母和数字';
    if (password !== confirmPassword) return '两次输入的密码不一致';
    return null;
  };

  const handleVerifyOldPassword = () => {
    if (!oldPassword) { setVerifyError('请输入当前备份密码'); return; }
    const ok = verifyBackupPassword(walletId!, oldPassword);
    if (!ok) {
      setVerifyError('备份密码错误，请重试');
      return;
    }
    // Verified — proceed to set new password
    setShowVerifyPassword(false);
    setShowPasswordForm(true);
    setOldPassword('');
    setVerifyError('');
  };

  const handleBackup = async () => {
    const validationError = validatePassword();
    if (validationError) { setError(validationError); return; }
    if (!confirmed) { setError('请确认您已牢记密码'); return; }

    setIsLoading(true);
    try {
      await backupWallet(walletId!, {
        method: backupType!,
        ...(backupType === 'cloud'
          ? { cloudProvider: 'icloud' as const, lastBackupTime: new Date() }
          : { fileBackupTime: new Date() }),
      }, password);
      setShowSuccess(true);
      toast.success('备份完成');
    } catch {
      setError('备份失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // Success screen
  if (showSuccess) {
    return (
      <AppLayout showNav={false} title="备份钱包" showBack>
        <div className="flex flex-col h-full px-4">
          <div className="flex-1 flex flex-col items-center justify-center text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
            >
              <CheckCircle2 className="w-10 h-10 text-success" />
            </motion.div>
            <h2 className="text-lg font-bold text-foreground mb-2">
              {backupType === 'cloud' ? '云备份完成' : '本地备份完成'}
            </h2>
            <p className="text-muted-foreground text-sm max-w-[280px] mb-2">
              「{wallet.name}」{backupType === 'cloud' ? '已安全备份到云端' : '备份文件已保存到本地'}
            </p>
          </div>
          <div className="pb-6">
            <Button
              size="lg"
              className="w-full text-base font-medium"
              onClick={() => navigate('/profile/wallets')}
            >
              返回钱包管理
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Verify old password screen (for re-backup)
  if (showVerifyPassword) {
    return (
      <AppLayout
        showNav={false}
        title="备份钱包"
        showBack
        onBack={() => { setShowVerifyPassword(false); setOldPassword(''); setVerifyError(''); }}
      >
        <div className="flex flex-col h-full px-4">
          <div className="flex-1 py-4">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Lock className="w-8 h-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-bold text-foreground mb-1">验证备份密码</h2>
              <p className="text-muted-foreground text-sm">
                重新备份前，请验证当前备份密码
              </p>
            </div>

            <div className="space-y-4 max-w-[300px] mx-auto">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">当前备份密码</label>
                <div className="relative">
                  <Input
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => { setOldPassword(e.target.value); setVerifyError(''); }}
                    placeholder="请输入当前备份密码"
                    className="h-11 pr-10"
                    onKeyDown={(e) => { if (e.key === 'Enter') handleVerifyOldPassword(); }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowOldPassword(!showOldPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showOldPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {verifyError && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive flex items-center gap-1"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {verifyError}
                </motion.p>
              )}
            </div>
          </div>

          <div className="pb-6">
            <Button
              size="lg"
              className="w-full text-base font-medium"
              onClick={handleVerifyOldPassword}
            >
              验证并继续
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  // Password form (set new password) — only for local/file backup
  if (showPasswordForm && backupType === 'local') {
    return (
      <AppLayout showNav={false} title="备份钱包" showBack onBack={() => setShowPasswordForm(false)}>
        <div className="flex flex-col h-full px-4">
          <div className="flex-1 py-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-bold text-foreground mb-1">
                设置备份文件密码
              </h2>
              <p className="text-muted-foreground text-sm">
                此密码用于加密「{wallet.name}」的本地备份数据
              </p>
            </div>

            <div className="space-y-4 max-w-[300px] mx-auto">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">设置密码</label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => { setPassword(e.target.value); setError(''); }}
                    placeholder="8-32位，包含字母和数字"
                    className="h-11 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-1 block">确认密码</label>
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                  placeholder="再次输入密码"
                  className="h-11"
                />
              </div>

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive flex items-center gap-1"
                >
                  <AlertTriangle className="w-4 h-4" />
                  {error}
                </motion.p>
              )}

              <label className="flex items-start gap-2 mt-4">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  className="mt-1"
                />
                <span className="text-xs text-muted-foreground">
                  我已牢记密码，明白丢失密码将无法恢复备份
                </span>
              </label>
            </div>
          </div>

          <div className="pb-6 space-y-2">
            <Button
              size="lg"
              className="w-full text-base font-medium"
              onClick={handleBackup}
              disabled={isLoading || !confirmed}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              ) : (
                <Upload className="w-5 h-5 mr-2" />
              )}
              完成备份
            </Button>
          </div>
        </div>
      </AppLayout>
    );
  }

  const hasCloudBackup = wallet.isBackedUp && wallet.backupInfo?.method === 'cloud';
  const cloudProviderName = wallet.backupInfo?.cloudProvider === 'icloud' ? 'iCloud' : 'Google Drive';

  // Backup type selection
  return (
    <AppLayout showNav={false} title="备份钱包" showBack>
      <div className="flex flex-col h-full px-4">
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-24 h-24 rounded-full bg-accent/10 flex items-center justify-center mb-6"
          >
            <CloudUpload className="w-12 h-12 text-accent" />
          </motion.div>

          <h2 className="text-lg font-bold text-foreground mb-2">
            {wallet.isBackedUp ? '管理备份' : '备份钱包'}
          </h2>
          <p className="text-muted-foreground text-sm max-w-[280px] mb-6">
            {wallet.isBackedUp
              ? `「${wallet.name}」已备份，您可以添加其他备份方式`
              : `为「${wallet.name}」创建备份，确保资产安全`
            }
          </p>

          {/* Backup options */}
          <div className="w-full space-y-3 max-w-[300px]">
            {/* Cloud backup option */}
            {hasCloudBackup ? (
              <button
                onClick={async () => {
                  setBackupType('cloud');
                  setIsLoading(true);
                  try {
                    await backupWallet(walletId!, {
                      method: 'cloud',
                      cloudProvider: 'icloud' as const,
                      lastBackupTime: new Date(),
                    });
                    setShowSuccess(true);
                    toast.success('备份完成');
                  } catch {
                    toast.error('备份失败，请重试');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full p-4 rounded-xl border border-success/30 bg-success/5 hover:bg-success/10 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                    {isLoading && backupType === 'cloud' ? (
                      <Loader2 className="w-5 h-5 text-success animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-5 h-5 text-success" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-medium text-foreground text-sm">
                        {isLoading && backupType === 'cloud' ? '正在备份...' : '云端备份'}
                      </p>
                      {!(isLoading && backupType === 'cloud') && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-success/10 text-success">
                          已完成
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {cloudProviderName} 备份
                      {wallet.backupInfo?.lastBackupTime && ` · ${formatTimeAgo(wallet.backupInfo.lastBackupTime)}`}
                    </p>
                  </div>
                  {!(isLoading && backupType === 'cloud') && (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-xs text-muted-foreground">重新备份</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </button>
            ) : (
              <button
                onClick={async () => {
                  setBackupType('cloud');
                  setIsLoading(true);
                  try {
                    await backupWallet(walletId!, {
                      method: 'cloud',
                      cloudProvider: 'icloud' as const,
                      lastBackupTime: new Date(),
                    });
                    setShowSuccess(true);
                    toast.success('备份完成');
                  } catch {
                    toast.error('备份失败，请重试');
                  } finally {
                    setIsLoading(false);
                  }
                }}
                disabled={isLoading}
                className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left disabled:opacity-50"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    {isLoading && backupType === 'cloud' ? (
                      <Loader2 className="w-5 h-5 text-primary animate-spin" />
                    ) : (
                      <Cloud className="w-5 h-5 text-primary" />
                    )}
                  </div>
                  <div>
                    <p className="font-medium text-foreground text-sm">
                      {isLoading && backupType === 'cloud' ? '正在备份到云端...' : '云端备份'}
                    </p>
                    <p className="text-xs text-muted-foreground">备份到 iCloud 或 Google Drive</p>
                  </div>
                </div>
              </button>
            )}

            {/* Local backup option — always available */}
            <button
              onClick={() => { setBackupType('local'); setShowPasswordForm(true); }}
              className="w-full p-4 rounded-xl border border-border bg-card hover:bg-muted/50 transition-colors text-left"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center shrink-0">
                  <HardDrive className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-foreground text-sm">导出备份文件</p>
                  <p className="text-xs text-muted-foreground">保存加密文件到本地</p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
