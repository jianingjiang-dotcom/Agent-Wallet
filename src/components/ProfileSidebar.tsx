import { ReactNode, useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, X, ChevronRight, Bot, Settings2, BarChart3, FileText,
  Wallet, BookUser, Shield
} from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListItem } from '@/components/ui/list-item';
import { SectionHeader } from '@/components/ui/section-header';

interface ProfileSidebarProps {
  children: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileSidebar({ children, open, onOpenChange }: ProfileSidebarProps) {
  const navigate = useNavigate();
  const { userInfo } = useWallet();

  const sidebarNavigate = useCallback((path: string) => {
    onOpenChange(false);
    // Small delay to let animation finish before navigating
    setTimeout(() => navigate(path), 200);
  }, [navigate, onOpenChange]);

  return (
    <div className="h-full relative overflow-hidden">
      {/* Push container: main content + sidebar side by side */}
      <div
        className="flex h-full transition-transform duration-300 ease-in-out"
        style={{ transform: open ? 'translateX(-75%)' : 'translateX(0)' }}
      >
        {/* Main content area - full width */}
        <div className="w-full h-full shrink-0 relative">
          {/* Overlay on main content - fades in as sidebar opens */}
          <div
            className="absolute inset-0 z-30 bg-black pointer-events-none transition-opacity duration-300 ease-in-out"
            style={{ opacity: open ? 0.5 : 0 }}
          />
          {children}
        </div>

        {/* Sidebar panel - 75% width, positioned right after main content */}
        <div className="w-[75%] h-full shrink-0 bg-page flex flex-col">
          <div className="flex-1 overflow-y-auto px-4 pb-8 no-card-shadow">
            {/* Settings & Close */}
            <div className="flex items-center justify-between h-[54px]">
              <button
                onClick={() => sidebarNavigate('/profile/general')}
                className="flex items-center gap-1 px-3 h-9 rounded-full text-[14px] leading-5 font-normal text-foreground bg-background card-elevated"
              >
                <Settings className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
                设置
              </button>
              <button
                onClick={() => onOpenChange(false)}
                className="flex items-center justify-center w-9 h-9 rounded-full bg-background card-elevated"
              >
                <X className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
              </button>
            </div>
            {/* Profile Card */}
            <button
              onClick={() => sidebarNavigate('/profile/info/edit')}
              className="mt-2 w-full flex items-center gap-3 p-3 mb-4 card-elevated cursor-pointer"
            >
              <Avatar className="w-14 h-14 shrink-0">
                <AvatarImage src={userInfo?.avatar} alt="User avatar" />
                <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-xl font-semibold">
                  {(userInfo?.nickname || userInfo?.email?.split('@')[0] || 'U')[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0 text-left">
                <h2 className="text-[18px] leading-7 font-bold text-foreground">
                  {userInfo?.nickname || userInfo?.email?.split('@')[0] || '用户'}
                </h2>
                <p className="text-xs text-muted-foreground">编辑个人信息</p>
              </div>
              <ChevronRight className="w-5 h-5 shrink-0" strokeWidth={1} style={{ color: '#000000' }} />
            </button>

            {/* Agent 管理 */}
            <div className="mb-4">
              <SectionHeader title="Agent 管理" />
              <div className="card-elevated overflow-hidden">
                {[
                  { icon: Bot, label: 'Agent 授权管理', path: '/agent-management' },
                  { icon: Settings2, label: 'Agent 风控管理', path: '/agent-settings' },
                  { icon: BarChart3, label: '结算对账', path: '/settlement-dashboard' },
                  { icon: FileText, label: '审计日志', path: '/audit-log' },
                ].map((item, index, arr) => (
                  <ListItem
                    key={item.label}
                    icon={<item.icon className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />}
                    title={item.label}
                    showChevron
                    showDivider={index !== arr.length - 1}
                    onClick={() => sidebarNavigate(item.path)}
                    className="py-4 px-4"
                  />
                ))}
              </div>
            </div>

            {/* 钱包管理 */}
            <div className="mb-4">
              <SectionHeader title="钱包管理" />
              <div className="card-elevated overflow-hidden">
                {[
                  { icon: Wallet, label: '钱包管理', path: '/profile/wallets' },
                  { icon: BookUser, label: '地址簿', path: '/profile/contacts' },
                  { icon: Shield, label: '钱包安全', path: '/profile/security' },
                ].map((item, index, arr) => (
                  <ListItem
                    key={item.label}
                    icon={<item.icon className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />}
                    title={item.label}
                    showChevron
                    showDivider={index !== arr.length - 1}
                    onClick={() => sidebarNavigate(item.path)}
                    className="py-4 px-4"
                  />
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Tap overlay to close sidebar - covers the visible main content area */}
      {open && (
        <div
          className="absolute inset-0 z-40"
          onClick={() => onOpenChange(false)}
          style={{ width: '25%' }}
        />
      )}
    </div>
  );
}
