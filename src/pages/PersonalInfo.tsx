import { useState, useEffect } from 'react';
import { Smartphone, ChevronRight, User, Phone, Mail, Lock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/lib/toast';
import { BindAccountDrawer } from '@/components/BindAccountDrawer';
import { ChangePasswordDrawer } from '@/components/ChangePasswordDrawer';

export default function PersonalInfo() {
  const navigate = useNavigate();
  const { userInfo, logout } = useWallet();

  const initialNickname = userInfo?.email?.split('@')[0] || '';
  const [nickname, setNickname] = useState(initialNickname);

  // Bound accounts
  const [boundEmail, setBoundEmail] = useState<string | null>(userInfo?.email || null);
  const [boundPhone, setBoundPhone] = useState<string | null>(null);

  // Bind drawer state
  const [bindDrawerOpen, setBindDrawerOpen] = useState(false);
  const [bindType, setBindType] = useState<'email' | 'phone'>('email');
  const [bindMode, setBindMode] = useState<'bind' | 'rebind'>('bind');
  const [currentBindValue, setCurrentBindValue] = useState<string>('');

  // Password drawer state
  const [passwordDrawerOpen, setPasswordDrawerOpen] = useState(false);
  const [hasExistingPassword, setHasExistingPassword] = useState(false);

  const userId = 'UID-2024-XXXX-XXXX';

  // Check if password exists on mount
  useEffect(() => {
    const savedPassword = localStorage.getItem('user_password');
    if (savedPassword) {
      setHasExistingPassword(true);
    }
    // Load bound phone from localStorage
    const savedPhone = localStorage.getItem('bound_phone');
    if (savedPhone) {
      setBoundPhone(savedPhone);
    }
  }, []);

  const handleBindAccount = (type: 'email' | 'phone') => {
    const isBound = type === 'email' ? boundEmail : boundPhone;
    setBindType(type);
    setBindMode(isBound ? 'rebind' : 'bind');
    setCurrentBindValue(isBound || '');
    setBindDrawerOpen(true);
  };

  const handleBindSuccess = (value: string) => {
    if (bindType === 'email') {
      setBoundEmail(value);
      toast.success('邮箱绑定成功');
    } else {
      setBoundPhone(value);
      localStorage.setItem('bound_phone', value);
      toast.success('手机号绑定成功');
    }
  };

  const handlePasswordSuccess = () => {
    setHasExistingPassword(true);
    toast.success('密码设置成功');
  };

  // Mask phone number for display
  const maskPhone = (phone: string) => {
    if (!phone) return '';
    const parts = phone.split(' ');
    if (parts.length < 2) return phone;
    const countryCode = parts[0];
    const number = parts.slice(1).join('');
    if (number.length <= 4) return phone;
    return `${countryCode} ${number.slice(0, 3)}****${number.slice(-4)}`;
  };

  // Mask email for display
  const maskEmail = (email: string) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain || local.length <= 2) return email;
    return `${local.slice(0, 2)}****@${domain}`;
  };

  return (
    <AppLayout showNav={false} showBack title="账户管理" pageBg="bg-page">
      <div className="min-h-full flex flex-col bg-page">

        <div className="flex-1 px-4 pb-8 overflow-auto no-card-shadow">
          {/* Avatar Section */}
          <div className="w-full flex flex-col items-center pt-4 pb-6">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={userInfo?.avatar} alt="User avatar" />
                <AvatarFallback className="bg-accent/20 text-accent text-2xl font-semibold">
                  {nickname[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            </div>
            <p className="text-[18px] font-semibold text-foreground mt-3">{nickname || '未设置昵称'}</p>
            <p className="mt-1 text-xs text-muted-foreground">{userId}</p>
          </div>

          {/* Menu Card */}
          <div className="card-elevated overflow-hidden">
            {/* 个人信息 */}
            <button onClick={() => navigate('/profile/info/edit')} className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 active:bg-muted/50 transition-colors">
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 icon-gradient-warning">
                <User className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-foreground flex-1 text-left">个人信息</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" strokeWidth={1} />
            </button>

            {/* 手机号 */}
            <button onClick={() => handleBindAccount('phone')} className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 active:bg-muted/50 transition-colors">
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 icon-gradient-warning">
                <Phone className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-foreground flex-1 text-left">手机号</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">{boundPhone ? maskPhone(boundPhone) : '未绑定'}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" strokeWidth={1} />
              </div>
            </button>

            {/* 邮箱 */}
            <button onClick={() => handleBindAccount('email')} className="w-full flex items-center gap-3 px-4 py-3 border-b border-border/50 active:bg-muted/50 transition-colors">
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 icon-gradient-warning">
                <Mail className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-foreground flex-1 text-left">邮箱</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">{boundEmail ? maskEmail(boundEmail) : '未绑定'}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" strokeWidth={1} />
              </div>
            </button>

            {/* 登录密码 */}
            <button onClick={() => setPasswordDrawerOpen(true)} className="w-full flex items-center gap-3 px-4 py-3 active:bg-muted/50 transition-colors">
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 icon-gradient-warning">
                <Lock className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-foreground flex-1 text-left">登录密码</span>
              <div className="flex items-center gap-1">
                <span className="text-sm text-muted-foreground">{hasExistingPassword ? '已设置' : '未设置'}</span>
                <ChevronRight className="w-5 h-5 text-muted-foreground" strokeWidth={1} />
              </div>
            </button>
          </div>

          {/* 登录设备 */}
          <div className="mt-6">
            <button
              onClick={() => navigate('/profile/devices')}
              className="w-full card-elevated px-4 py-3 flex items-center gap-3"
            >
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 icon-gradient-warning">
                <Smartphone className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium flex-1 text-left">登录设备</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" strokeWidth={1} />
            </button>
          </div>

          {/* 退出登录 */}
          <div className="mt-6">
            <button
              onClick={() => { logout(); navigate('/'); }}
              className="w-full card-elevated p-4 flex items-center justify-center text-destructive"
            >
              <span className="text-sm font-medium">退出登录</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bind Account Drawer */}
      <BindAccountDrawer
        open={bindDrawerOpen}
        onOpenChange={setBindDrawerOpen}
        type={bindType}
        mode={bindMode}
        currentValue={currentBindValue}
        onSuccess={handleBindSuccess}
        hasPassword={hasExistingPassword}
      />

      {/* Change Password Drawer */}
      <ChangePasswordDrawer
        open={passwordDrawerOpen}
        onOpenChange={setPasswordDrawerOpen}
        hasExistingPassword={hasExistingPassword}
        onSuccess={handlePasswordSuccess}
        boundEmail={boundEmail}
        boundPhone={boundPhone}
      />
    </AppLayout>
  );
}
