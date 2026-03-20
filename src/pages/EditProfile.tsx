import { useState } from 'react';
import { Copy, Check, ChevronRight, User, Hash } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/lib/toast';
import { copyToClipboard } from '@/lib/utils';

export default function EditProfile() {
  const navigate = useNavigate();
  const { userInfo } = useWallet();
  const initialNickname = userInfo?.email?.split('@')[0] || '';
  const [nickname] = useState(initialNickname);
  const avatar = userInfo?.avatar || '';
  const [copied, setCopied] = useState(false);

  const uidNumber = '8824563147';
  const userId = uidNumber;

  const handleCopyUid = async () => {
    const ok = await copyToClipboard(userId);
    if (ok) {
      setCopied(true);
      toast.success('已复制');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  return (
    <AppLayout showNav={false} showBack title="个人信息" pageBg="bg-page">
      <div className="flex flex-col bg-page min-h-full px-4 pb-8 no-card-shadow">

        {/* Avatar */}
        <div className="flex flex-col items-center pt-4 pb-6">
          <Avatar className="w-[160px] h-[160px]">
            <AvatarImage src={avatar} alt="User avatar" />
            <AvatarFallback className="bg-accent/20 text-accent text-2xl font-semibold">
              {nickname[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <button className="mt-4 px-3 py-1.5 rounded-full bg-accent text-white text-xs font-medium active:opacity-80 transition-opacity">
            更改
          </button>
        </div>

        {/* Fields */}
        <div className="bg-[#F7F8FA] rounded-xl overflow-hidden">
          {/* 用户名 */}
          <button
            onClick={() => navigate('/profile/info/edit/nickname')}
            className="w-full flex items-center gap-3 px-4 py-4 active:bg-muted/50 transition-colors"
          >
            <User className="w-5 h-5 shrink-0" strokeWidth={1.5} style={{ color: '#000000' }} />
            <span className="text-[14px] leading-5 font-normal text-foreground shrink-0 text-left">用户名</span>
            <div className="flex-1 flex items-center justify-end gap-1">
              <span className="text-[14px] leading-5 font-normal text-muted-foreground">{nickname || '未设置'}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1} />
            </div>
          </button>

          {/* UID */}
          <div className="flex items-center gap-3 px-4 py-4">
            <Hash className="w-5 h-5 shrink-0" strokeWidth={1.5} style={{ color: '#000000' }} />
            <span className="text-[14px] leading-5 font-normal text-foreground shrink-0 text-left">UID</span>
            <div className="flex-1 flex items-center justify-end gap-1">
              <span className="text-[14px] leading-5 font-normal text-muted-foreground select-none">{userId}</span>
              <button
                onClick={handleCopyUid}
                className="flex items-center justify-center w-5 h-5 rounded-full active:opacity-60 transition-opacity shrink-0"
              >
                {copied
                  ? <Check className="w-[14px] h-[14px] text-green-500" strokeWidth={1.5} />
                  : <Copy className="w-[14px] h-[14px] text-muted-foreground" strokeWidth={1.5} />
                }
              </button>
            </div>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
