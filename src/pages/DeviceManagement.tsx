import { motion } from 'framer-motion';
import { Smartphone, Monitor, Tablet } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import * as React from 'react';
import { createPortal } from 'react-dom';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { AppLayout } from '@/components/layout/AppLayout';
import { useNavigate } from 'react-router-dom';
import { useWallet } from '@/contexts/WalletContext';

// ---- StatusBadge ----
const statusBadgeVariants = cva('inline-flex items-center gap-1 rounded-full font-medium', {
  variants: {
    variant: {
      success: 'bg-success/10 text-success',
    },
    size: {
      sm: 'text-[10px] px-1.5 py-0.5',
    },
  },
  defaultVariants: { variant: 'success', size: 'sm' },
});

function StatusBadge({ className, variant, size, children, ...props }:
  React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof statusBadgeVariants>) {
  return (
    <span className={cn(statusBadgeVariants({ variant, size }), className)} {...props}>
      {children}
    </span>
  );
}

// ---- 数据类型 ----
interface LoginRecord {
  id: string;
  deviceName: string;
  deviceModel: string;
  timestamp: Date;
  location: string;
  ipAddress: string;
}

// ---- Mock 数据 ----
const mockLoginHistory: LoginRecord[] = [
  { id: '1', deviceName: 'iPhone 15 Pro', deviceModel: 'iPhone',  timestamp: new Date(),                            location: '上海, 中国', ipAddress: '116.228.xxx.xxx' },
  { id: '2', deviceName: 'iPhone 15 Pro', deviceModel: 'iPhone', timestamp: new Date(Date.now() - 2*3600*1000),   location: '北京, 中国', ipAddress: '223.104.xxx.xxx' },
  { id: '3', deviceName: 'iPhone 15 Pro', deviceModel: 'iPhone',  timestamp: new Date(Date.now() - 24*3600*1000),  location: '上海, 中国', ipAddress: '116.228.xxx.xxx' },
  { id: '4', deviceName: 'iPhone 15 Pro', deviceModel: 'iPhone',  timestamp: new Date(Date.now() - 72*3600*1000),  location: '上海, 中国', ipAddress: '116.228.xxx.xxx' },
  { id: '5', deviceName: 'iPhone 15 Pro', deviceModel: 'iPhone',  timestamp: new Date(Date.now() - 96*3600*1000),  location: '深圳, 中国', ipAddress: '120.229.xxx.xxx' },
];

// ---- 工具函数 ----
const getDeviceIcon = (model: string) => {
  const m = model.toLowerCase();
  if (m.includes('iphone') || m.includes('android')) return Smartphone;
  if (m.includes('ipad')   || m.includes('tablet'))  return Tablet;
  return Monitor;
};

const formatTime = (date: Date) => {
  const now = new Date();
  const isToday     = date.toDateString() === now.toDateString();
  const isYesterday = new Date(now.getTime() - 86400000).toDateString() === date.toDateString();
  if (isToday)     return `今天 ${format(date, 'HH:mm')}`;
  if (isYesterday) return `昨天 ${format(date, 'HH:mm')}`;
  return format(date, 'MM/dd HH:mm', { locale: zhCN });
};

// ---- 确认弹窗 ----
function ConfirmDialog({ open, onConfirm, onCancel }: { open: boolean; onConfirm: () => void; onCancel: () => void }) {
  if (!open) return null;
  const container = document.getElementById('phone-frame-container');
  if (!container) return null;
  return createPortal(
    <div className="absolute inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative bg-card rounded-xl w-[280px] overflow-hidden shadow-xl">
        <div className="px-6 pt-6 pb-4 text-center">
          <p className="text-[16px] font-semibold text-foreground">确认退出</p>
          <p className="text-[14px] text-muted-foreground mt-2">确定要退出当前设备吗？</p>
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

// ---- 主页面 ----
export default function DeviceManagementPage() {
  const { logout } = useWallet();
  const navigate = useNavigate();
  const [confirmOpen, setConfirmOpen] = React.useState(false);

  return (
    <AppLayout showNav={false} title="登录设备" showBack pageBg="bg-page">
      <div className="px-4 pt-2 pb-[72px] space-y-4 no-card-shadow">
        {/* 安全提示 */}
        <p className="text-xs text-muted-foreground leading-relaxed">
          为了账户安全，同一账户仅允许一台设备在线。在新设备登录时，当前设备将自动退出。
        </p>

        {/* 设备列表 */}
        <div>
          <div className="space-y-4">
            {mockLoginHistory.map((record, index) => {
              const Icon = getDeviceIcon(record.deviceModel);
              const isCurrent = index === 0;
              return (
                <div key={record.id} className="flex items-start gap-3">
                  {/* 设备图标 */}
                  <div className="relative w-8 h-8 shrink-0 mt-0.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-[#F7F8FA]">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                    </div>
                    {isCurrent && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-success border-2 border-white dark:border-gray-800" />
                    )}
                  </div>
                  {/* 设备信息 */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <p className="text-base leading-6 font-medium">{record.deviceName}</p>
                    <p className="text-xs text-muted-foreground">最近登录：{formatTime(record.timestamp)}</p>
                    <p className="text-xs text-muted-foreground">登录地点：{record.location}</p>
                    <p className="text-xs text-muted-foreground">IP 地址：{record.ipAddress}</p>
                    {isCurrent && (
                      <StatusBadge variant="success" size="sm" className="mt-1">当前设备</StatusBadge>
                    )}
                  </div>
                  {/* 退出按钮 */}
                  {isCurrent && (
                    <button
                      onClick={() => setConfirmOpen(true)}
                      className="shrink-0 px-3 py-1.5 rounded-full bg-[#F7F8FA] text-xs font-medium"
                    >
                      退出
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <ConfirmDialog
          open={confirmOpen}
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => { setConfirmOpen(false); logout(); navigate('/'); }}
        />
      </div>
    </AppLayout>
  );
}
