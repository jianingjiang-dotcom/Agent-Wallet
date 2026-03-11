import { useState } from 'react';
import { Copy, Check, ChevronRight } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/lib/toast';
import { copyToClipboard } from '@/lib/utils';

export default function EditProfile() {
  const { userInfo } = useWallet();
  const initialNickname = userInfo?.email?.split('@')[0] || '';
  const [nickname, setNickname] = useState(initialNickname);
  const avatar = userInfo?.avatar || '';
  const [copied, setCopied] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editValue, setEditValue] = useState('');

  const userId = 'UID-2024-XXXX-XXXX';

  const handleCopyUid = async () => {
    const ok = await copyToClipboard(userId);
    if (ok) {
      setCopied(true);
      toast.success('已复制', '用户ID已复制到剪贴板');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  const handleOpenDrawer = () => {
    setEditValue(nickname);
    setDrawerOpen(true);
  };

  const handleSaveNickname = () => {
    if (editValue.trim()) {
      setNickname(editValue.trim());
    }
    setDrawerOpen(false);
    toast.success('保存成功');
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
        <div className="card-elevated overflow-hidden">
          {/* 用户名 */}
          <button
            onClick={handleOpenDrawer}
            className="w-full flex items-center gap-3 px-4 py-[17px] border-b border-border/50 active:bg-muted/50 transition-colors"
          >
            <span className="text-sm font-medium text-foreground w-16 shrink-0 text-left">用户名</span>
            <div className="flex-1 flex items-center justify-end gap-1">
              <span className="text-[14px] text-muted-foreground">{nickname || '未设置'}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground shrink-0" strokeWidth={1} />
            </div>
          </button>

          {/* UID */}
          <div className="flex items-center gap-3 px-4 py-[17px]">
            <span className="text-sm font-medium text-foreground w-16 shrink-0 text-left">UID</span>
            <div className="flex-1 flex items-center justify-end gap-1">
              <span className="text-[14px] text-muted-foreground select-none">{userId}</span>
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

      {/* Edit Nickname Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} snapPoints={[0.32]}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>修改用户名</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 flex flex-col gap-4">
            <Input
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              placeholder="请输入用户名"
              autoFocus
              maxLength={20}
            />
            <Button onClick={handleSaveNickname} className="w-full">
              保存
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </AppLayout>
  );
}
