import { useState, useEffect } from 'react';
import { Phone, Mail, Lock, Smartphone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { ListItem } from '@/components/ui/list-item';
import { useWallet } from '@/contexts/WalletContext';
import { BindAccountDrawer } from '@/components/BindAccountDrawer';
import { ChangePasswordDrawer } from '@/components/ChangePasswordDrawer';
import { toast } from '@/lib/toast';

export default function AccountSecurity() {
  const navigate = useNavigate();
  const { userInfo } = useWallet();

  const [boundEmail, setBoundEmail] = useState<string | null>(userInfo?.email || null);
  const [boundPhone, setBoundPhone] = useState<string | null>(null);
  const [bindDrawerOpen, setBindDrawerOpen] = useState(false);
  const [bindType, setBindType] = useState<'email' | 'phone'>('email');
  const [bindMode, setBindMode] = useState<'bind' | 'rebind'>('bind');
  const [currentBindValue, setCurrentBindValue] = useState<string>('');
  const [passwordDrawerOpen, setPasswordDrawerOpen] = useState(false);
  const [hasExistingPassword, setHasExistingPassword] = useState(false);

  useEffect(() => {
    const savedPassword = localStorage.getItem('user_password');
    if (savedPassword) setHasExistingPassword(true);
    const savedPhone = localStorage.getItem('bound_phone');
    if (savedPhone) setBoundPhone(savedPhone);
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

  const maskPhone = (phone: string) => {
    if (!phone) return '';
    const parts = phone.split(' ');
    if (parts.length < 2) return phone;
    const countryCode = parts[0];
    const number = parts.slice(1).join('');
    if (number.length <= 4) return phone;
    return `${countryCode} ${number.slice(0, 3)}****${number.slice(-4)}`;
  };

  const maskEmail = (email: string) => {
    if (!email) return '';
    const [local, domain] = email.split('@');
    if (!domain || local.length <= 2) return email;
    return `${local.slice(0, 2)}****@${domain}`;
  };

  return (
    <AppLayout title="账户安全" pageBg="bg-page" showBack showNav={false}>
      <div className="px-4 no-card-shadow">
        <div className="mb-[16px] pt-[8px]">
          <div className="bg-[#F7F8FA] rounded-xl overflow-hidden">
            <ListItem
              icon={
                <Phone className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              }
              title="手机号"
              value={boundPhone ? maskPhone(boundPhone) : '未绑定'}
              showChevron
              onClick={() => handleBindAccount('phone')}
              className="py-4 px-4"
            />
            <ListItem
              icon={
                <Mail className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              }
              title="邮箱"
              value={boundEmail ? maskEmail(boundEmail) : '未绑定'}
              showChevron
              onClick={() => handleBindAccount('email')}
              className="py-4 px-4"
            />
            <ListItem
              icon={
                <Lock className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              }
              title="登录密码"
              value={hasExistingPassword ? '已设置' : '未设置'}
              showChevron
              onClick={() => setPasswordDrawerOpen(true)}
              className="py-4 px-4"
            />
          </div>
        </div>

        <div className="mb-[16px]">
          <div className="bg-[#F7F8FA] rounded-xl overflow-hidden">
            <ListItem
              icon={
                <Smartphone className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              }
              title="登录设备"
              showChevron
              onClick={() => navigate('/profile/devices')}
              className="py-4 px-4"
            />
          </div>
        </div>

        <BindAccountDrawer
          open={bindDrawerOpen}
          onOpenChange={setBindDrawerOpen}
          type={bindType}
          mode={bindMode}
          currentValue={currentBindValue}
          onSuccess={handleBindSuccess}
          hasPassword={hasExistingPassword}
        />
        <ChangePasswordDrawer
          open={passwordDrawerOpen}
          onOpenChange={setPasswordDrawerOpen}
          hasExistingPassword={hasExistingPassword}
          onSuccess={handlePasswordSuccess}
          boundEmail={boundEmail}
          boundPhone={boundPhone}
        />

        <div className="h-[72px] shrink-0" />
      </div>
    </AppLayout>
  );
}
