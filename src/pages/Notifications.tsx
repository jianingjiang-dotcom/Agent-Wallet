import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowDownLeft, ArrowUpRight, AlertTriangle,
  ClipboardCheck, CheckCircle2, Bell, Mail, Gift, Megaphone, Key
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';

interface NotificationConfig {
  // Transaction notifications
  receiveNotification: boolean;
  sendNotification: boolean;
  largeAmountAlert: boolean;
  largeAmountThreshold: number;

  // Agent review notifications
  agentPendingAlert: boolean;
  agentAutoApproveAlert: boolean;
  agentSettledAlert: boolean;
  agentFailedAlert: boolean;
  apiKeyChangeAlert: boolean;

  // System notifications
  productUpdateNotification: boolean;
  promotionNotification: boolean;

  // Channels
  pushEnabled: boolean;
  emailEnabled: boolean;
}

const defaultConfig: NotificationConfig = {
  receiveNotification: true,
  sendNotification: true,
  largeAmountAlert: true,
  largeAmountThreshold: 1000,
  agentPendingAlert: true,
  agentAutoApproveAlert: true,
  agentSettledAlert: true,
  agentFailedAlert: true,
  apiKeyChangeAlert: true,
  productUpdateNotification: true,
  promotionNotification: false,
  pushEnabled: true,
  emailEnabled: true,
};

