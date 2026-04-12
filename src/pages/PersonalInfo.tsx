import { useState } from 'react';
import { User, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWallet } from '@/contexts/WalletContext';


export default function PersonalInfo() {
  const navigate = useNavigate();
  const { userInfo } = useWallet();

  const initialNickname = userInfo?.email?.split('@')[0] || '';
  const [nickname] = useState(initialNickname);

  const userId = 'UID_8824563147';

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
            <button onClick={() => navigate('/profile/info/edit')} className="w-full flex items-center gap-3 px-4 py-3 active:bg-muted/50 transition-colors">
              <div className="w-[30px] h-[30px] rounded-full flex items-center justify-center shrink-0 icon-gradient-warning">
                <User className="w-3.5 h-3.5" strokeWidth={1.5} />
              </div>
              <span className="text-sm font-medium text-foreground flex-1 text-left">个人信息</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" strokeWidth={1} />
            </button>
          </div>

        </div>
      </div>
    </AppLayout>
  );
}
