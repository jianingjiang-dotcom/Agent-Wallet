import { useState } from 'react';
import {
  Wallet, Shield, Bell, Star, Zap, CheckCircle2, AlertTriangle,
  Info, Flame, Lock, Send, User, Settings, ChevronRight, Copy
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { SectionHeader } from '@/components/ui/section-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { IconCircle } from '@/components/ui/icon-circle';
import { ListItem } from '@/components/ui/list-item';
import { DetailRow } from '@/components/ui/detail-row';
import { AlertBanner } from '@/components/ui/alert-banner';
import { StepIndicator } from '@/components/ui/step-indicator';
import { FilterPills } from '@/components/ui/filter-pills';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

// Mini demo block wrapper
function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <SectionHeader title={title} />
      {children}
    </div>
  );
}

// Color swatch
function Swatch({ label, className }: { label: string; className: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className={`w-10 h-10 rounded-xl ${className}`} />
      <span className="text-[9px] text-muted-foreground leading-tight text-center">{label}</span>
    </div>
  );
}

export default function ComponentDemo() {
  const [filterPill, setFilterPill] = useState('all');
  const [filterTab, setFilterTab] = useState('audit');
  const [switchOn, setSwitchOn] = useState(true);
  const [stepCurrent, setStepCurrent] = useState(2);

  const stepItems = [
    { id: 1, title: '创建', icon: Wallet },
    { id: 2, title: '验证', icon: Shield },
    { id: 3, title: '完成', icon: CheckCircle2 },
  ];

  const pillItems = [
    { id: 'all', label: '全部' },
    { id: 'receive', label: '转入' },
    { id: 'send', label: '转出' },
    { id: 'agent', label: 'Agent', badge: 3 },
  ];

  const tabItems = [
    { id: 'audit', label: '审核', badge: 2 },
    { id: 'tx', label: '交易' },
    { id: 'system', label: '系统' },
  ];

  return (
    <AppLayout title="组件 Demo" pageBg="bg-page" showBack showNav={false}>
      <div className="px-4 pt-2 pb-10 no-card-shadow">

        {/* ── 色彩系统 ── */}
        <Block title="色彩系统">
          <div className="card-elevated p-3">
            <div className="flex flex-wrap gap-3">
              <Swatch label="primary" className="bg-primary" />
              <Swatch label="accent" className="bg-accent" />
              <Swatch label="success" className="bg-success" />
              <Swatch label="warning" className="bg-warning" />
              <Swatch label="destructive" className="bg-destructive" />
              <Swatch label="trust" className="bg-trust" />
              <Swatch label="muted" className="bg-muted" />
              <Swatch label="border" className="bg-border" />
            </div>
          </div>
        </Block>

        {/* ── Button ── */}
        <Block title="Button">
          <div className="card-elevated p-3 space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Button size="sm">默认</Button>
              <Button size="sm" variant="outline">描边</Button>
              <Button size="sm" variant="secondary">次要</Button>
              <Button size="sm" variant="ghost">幽灵</Button>
              <Button size="sm" variant="destructive">危险</Button>
            </div>
            <div className="flex gap-2 flex-wrap items-center">
              <Button size="sm" disabled>禁用</Button>
              <Button size="md" className="gradient-primary">渐变</Button>
              <Button size="icon-sm" variant="outline"><Send className="w-4 h-4" /></Button>
            </div>
          </div>
        </Block>

        {/* ── Badge & StatusBadge ── */}
        <Block title="Badge / StatusBadge">
          <div className="card-elevated p-3 space-y-2">
            <div className="flex gap-2 flex-wrap">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">9+</Badge>
            </div>
            <div className="flex gap-2 flex-wrap">
              <StatusBadge variant="success" icon={CheckCircle2}>已完成</StatusBadge>
              <StatusBadge variant="warning" icon={AlertTriangle}>待审批</StatusBadge>
              <StatusBadge variant="danger" icon={Flame}>失败</StatusBadge>
              <StatusBadge variant="info" icon={Info}>处理中</StatusBadge>
              <StatusBadge variant="purple">Agent</StatusBadge>
              <StatusBadge variant="muted">--</StatusBadge>
            </div>
          </div>
        </Block>

        {/* ── IconCircle ── */}
        <Block title="IconCircle">
          <div className="card-elevated p-3">
            <div className="flex gap-3 flex-wrap items-end">
              <IconCircle icon={Wallet} color="accent" size="sm" />
              <IconCircle icon={Shield} color="success" size="md" />
              <IconCircle icon={Bell} color="warning" size="lg" />
              <IconCircle icon={Zap} color="destructive" size="xl" />
              <IconCircle icon={Star} color="purple" size="md" />
              <IconCircle icon={Lock} color="blue" size="md" />
              <IconCircle icon={Flame} color="amber" size="md" />
              <IconCircle icon={User} color="muted" size="md" />
            </div>
          </div>
        </Block>

        {/* ── ListItem ── */}
        <Block title="ListItem">
          <div className="card-elevated overflow-hidden">
            <ListItem
              icon={Wallet}
              iconColor="accent"
              title="钱包管理"
              showChevron
              showDivider
              onClick={() => {}}
              className="py-4 px-4"
            />
            <ListItem
              icon={Shield}
              iconColor="success"
              title="账户安全"
              subtitle="已开启双重验证"
              showChevron
              showDivider
              onClick={() => {}}
              className="py-4 px-4"
            />
            <ListItem
              icon={Bell}
              iconColor="warning"
              title="通知设置"
              value="已开启"
              showDivider
              trailing={<Switch checked={switchOn} onCheckedChange={setSwitchOn} />}
              className="py-4 px-4"
            />
            <ListItem
              icon={User}
              iconColor="blue"
              title="编辑资料"
              value="Sarah Chen"
              showChevron
              showDivider
              onClick={() => {}}
              className="py-4 px-4"
            />
            <ListItem
              icon={Lock}
              iconColor="destructive"
              title="删除账号"
              destructive
              showChevron
              onClick={() => {}}
              className="py-4 px-4"
            />
          </div>
        </Block>

        {/* ── SectionHeader ── */}
        <Block title="SectionHeader">
          <div className="card-elevated p-3 space-y-3">
            <SectionHeader title="基础标题" />
            <SectionHeader title="带图标" icon={Settings} />
            <SectionHeader title="带操作" action={{ label: '查看全部', onClick: () => {} }} />
            <SectionHeader title="大尺寸" size="md" icon={Wallet} action={{ label: '添加', onClick: () => {} }} />
          </div>
        </Block>

        {/* ── DetailRow ── */}
        <Block title="DetailRow">
          <div className="card-elevated overflow-hidden">
            <DetailRow label="交易哈希" value="0x1f98...F984" copyValue="0x1f984321F984" mono />
            <DetailRow label="金额" value="0.125 BTC" subValue="≈ $12,187.5" />
            <DetailRow label="状态" value={<StatusBadge variant="success" size="sm">已确认</StatusBadge>} />
            <DetailRow label="时间" value="2026-03-16 14:32" />
          </div>
        </Block>

        {/* ── AlertBanner ── */}
        <Block title="AlertBanner">
          <div className="space-y-2">
            <AlertBanner icon={AlertTriangle} variant="warning" title="需要备份" description="您的钱包尚未完成云端备份，请及时备份。" action={{ label: '立即备份', onClick: () => {} }} />
            <AlertBanner icon={Shield} variant="info" title="安全提示" description="请勿向任何人透露您的私钥或助记词。" />
            <AlertBanner icon={CheckCircle2} variant="success" title="验证通过" size="sm" />
            <AlertBanner icon={Flame} variant="danger" title="操作风险" description="此操作不可撤销，请谨慎操作。" onDismiss={() => {}} />
          </div>
        </Block>

        {/* ── StepIndicator ── */}
        <Block title="StepIndicator">
          <div className="card-elevated p-4 space-y-4">
            <StepIndicator steps={stepItems} currentStep={stepCurrent} showLabels />
            <div className="flex gap-2 justify-center">
              <Button size="sm" variant="outline" onClick={() => setStepCurrent(s => Math.max(1, s - 1))}>上一步</Button>
              <Button size="sm" onClick={() => setStepCurrent(s => Math.min(3, s + 1))}>下一步</Button>
            </div>
          </div>
        </Block>

        {/* ── FilterPills ── */}
        <Block title="FilterPills">
          <div className="card-elevated p-3 space-y-3">
            <FilterPills items={pillItems} value={filterPill} onChange={setFilterPill} variant="pill" />
            <FilterPills items={tabItems} value={filterTab} onChange={setFilterTab} variant="tab" />
          </div>
        </Block>

        {/* ── Input & Switch ── */}
        <Block title="Input / Switch">
          <div className="card-elevated p-3 space-y-3">
            <Input placeholder="请输入内容" />
            <Input placeholder="禁用状态" disabled />
            <div className="flex items-center justify-between">
              <span className="text-sm text-foreground">开关</span>
              <Switch checked={switchOn} onCheckedChange={setSwitchOn} />
            </div>
          </div>
        </Block>

        {/* ── Skeleton ── */}
        <Block title="Skeleton">
          <div className="card-elevated p-3 space-y-2">
            <Skeleton className="h-4 w-3/4 rounded" />
            <Skeleton className="h-4 w-1/2 rounded" />
            <Skeleton className="h-10 w-full rounded-xl" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10 rounded-full shrink-0" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-3 w-full rounded" />
                <Skeleton className="h-3 w-2/3 rounded" />
              </div>
            </div>
          </div>
        </Block>

      </div>
    </AppLayout>
  );
}
