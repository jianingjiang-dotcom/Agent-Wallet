import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Monitor, Globe, ChevronRight,
  Settings2, BarChart3, Bot, FileText,
  Wallet, BookUser, Shield, Bell, HelpCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListItem } from '@/components/ui/list-item';
import { SectionHeader } from '@/components/ui/section-header';
import { useWallet } from '@/contexts/WalletContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { LanguageSelectDrawer } from '@/components/LanguageSelectDrawer';
import { AppearanceSelectDrawer } from '@/components/AppearanceSelectDrawer';
import { cn } from '@/lib/utils';

const menuGroups = [
  {
    title: 'Agent 管理',
    icon: Bot,
    iconGradient: 'icon-gradient-primary',
    items: [
      { icon: Bot, label: 'Agent 授权管理', path: '/agent-management' },
      { icon: Settings2, label: 'Agent 风控管理', path: '/agent-settings' },
      { icon: BarChart3, label: '结算对账', path: '/settlement-dashboard' },
      { icon: FileText, label: '审计日志', path: '/audit-log' },
    ],
  },
  {
    title: '钱包管理',
    icon: Wallet,
    iconGradient: 'icon-gradient-success',
    items: [
      { icon: Wallet, label: '钱包管理', path: '/profile/wallets' },
      { icon: BookUser, label: '地址簿', path: '/profile/contacts' },
      { icon: Shield, label: '钱包安全', path: '/profile/security' },
    ],
  },
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const { userInfo } = useWallet();
  const displayName = userInfo?.nickname || userInfo?.email?.split('@')[0] || '用户';
  const { theme } = useTheme();
  const { language, getLabel } = useLanguage();
  const [languageDrawerOpen, setLanguageDrawerOpen] = useState(false);
  const [appearanceDrawerOpen, setAppearanceDrawerOpen] = useState(false);

  const appearanceLabel: Record<string, string> = {
    light: '浅色模式',
    dark: '深色模式',
    system: '跟随系统',
  };

  return (
    <AppLayout title="我的" pageBg="bg-page">
      <div className="px-4 no-card-shadow">

        {/* Profile Header - User Info */}
        <div className="card-elevated overflow-hidden mb-6">
          <motion.button
            onClick={() => navigate('/profile/info')}
            className="w-full flex items-center gap-4 p-4"
            whileTap={{ scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Avatar className="relative w-12 h-12">
              <AvatarImage src={userInfo?.avatar} alt="User avatar" />
              <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-lg font-semibold">
                {displayName[0]?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <h2 className="text-base font-bold text-foreground">{displayName}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">账户管理、安全设置</p>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1} />
          </motion.button>
        </div>

        {/* Grouped Menu Sections */}
        {menuGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.title} className="mb-6">
              <SectionHeader icon={GroupIcon} title={group.title} />
              <div className="card-elevated overflow-hidden">
                {group.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <ListItem
                      key={`${group.title}-${item.label}`}
                      icon={
                        <div className={cn("w-[30px] h-[30px] rounded-full flex items-center justify-center", group.iconGradient)}>
                          <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
                        </div>
                      }
                      title={item.label}
                      showChevron
                      showDivider={index !== group.items.length - 1}
                      onClick={() => navigate(item.path)}
                      className="p-4"
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* 偏好设置 */}
        <div className="mb-6">
          <div className="card-elevated overflow-hidden">
            <ListItem
              icon={
                <div className="w-[30px] h-[30px] rounded-full icon-gradient-purple flex items-center justify-center">
                  <Bell className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
              }
              title="通知"
              showChevron
              showDivider
              onClick={() => navigate('/profile/notifications')}
              className="p-4"
            />
            <ListItem
              icon={
                <div className="w-[30px] h-[30px] rounded-full icon-gradient-purple flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
              }
              title="语言"
              value={getLabel(language)}
              showChevron
              showDivider
              onClick={() => setLanguageDrawerOpen(true)}
              className="p-4"
            />
            <ListItem
              icon={
                <div className="w-[30px] h-[30px] rounded-full icon-gradient-purple flex items-center justify-center">
                  <Monitor className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
              }
              title="外观"
              value={appearanceLabel[theme ?? 'system'] ?? '跟随系统'}
              showChevron
              onClick={() => setAppearanceDrawerOpen(true)}
              className="p-4"
            />
          </div>
        </div>

        {/* 帮助与支持 */}
        <div className="mb-0">
          <div className="card-elevated overflow-hidden">
            <ListItem
              icon={
                <div className="w-[30px] h-[30px] rounded-full icon-gradient-warning flex items-center justify-center">
                  <HelpCircle className="w-3.5 h-3.5" strokeWidth={1.5} />
                </div>
              }
              title="帮助与支持"
              showChevron
              onClick={() => navigate('/profile/help')}
              className="p-4"
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

        <div className="h-6 shrink-0" />
      </div>
    </AppLayout>
  );
}
