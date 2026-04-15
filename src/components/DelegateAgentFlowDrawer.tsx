import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wallet, Shield, Loader2, CheckCircle2, Fingerprint,
  ChevronRight, Eye, Send, FileCode, Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Drawer, DrawerContent, DrawerHeader, DrawerTitle,
} from '@/components/ui/drawer';
import { useWallet } from '@/contexts/WalletContext';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import {
  HumanAgent, DefaultPolicyAction,
  AgentPermissions, AGENT_PERMISSION_LIST, DEFAULT_AGENT_PERMISSIONS,
} from '@/types/wallet';

const PERMISSION_ICONS = { Eye, Send, FileCode, Settings } as Record<string, React.ComponentType<{ className?: string }>>;

interface DelegateAgentFlowDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agent: HumanAgent | null;
  onDelegated: () => void;
  /** When provided, skip wallet selection step */
  preSelectedWalletId?: string | null;
}

const stepTransition = {
  initial: { opacity: 0, x: 20 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -20 },
  transition: { duration: 0.2 },
};

// Steps: 0=SelectWallet, 1=Permissions, 2=RiskConfig, 3=Confirm
const STEP_WALLET = 0;
const STEP_PERMISSIONS = 1;
const STEP_RISK = 2;
const STEP_CONFIRM = 3;

const STEP_TITLES = ['选择钱包', '权限配置', '风控配置', '确认授权'];

