import { motion } from 'framer-motion';
import { 
  Smartphone, Monitor, Tablet, MapPin, Shield
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

interface LoginRecord {
  id: string;
  deviceName: string;
  deviceModel: string;
  timestamp: Date;
  location: string;
  ipAddress: string;
  browser?: string;
  os?: string;
  isSuccess: boolean;
}

// Mock login history data
const mockLoginHistory: LoginRecord[] = [
  { 
    id: '1', 
    deviceName: 'iPhone 15 Pro', 
    deviceModel: 'iPhone',
    timestamp: new Date(), 
    location: '上海, 中国',
    ipAddress: '116.228.xxx.xxx',
    os: 'iOS 17.2',
    browser: 'Safari',
    isSuccess: true
  },
  { 
    id: '2', 
    deviceName: 'MacBook Pro', 
    deviceModel: 'MacBook',
    timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), 
    location: '北京, 中国',
    ipAddress: '223.104.xxx.xxx',
    os: 'macOS Sonoma',
    browser: 'Chrome 120',
    isSuccess: true
  },
  { 
    id: '3', 
    deviceName: 'iPhone 15 Pro', 
    deviceModel: 'iPhone',
    timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), 
    location: '上海, 中国',
    ipAddress: '116.228.xxx.xxx',
    os: 'iOS 17.2',
    browser: 'Safari',
    isSuccess: true
  },
  { 
    id: '4', 
    deviceName: 'Windows PC', 
    deviceModel: 'Windows',
    timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000), 
    location: '杭州, 中国',
    ipAddress: '115.236.xxx.xxx',
    os: 'Windows 11',
    browser: 'Edge 120',
    isSuccess: false
  },
  { 
    id: '5', 
    deviceName: 'iPad Pro', 
    deviceModel: 'iPad',
    timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000), 
    location: '上海, 中国',
    ipAddress: '116.228.xxx.xxx',
    os: 'iPadOS 17.2',
    browser: 'Safari',
    isSuccess: true
  },
  { 
    id: '6', 
    deviceName: 'iPhone 15 Pro', 
    deviceModel: 'iPhone',
    timestamp: new Date(Date.now() - 96 * 60 * 60 * 1000), 
    location: '深圳, 中国',
    ipAddress: '120.229.xxx.xxx',
    os: 'iOS 17.2',
    browser: 'Safari',
    isSuccess: true
  },
];

export default function DeviceManagementPage() {
  const { devices } = useWallet();
  
  const currentDevice = devices.find(d => d.isCurrent);
  
  const getDeviceIcon = (model: string) => {
    if (model.toLowerCase().includes('iphone') || model.toLowerCase().includes('android')) {
      return Smartphone;
    }
    if (model.toLowerCase().includes('ipad') || model.toLowerCase().includes('tablet')) {
      return Tablet;
    }
    return Monitor;
  };

  const formatRecordTime = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const isYesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() === date.toDateString();
    
    if (isToday) {
      return `今天 ${format(date, 'HH:mm')}`;
    }
    if (isYesterday) {
      return `昨天 ${format(date, 'HH:mm')}`;
    }
    return format(date, 'MM/dd HH:mm', { locale: zhCN });
  };

  const CurrentDeviceIcon = currentDevice ? getDeviceIcon(currentDevice.model) : Smartphone;

  return (
    <AppLayout showNav={false} title="登录历史" showBack>
      <div className="px-4 py-4 space-y-4">
        {/* Current Device Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">当前设备</h3>
          <div className="card-elevated p-4">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
                <CurrentDeviceIcon className="w-6 h-6 text-accent" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">
                    {currentDevice?.name || 'iPhone 15 Pro'}
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 bg-success/10 text-success rounded">
                    在线
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <MapPin className="w-3 h-3" />
                  <span>{currentDevice?.location || '上海, 中国'}</span>
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                  <Shield className="w-3 h-3" />
                  <span>单设备在线保护已启用</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Security Note - Neutral Info Style */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="px-4 py-3 bg-muted/50 rounded-xl border border-border"
        >
          <p className="text-xs text-muted-foreground leading-relaxed">
            为了账户安全，同一账户仅允许一台设备在线。在新设备登录时，当前设备将自动退出。
          </p>
        </motion.div>

        {/* Login History */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">近期登录记录</h3>
          <div className="card-elevated overflow-hidden">
            {mockLoginHistory.map((record, index) => {
              const Icon = getDeviceIcon(record.deviceModel);
              return (
                <div 
                  key={record.id}
                  className={cn(
                    'p-3 flex items-center gap-3',
                    index !== mockLoginHistory.length - 1 && 'border-b border-border'
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center",
                    record.isSuccess ? "bg-muted" : "bg-destructive/10"
                  )}>
                    <Icon className={cn(
                      "w-4 h-4",
                      record.isSuccess ? "text-muted-foreground" : "text-destructive"
                    )} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium">{record.deviceName}</p>
                      {!record.isSuccess && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-destructive/10 text-destructive rounded">
                          失败
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{record.location}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatRecordTime(record.timestamp)}
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

    </AppLayout>
  );
}
