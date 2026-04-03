import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, HelpCircle, Copy, AlertTriangle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AppLayout } from '@/components/layout/AppLayout';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/lib/toast';
import CoboLogo from '@/assets/cobo-logo.svg';

export default function ClaimIntro() {
  const navigate = useNavigate();
  const { validateClaimCode } = useWallet();
  const [code, setCode] = useState('');
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState('');
  const [showHelp, setShowHelp] = useState(false);

  const handleValidate = async () => {
    if (code.length !== 8) {
      setError('请输入完整的 8 位配对口令');
      return;
    }
    setIsValidating(true);
    setError('');
    try {
      const info = await validateClaimCode(code);
      // Navigate to claim flow starting at step 2 (confirm), passing claim info
      navigate('/claim-wallet', { state: { claimInfo: info } });
    } catch (e: any) {
      setError(e.message || '配对口令验证失败');
    } finally {
      setIsValidating(false);
    }
  };

  // Auto-submit when 8 digits are entered
  const handleCodeChange = (value: string) => {
    setCode(value);
    setError('');
  };

  return (
    <AppLayout showNav={false} showSecurityBanner={false}>
      <div className="h-full flex flex-col px-6">
        {/* Top section */}
        <div className="flex-1 flex flex-col pt-[25%]">
          {/* Brand + Welcome */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="flex items-center gap-3 mb-3"
          >
            <h1 className="text-2xl font-bold text-foreground">欢迎使用</h1>
            <div className="flex items-center gap-2">
              <img src={CoboLogo} alt="Cobo" className="h-5" />
              <span className="text-xs font-bold text-foreground tracking-wide leading-none">AGENTIC<br />WALLET</span>
            </div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
            className="text-muted-foreground text-sm mb-10 leading-relaxed"
          >
            输入配对口令，接管您的加密钱包
          </motion.p>

          {/* OTP Input */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex flex-col items-center"
          >
            <InputOTP
              maxLength={8}
              value={code}
              onChange={handleCodeChange}
              disabled={isValidating}
            >
              <InputOTPGroup className="gap-2">
                {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
                  <InputOTPSlot
                    key={index}
                    index={index}
                    className="w-10 h-12 rounded-lg border border-border text-lg font-semibold"
                  />
                ))}
              </InputOTPGroup>
            </InputOTP>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-1.5 text-destructive text-xs mt-3"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                {error}
              </motion.div>
            )}

            {/* Help section — below OTP input */}
            <div className="mt-4 w-full flex flex-col items-center">
              <button
                className="inline-flex items-center gap-1 text-xs text-primary py-1"
                onClick={() => setShowHelp(!showHelp)}
              >
                <HelpCircle className="w-3.5 h-3.5" />
                还没有配对口令？
                <motion.div animate={{ rotate: showHelp ? 180 : 0 }} transition={{ duration: 0.2 }}>
                  <ChevronDown className="w-3.5 h-3.5" />
                </motion.div>
              </button>
              <AnimatePresence>
                {showHelp && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 p-3 bg-muted/50 rounded-xl text-xs leading-relaxed space-y-2 text-left">
                      <p className="font-medium text-foreground">在 Agent 环境执行以下指令</p>
                      <div className="relative">
                        <pre className="bg-background rounded-lg p-2.5 pr-9 text-[11px] font-mono text-foreground overflow-x-auto whitespace-pre-wrap break-all leading-relaxed">npx skills add cobosteven/cobo-agent-wallet-manual --skill cobo-agentic-wallet-sandbox --yes --global</pre>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText('npx skills add cobosteven/cobo-agent-wallet-manual --skill cobo-agentic-wallet-sandbox --yes --global');
                            toast.success('已复制');
                          }}
                          className="absolute right-1.5 top-1.5 p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>

        {/* Bottom */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="pb-8 space-y-3"
        >
          <Button
            size="lg"
            className="w-full text-base gradient-primary"
            onClick={handleValidate}
            disabled={code.length !== 8 || isValidating}
          >
            {isValidating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />验证中...</>
            ) : '开始配对'}
          </Button>

          <button
            className="w-full text-center text-sm text-muted-foreground py-2"
            onClick={() => navigate('/home')}
          >
            先看看
          </button>
        </motion.div>
      </div>
    </AppLayout>
  );
}