export function DelegateAgentFlowDrawer({
  open, onOpenChange, agent, onDelegated, preSelectedWalletId,
}: DelegateAgentFlowDrawerProps) {
  const { wallets, delegateAgent, delegatedAgents } = useWallet();
  const userWallets = wallets.filter(w => w.origin === 'user_created');

  const hasPreSelectedWallet = !!preSelectedWalletId;
  const initialStep = hasPreSelectedWallet ? STEP_PERMISSIONS : STEP_WALLET;

  const [step, setStep] = useState(initialStep);
  const [selectedWalletId, setSelectedWalletId] = useState(preSelectedWalletId || '');
  const [permissions, setPermissions] = useState<AgentPermissions>({ ...DEFAULT_AGENT_PERMISSIONS });
  const [defaultAction, setDefaultAction] = useState<DefaultPolicyAction>('deny');
  const [dailyLimit, setDailyLimit] = useState('');
  const [isBioAuthing, setIsBioAuthing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Reset on open
  useEffect(() => {
    if (open) {
      setStep(hasPreSelectedWallet ? STEP_PERMISSIONS : STEP_WALLET);
      setSelectedWalletId(preSelectedWalletId || '');
      setPermissions({ ...DEFAULT_AGENT_PERMISSIONS });
      setDefaultAction('deny');
      setDailyLimit('');
      setIsBioAuthing(false);
      setIsSaving(false);
    }
  }, [open, hasPreSelectedWallet, preSelectedWalletId]);

  const selectedWallet = wallets.find(w => w.id === selectedWalletId);

  const getAddressPreview = (addresses: Record<string, string>) => {
    const firstAddr = Object.values(addresses).find(Boolean) || '';
    if (firstAddr.length <= 16) return firstAddr;
    return `${firstAddr.slice(0, 8)}...${firstAddr.slice(-6)}`;
  };

  const togglePermission = (key: keyof AgentPermissions) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const enabledPermissionLabels = AGENT_PERMISSION_LIST
    .filter(p => permissions[p.key])
    .map(p => p.label);

  const handleBiometricAuth = async () => {
    setIsBioAuthing(true);
    await new Promise(r => setTimeout(r, 1200));
    setIsBioAuthing(false);
    handleDelegate();
  };

  const handleDelegate = async () => {
    if (!agent || !selectedWalletId) return;
    // Defensive check: agent already delegated to another wallet
    const existingDelegation = delegatedAgents.find(
      da => da.principalId === agent.principalId && da.status !== 'revoked'
    );
    if (existingDelegation && existingDelegation.walletId !== selectedWalletId) {
      toast.error('该 Agent 已被其他钱包授权，无法重复授权');
      return;
    }
    setIsSaving(true);
    try {
      // Build initial policies from optional daily limit
      const initialPolicies: any[] = [];
      if (dailyLimit && Number(dailyLimit) > 0) {
        initialPolicies.push({
          name: '基础日限额',
          type: 'transfer_rules' as const,
          effect: 'allow' as const,
          enabled: true,
          priority: 0,
          config: { maxValuePerDay: Number(dailyLimit) },
        });
      }
      await delegateAgent(selectedWalletId, agent.principalId, agent.displayName || agent.principalId.slice(0, 10), permissions, {
        defaultAction,
        policies: initialPolicies,
      });
      toast.success('Agent 授权成功');
      onDelegated();
      onOpenChange(false);
    } catch {
      toast.error('授权失败，请重试');
    } finally {
      setIsSaving(false);
    }
  };

  if (!agent) return null;

  return (
    <Drawer open={open} onOpenChange={onOpenChange}>
      <DrawerContent className="max-h-[85vh]">
        <DrawerHeader>
          <DrawerTitle>{STEP_TITLES[step]}</DrawerTitle>
        </DrawerHeader>

        <div className="px-4 pb-6 overflow-y-auto">
          {/* Agent info banner */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/50 mb-4">
            <Shield className="w-4 h-4 text-muted-foreground shrink-0" />
            <span className="text-xs text-muted-foreground truncate">
              授权给 {agent.displayName || agent.principalId.slice(0, 15)}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* Step 0: Select Wallet */}
            {step === STEP_WALLET && (
              <motion.div key="step-wallet" {...stepTransition} className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">
                  选择一个钱包委托给此 Agent
                </p>
                {userWallets.length === 0 ? (
                  <div className="text-center py-8">
                    <Wallet className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">没有可用的钱包</p>
                  </div>
                ) : (
                  userWallets.map(w => (
                    <button
                      key={w.id}
                      onClick={() => {
                        setSelectedWalletId(w.id);
                        setStep(STEP_PERMISSIONS);
                      }}
                      className={cn(
                        'w-full p-3 rounded-xl border flex items-center gap-3 transition-all text-left',
                        'border-border active:bg-muted/50'
                      )}
                    >
                      <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
                        <Wallet className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{w.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {getAddressPreview(w.addresses)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                    </button>
                  ))
                )}
              </motion.div>
            )}

            {/* Step 1: Permissions */}
            {step === STEP_PERMISSIONS && (
              <motion.div key="step-permissions" {...stepTransition} className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  选择授权给此 Agent 的操作权限
                </p>

                <div className="space-y-1">
                  {AGENT_PERMISSION_LIST.map(perm => {
                    const Icon = PERMISSION_ICONS[perm.icon] || Eye;
                    const isOn = permissions[perm.key];
                    return (
                      <button
                        key={perm.key}
                        onClick={() => togglePermission(perm.key)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl transition-colors text-left"
                      >
                        <div className={cn(
                          'w-9 h-9 rounded-full flex items-center justify-center shrink-0',
                          isOn ? 'bg-accent/10' : 'bg-muted'
                        )}>
                          <Icon className={cn('w-4 h-4', isOn ? 'text-accent' : 'text-muted-foreground')} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={cn('text-sm font-medium', isOn ? 'text-foreground' : 'text-muted-foreground')}>
                            {perm.label}
                          </p>
                          <p className="text-xs text-muted-foreground">{perm.desc}</p>
                        </div>
                        <Switch
                          checked={isOn}
                          onCheckedChange={() => togglePermission(perm.key)}
                          onClick={e => e.stopPropagation()}
                        />
                      </button>
                    );
                  })}
                </div>

                <div className="flex gap-2 pt-2">
                  {!hasPreSelectedWallet && (
                    <Button variant="outline" className="flex-1" onClick={() => setStep(STEP_WALLET)}>
                      上一步
                    </Button>
                  )}
                  <Button className="flex-1" onClick={() => setStep(STEP_RISK)}>
                    下一步
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 2: Risk Config */}
            {step === STEP_RISK && (
              <motion.div key="step-risk" {...stepTransition} className="space-y-4">
                <div>
                  <p className="text-sm font-medium mb-2">默认动作</p>
                  <p className="text-xs text-muted-foreground mb-3">
                    未匹配任何策略的交易将：
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setDefaultAction('allow')}
                      className={cn(
                        'flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all',
                        defaultAction === 'allow'
                          ? 'border-emerald-500 bg-success/8 text-success dark:border-emerald-600'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      🟢 允许通过
                    </button>
                    <button
                      onClick={() => setDefaultAction('deny')}
                      className={cn(
                        'flex-1 py-2.5 px-3 rounded-xl border text-sm font-medium transition-all',
                        defaultAction === 'deny'
                          ? 'border-red-500 bg-destructive/8 text-destructive dark:border-red-600'
                          : 'border-border text-muted-foreground'
                      )}
                    >
                      🔴 拒绝交易
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium">基础日限额 (可选)</label>
                  <p className="text-xs text-muted-foreground mt-0.5 mb-2">
                    设置后将自动创建一条转账规则策略
                  </p>
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      placeholder="不限制"
                      value={dailyLimit}
                      onChange={e => setDailyLimit(e.target.value)}
                    />
                    <span className="text-sm text-muted-foreground shrink-0">USD</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-accent/5 border border-accent/20">
                  <span className="text-xs text-muted-foreground">
                    💡 创建后可在风控管理中详细配置策略
                  </span>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(STEP_PERMISSIONS)}>
                    上一步
                  </Button>
                  <Button className="flex-1" onClick={() => setStep(STEP_CONFIRM)}>
                    下一步
                  </Button>
                </div>
              </motion.div>
            )}

            {/* Step 3: Confirm */}
            {step === STEP_CONFIRM && (
              <motion.div key="step-confirm" {...stepTransition} className="space-y-4">
                <div className="space-y-3 p-3 rounded-xl bg-muted/30 border border-border/50">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Agent</span>
                    <span className="font-medium font-mono text-xs">
                      {agent.principalId.slice(0, 15)}...
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">钱包</span>
                    <span className="font-medium">{selectedWallet?.name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">权限</span>
                    <span className="font-medium text-xs text-right max-w-[60%]">
                      {enabledPermissionLabels.length > 0
                        ? enabledPermissionLabels.join('、')
                        : '无'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">默认动作</span>
                    <span className={cn(
                      'font-medium',
                      defaultAction === 'allow' ? 'text-success' : 'text-destructive'
                    )}>
                      {defaultAction === 'allow' ? '允许' : '拒绝'}
                    </span>
                  </div>
                  {dailyLimit && Number(dailyLimit) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">日限额</span>
                      <span className="font-medium">${Number(dailyLimit).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setStep(STEP_RISK)}>
                    上一步
                  </Button>
                  <Button
                    className="flex-1"
                    disabled={isBioAuthing || isSaving}
                    onClick={handleBiometricAuth}
                  >
                    {isBioAuthing ? (
                      <>
                        <Fingerprint className="w-4 h-4 mr-1.5 animate-pulse" />
                        验证中...
                      </>
                    ) : isSaving ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                        授权中...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4 mr-1.5" />
                        确认授权
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
