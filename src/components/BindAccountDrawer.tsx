import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, Loader2, CheckCircle2, ArrowLeft, Shield, Lock, Eye, EyeOff, ChevronRight } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from '@/components/ui/input-otp';
import { CountryCodeSelector, countries, type Country } from './CountryCodeSelector';
import { cn } from '@/lib/utils';

type BindType = 'email' | 'phone';
type BindMode = 'bind' | 'rebind';
type OAuthProvider = 'google' | 'apple';
type BindStep = 'verify-old' | 'input' | 'verification' | 'success';
type VerifyMode = 'otp' | 'password';

interface BindAccountDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: BindType;
  mode?: BindMode;
  currentValue?: string;
  onSuccess?: (value: string) => void;
  hasPassword?: boolean;
}

export function BindAccountDrawer({
  open,
  onOpenChange,
  type,
  mode = 'bind',
  currentValue,
  onSuccess,
  hasPassword = false
}: BindAccountDrawerProps) {
  const [step, setStep] = useState<BindStep>(mode === 'rebind' ? 'verify-old' : 'input');
  const [value, setValue] = useState('');
  const [code, setCode] = useState('');
  const [oldCode, setOldCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<OAuthProvider | null>(null);
  const [countdown, setCountdown] = useState(0);
  const [oldCountdown, setOldCountdown] = useState(0);
  const [codeError, setCodeError] = useState('');
  const [oldCodeError, setOldCodeError] = useState('');
  const [oldCodeSent, setOldCodeSent] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]);
  
  // Password verification state
  const [verifyMode, setVerifyMode] = useState<VerifyMode>('otp');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  const isEmail = type === 'email';
  const isRebind = mode === 'rebind';
  
  const title = isRebind 
    ? (isEmail ? '换绑邮箱' : '换绑手机号')
    : (isEmail ? '绑定邮箱' : '绑定手机号');
  
  const placeholder = isEmail ? '请输入邮箱地址' : '请输入手机号';
  const Icon = isEmail ? Mail : Phone;

  // Mask functions for security display
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain || local.length <= 2) return email;
    return `${local.slice(0, 2)}****@${domain}`;
  };

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    const parts = phone.split(' ');
    if (parts.length < 2) {
      // No country code format
      if (phone.length <= 4) return phone;
      return `${phone.slice(0, 3)}****${phone.slice(-4)}`;
    }
    const countryCode = parts[0];
    const number = parts.slice(1).join('');
    if (number.length <= 4) return phone;
    return `${countryCode} ${number.slice(0, 3)}****${number.slice(-4)}`;
  };

  const maskedCurrentValue = currentValue 
    ? (isEmail ? maskEmail(currentValue) : maskPhone(currentValue))
    : '';

  // Reset step when mode changes
  useEffect(() => {
    if (open) {
      setStep(mode === 'rebind' ? 'verify-old' : 'input');
    }
  }, [open, mode]);

  const handleOAuthBind = async (provider: OAuthProvider) => {
    setOauthLoading(provider);
    // Simulate OAuth flow
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock OAuth success with email from provider
    const mockEmail = provider === 'google' 
      ? 'user@gmail.com' 
      : 'user@icloud.com';
    
    setOauthLoading(null);
    setStep('success');
    setValue(mockEmail);
    
    setTimeout(() => {
      onSuccess?.(mockEmail);
      handleClose();
    }, 1500);
  };

  const handleSendOldCode = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setOldCodeSent(true);
    setOldCountdown(60);
    
    // Start countdown
    const timer = setInterval(() => {
      setOldCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyOldCode = async (inputCode: string) => {
    if (inputCode.length !== 6) return;
    
    setIsLoading(true);
    setOldCodeError('');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock: accept any 6-digit code
    if (inputCode.length === 6) {
      setStep('input');
    } else {
      setOldCodeError('验证码错误');
      setOldCode('');
    }
    
    setIsLoading(false);
  };

  const handleOldCodeChange = (newCode: string) => {
    setOldCode(newCode);
    setOldCodeError('');
    if (newCode.length === 6) {
      handleVerifyOldCode(newCode);
    }
  };

  const handleSendCode = async () => {
    if (!value) return;
    
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    setStep('verification');
    setCountdown(60);
    
    // Start countdown
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyCode = async (inputCode: string) => {
    if (inputCode.length !== 6) return;
    
    setIsLoading(true);
    setCodeError('');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Mock: accept any 6-digit code
    if (inputCode === '123456' || inputCode.length === 6) {
      setStep('success');
      setTimeout(() => {
        const fullValue = isEmail ? value : `${selectedCountry.dialCode} ${value}`;
        onSuccess?.(fullValue);
        handleClose();
      }, 1500);
    } else {
      setCodeError('验证码错误');
      setCode('');
    }
    
    setIsLoading(false);
  };

  const handleCodeChange = (newCode: string) => {
    setCode(newCode);
    setCodeError('');
    if (newCode.length === 6) {
      handleVerifyCode(newCode);
    }
  };

  const handleResendCode = async () => {
    if (countdown > 0) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    setCountdown(60);
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleResendOldCode = async () => {
    if (oldCountdown > 0) return;
    
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    setIsLoading(false);
    setOldCountdown(60);
    
    const timer = setInterval(() => {
      setOldCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleVerifyPassword = async () => {
    if (!password) {
      setPasswordError('请输入密码');
      return;
    }
    
    setIsLoading(true);
    setPasswordError('');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const savedPassword = localStorage.getItem('user_password');
    if (password !== savedPassword) {
      setPasswordError('密码不正确');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(false);
    setStep('input'); // Proceed to new account input
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep(mode === 'rebind' ? 'verify-old' : 'input');
      setValue('');
      setCode('');
      setOldCode('');
      setCodeError('');
      setOldCodeError('');
      setOldCodeSent(false);
      setOauthLoading(null);
      setCountdown(0);
      setOldCountdown(0);
      // Reset password verification state
      setVerifyMode('otp');
      setPassword('');
      setShowPassword(false);
      setPasswordError('');
    }, 300);
  };

  const handleBack = () => {
    if (step === 'verification') {
      setStep('input');
      setCode('');
      setCodeError('');
    } else if (step === 'input' && isRebind) {
      setStep('verify-old');
      setOldCode('');
      setOldCodeError('');
      setVerifyMode('otp');
      setPassword('');
      setPasswordError('');
    } else if (step === 'verify-old' && verifyMode === 'password') {
      // Go back to OTP mode
      setVerifyMode('otp');
      setPassword('');
      setPasswordError('');
    }
  };

  const getStepTitle = () => {
    if (step === 'verify-old') {
      return '安全验证';
    }
    return title;
  };

  return (
    <Drawer open={open} onOpenChange={handleClose}>
      <DrawerContent>
        <DrawerHeader className="border-b border-border">
          <div className="flex items-center gap-3">
            {(step === 'verification' || (step === 'input' && isRebind) || (step === 'verify-old' && verifyMode === 'password')) && (
              <button onClick={handleBack} className="text-muted-foreground">
                <ArrowLeft className="w-5 h-5" />
              </button>
            )}
            <DrawerTitle>{getStepTitle()}</DrawerTitle>
          </div>
        </DrawerHeader>

        <div className="px-4 py-6">
          <AnimatePresence mode="wait">
            {/* Step: Verify Old Account (Rebind mode only) */}
            {step === 'verify-old' && (
              <motion.div
                key="verify-old"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {verifyMode === 'otp' ? (
                  <>
                    {/* Security Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-warning/10 flex items-center justify-center">
                        <Shield className="w-8 h-8 text-warning" />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        为确保账号安全，请先验证当前绑定的{isEmail ? '邮箱' : '手机号'}
                      </p>
                      <p className="font-medium text-foreground text-lg">
                        {maskedCurrentValue}
                      </p>
                    </div>

                    {!oldCodeSent ? (
                      <Button
                        className="w-full h-12"
                        onClick={handleSendOldCode}
                        disabled={isLoading}
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          `发送验证码到${isEmail ? '原邮箱' : '原手机号'}`
                        )}
                      </Button>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex justify-center">
                          <InputOTP
                            maxLength={6}
                            value={oldCode}
                            onChange={handleOldCodeChange}
                            disabled={isLoading}
                          >
                            <InputOTPGroup>
                              {[0, 1, 2, 3, 4, 5].map((index) => (
                                <InputOTPSlot
                                  key={index}
                                  index={index}
                                  className={cn(
                                    "w-11 h-12 text-lg",
                                    oldCodeError && "border-destructive"
                                  )}
                                />
                              ))}
                            </InputOTPGroup>
                          </InputOTP>
                        </div>

                        {oldCodeError && (
                          <p className="text-sm text-destructive text-center">{oldCodeError}</p>
                        )}

                        <div className="text-center">
                          <button
                            onClick={handleResendOldCode}
                            disabled={oldCountdown > 0 || isLoading}
                            className={cn(
                              "text-sm",
                              oldCountdown > 0 ? "text-muted-foreground" : "text-primary hover:underline"
                            )}
                          >
                            {oldCountdown > 0 ? `${oldCountdown}s 后重新发送` : '重新发送验证码'}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Password verification option */}
                    {hasPassword && (
                      <>
                        <div className="relative my-6">
                          <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-border" />
                          </div>
                          <div className="relative flex justify-center text-xs">
                            <span className="bg-background px-4 text-muted-foreground">或</span>
                          </div>
                        </div>
                        <button
                          onClick={() => setVerifyMode('password')}
                          className="w-full flex items-center justify-center gap-1 text-sm text-primary hover:underline"
                        >
                          使用密码验证
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <>
                    {/* Password verification mode */}
                    {/* Lock Icon */}
                    <div className="flex justify-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <Lock className="w-8 h-8 text-primary" />
                      </div>
                    </div>

                    {/* Description */}
                    <div className="text-center mb-6">
                      <p className="text-sm text-muted-foreground">
                        请输入登录密码以验证身份
                      </p>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-4">
                      <div className="relative">
                        <Input
                          type={showPassword ? 'text' : 'password'}
                          placeholder="请输入登录密码"
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setPasswordError('');
                          }}
                          className={cn(
                            "h-12 pr-12",
                            passwordError && "border-destructive focus-visible:ring-destructive"
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showPassword ? (
                            <EyeOff className="w-5 h-5" />
                          ) : (
                            <Eye className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      {passwordError && (
                        <motion.p
                          initial={{ opacity: 0, y: -5 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-sm text-destructive text-center"
                        >
                          {passwordError}
                        </motion.p>
                      )}

                      <Button
                        className="w-full h-12"
                        onClick={handleVerifyPassword}
                        disabled={isLoading || !password}
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          '确认'
                        )}
                      </Button>
                    </div>

                    {/* Switch back to OTP */}
                    <div className="relative my-6">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-background px-4 text-muted-foreground">或</span>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        setVerifyMode('otp');
                        setPassword('');
                        setPasswordError('');
                      }}
                      className="w-full flex items-center justify-center gap-1 text-sm text-primary hover:underline"
                    >
                      使用验证码验证
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </>
                )}
              </motion.div>
            )}

            {/* Step: Input New Account */}
            {step === 'input' && (
              <motion.div
                key="input"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                {/* Icon */}
                <div className="flex justify-center mb-6">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center">
                    <Icon className="w-8 h-8 text-accent" />
                  </div>
                </div>

                {/* Rebind hint */}
                {isRebind && (
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground">
                      请输入新的{isEmail ? '邮箱地址' : '手机号码'}
                    </p>
                  </div>
                )}

                {/* OAuth Options - Only for Email */}
                {isEmail && (
                  <div className="space-y-3">
                    {/* Google OAuth */}
                    <Button
                      variant="outline"
                      className="w-full h-12 gap-3"
                      onClick={() => handleOAuthBind('google')}
                      disabled={oauthLoading !== null || isLoading}
                    >
                      {oauthLoading === 'google' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                          <path
                            fill="#4285F4"
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          />
                          <path
                            fill="#34A853"
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          />
                          <path
                            fill="#FBBC05"
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          />
                          <path
                            fill="#EA4335"
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          />
                        </svg>
                      )}
                      <span>使用 Google 账号{isRebind ? '换绑' : '绑定'}</span>
                    </Button>

                    {/* Apple OAuth */}
                    <Button
                      variant="outline"
                      className="w-full h-12 gap-3"
                      onClick={() => handleOAuthBind('apple')}
                      disabled={oauthLoading !== null || isLoading}
                    >
                      {oauthLoading === 'apple' ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                        </svg>
                      )}
                      <span>使用 Apple 账号{isRebind ? '换绑' : '绑定'}</span>
                    </Button>

                    {/* Divider */}
                    <div className="relative my-4">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-border" />
                      </div>
                      <div className="relative flex justify-center text-xs">
                        <span className="bg-background px-4 text-muted-foreground">
                          或手动输入邮箱
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Input */}
                {isEmail ? (
                  <Input
                    type="email"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    className="h-12 text-base"
                  />
                ) : (
                  <div className="relative flex items-center h-12 rounded-md border border-input bg-background">
                    <CountryCodeSelector
                      selectedCountry={selectedCountry}
                      onSelect={setSelectedCountry}
                      className="border-0 bg-transparent h-full rounded-l-md hover:bg-muted/50"
                    />
                    <div className="w-px h-6 bg-border" />
                    <input
                      type="tel"
                      placeholder={placeholder}
                      value={value}
                      onChange={(e) => setValue(e.target.value.replace(/\D/g, ''))}
                      className="flex-1 h-full px-3 text-base bg-transparent outline-none placeholder:text-text-placeholder"
                    />
                  </div>
                )}

                <p className="text-xs text-muted-foreground text-center">
                  {isEmail 
                    ? '我们将发送验证码到您的邮箱'
                    : '我们将发送验证码到您的手机'
                  }
                </p>

                <Button
                  className="w-full h-12"
                  onClick={handleSendCode}
                  disabled={isLoading || !value || oauthLoading !== null}
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    '发送验证码'
                  )}
                </Button>
              </motion.div>
            )}

            {/* Step: Verify New Account */}
            {step === 'verification' && (
              <motion.div
                key="verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">验证码已发送至</p>
                  <p className="font-medium text-foreground">
                    {isEmail ? value : `${selectedCountry.dialCode} ${value}`}
                  </p>
                </div>

                <div className="flex justify-center">
                  <InputOTP
                    maxLength={6}
                    value={code}
                    onChange={handleCodeChange}
                    disabled={isLoading}
                  >
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((index) => (
                        <InputOTPSlot
                          key={index}
                          index={index}
                          className={cn(
                            "w-11 h-12 text-lg",
                            codeError && "border-destructive"
                          )}
                        />
                      ))}
                    </InputOTPGroup>
                  </InputOTP>
                </div>

                {codeError && (
                  <p className="text-sm text-destructive text-center">{codeError}</p>
                )}

                <div className="text-center">
                  <button
                    onClick={handleResendCode}
                    disabled={countdown > 0 || isLoading}
                    className={cn(
                      "text-sm",
                      countdown > 0 ? "text-muted-foreground" : "text-primary hover:underline"
                    )}
                  >
                    {countdown > 0 ? `${countdown}s 后重新发送` : '重新发送验证码'}
                  </button>
                </div>
              </motion.div>
            )}

            {/* Step: Success */}
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
                  transition={{ type: "spring", damping: 10 }}
                  className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-4"
                >
                  <CheckCircle2 className="w-10 h-10 text-success" />
                </motion.div>
                <p className="text-lg font-semibold text-foreground">
                  {isRebind ? '换绑成功' : '绑定成功'}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {isEmail ? value : `${selectedCountry.dialCode} ${value}`}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}

export default BindAccountDrawer;
