import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, ArrowRight, Mail, Phone, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';

type Step = 'verify' | 'new-password' | 'success' | 'forgot-choose' | 'forgot-otp';

interface ChangePasswordDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasExistingPassword: boolean;
  onSuccess: () => void;
  boundEmail?: string | null;
  boundPhone?: string | null;
}

// Password strength calculation
function getPasswordStrength(password: string): { level: 'weak' | 'medium' | 'strong'; label: string; color: string } {
  if (!password) return { level: 'weak', label: '', color: '' };
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;
  
  if (score <= 2) return { level: 'weak', label: '弱', color: 'bg-destructive' };
  if (score <= 3) return { level: 'medium', label: '中', color: 'bg-warning' };
  return { level: 'strong', label: '强', color: 'bg-success' };
}

// Mask helpers
function maskEmail(email: string) {
  if (!email) return '';
  const [local, domain] = email.split('@');
  if (!domain || local.length <= 2) return email;
  return `${local.slice(0, 2)}****@${domain}`;
}

function maskPhone(phone: string) {
  if (!phone) return '';
  const parts = phone.split(' ');
  if (parts.length < 2) return phone;
  const countryCode = parts[0];
  const number = parts.slice(1).join('');
  if (number.length <= 4) return phone;
  return `${countryCode} ${number.slice(0, 3)}****${number.slice(-4)}`;
}

