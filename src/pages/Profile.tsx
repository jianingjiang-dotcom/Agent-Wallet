import { motion } from 'framer-motion';
import {
  Settings2, BarChart3, Bot, FileText,
  Wallet, BookUser, Shield, Settings
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListItem } from '@/components/ui/list-item';
import { useWallet } from '@/contexts/WalletContext';
import { SectionHeader } from '@/components/ui/section-header';
import { cn } from '@/lib/utils';

const menuGroups = [
  {
    title: 'Agent 管理',
    icon: Bot,
    iconColor: 'text-primary',
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
    iconColor: 'text-success',
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

  return (
    <AppLayout showNav pageBg="bg-page">
      <div className="px-4 no-card-shadow">

        {/* Profile Header - 无卡片，直接置于页面背景 */}
        <div className="flex items-center gap-3 py-6">
          <Avatar className="relative w-14 h-14 shrink-0">
            <AvatarImage src={userInfo?.avatar} alt="User avatar" />
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-xl font-semibold">
              {displayName[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] leading-7 font-bold text-foreground">{displayName}</h2>
            {userInfo?.uid && (
              <p className="text-xs text-muted-foreground">{userInfo.uid}</p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => navigate('/profile/info/edit')}
              className="flex items-center px-3 h-9 rounded-full text-[14px] leading-5 font-normal text-foreground bg-background card-elevated"
            >
              编辑资料
            </button>
            <button
              onClick={() => navigate('/profile/general')}
              className="flex items-center justify-center w-9 h-9 rounded-full bg-background card-elevated"
            >
              <Settings className="w-5 h-5" style={{ color: '#000000' }} strokeWidth={1.5} />
            </button>
          </div>
        </div>

        {/* Grouped Menu Sections */}
        {menuGroups.map((group) => {
          const GroupIcon = group.icon;
          return (
            <div key={group.title} className="mb-6">
              <SectionHeader title={group.title} />
              <div className="card-elevated overflow-hidden">
                {group.items.map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <ListItem
                      key={`${group.title}-${item.label}`}
                      icon={
                        <Icon className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
                      }
                      title={item.label}
                      showChevron
                      showDivider={index !== group.items.length - 1}
                      onClick={() => navigate(item.path)}
                      className="py-4 px-4"
                    />
                  );
                })}
              </div>
            </div>
          );
        })}

        <div className="h-6 shrink-0" />
      </div>
    </AppLayout>
  );
}