export default function NotificationsPage() {
  const [config, setConfig] = useState<NotificationConfig>(defaultConfig);
  const [showThresholdDrawer, setShowThresholdDrawer] = useState(false);
  const [tempThreshold, setTempThreshold] = useState(config.largeAmountThreshold.toString());

  const updateConfig = (updates: Partial<NotificationConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const handleSaveThreshold = () => {
    const value = parseFloat(tempThreshold);
    if (!isNaN(value) && value > 0) {
      updateConfig({ largeAmountThreshold: value });
    }
    setShowThresholdDrawer(false);
  };

  return (
    <AppLayout showNav={false} title="通知设置" showBack>
      <div className="px-4 py-4 space-y-4">
        {/* Transaction Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">交易通知</h3>
          <div className="card-elevated overflow-hidden">
            <div className="p-3 flex items-center gap-3 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center">
                <ArrowDownLeft className="w-4 h-4 text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">收款到账通知</p>
                <p className="text-xs text-muted-foreground">收到转账时推送通知</p>
              </div>
              <Switch
                checked={config.receiveNotification}
                onCheckedChange={(checked) => updateConfig({ receiveNotification: checked })}
              />
            </div>

            <div className="p-3 flex items-center gap-3 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <ArrowUpRight className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">转账成功通知</p>
                <p className="text-xs text-muted-foreground">转账完成时推送通知</p>
              </div>
              <Switch
                checked={config.sendNotification}
                onCheckedChange={(checked) => updateConfig({ sendNotification: checked })}
              />
            </div>

            <div className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-warning/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-warning" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">大额交易提醒</p>
                <button
                  className="text-xs text-accent hover:underline"
                  onClick={() => {
                    setTempThreshold(config.largeAmountThreshold.toString());
                    setShowThresholdDrawer(true);
                  }}
                >
                  单笔超过 ${config.largeAmountThreshold.toLocaleString()} 时提醒
                </button>
              </div>
              <Switch
                checked={config.largeAmountAlert}
                onCheckedChange={(checked) => updateConfig({ largeAmountAlert: checked })}
              />
            </div>
          </div>
        </motion.div>

        {/* Agent Review Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">审核通知</h3>
          <div className="card-elevated overflow-hidden">
            <div className="p-3 flex items-center gap-3 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center">
                <ClipboardCheck className="w-4 h-4 text-amber-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">Agent 交易审核提醒</p>
                <p className="text-xs text-muted-foreground">Agent 提交交易请求时通知</p>
              </div>
              <Switch
                checked={config.agentPendingAlert}
                onCheckedChange={(checked) => updateConfig({ agentPendingAlert: checked })}
              />
            </div>

            <div className="p-3 flex items-center gap-3 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">自动批准执行通知</p>
                <p className="text-xs text-muted-foreground">自动模式下交易被批准时通知</p>
              </div>
              <Switch
                checked={config.agentAutoApproveAlert}
                onCheckedChange={(checked) => updateConfig({ agentAutoApproveAlert: checked })}
              />
            </div>

            <div className="p-3 flex items-center gap-3 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">交易结算通知</p>
                <p className="text-xs text-muted-foreground">Agent 交易成功结算时通知</p>
              </div>
              <Switch
                checked={config.agentSettledAlert}
                onCheckedChange={(checked) => updateConfig({ agentSettledAlert: checked })}
              />
            </div>

            <div className="p-3 flex items-center gap-3 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">交易异常提醒</p>
                <p className="text-xs text-muted-foreground">交易失败或过期时通知</p>
              </div>
              <Switch
                checked={config.agentFailedAlert}
                onCheckedChange={(checked) => updateConfig({ agentFailedAlert: checked })}
              />
            </div>

            <div className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Key className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">API 密钥变动通知</p>
                <p className="text-xs text-muted-foreground">密钥创建或撤销时通知</p>
              </div>
              <Switch
                checked={config.apiKeyChangeAlert}
                onCheckedChange={(checked) => updateConfig({ apiKeyChangeAlert: checked })}
              />
            </div>
          </div>
        </motion.div>

        {/* System Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">系统通知</h3>
          <div className="card-elevated overflow-hidden">
            <div className="p-3 flex items-center gap-3 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Megaphone className="w-4 h-4 text-blue-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">产品更新通知</p>
                <p className="text-xs text-muted-foreground">新功能和版本更新</p>
              </div>
              <Switch
                checked={config.productUpdateNotification}
                onCheckedChange={(checked) => updateConfig({ productUpdateNotification: checked })}
              />
            </div>

            <div className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-pink-500/10 flex items-center justify-center">
                <Gift className="w-4 h-4 text-pink-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">活动与优惠通知</p>
                <p className="text-xs text-muted-foreground">优惠活动和福利</p>
              </div>
              <Switch
                checked={config.promotionNotification}
                onCheckedChange={(checked) => updateConfig({ promotionNotification: checked })}
              />
            </div>
          </div>
        </motion.div>

        {/* Notification Channels */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h3 className="text-xs font-medium text-muted-foreground mb-2 px-1">通知渠道</h3>
          <div className="card-elevated overflow-hidden">
            <div className="p-3 flex items-center gap-3 border-b border-border">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Bell className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">App 推送通知</p>
              </div>
              <Switch
                checked={config.pushEnabled}
                onCheckedChange={(checked) => updateConfig({ pushEnabled: checked })}
              />
            </div>

            <div className="p-3 flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center">
                <Mail className="w-4 h-4 text-accent" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">邮件通知</p>
                <p className="text-xs text-muted-foreground">user@example.com</p>
              </div>
              <Switch
                checked={config.emailEnabled}
                onCheckedChange={(checked) => updateConfig({ emailEnabled: checked })}
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Threshold Drawer */}
      <Drawer open={showThresholdDrawer} onOpenChange={setShowThresholdDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>设置大额交易阈值</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">单笔金额超过 (USD)</Label>
              <Input
                type="number"
                value={tempThreshold}
                onChange={(e) => setTempThreshold(e.target.value)}
                placeholder="输入金额"
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">快捷选择</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[500, 1000, 5000, 10000].map((value) => (
                  <Button
                    key={value}
                    variant={tempThreshold === value.toString() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTempThreshold(value.toString())}
                    className="text-xs"
                  >
                    ${value >= 1000 ? `${value / 1000}K` : value}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowThresholdDrawer(false)}>
                取消
              </Button>
              <Button className="flex-1" onClick={handleSaveThreshold}>
                确认
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </AppLayout>
  );
}
