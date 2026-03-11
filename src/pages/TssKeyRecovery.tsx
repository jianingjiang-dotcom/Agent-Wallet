import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { 
  Shield, Cloud, HardDrive, 
  AlertTriangle, CheckCircle2, Loader2, ChevronLeft,
  Lock, Eye, EyeOff, Upload, FileText, MessageCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';

type RecoveryMethod = 'cloud' | 'local_file';
type RecoveryStep = 'method' | 'file_select' | 'password' | 'success';

// Define steps for progress indicator
const getStepsForMethod = (method: RecoveryMethod | null) => {
  if (method === 'local_file') {
    return [
      { id: 1, title: '选择方式', icon: Shield, step: 'method' },
      { id: 2, title: '选择文件', icon: HardDrive, step: 'file_select' },
      { id: 3, title: '验证密码', icon: Lock, step: 'password' },
    ];
  }
  // Cloud recovery: no password needed
  return [
    { id: 1, title: '选择方式', icon: Shield, step: 'method' },
  ];
};

export default function TSSRecoveryPage() {
  const [searchParams] = useSearchParams();
  const hasCloudBackup = searchParams.get('cloud') !== 'false';
  const cloudProvider = searchParams.get('provider') || 'icloud';
  const lastBackupTime = searchParams.get('time') || '3 天前';
  
  const [step, setStep] = useState<RecoveryStep>('method');
  const [selectedMethod, setSelectedMethod] = useState<RecoveryMethod | null>(null);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();
  const { recoverTSSNode } = useWallet();

  const handleSelectMethod = async (method: RecoveryMethod) => {
    setSelectedMethod(method);
    if (method === 'local_file') {
      // Go to file selection step first
      setStep('file_select');
    } else {
      // Cloud recovery: skip password, directly recover
      setIsLoading(true);
      setError('');
      try {
        await recoverTSSNode('cloud');
        setStep('success');
      } catch {
        setError('恢复失败，请重试');
        setStep('method');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleFileSelected = (fileName: string) => {
    setSelectedFile(fileName);
    setStep('password');
  };

  const handleRecover = async () => {
    if (!password) {
      setError('请输入备份密码');
      return;
    }
    if (password.length < 8) {
      setError('密码长度至少 8 位');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      await recoverTSSNode(selectedMethod!, password);
      setStep('success');
    } catch (e) {
      setError('恢复失败，请检查密码是否正确');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnterWallet = () => {
    navigate('/home');
  };

  const handleBack = () => {
    if (step === 'password') {
      if (selectedMethod === 'local_file') {
        setStep('file_select');
        setPassword('');
        setError('');
      } else {
        setStep('method');
        setSelectedMethod(null);
        setPassword('');
        setError('');
      }
    } else if (step === 'file_select') {
      setStep('method');
      setSelectedMethod(null);
      setSelectedFile(null);
    } else {
      navigate('/login');
    }
  };

  const getStepTitle = () => {
    switch (step) {
      case 'method': return '恢复安全账户';
      case 'file_select': return '选择备份文件';
      case 'password': return '验证密码';
      case 'success': return '恢复成功';
    }
  };

  // Get current step index for progress (only used after method selection)
  const steps = getStepsForMethod(selectedMethod);
  const getCurrentStepIndex = () => {
    if (step === 'success') return steps.length;
    if (step === 'method') return 0;
    // For file_select and password steps, calculate index within the remaining steps
    if (selectedMethod === 'local_file') {
      if (step === 'file_select') return 1;
      if (step === 'password') return 2;
    } else {
      // cloud method
      if (step === 'password') return 1;
    }
    return 1;
  };
  const currentStepIndex = getCurrentStepIndex();
  const totalSteps = selectedMethod === 'local_file' ? 2 : 1; // Steps after method selection
  const progress = step === 'success' ? 100 : (currentStepIndex / totalSteps) * 100;

  // Steps to show in progress indicator (excluding method selection step)
  const displaySteps = selectedMethod === 'local_file' 
    ? [
        { id: 1, title: '选择文件', icon: HardDrive, step: 'file_select' },
        { id: 2, title: '验证密码', icon: Lock, step: 'password' },
      ]
    : [
        { id: 1, title: '验证密码', icon: Lock, step: 'password' },
      ];

  return (
    <div className="h-full bg-background flex flex-col pt-7">
      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button 
              onClick={handleBack}
              className="p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="w-6 h-6" strokeWidth={1.5} />
            </button>
            {/* Show step counter only for local file recovery flow */}
            {selectedMethod === 'local_file' && step !== 'method' && step !== 'success' && (
              <span className="text-sm text-muted-foreground">
                步骤 {step === 'file_select' ? 1 : 2} / 2
              </span>
            )}
          </div>
          {/* Only show title when not on method selection step */}
          {step !== 'method' && (
            <span className="text-sm font-medium text-foreground">
              {getStepTitle()}
            </span>
          )}
          {step === 'method' && <div />}
        </div>
        
        {/* Step icons indicator for local file recovery - full width like onboarding */}
        {selectedMethod === 'local_file' && step !== 'method' && step !== 'success' && (
          <div className="flex items-center mt-6">
            {[
              { id: 1, icon: HardDrive, step: 'file_select' },
              { id: 2, icon: Lock, step: 'password' },
            ].map((stepItem, index, arr) => {
              const Icon = stepItem.icon;
              const currentStepNum = step === 'file_select' ? 1 : 2;
              const isComplete = currentStepNum > stepItem.id;
              const isCurrent = currentStepNum === stepItem.id;
              
              return (
                <div key={stepItem.id} className="flex items-center flex-1 last:flex-none">
                  <div
                    className={cn(
                      'w-10 h-10 rounded-full flex items-center justify-center transition-all shrink-0',
                      isComplete && 'bg-success text-success-foreground',
                      isCurrent && 'bg-primary text-primary-foreground',
                      !isComplete && !isCurrent && 'bg-muted text-muted-foreground'
                    )}
                  >
                    {isComplete ? (
                      <CheckCircle2 className="w-5 h-5" strokeWidth={1.5} />
                    ) : (
                      <Icon className="w-5 h-5" strokeWidth={1.5} />
                    )}
                  </div>
                  {index < arr.length - 1 && (
                    <div
                      className={cn(
                        'flex-1 h-0.5 mx-2',
                        currentStepNum > stepItem.id ? 'bg-success' : 'bg-border'
                      )}
                    />
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 px-4 overflow-auto">
        <AnimatePresence mode="wait">
          {step === 'method' && (
            <MethodSelectionStep
              key="method"
              hasCloudBackup={hasCloudBackup}
              cloudProvider={cloudProvider}
              lastBackupTime={lastBackupTime}
              isRecovering={isLoading}
              onSelect={handleSelectMethod}
              onCloudUnavailable={() => navigate('/cloud-recovery-unavailable?provider=' + cloudProvider)}
            />
          )}
          {step === 'file_select' && (
            <FileSelectStep
              key="file_select"
              onFileSelected={handleFileSelected}
            />
          )}
          {step === 'password' && (
            <PasswordStep
              key="password"
              method={selectedMethod!}
              cloudProvider={cloudProvider}
              selectedFile={selectedFile}
              password={password}
              setPassword={setPassword}
              showPassword={showPassword}
              setShowPassword={setShowPassword}
              error={error}
              isLoading={isLoading}
              onSubmit={handleRecover}
            />
          )}
          {step === 'success' && (
            <SuccessStep
              key="success"
              onEnter={handleEnterWallet}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Contact Support - only show on method selection step */}
      {step === 'method' && (
        <div className="px-4 pb-6 pt-2 space-y-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full text-base"
            onClick={() => navigate('/help')}
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            联系客服
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            遇到问题？联系客服获取帮助
          </p>
        </div>
      )}
    </div>
  );
}

// Method Selection Step
function MethodSelectionStep({
  hasCloudBackup,
  cloudProvider,
  lastBackupTime,
  isRecovering,
  onSelect,
  onCloudUnavailable,
}: {
  hasCloudBackup: boolean;
  cloudProvider: string;
  lastBackupTime: string;
  isRecovering?: boolean;
  onSelect: (method: RecoveryMethod) => void;
  onCloudUnavailable: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      {/* Header Info */}
      <div className="flex flex-col items-center text-center pt-6 pb-4">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4"
        >
          <Shield className="w-8 h-8 text-accent" />
        </motion.div>
        <h2 className="text-lg font-bold text-foreground mb-2">
          检测到已有安全账户
        </h2>
        <p className="text-sm text-muted-foreground max-w-[280px]">
          您已在其他设备创建过钱包，请选择恢复方式以继续使用
        </p>
      </div>

      {/* Recovery Options */}
      <div className="space-y-3 flex-1">
        {/* Cloud Recovery - always show */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={() => hasCloudBackup ? onSelect('cloud') : onCloudUnavailable()}
          disabled={isRecovering}
          className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-accent/50 transition-colors disabled:opacity-50"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              {isRecovering ? (
                <Loader2 className="w-5 h-5 text-primary animate-spin" />
              ) : (
                <Cloud className="w-5 h-5 text-primary" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-medium text-foreground">
                  {isRecovering ? '正在恢复...' : '云端恢复'}
                </span>
                {hasCloudBackup && !isRecovering && (
                  <span className="text-xs text-success bg-success/10 px-2 py-0.5 rounded-full">
                    推荐
                  </span>
                )}
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                从 {cloudProvider === 'icloud' ? 'iCloud' : 'Google Drive'} 恢复
              </p>
              <p className={`text-xs mt-1 ${hasCloudBackup ? 'text-muted-foreground' : 'text-warning'}`}>
                {hasCloudBackup ? `上次备份：${lastBackupTime}` : '无备份记录'}
              </p>
            </div>
          </div>
        </motion.button>

        {/* Local File Recovery */}
        <motion.button
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: hasCloudBackup ? 0.2 : 0.1 }}
          onClick={() => onSelect('local_file')}
          className="w-full bg-card border border-border rounded-xl p-4 text-left hover:border-accent/50 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center shrink-0">
              <HardDrive className="w-5 h-5 text-warning" />
            </div>
            <div className="flex-1">
              <span className="font-medium text-foreground">本地文件恢复</span>
              <p className="text-sm text-muted-foreground mt-1">
                导入之前导出的 .backup 文件
              </p>
            </div>
          </div>
        </motion.button>
      </div>
    </motion.div>
  );
}

// File Selection Step
function FileSelectStep({
  onFileSelected,
}: {
  onFileSelected: (fileName: string) => void;
}) {
  const [selectedFile, setSelectedFile] = useState<string | null>(null);

  const handleFileSelect = () => {
    // Mock file selection
    const mockFileName = 'wallet_backup_20250120.backup';
    setSelectedFile(mockFileName);
  };

  const handleContinue = () => {
    if (selectedFile) {
      onFileSelected(selectedFile);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 flex flex-col items-center pt-8">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center mb-4"
        >
          <HardDrive className="w-8 h-8 text-warning" />
        </motion.div>
        
        <h2 className="text-lg font-bold text-foreground mb-2 text-center">
          选择备份文件
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-[280px] mb-8">
          请选择之前导出的 .backup 备份文件
        </p>

        {/* File Selection Area */}
        <div className="w-full max-w-[300px]">
          {!selectedFile ? (
            <button
              onClick={handleFileSelect}
              className="w-full border-2 border-dashed border-border rounded-xl p-8 flex flex-col items-center gap-3 hover:border-accent/50 hover:bg-accent/5 transition-colors"
            >
              <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Upload className="w-6 h-6 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">点击选择文件</p>
                <p className="text-xs text-muted-foreground mt-1">支持 .backup 格式</p>
              </div>
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full bg-success/5 border border-success/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-success" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {selectedFile}
                  </p>
                  <p className="text-xs text-success flex items-center gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3" />
                    文件已选择
                  </p>
                </div>
              </div>
              <button
                onClick={handleFileSelect}
                className="w-full mt-3 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                重新选择
              </button>
            </motion.div>
          )}
        </div>
      </div>

      <div className="pb-6">
        <Button
          size="lg"
          className="w-full text-base font-medium"
          onClick={handleContinue}
          disabled={!selectedFile}
        >
          下一步
        </Button>
      </div>
    </motion.div>
  );
}

// Password Input Step
function PasswordStep({
  method,
  cloudProvider,
  selectedFile,
  password,
  setPassword,
  showPassword,
  setShowPassword,
  error,
  isLoading,
  onSubmit,
}: {
  method: RecoveryMethod;
  cloudProvider: string;
  selectedFile: string | null;
  password: string;
  setPassword: (v: string) => void;
  showPassword: boolean;
  setShowPassword: (v: boolean) => void;
  error: string;
  isLoading: boolean;
  onSubmit: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="flex flex-col h-full"
    >
      <div className="flex-1 flex flex-col items-center pt-8">
        <motion.div
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mb-4"
        >
          <Lock className="w-8 h-8 text-accent" />
        </motion.div>
        
        <h2 className="text-lg font-bold text-foreground mb-2 text-center">
          {method === 'cloud' ? '输入云备份密码' : '输入备份文件密码'}
        </h2>
        <p className="text-sm text-muted-foreground text-center max-w-[280px] mb-6">
          {method === 'cloud' 
            ? `请输入您在备份到 ${cloudProvider === 'icloud' ? 'iCloud' : 'Google Drive'} 时设置的密码`
            : '请输入您在导出备份文件时设置的密码'
          }
        </p>

        {/* Show selected file info for local_file method */}
        {method === 'local_file' && selectedFile && (
          <div className="w-full max-w-[300px] mb-4 bg-muted/30 rounded-lg p-3 flex items-center gap-2">
            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-sm text-muted-foreground truncate">{selectedFile}</span>
          </div>
        )}

        {/* Password Input */}
        <div className="w-full max-w-[300px] relative">
          <Input
            type={showPassword ? 'text' : 'password'}
            placeholder="请输入备份密码"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-12 pr-10"
            disabled={isLoading}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          >
            {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-destructive mt-3 flex items-center gap-1"
          >
            <AlertTriangle className="w-4 h-4" />
            {error}
          </motion.p>
        )}
      </div>

      <div className="pb-6">
        <Button
          size="lg"
          className="w-full text-base font-medium"
          onClick={onSubmit}
          disabled={isLoading || !password}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
          ) : null}
          确认恢复
        </Button>
      </div>
    </motion.div>
  );
}


// Success Step
function SuccessStep({ onEnter }: { onEnter: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col h-full items-center justify-center text-center"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', damping: 15, stiffness: 300 }}
        className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
      >
        <CheckCircle2 className="w-10 h-10 text-success" />
      </motion.div>

      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-xl font-bold text-foreground mb-2"
      >
        TSS Node 恢复成功
      </motion.h2>
      
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="text-sm text-muted-foreground max-w-[280px] mb-8"
      >
        您的安全账户已成功恢复到此设备，可以继续使用钱包了
      </motion.p>

      {/* Recovered Wallets Preview */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="w-full bg-card border border-border rounded-xl p-4 mb-6"
      >
        <p className="text-xs text-muted-foreground mb-3">已恢复的钱包</p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-accent" />
              </div>
              <span className="font-medium text-foreground">主钱包</span>
            </div>
            <span className="text-sm text-muted-foreground">$47,511.00</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Shield className="w-4 h-4 text-accent" />
              </div>
              <span className="font-medium text-foreground">商务钱包</span>
            </div>
            <span className="text-sm text-muted-foreground">$74,540.00</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="w-full"
      >
        <Button
          size="lg"
          className="w-full text-base font-medium"
          onClick={onEnter}
        >
          进入钱包
        </Button>
      </motion.div>
    </motion.div>
  );
}