export function ChangePasswordDrawer({
  open,
  onOpenChange,
  hasExistingPassword,
  onSuccess,
  boundEmail,
  boundPhone,
}: ChangePasswordDrawerProps) {
  const [step, setStep] = useState<Step>(hasExistingPassword ? 'verify' : 'new-password');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Forgot password states
  const [resetMethod, setResetMethod] = useState<'email' | 'phone'>('email');
  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef<NodeJS.Timeout | null>(null);

  const passwordStrength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  // Countdown timer for resend
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [countdown]);

  const handleVerifyPassword = async () => {
    setError('');
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const savedPassword = localStorage.getItem('user_password');
    if (currentPassword !== savedPassword) {
      setError('当前密码不正确');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(false);
    setStep('new-password');
  };

  const handleForgotPassword = () => {
    setError('');
    // Default to email if available, otherwise phone
    if (boundEmail) {
      setResetMethod('email');
    } else if (boundPhone) {
      setResetMethod('phone');
    }
    setStep('forgot-choose');
  };

  const handleSendResetCode = async () => {
    setError('');
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setIsLoading(false);
    setCountdown(60);
    setStep('forgot-otp');
  };

  const handleVerifyOtp = async () => {
    setError('');
    
    if (otp.length !== 6) {
      setError('请输入完整的验证码');
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Mock verification - accept any 6-digit code
    if (otp === '000000') {
      setError('验证码错误，请重试');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(false);
    setStep('new-password');
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    setIsLoading(false);
    setCountdown(60);
  };

  const handleSetNewPassword = async () => {
    setError('');
    
    if (newPassword !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }
    
    if (newPassword.length < 6) {
      setError('密码长度至少6位');
      return;
    }
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 800));
    
    localStorage.setItem('user_password', newPassword);
    setIsLoading(false);
    setStep('success');
    
    setTimeout(() => {
      onSuccess();
      handleClose();
    }, 1500);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setStep(hasExistingPassword ? 'verify' : 'new-password');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setOtp('');
      setError('');
      setShowCurrentPassword(false);
      setShowNewPassword(false);
      setShowConfirmPassword(false);
      setCountdown(0);
    }, 300);
  };

  const handleBack = () => {
    setError('');
    if (step === 'forgot-choose') {
      setStep('verify');
    } else if (step === 'forgot-otp') {
      setStep('forgot-choose');
    }
  };

  const getTitle = () => {
    switch (step) {
      case 'verify':
        return '验证当前密码';
      case 'new-password':
        return hasExistingPassword ? '设置新密码' : '设置登录密码';
      case 'success':
        return '密码设置成功';
      case 'forgot-choose':
        return '找回密码';
      case 'forgot-otp':
        return '验证身份';
    }
  };

  const hasBoundAccounts = boundEmail || boundPhone;

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader className="text-left pb-0">
          <DrawerTitle className="flex items-center gap-2 text-xl font-semibold">
            {(step === 'forgot-choose' || step === 'forgot-otp') && (
              <button
                onClick={handleBack}
                className="mr-1 p-1 -ml-1 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            {getTitle()}
          </DrawerTitle>
        </DrawerHeader>
        
        {/* Separator line */}
        <div className="mx-6 my-4 border-t border-border" />

        <div className="px-6 pb-8">
          <AnimatePresence mode="wait">
            {/* Step 1: Verify current password */}
            {step === 'verify' && (
              <motion.div
                key="verify"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground text-center mb-4">
                  请输入当前密码以验证身份
                </p>
                
                <div className="relative">
                  <Input
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={currentPassword}
                    onChange={(e) => {
                      setCurrentPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="请输入当前密码"
                    className="h-12 text-base pr-12"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive text-center"
                  >
                    {error}
                  </motion.p>
                )}
                
                <Button
                  className="w-full h-12"
                  onClick={handleVerifyPassword}
                  disabled={!currentPassword || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      验证密码
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {hasBoundAccounts && (
                  <button
                    onClick={handleForgotPassword}
                    className="w-full text-center text-sm text-primary hover:underline"
                  >
                    忘记密码？
                  </button>
                )}
              </motion.div>
            )}

            {/* Forgot Password - Choose Method */}
            {step === 'forgot-choose' && (
              <motion.div
                key="forgot-choose"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground text-center mb-4">
                  选择验证方式找回密码
                </p>
                
                <div className="space-y-3">
                  {boundEmail && (
                    <button
                      onClick={() => setResetMethod('email')}
                      className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        resetMethod === 'email'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        resetMethod === 'email' ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Mail className={`w-5 h-5 ${resetMethod === 'email' ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-foreground">邮箱验证</p>
                        <p className="text-sm text-muted-foreground">{maskEmail(boundEmail)}</p>
                      </div>
                      {resetMethod === 'email' && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  )}
                  
                  {boundPhone && (
                    <button
                      onClick={() => setResetMethod('phone')}
                      className={`w-full p-4 rounded-lg border-2 transition-all flex items-center gap-3 ${
                        resetMethod === 'phone'
                          ? 'border-primary bg-primary/5'
                          : 'border-border hover:border-muted-foreground/50'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        resetMethod === 'phone' ? 'bg-primary/10' : 'bg-muted'
                      }`}>
                        <Phone className={`w-5 h-5 ${resetMethod === 'phone' ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="text-left flex-1">
                        <p className="font-medium text-foreground">手机验证</p>
                        <p className="text-sm text-muted-foreground">{maskPhone(boundPhone)}</p>
                      </div>
                      {resetMethod === 'phone' && (
                        <CheckCircle2 className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  )}
                </div>
                
                <Button
                  className="w-full h-12"
                  onClick={handleSendResetCode}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      发送验证码
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>
              </motion.div>
            )}

            {/* Forgot Password - OTP Verification */}
            {step === 'forgot-otp' && (
              <motion.div
                key="forgot-otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <p className="text-sm text-muted-foreground text-center mb-4">
                  验证码已发送至 {resetMethod === 'email' ? maskEmail(boundEmail || '') : maskPhone(boundPhone || '')}
                </p>
                
                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={otp}
                    onChange={setOtp}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot key={index} index={index} className="w-11 h-12" />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive text-center"
                  >
                    {error}
                  </motion.p>
                )}
                
                <div className="text-center">
                  {countdown > 0 ? (
                    <p className="text-sm text-muted-foreground">
                      {countdown}秒后可重新发送
                    </p>
                  ) : (
                    <button
                      onClick={handleResendCode}
                      disabled={isLoading}
                      className="text-sm text-primary hover:underline disabled:opacity-50"
                    >
                      重新发送验证码
                    </button>
                  )}
                </div>
                
                <Button
                  className="w-full h-12"
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    '验证'
                  )}
                </Button>
              </motion.div>
            )}

            {/* Step 2: Set new password */}
            {step === 'new-password' && (
              <motion.div
                key="new-password"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                
                {/* New Password */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">新密码</label>
                  <div className="relative">
                    <Input
                      type={showNewPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => {
                        setNewPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="请输入新密码"
                      className="h-12 text-base pr-12"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {/* Password Strength Indicator */}
                {newPassword && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">密码强度:</span>
                      <div className="flex gap-1 flex-1">
                        {[1, 2, 3].map((segment) => (
                          <div
                            key={segment}
                            className={`h-1.5 flex-1 rounded-full transition-colors ${
                              segment === 1 ? passwordStrength.color :
                              segment === 2 && (passwordStrength.level === 'medium' || passwordStrength.level === 'strong') ? passwordStrength.color :
                              segment === 3 && passwordStrength.level === 'strong' ? passwordStrength.color :
                              'bg-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <span className={`text-sm font-medium ${
                        passwordStrength.level === 'weak' ? 'text-destructive' :
                        passwordStrength.level === 'medium' ? 'text-warning' : 'text-success'
                      }`}>
                        {passwordStrength.label}
                      </span>
                    </div>
                  </motion.div>
                )}
                
                {/* Confirm Password */}
                <div className="space-y-2">
                  <label className="text-sm text-muted-foreground">确认新密码</label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="请再次输入新密码"
                      className="h-12 text-base pr-12"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive text-center"
                  >
                    {error}
                  </motion.p>
                )}
                
                <p className="text-xs text-muted-foreground text-center">
                  建议使用8位以上，包含大小写字母、数字和特殊字符
                </p>
                
                <Button
                  className="w-full h-12"
                  onClick={handleSetNewPassword}
                  disabled={!newPassword || !confirmPassword || isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    '确认设置'
                  )}
                </Button>
              </motion.div>
            )}

            {/* Step 3: Success */}
            {step === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center py-8"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-8 h-8 text-success" />
                </motion.div>
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  密码设置成功
                </h3>
                <p className="text-sm text-muted-foreground">
                  您的登录密码已更新
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
