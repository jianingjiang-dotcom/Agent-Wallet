import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Shield, Lock, Fingerprint, Smartphone,
  DollarSign, Calendar, CalendarDays, TestTube,
  CheckCircle2, AlertTriangle, Users
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { IconCircle } from '@/components/ui/icon-circle';
import { ListItem } from '@/components/ui/list-item';
import { SectionHeader } from '@/components/ui/section-header';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { isAgentLinked } from '@/types/wallet';

const QUICK_LIMITS = [5000, 10000, 50000, 100000];

export default function SecurityPage() {
  const navigate = useNavigate();
  const { securityConfig, updateSecurityConfig, hasPin, hasBiometric, devices, contacts, currentWallet } = useWallet();
  const isAgent = isAgentLinked(currentWallet);

  const [showLimitDrawer, setShowLimitDrawer] = useState(false);
  const [editingLimit, setEditingLimit] = useState<'single' | 'daily' | 'monthly' | null>(null);
  const [tempLimit, setTempLimit] = useState('');
  const [showRiskDrawer, setShowRiskDrawer] = useState(false);

  // Calculate security score
  const securityFeatures = [
    { enabled: hasPin, label: '支付密码' },
    { enabled: hasBiometric, label: '生物识别' },
    { enabled: devices.length > 0, label: '设备验证' },
    { enabled: securityConfig.requireSatoshiTest, label: '首次转账测试' },
    { enabled: securityConfig.highRiskAction === 'block', label: '高风险拦截' },
  ];

  const enabledCount = securityFeatures.filter(f => f.enabled).length;
  const securityScore = Math.round((enabledCount / securityFeatures.length) * 100);

  const whitelistCount = contacts.filter(c => c.isWhitelisted).length;

  const handleEditLimit = (type: 'single' | 'daily' | 'monthly') => {
    setEditingLimit(type);
    const currentValue = type === 'single'
      ? securityConfig.singleTransactionLimit
      : type === 'daily'
        ? securityConfig.dailyLimit
        : securityConfig.monthlyLimit;
    setTempLimit(currentValue.toString());
    setShowLimitDrawer(true);
  };

  const handleSaveLimit = () => {
    const value = parseFloat(tempLimit);
    if (isNaN(value) || value <= 0) return;

    if (editingLimit === 'single') {
      updateSecurityConfig({ singleTransactionLimit: value });
    } else if (editingLimit === 'daily') {
      updateSecurityConfig({ dailyLimit: value });
    } else if (editingLimit === 'monthly') {
      updateSecurityConfig({ monthlyLimit: value });
    }
    setShowLimitDrawer(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const getLimitLabel = () => {
    switch (editingLimit) {
      case 'single': return '单笔限额';
      case 'daily': return '每日限额';
      case 'monthly': return '每月限额';
      default: return '';
    }
  };

  const scoreColor = securityScore >= 80 ? 'success' : securityScore >= 50 ? 'warning' : 'destructive';

  return (
    <AppLayout showNav={false} title="安全与风控" showBack>
      <div className="px-4 py-4 space-y-4">
        {/* Agent Wallet Notice */}
        {isAgent && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 rounded-xl bg-primary/8 border border-primary/20"
          >
            <p className="text-xs text-primary">
              此钱包由 Agent 控制签名，安全设置用于审批验证和风控策略。
            </p>
          </motion.div>
        )}

        {/* Security Score Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="card-elevated p-4"
        >
          <div className="flex items-center gap-3 mb-3">
            <IconCircle icon={Shield} size="md" color={scoreColor} />
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">安全等级</span>
                <span className={cn(
                  'text-lg font-bold',
                  securityScore >= 80 ? 'text-success' : securityScore >= 50 ? 'text-warning' : 'text-destructive'
                )}>
                  {securityScore >= 80 ? '高' : securityScore >= 50 ? '中' : '低'}
                </span>
              </div>
              <Progress value={securityScore} className="h-2 mt-1" />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            已启用 {enabledCount}/{securityFeatures.length} 项安全功能
          </p>
        </motion.div>

        {/* Authentication & Verification */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
        >
          <SectionHeader title="认证与验证" />
          <div className="card-elevated overflow-hidden">
            <ListItem
              icon={Lock}
              iconColor="accent"
              title="支付密码"
              value={hasPin ? '已设置' : '未设置'}
              valueClassName={hasPin ? 'text-success' : undefined}
              showChevron
              showDivider
              onClick={() => {}}
            />
            <ListItem
              icon={Fingerprint}
              iconColor="accent"
              title="生物识别"
              trailing={<Switch checked={hasBiometric} />}
              showDivider
            />
            <ListItem
              icon={Smartphone}
              iconColor="accent"
              title="设备验证"
              value={`${devices.length} 台设备`}
              showChevron
              onClick={() => navigate('/profile/devices')}
            />
          </div>
        </motion.div>

        {/* Transfer Risk Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <SectionHeader title={isAgent ? "审批风控" : "转账风控"} />
          {isAgent && (
            <p className="text-xs text-muted-foreground px-1 -mt-1 mb-2">
              以下限额用于审批 Agent 提交的转账请求
            </p>
          )}
          <div className="card-elevated overflow-hidden">
            <ListItem
              icon={DollarSign}
              iconColor="accent"
              title="单笔限额"
              value={formatCurrency(securityConfig.singleTransactionLimit)}
              showChevron
              showDivider
              onClick={() => handleEditLimit('single')}
            />
            <ListItem
              icon={Calendar}
              iconColor="primary"
              title="每日限额"
              value={formatCurrency(securityConfig.dailyLimit)}
              showChevron
              showDivider
              onClick={() => handleEditLimit('daily')}
            />
            <ListItem
              icon={CalendarDays}
              iconColor="accent"
              title="每月限额"
              value={formatCurrency(securityConfig.monthlyLimit)}
              showChevron
              showDivider
              onClick={() => handleEditLimit('monthly')}
            />
            <ListItem
              icon={TestTube}
              iconColor="accent"
              title="首次转账测试"
              subtitle="新地址首次转账需先小额测试"
              trailing={
                <Switch
                  checked={securityConfig.requireSatoshiTest}
                  onCheckedChange={(checked) => updateSecurityConfig({ requireSatoshiTest: checked })}
                />
              }
              showDivider
            />
            <ListItem
              icon={CheckCircle2}
              iconColor="accent"
              title="白名单免验证"
              subtitle="白名单地址转账跳过二次验证"
              trailing={
                <Switch
                  checked={securityConfig.whitelistBypass}
                  onCheckedChange={(checked) => updateSecurityConfig({ whitelistBypass: checked })}
                />
              }
            />
          </div>
        </motion.div>

        {/* Risk Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <SectionHeader title="风险控制" />
          <div className="card-elevated overflow-hidden">
            <ListItem
              icon={AlertTriangle}
              iconColor="destructive"
              title="高风险地址处理"
              value={securityConfig.highRiskAction === 'block' ? '拦截' : '警告'}
              showChevron
              showDivider
              onClick={() => setShowRiskDrawer(true)}
            />
            <ListItem
              icon={Users}
              iconColor="accent"
              title="白名单地址"
              value={`${whitelistCount} 个地址`}
              showChevron
              onClick={() => navigate('/profile/contacts')}
            />
          </div>
        </motion.div>

        {/* Limit Usage */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <SectionHeader title={isAgent ? "审批额度使用" : "额度使用情况"} />
          <div className="card-elevated p-4 space-y-4">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">今日已用</span>
                <span className="text-foreground">
                  {formatCurrency(securityConfig.dailyUsed)} / {formatCurrency(securityConfig.dailyLimit)}
                </span>
              </div>
              <Progress
                value={(securityConfig.dailyUsed / securityConfig.dailyLimit) * 100}
                className="h-2"
              />
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">本月已用</span>
                <span className="text-foreground">
                  {formatCurrency(securityConfig.monthlyUsed)} / {formatCurrency(securityConfig.monthlyLimit)}
                </span>
              </div>
              <Progress
                value={(securityConfig.monthlyUsed / securityConfig.monthlyLimit) * 100}
                className="h-2"
              />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Edit Limit Drawer */}
      <Drawer open={showLimitDrawer} onOpenChange={setShowLimitDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>修改{getLimitLabel()}</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4">
            <div>
              <Label className="text-sm text-muted-foreground">输入新限额 (USD)</Label>
              <Input
                type="number"
                value={tempLimit}
                onChange={(e) => setTempLimit(e.target.value)}
                placeholder="输入金额"
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm text-muted-foreground">快捷选择</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {QUICK_LIMITS.map((limit) => (
                  <Button
                    key={limit}
                    variant={tempLimit === limit.toString() ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setTempLimit(limit.toString())}
                    className="text-xs"
                  >
                    ${(limit / 1000).toFixed(0)}K
                  </Button>
                ))}
              </div>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              提高限额需要进行身份验证
            </p>

            <div className="flex gap-3 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowLimitDrawer(false)}>
                取消
              </Button>
              <Button className="flex-1" onClick={handleSaveLimit}>
                确认修改
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Risk Action Drawer */}
      <Drawer open={showRiskDrawer} onOpenChange={setShowRiskDrawer}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>高风险地址处理方式</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-8 space-y-4">
            <RadioGroup
              value={securityConfig.highRiskAction}
              onValueChange={(value) => {
                updateSecurityConfig({ highRiskAction: value as 'block' | 'warn' });
                setShowRiskDrawer(false);
              }}
            >
              <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <RadioGroupItem value="block" id="block" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="block" className="font-medium cursor-pointer">拦截交易</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    检测到高风险地址时，直接阻止交易执行
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-lg border border-border">
                <RadioGroupItem value="warn" id="warn" className="mt-0.5" />
                <div className="flex-1">
                  <Label htmlFor="warn" className="font-medium cursor-pointer">仅警告</Label>
                  <p className="text-xs text-muted-foreground mt-1">
                    显示风险提示，但允许用户确认后继续交易
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>
        </DrawerContent>
      </Drawer>
    </AppLayout>
  );
}
