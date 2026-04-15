import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Cloud, HardDrive, Check, Eye, EyeOff, AlertTriangle, Shield, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { getTSSNodeInfo, updateTSSNodeBackup, formatTimeAgo } from '@/lib/tss-node';
import { toast } from '@/lib/toast';
type BackupType = 'cloud' | 'local';
export default function TSSBackupManagement() {
  const navigate = useNavigate();
  const [tssNodeInfo, setTssNodeInfo] = useState(getTSSNodeInfo);

  // Drawer states
  const [activeBackupType, setActiveBackupType] = useState<BackupType | null>(null);

  // Confirmation dialog
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingBackupType, setPendingBackupType] = useState<BackupType | null>(null);

  // Password form states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const resetForm = () => {
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
    setConfirmed(false);
    setError('');
  };
  const handleStartBackup = (type: BackupType) => {
    const hasExistingBackup = type === 'cloud' ? tssNodeInfo.backup.hasCloudBackup : tssNodeInfo.backup.hasLocalBackup;
    if (hasExistingBackup) {
      setPendingBackupType(type);
      setShowConfirmDialog(true);
    } else {
      setActiveBackupType(type);
    }
  };
  const handleConfirmRebackup = () => {
    setShowConfirmDialog(false);
    if (pendingBackupType) {
      setActiveBackupType(pendingBackupType);
      setPendingBackupType(null);
    }
  };
  const validatePassword = (): boolean => {
    if (password.length < 8 || password.length > 32) {
      setError('密码长度需要在 8-32 位之间');
      return false;
    }
    if (!/[a-zA-Z]/.test(password) || !/[0-9]/.test(password)) {
      setError('密码需要包含字母和数字');
      return false;
    }
    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return false;
    }
    return true;
  };
  const handleCloudBackup = async () => {
    setIsLoading(true);
    try {
      // Simulate backup process
      await new Promise(resolve => setTimeout(resolve, 1500));
      const updated = updateTSSNodeBackup({
        hasCloudBackup: true,
        cloudProvider: 'icloud',
        cloudBackupTime: new Date()
      });
      setTssNodeInfo(updated);
      toast.success('云备份完成', '已备份到 iCloud');
      setActiveBackupType(null);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };
  const handleLocalBackup = async () => {
    if (!validatePassword()) return;
    setIsLoading(true);
    try {
      // Simulate file export
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create a mock backup file download
      const backupData = {
        type: 'tss_node_backup',
        timestamp: new Date().toISOString(),
        encrypted: true
      };
      const blob = new Blob([JSON.stringify(backupData)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tss_backup_${Date.now()}.encrypted`;
      a.click();
      URL.revokeObjectURL(url);
      const updated = updateTSSNodeBackup({
        hasLocalBackup: true,
        localBackupTime: new Date()
      });
      setTssNodeInfo(updated);
      toast.success('备份文件已导出', '请妥善保管备份文件');
      setActiveBackupType(null);
      resetForm();
    } finally {
      setIsLoading(false);
    }
  };
  const handleDrawerClose = (open: boolean) => {
    if (!open) {
      setActiveBackupType(null);
      resetForm();
    }
  };
  return <div className="min-h-screen bg-background pt-7">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold">安全账户备份管理</h1>
        </div>
      </div>

      <div className="px-4 pb-8 space-y-6">
        {/* Intro Card */}
        <Card className="p-4 bg-primary/5 border-primary/20">
          <div className="flex gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="font-medium text-sm">安全账户备份</h3>
              <p className="text-xs text-muted-foreground mt-1">
                备份您的安全账户密钥分片，用于换机或手机丢失时找回资金。建议同时完成云端和本地备份。
              </p>
            </div>
          </div>
        </Card>

        {/* Cloud Backup Section */}
        <div className="space-y-3">
          <span className="text-xs text-muted-foreground">云端备份</span>
          
          <Card className="p-4 cursor-pointer active:bg-muted/50 transition-colors" onClick={() => handleStartBackup('cloud')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tssNodeInfo.backup.hasCloudBackup ? 'bg-success/10' : 'bg-muted'}`}>
                  {tssNodeInfo.backup.hasCloudBackup ? <Check className="h-5 w-5 text-success" /> : <Cloud className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {tssNodeInfo.backup.hasCloudBackup ? 'iCloud' : '未备份'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tssNodeInfo.backup.hasCloudBackup && tssNodeInfo.backup.cloudBackupTime ? `已备份 · ${formatTimeAgo(tssNodeInfo.backup.cloudBackupTime)}` : '点击开始云端备份'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Local Backup Section */}
        <div className="space-y-3">
          <span className="text-xs text-muted-foreground">本地备份</span>
          
          <Card className="p-4 cursor-pointer active:bg-muted/50 transition-colors" onClick={() => handleStartBackup('local')}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${tssNodeInfo.backup.hasLocalBackup ? 'bg-success/10' : 'bg-muted'}`}>
                  {tssNodeInfo.backup.hasLocalBackup ? <Check className="h-5 w-5 text-success" /> : <HardDrive className="h-5 w-5 text-muted-foreground" />}
                </div>
                <div>
                  <p className="text-sm font-medium">
                    {tssNodeInfo.backup.hasLocalBackup ? '本地文件' : '未备份'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {tssNodeInfo.backup.hasLocalBackup && tssNodeInfo.backup.localBackupTime ? `已备份 · ${formatTimeAgo(tssNodeInfo.backup.localBackupTime)}` : '点击导出备份文件'}
                  </p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </div>
          </Card>
        </div>

      </div>

      {/* Re-backup Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>重新备份</AlertDialogTitle>
            <AlertDialogDescription>
              {pendingBackupType === 'cloud'
                ? '您已有云端备份。重新备份将更新您的云端备份数据。'
                : '您已有本地备份。重新备份将使用新密码创建新的备份文件，旧备份仍可使用旧密码恢复。'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmRebackup}>
              继续备份
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cloud Backup Drawer - iCloud only (no password needed) */}
      <Drawer open={activeBackupType === 'cloud'} onOpenChange={handleDrawerClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>备份到 iCloud</DrawerTitle>
          </DrawerHeader>

          <div className="px-4 pb-8">
            {/* Cloud Backup Tips */}
            <div className="p-3 rounded-xl bg-warning/80/5 border border-amber-500/20 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">重要提示</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 备份将加密存储在您的 iCloud 账户中</li>
                    <li>• 换机时使用相同 Apple ID 登录即可恢复</li>
                  </ul>
                </div>
              </div>
            </div>

            <Button className="w-full" disabled={isLoading} onClick={handleCloudBackup}>
              {isLoading ? '备份中...' : '备份到 iCloud'}
            </Button>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Local Backup Drawer */}
      <Drawer open={activeBackupType === 'local'} onOpenChange={handleDrawerClose}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>设置备份密码</DrawerTitle>
          </DrawerHeader>
          
          <div className="px-4 pb-8">
            {/* Local Backup Tips */}
            <div className="p-3 rounded-xl bg-warning/80/5 border border-amber-500/20 mb-6">
              <div className="flex gap-3">
                <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="text-sm font-medium">重要提示</h4>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    <li>• 备份文件将导出至您当前设备</li>
                    <li>• 备份密码无法找回，请务必牢记</li>
                    <li>• 请将备份文件保存在安全位置（如电脑或 U 盘）</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <PasswordForm password={password} confirmPassword={confirmPassword} showPassword={showPassword} confirmed={confirmed} error={error} isLoading={isLoading} onPasswordChange={v => {
            setPassword(v);
            setError('');
          }} onConfirmPasswordChange={v => {
            setConfirmPassword(v);
            setError('');
          }} onShowPasswordToggle={() => setShowPassword(!showPassword)} onConfirmedChange={setConfirmed} onSubmit={handleLocalBackup} submitLabel="导出备份文件" />
          </div>
        </DrawerContent>
      </Drawer>
    </div>;
}

// Password Form Component
interface PasswordFormProps {
  password: string;
  confirmPassword: string;
  showPassword: boolean;
  confirmed: boolean;
  error: string;
  isLoading: boolean;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onShowPasswordToggle: () => void;
  onConfirmedChange: (value: boolean) => void;
  onSubmit: () => void;
  onBack?: () => void;
  submitLabel: string;
  showBackButton?: boolean;
  children?: React.ReactNode;
}
function PasswordForm({
  password,
  confirmPassword,
  showPassword,
  confirmed,
  error,
  isLoading,
  onPasswordChange,
  onConfirmPasswordChange,
  onShowPasswordToggle,
  onConfirmedChange,
  onSubmit,
  onBack,
  submitLabel,
  showBackButton,
  children
}: PasswordFormProps) {
  const isValid = password.length >= 8 && /[a-zA-Z]/.test(password) && /[0-9]/.test(password) && password === confirmPassword && confirmed;
  return <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">设置密码</label>
        <div className="relative">
          <Input type={showPassword ? 'text' : 'password'} placeholder="8-32位，包含字母和数字" value={password} onChange={e => onPasswordChange(e.target.value)} className="pr-10" />
          <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={onShowPasswordToggle}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium">确认密码</label>
        <Input type={showPassword ? 'text' : 'password'} placeholder="再次输入密码" value={confirmPassword} onChange={e => onConfirmPasswordChange(e.target.value)} />
      </div>
      
      {error && <p className="text-sm text-destructive">{error}</p>}
      
      <div className="flex items-start gap-2 pt-2">
        <Checkbox id="confirm-password" checked={confirmed} onCheckedChange={checked => onConfirmedChange(checked as boolean)} />
        <label htmlFor="confirm-password" className="text-xs text-muted-foreground leading-tight cursor-pointer">
          我已牢记密码，并了解如果忘记密码将无法恢复备份
        </label>
      </div>
      
      {children && <div className="pt-4">
          {children}
        </div>}
      
      <div className={`flex gap-3 pt-4 ${showBackButton ? '' : ''}`}>
        {showBackButton && onBack && <Button variant="outline" className="flex-1" onClick={onBack}>
            返回
          </Button>}
        <Button className={showBackButton ? 'flex-1' : 'w-full'} disabled={!isValid || isLoading} onClick={onSubmit}>
          {isLoading ? '备份中...' : submitLabel}
        </Button>
      </div>
    </div>;
}