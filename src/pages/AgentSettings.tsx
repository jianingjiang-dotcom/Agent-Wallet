import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot, ChevronDown, Plus,
  CheckCircle2, XCircle, Info, Shield,
  ArrowUpDown, FileCode, MapPin, Coins, Link,
} from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import { AlertBanner } from '@/components/ui/alert-banner';
import { PolicyCard } from '@/components/PolicyCard';
import PolicyEditDrawer from '@/components/PolicyEditDrawer';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import type { AgentPolicy, PolicyType, DefaultPolicyAction } from '@/types/wallet';
import { POLICY_TYPE_META } from '@/types/wallet';

// ─── Policy type icon mapping ─────────────────────────────────────

const POLICY_ICONS: Record<PolicyType, typeof ArrowUpDown> = {
  transfer_rules: ArrowUpDown,
  contract_call_rules: FileCode,
  address_rules: MapPin,
  token_rules: Coins,
  chain_rules: Link,
};

// ─── Component ────────────────────────────────────────────────────

export default function AgentSettings() {
  const [searchParams] = useSearchParams();
  const {
    wallets,
    delegatedAgents,
    updateDelegatedAgentRiskConfig,
    addPolicy,
    updatePolicy,
    removePolicy,
    reorderPolicies,
    togglePolicyEnabled,
    updateDefaultAction,
  } = useWallet();

  // Filter agents that are active or paused (not revoked)
  const availableAgents = useMemo(
    () => delegatedAgents.filter(a => a.status === 'active' || a.status === 'paused'),
    [delegatedAgents],
  );

  // Resolve wallet name for an agent
  const getWalletName = (walletId: string) => {
    const w = wallets.find(w => w.id === walletId);
    return w?.name || walletId;
  };

  // Initial selection: from URL query param, or first available agent
  const initialAgentId = searchParams.get('agent') || availableAgents[0]?.id || '';
  const [selectedAgentId, setSelectedAgentId] = useState(initialAgentId);

  // If the URL param changes, sync
  useEffect(() => {
    const paramId = searchParams.get('agent');
    if (paramId && availableAgents.some(a => a.id === paramId)) {
      setSelectedAgentId(paramId);
    }
  }, [searchParams, availableAgents]);

  const selectedAgent = useMemo(
    () => availableAgents.find(a => a.id === selectedAgentId),
    [availableAgents, selectedAgentId],
  );
  const config = selectedAgent?.riskConfig;

  // ─── State ──────────────────────────────────────────────────────

  const [agentPickerOpen, setAgentPickerOpen] = useState(false);
  const [policyTypePickerOpen, setPolicyTypePickerOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<AgentPolicy | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [newPolicyType, setNewPolicyType] = useState<PolicyType | null>(null);

  // ─── Handlers ───────────────────────────────────────────────────

  const handleAgentSwitch = (agentId: string) => {
    setSelectedAgentId(agentId);
    setAgentPickerOpen(false);
  };

  // Sorted policies by priority
  const sortedPolicies = useMemo(() => {
    if (!config) return [];
    return [...config.policies].sort((a, b) => a.priority - b.priority);
  }, [config]);

  const enabledCount = useMemo(
    () => sortedPolicies.filter(p => p.enabled).length,
    [sortedPolicies],
  );

  const handleMoveUp = (policyId: string) => {
    const sorted = [...sortedPolicies];
    const idx = sorted.findIndex(p => p.id === policyId);
    if (idx <= 0) return;
    const newOrder = [...sorted];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    reorderPolicies(selectedAgentId, newOrder.map(p => p.id));
  };

  const handleMoveDown = (policyId: string) => {
    const sorted = [...sortedPolicies];
    const idx = sorted.findIndex(p => p.id === policyId);
    if (idx < 0 || idx >= sorted.length - 1) return;
    const newOrder = [...sorted];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    reorderPolicies(selectedAgentId, newOrder.map(p => p.id));
  };

  const handleSavePolicy = (data: Omit<AgentPolicy, 'id' | 'createdAt' | 'updatedAt' | 'priority'>) => {
    if (editingPolicy) {
      // Editing existing policy
      updatePolicy(selectedAgentId, editingPolicy.id, data);
    } else {
      // Adding new policy - addPolicy expects Omit<..., 'id' | 'createdAt' | 'updatedAt'>
      // We need to include priority
      const nextPriority = sortedPolicies.length > 0
        ? Math.max(...sortedPolicies.map(p => p.priority)) + 1
        : 0;
      addPolicy(selectedAgentId, { ...data, priority: nextPriority });
    }
    setEditingPolicy(null);
    setNewPolicyType(null);
  };

  const handleDeletePolicy = () => {
    if (editingPolicy) {
      removePolicy(selectedAgentId, editingPolicy.id);
      setEditingPolicy(null);
    }
  };

  // ─── Early returns ──────────────────────────────────────────────

  // No agents available
  if (availableAgents.length === 0) {
    return (
      <AppLayout title="Agent 风控管理" showBack>
        <div className="p-8 text-center">
          <Bot className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">暂无可管理的 Agent</p>
          <p className="text-xs text-muted-foreground mt-1">请先委托一个 Agent 访问您的钱包</p>
        </div>
      </AppLayout>
    );
  }

  // Selected agent not found (fallback)
  if (!selectedAgent || !config) {
    return (
      <AppLayout title="Agent 风控管理" showBack>
        <div className="p-8 text-center text-muted-foreground">未找到 Agent 配置</div>
      </AppLayout>
    );
  }

  return (
    <AppLayout title="Agent 风控管理" showBack>
      <div className="px-4 py-4 space-y-4">

        {/* ── 1. Agent Selector ──────────────────────────────── */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => setAgentPickerOpen(true)}
          className="w-full card-elevated p-4 flex items-center gap-3"
        >
          <Bot className="w-5 h-5 text-accent" />
          <div className="flex-1 text-left">
            <p className="text-sm font-medium">{selectedAgent.agentName}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {getWalletName(selectedAgent.walletId)}
            </p>
          </div>
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        </motion.button>

        {/* ── 2. Default Action Card ────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="card-elevated p-4"
        >
          <h3 className="font-medium text-sm mb-1 flex items-center gap-2">
            <Shield className="w-4 h-4 text-muted-foreground" /> 默认动作
          </h3>
          <p className="text-xs text-muted-foreground mb-3">
            当交易未匹配任何策略时：
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => updateDefaultAction(selectedAgentId, 'allow')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                config.defaultAction === 'allow'
                  ? 'bg-emerald-100 border-emerald-500 text-emerald-700'
                  : 'bg-muted text-muted-foreground border-transparent',
              )}
            >
              <CheckCircle2 className="h-4 w-4" />
              允许
            </button>
            <button
              type="button"
              onClick={() => updateDefaultAction(selectedAgentId, 'deny')}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                config.defaultAction === 'deny'
                  ? 'bg-red-100 border-red-500 text-red-700'
                  : 'bg-muted text-muted-foreground border-transparent',
              )}
            >
              <XCircle className="h-4 w-4" />
              拒绝
            </button>
          </div>

          <div className="flex items-start gap-1.5 mt-3">
            <Info className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground">
              当前默认：{config.defaultAction === 'allow' ? '允许所有未匹配的交易' : '拒绝所有未匹配的交易'}
            </p>
          </div>
        </motion.div>

        {/* ── 4. Evaluation Info Banner ──────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
        >
          <AlertBanner
            variant="info"
            icon={Info}
            size="sm"
            title="策略按优先级从上到下匹配，首条匹配的策略生效"
          />
        </motion.div>

        {/* ── 5. Policy List Header ─────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-sm">风控策略</h3>
            <span className="text-xs text-muted-foreground">
              {enabledCount}条生效中
            </span>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-1 h-8"
            onClick={() => setPolicyTypePickerOpen(true)}
          >
            <Plus className="w-3.5 h-3.5" />
            添加
          </Button>
        </motion.div>

        {/* ── 6. Policy List ────────────────────────────────── */}
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedPolicies.length > 0 ? (
              sortedPolicies.map((policy, idx) => (
                <motion.div
                  key={policy.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ delay: 0.12 + idx * 0.03 }}
                >
                  <PolicyCard
                    policy={policy}
                    index={idx}
                    isFirst={idx === 0}
                    isLast={idx === sortedPolicies.length - 1}
                    onToggleEnabled={() => togglePolicyEnabled(selectedAgentId, policy.id)}
                    onMoveUp={() => handleMoveUp(policy.id)}
                    onMoveDown={() => handleMoveDown(policy.id)}
                    onClick={() => {
                      setEditingPolicy(policy);
                      setNewPolicyType(null);
                      setEditDrawerOpen(true);
                    }}
                  />
                </motion.div>
              ))
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="card-elevated p-6 text-center"
              >
                <Info className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground font-medium">暂无风控策略</p>
                <p className="text-xs text-muted-foreground mt-1">
                  点击"添加"创建第一条策略
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>


      </div>

      {/* ── Agent Picker Drawer ──────────────────────────────── */}
      <Drawer open={agentPickerOpen} onOpenChange={setAgentPickerOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>选择 Agent</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-6 space-y-2">
            {availableAgents.map(agent => (
              <button
                key={agent.id}
                onClick={() => handleAgentSwitch(agent.id)}
                className={cn(
                  'w-full p-3 rounded-xl border flex items-center gap-3 text-left',
                  agent.id === selectedAgentId ? 'border-accent bg-accent/5' : 'border-border',
                )}
              >
                <Bot className="w-5 h-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium block truncate">{agent.agentName}</span>
                  <span className="text-xs text-muted-foreground block truncate">
                    {getWalletName(agent.walletId)}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {agent.status === 'paused' ? (
                    <span className="w-2 h-2 rounded-full bg-yellow-500" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                  <span className="text-[11px] text-muted-foreground">
                    {agent.status === 'paused' ? '已暂停' : '运行中'}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Policy Type Picker Drawer ────────────────────────── */}
      <Drawer open={policyTypePickerOpen} onOpenChange={setPolicyTypePickerOpen}>
        <DrawerContent>
          <DrawerHeader><DrawerTitle>选择策略类型</DrawerTitle></DrawerHeader>
          <div className="px-4 pb-6 space-y-2">
            {POLICY_TYPE_META.map(meta => {
              const Icon = POLICY_ICONS[meta.type];
              return (
                <button
                  key={meta.type}
                  onClick={() => {
                    setNewPolicyType(meta.type);
                    setEditingPolicy(null);
                    setPolicyTypePickerOpen(false);
                    setEditDrawerOpen(true);
                  }}
                  className="w-full p-3 rounded-xl border border-border flex items-center gap-3 text-left transition-colors"
                >
                  <div className="w-9 h-9 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium block">{meta.label}</span>
                    <span className="text-xs text-muted-foreground block mt-0.5">
                      {meta.description}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Policy Edit Drawer ───────────────────────────────── */}
      <PolicyEditDrawer
        open={editDrawerOpen}
        onOpenChange={(open) => {
          setEditDrawerOpen(open);
          if (!open) {
            setEditingPolicy(null);
            setNewPolicyType(null);
          }
        }}
        policy={editingPolicy}
        policyType={newPolicyType}
        onSave={handleSavePolicy}
        onDelete={editingPolicy ? handleDeletePolicy : undefined}
      />



    </AppLayout>
  );
}
