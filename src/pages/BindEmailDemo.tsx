import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, CheckCircle2, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { BindAccountDrawer } from '@/components/BindAccountDrawer';

// Helper function to mask email
const maskEmail = (email: string) => {
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local}****@${domain}`;
  }
  return `${local.slice(0, 2)}****@${domain}`;
};

// Helper function to mask phone
const maskPhone = (phone: string) => {
  // Format: +86 138****8888
  const parts = phone.split(' ');
  if (parts.length >= 2) {
    const dialCode = parts[0];
    const number = parts.slice(1).join('');
    if (number.length >= 8) {
      return `${dialCode} ${number.slice(0, 3)}****${number.slice(-4)}`;
    }
  }
  return phone;
};

type BindType = 'email' | 'phone';
type BindMode = 'bind' | 'rebind';

export default function BindEmailDemo() {
  const navigate = useNavigate();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerType, setDrawerType] = useState<BindType>('email');
  const [drawerMode, setDrawerMode] = useState<BindMode>('bind');
  const [boundEmail, setBoundEmail] = useState<string | null>(null);
  const [boundPhone, setBoundPhone] = useState<string | null>(null);
  
  // Check if user has password set
  const hasPassword = Boolean(localStorage.getItem('user_password'));

  const handleOpenDrawer = (type: BindType, mode: BindMode) => {
    setDrawerType(type);
    setDrawerMode(mode);
    setDrawerOpen(true);
  };

  const handleBindSuccess = (value: string) => {
    if (drawerType === 'email') {
      setBoundEmail(value);
    } else {
      setBoundPhone(value);
    }
  };

  const handleReset = () => {
    setBoundEmail(null);
    setBoundPhone(null);
  };

  const getCurrentValue = () => {
    if (drawerType === 'email' && boundEmail) {
      return maskEmail(boundEmail);
    }
    if (drawerType === 'phone' && boundPhone) {
      return maskPhone(boundPhone);
    }
    return '';
  };

  return (
    <AppLayout showNav={false} showBack title="账号绑定演示">

      {/* Content */}
      <div className="flex-1 px-4 pb-12 space-y-4">
        {/* Email Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Mail className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">邮箱</p>
              {boundEmail ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  <p className="text-sm text-muted-foreground truncate">
                    {maskEmail(boundEmail)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">未绑定</p>
              )}
            </div>
            <Button
              variant={boundEmail ? "outline" : "default"}
              size="sm"
              onClick={() => handleOpenDrawer('email', boundEmail ? 'rebind' : 'bind')}
              className="gap-1"
            >
              {boundEmail ? '换绑' : '绑定'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Phone Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Phone className="w-6 h-6 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground">手机号</p>
              {boundPhone ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-success flex-shrink-0" />
                  <p className="text-sm text-muted-foreground truncate">
                    {maskPhone(boundPhone)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">未绑定</p>
              )}
            </div>
            <Button
              variant={boundPhone ? "outline" : "default"}
              size="sm"
              onClick={() => handleOpenDrawer('phone', boundPhone ? 'rebind' : 'bind')}
              className="gap-1"
            >
              {boundPhone ? '换绑' : '绑定'}
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </motion.div>

        {/* Reset Button */}
        {(boundEmail || boundPhone) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={handleReset}
            >
              重置所有绑定
            </Button>
          </motion.div>
        )}

        {/* Tips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 rounded-xl bg-muted/50"
        >
          <p className="text-xs text-muted-foreground text-center">
            提示：演示模式下，任意6位数字验证码均可通过验证
          </p>
        </motion.div>

        {/* Flow Description */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          <h3 className="text-sm font-medium text-foreground">流程说明</h3>
          
          <div className="space-y-2">
            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs font-medium text-primary">
                1
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">首次绑定</p>
                <p className="text-xs text-muted-foreground">
                  输入账号 → 验证码验证 → 绑定成功
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
              <div className="w-6 h-6 rounded-full bg-warning/20 flex items-center justify-center flex-shrink-0 text-xs font-medium text-warning">
                2
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">换绑流程</p>
                <p className="text-xs text-muted-foreground">
                  验证原账号 → 输入新账号 → 验证新账号 → 换绑成功
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Bind Account Drawer */}
      <BindAccountDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        type={drawerType}
        mode={drawerMode}
        currentValue={getCurrentValue()}
        onSuccess={handleBindSuccess}
        hasPassword={hasPassword}
      />
    </AppLayout>
  );
}
