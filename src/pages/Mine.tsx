import { useNavigate } from 'react-router-dom';
import {
  Settings, Bot, Settings2, FileText,
  Wallet, BookUser, Shield, ClipboardCheck, ChevronRight, KeyRound
} from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ListItem } from '@/components/ui/list-item';
import { SectionHeader } from '@/components/ui/section-header';
import { useWallet } from '@/contexts/WalletContext';
import { useT } from '@/lib/i18n';

export default function Mine() {
  const navigate = useNavigate();
  const t = useT();
  const { userInfo } = useWallet();
  const displayName = userInfo?.nickname || userInfo?.email?.split('@')[0] || '用户';

  return (
    <AppLayout
      showNav
      pageBg="bg-page"
      title={t.mine.title}
      rightAction={
        <motion.button
          onClick={() => navigate('/profile/general')}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Settings className="w-6 h-6" strokeWidth={1.5} style={{ color: '#000000' }} />
        </motion.button>
      }
    >
      <div className="px-4 pt-2 no-card-shadow">

        {/* Profile Header */}
        <motion.div
          className="bg-[#F7F8FA] rounded-xl flex items-center gap-3 px-4 py-3 mb-4 cursor-pointer"
          onClick={() => navigate('/profile/info/edit')}
          whileTap={{ scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Avatar className="relative w-14 h-14 shrink-0">
            <AvatarImage src={userInfo?.avatar} alt="User avatar" />
            <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/10 text-primary text-xl font-semibold">
              {displayName[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h2 className="text-[18px] leading-7 font-bold text-foreground">{displayName}</h2>
            <p className="text-xs text-muted-foreground">{t.mine.editProfile}</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1.5} />
        </motion.div>

        {/* Agent 管理 */}
        <div className="mb-4">
          <SectionHeader title={t.mine.agentManagement} />
          <div className="bg-[#F7F8FA] rounded-xl overflow-hidden">
            {[
              { icon: Bot, label: t.mine.agentAuth, path: '/agent-management' },
              { icon: Settings2, label: t.mine.agentRisk, path: '/agent-settings' },
              { icon: ClipboardCheck, label: t.mine.agentReview, path: '/agent-review' },
              { icon: FileText, label: t.mine.auditLog, path: '/audit-log' },
            ].map((item, index, arr) => (
              <ListItem
                key={item.label}
                icon={<item.icon className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />}
                title={item.label}
                showChevron
                showDivider={false}
                onClick={() => navigate(item.path)}
                className="py-4 px-4"
              />
            ))}
          </div>
        </div>

        {/* 钱包管理 */}
        <div className="mb-4">
          <SectionHeader title={t.mine.walletManagement} />
          <div className="bg-[#F7F8FA] rounded-xl overflow-hidden">
            {[
              { icon: Wallet, label: t.mine.walletMgmt, path: '/profile/wallets' },
              { icon: BookUser, label: t.mine.addressBook, path: '/profile/contacts' },
              { icon: KeyRound, label: t.mine.tssSigning, path: '/profile/tss-signing' },
            ].map((item, index, arr) => (
              <ListItem
                key={item.label}
                icon={<item.icon className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />}
                title={item.label}
                showChevron
                showDivider={false}
                onClick={() => navigate(item.path)}
                className="py-4 px-4"
              />
            ))}
          </div>
        </div>

        <div className="h-6 shrink-0" />
      </div>
    </AppLayout>
  );
}
