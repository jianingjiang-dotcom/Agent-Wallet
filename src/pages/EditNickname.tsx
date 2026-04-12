import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/lib/toast';

export default function EditNickname() {
  const navigate = useNavigate();
  const { userInfo } = useWallet();
  const initialNickname = userInfo?.email?.split('@')[0] || '';
  const [editValue, setEditValue] = useState(initialNickname);

  const handleSave = () => {
    if (editValue.trim()) {
      // TODO: persist nickname
      toast.success('保存成功');
      navigate(-1);
    }
  };

  return (
    <AppLayout showNav={false} showBack title="修改用户名">
      <div className="flex-1 flex flex-col px-4 pt-6 pb-8">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="请输入用户名"
          autoFocus
          maxLength={20}
        />
        <Button onClick={handleSave} className="w-full mt-6">
          保存
        </Button>
      </div>
    </AppLayout>
  );
}
