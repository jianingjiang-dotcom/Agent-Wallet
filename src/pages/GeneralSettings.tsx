import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Monitor, Globe, Bell, HelpCircle, Lock, FileText, Info, Shield, Layers } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { AppLayout } from '@/components/layout/AppLayout';
import { ListItem } from '@/components/ui/list-item';
import { SectionHeader } from '@/components/ui/section-header';
import { useLanguage } from '@/contexts/LanguageContext';
import { useWallet } from '@/contexts/WalletContext';
import { LanguageSelectDrawer } from '@/components/LanguageSelectDrawer';
import { AppearanceSelectDrawer } from '@/components/AppearanceSelectDrawer';

function LogoutConfirmDialog({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  const container = document.getElementById('phone-frame-container');
  if (!container) return null;
  return createPortal(
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-card rounded-xl w-[280px] overflow-hidden shadow-xl">
        <div className="px-6 pt-6 pb-4 text-center">
          <p className="text-[16px] font-semibold text-foreground">确认退出</p>
          <p className="text-[14px] text-muted-foreground mt-2">确定要退出当前账户吗？</p>
        </div>
        <div className="flex border-t border-border/60">
          <button onClick={onCancel} className="flex-1 py-3 text-[16px] text-foreground active:bg-muted/50 transition-colors">取消</button>
          <div className="w-px bg-border/60" />
          <button onClick={onConfirm} className="flex-1 py-3 text-[16px] text-destructive font-medium active:bg-muted/50 transition-colors">退出</button>
        </div>
      </div>
    </div>,
    container
  );
}

export default function GeneralSettings() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { language, getLabel } = useLanguage();
  const { logout } = useWallet();

  const [languageDrawerOpen, setLanguageDrawerOpen] = useState(false);
  const [appearanceDrawerOpen, setAppearanceDrawerOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);

  const appearanceLabel: Record<string, string> = {
    light: '浅色模式',
    dark: '深色模式',
    system: '跟随系统',
  };

  return (
    <AppLayout title="通用设置" pageBg="bg-page" showBack showNav={false}>
      <div className="px-4 pt-2 no-card-shadow flex flex-col min-h-full">

        {/* 账户安全 */}
        <div className="mb-[16px]">
          <div className="bg-[#F7F8FA] rounded-xl overflow-hidden">
            <ListItem
              icon={
                <Shield className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              }
              title="账户安全"
              showChevron
              onClick={() => navigate('/profile/account-security')}
              className="py-4 px-4"
            />
          </div>
        </div>

        {/* 偏好设置 */}
        <div className="mb-[16px]">
          <div className="bg-[#F7F8FA] rounded-xl overflow-hidden">
            <ListItem
              icon={
                <Bell className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              }
              title="通知"
              showChevron
              onClick={() => navigate('/profile/notifications')}
              className="py-4 px-4"
            />
            <ListItem
              icon={
                <Globe className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              }
              title="语言"
              value={getLabel(language)}
              showChevron
              onClick={() => setLanguageDrawerOpen(true)}
              className="py-4 px-4"
            />
            <ListItem
              icon={
                <Monitor className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              }
              title="外观"
              value={appearanceLabel[theme ?? 'system'] ?? '跟随系统'}
              showChevron
              onClick={() => setAppearanceDrawerOpen(true)}
              className="py-4 px-4"
            />
          </div>
        </div>

        {/* 帮助与关于 */}
        <div className="mb-[16px]">
          <div className="bg-[#F7F8FA] rounded-xl overflow-hidden">
            <ListItem
              icon={
                <HelpCircle className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              }
              title="帮助与支持"
              showChevron
              onClick={() => navigate('/profile/help')}
              className="py-4 px-4"
            />
            <ListItem
              icon={
                <FileText className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              }
              title="用户协议"
              showChevron
              onClick={() => navigate('/terms')}
              className="py-4 px-4"
            />
            <ListItem
              icon={
                <Lock className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              }
              title="隐私政策"
              showChevron
              onClick={() => navigate('/privacy')}
              className="py-4 px-4"
            />
            <ListItem
              icon={
                <Info className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              }
              title="关于我们"
              showChevron
              onClick={() => navigate('/about')}
              className="py-4 px-4"
            />
          </div>
        </div>

        <LanguageSelectDrawer
          open={languageDrawerOpen}
          onOpenChange={setLanguageDrawerOpen}
        />
        <AppearanceSelectDrawer
          open={appearanceDrawerOpen}
          onOpenChange={setAppearanceDrawerOpen}
        />
        {/* 组件 Demo */}
        <div className="mb-0">
          <div className="bg-[#F7F8FA] rounded-xl overflow-hidden">
            <ListItem
              icon={<Layers className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />}
              title="组件 Demo（仅Dev展示）"
              showChevron
              onClick={() => navigate('/component-demo')}
              className="py-4 px-4"
            />
          </div>
        </div>

        {/* 退出登录 */}
        <div className="mt-[16px]">
          <button
            onClick={() => setLogoutDialogOpen(true)}
            className="w-full bg-[#F7F8FA] rounded-xl p-4 flex items-center justify-center"
            style={{ color: '#000000' }}
          >
            <span className="text-[14px] leading-5 font-normal">退出登录</span>
          </button>
        </div>

        <LogoutConfirmDialog
          open={logoutDialogOpen}
          onCancel={() => setLogoutDialogOpen(false)}
          onConfirm={() => { setLogoutDialogOpen(false); logout(); navigate('/'); }}
        />

        {/* 版本号 */}
        <div className="flex-1" />
      </div>
    </AppLayout>
  );
}
