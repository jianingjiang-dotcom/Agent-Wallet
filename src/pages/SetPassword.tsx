import { useState } from 'react';
import { motion } from 'framer-motion';
import { Lock, Eye, EyeOff, CheckCircle2, Loader2, Wallet, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';

type PasswordStrength = 'weak' | 'medium' | 'strong';

const getPasswordStrength = (password: string): PasswordStrength => {
  if (!password) return 'weak';
  
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;
  
  if (score >= 4) return 'strong';
  if (score >= 2) return 'medium';
  return 'weak';
};

const strengthConfig = {
  weak: { label: '弱', color: 'bg-destructive', segments: 1 },
  medium: { label: '中', color: 'bg-warning', segments: 2 },
  strong: { label: '强', color: 'bg-success', segments: 3 },
};

export default function SetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isOnboardingFlow = searchParams.get('onboarding') === 'true';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');

  const strength = getPasswordStrength(password);
  const strengthInfo = strengthConfig[strength];
  
  const isValid = password.length >= 8 && password === confirmPassword;

  const handleSetPassword = async () => {
    if (!isValid) {
      if (password.length < 8) {
        setError('密码长度至少为8位');
      } else if (password !== confirmPassword) {
        setError('两次输入的密码不一致');
      }
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      // Simulate API call to set password
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Save password status to localStorage (mock)
      localStorage.setItem('user_password_set', 'true');
      
      setIsSuccess(true);
      
      // Non-onboarding flow: auto navigate back after success
      if (!isOnboardingFlow) {
        setTimeout(() => {
          navigate(-1);
        }, 1500);
      }
      // Onboarding flow: user clicks button to continue
    } catch (err) {
      setError('设置密码失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    navigate('/claim-intro');
  };

  const handleBack = () => {
    if (isOnboardingFlow) {
      // In onboarding flow, go back to login page
      navigate('/login');
    } else {
      navigate(-1);
    }
  };

  const handleContinueToOnboarding = () => {
    navigate('/claim-intro');
  };

  // Success state - Show welcome guidance for onboarding flow
  if (isSuccess) {
    return (
      <AppLayout showNav={false} showSecurityBanner={false}>
        <div className="h-full flex flex-col">
          {isOnboardingFlow ? (
            // Onboarding flow: Show wallet creation guidance
            <>
              <div className="flex-1 flex flex-col items-center justify-center px-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-8"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: "spring" }}
                  >
                    <Wallet className="w-10 h-10 text-primary" strokeWidth={1.5} />
                  </motion.div>
                </motion.div>
                
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-2xl font-bold text-foreground mb-3 text-center"
                >
                  欢迎加入 Cobo
                </motion.h2>
                
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="text-muted-foreground text-center mb-2"
                >
                  接下来认领您的钱包
                </motion.p>

                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="text-sm text-muted-foreground/70 text-center"
                >
                  您的 AI Agent 已为您创建好钱包，输入配对口令即可接管
                </motion.p>
              </div>
              
              {/* Fixed Bottom Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="px-4 pb-8"
              >
                <Button
                  variant="default"
                  size="lg"
                  className="w-full h-12 text-base font-medium"
                  onClick={handleContinueToOnboarding}
                >
                  继续
                  <ArrowRight className="w-5 h-5 ml-2" strokeWidth={1.5} />
                </Button>
              </motion.div>
            </>
          ) : (
            // Non-onboarding flow: Show simple success - centered
            <div className="flex-1 flex flex-col items-center justify-center px-4">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.5 }}
                className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                >
                  <CheckCircle2 className="w-10 h-10 text-success" strokeWidth={1.5} />
                </motion.div>
              </motion.div>
              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-semibold text-foreground mb-2"
              >
                密码设置成功
              </motion.h2>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-muted-foreground text-center"
              >
                正在返回...
              </motion.p>
            </div>
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNav={false} showBack onBack={handleBack} showSecurityBanner={false}>

      {/* Scrollable Content */}
      <div className="flex-1 px-4 overflow-y-auto">
        {/* Icon */}
        <div className="flex justify-center mb-6 mt-8">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.5 }}
            className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center"
          >
            <motion.div
              animate={{ rotate: [0, -10, 10, 0] }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Lock className="w-10 h-10 text-primary" strokeWidth={1.5} />
            </motion.div>
          </motion.div>
        </div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8 text-center"
        >
          <h1 className="text-2xl font-bold text-foreground mb-2">设置登录密码</h1>
          <p className="text-muted-foreground">为您的账户设置一个安全密码</p>
        </motion.div>

        {/* Password Input */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4"
        >
          {/* New Password */}
          <div className="relative">
            <Input
              type={showPassword ? 'text' : 'password'}
              placeholder="请输入新密码"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              className="h-12 text-base pr-12"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors"
            >
              {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
            </button>
          </div>

          {/* Password Strength Indicator */}
          {password && (
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
                      className={cn(
                        "h-1.5 flex-1 rounded-full transition-colors",
                        segment <= strengthInfo.segments
                          ? strengthInfo.color
                          : "bg-muted"
                      )}
                    />
                  ))}
                </div>
                <span className={cn(
                  "text-sm font-medium",
                  strength === 'weak' && "text-destructive",
                  strength === 'medium' && "text-warning",
                  strength === 'strong' && "text-success"
                )}>
                  {strengthInfo.label}
                </span>
              </div>
            </motion.div>
          )}

          {/* Confirm Password */}
          <div className="relative">
            <Input
              type={showConfirmPassword ? 'text' : 'password'}
              placeholder="确认密码"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              className="h-12 text-base pr-12"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors"
            >
              {showConfirmPassword ? <EyeOff className="w-5 h-5" strokeWidth={1.5} /> : <Eye className="w-5 h-5" strokeWidth={1.5} />}
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-sm text-destructive text-center"
            >
              {error}
            </motion.p>
          )}
        </motion.div>
      </div>

      {/* Fixed Bottom Buttons */}
      <div className="px-4 pb-8 pt-4 space-y-3">
        <Button
          variant="default"
          size="lg"
          className="w-full h-12 text-base font-medium"
          onClick={handleSetPassword}
          disabled={isLoading || !password || !confirmPassword}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 mr-2 animate-spin" strokeWidth={1.5} />
          ) : null}
          设置密码
        </Button>

        {/* Only show skip button when NOT in onboarding flow */}
        {!isOnboardingFlow && (
          <Button
            variant="ghost"
            size="lg"
            className="w-full h-12 text-base text-muted-foreground"
            onClick={handleSkip}
            disabled={isLoading}
          >
            稍后设置
          </Button>
        )}
      </div>
    </AppLayout>
  );
}
