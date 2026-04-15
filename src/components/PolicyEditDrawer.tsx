import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ArrowUpDown, FileCode, MapPin, Coins, Link,
  Plus, Trash2, CheckCircle2, XCircle, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils';
import { toast } from '@/lib/toast';
import type {
  AgentPolicy, PolicyType, PolicyEffect,
  TransferRulesConfig, ContractCallRulesConfig, ContractCallEntry,
  AddressRulesConfig, AddressEntry, TokenRulesConfig, TokenEntry,
  ChainRulesConfig, ChainId,
} from '@/types/wallet';

// ─── Props ──────────────────────────────────────────────────────────

interface PolicyEditDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  policy: AgentPolicy | null;
  policyType: PolicyType | null;
  onSave: (data: Omit<AgentPolicy, 'id' | 'createdAt' | 'updatedAt' | 'priority'>) => void;
  onDelete?: () => void;
}

// ─── Constants ──────────────────────────────────────────────────────

const CHAIN_OPTIONS: { value: Exclude<ChainId, 'all'>; label: string }[] = [
  { value: 'ethereum', label: 'Ethereum' },
  { value: 'bsc', label: 'BSC' },
  { value: 'tron', label: 'Tron' },
  { value: 'solana', label: 'Solana' },
];

const POLICY_TYPE_LABELS: Record<PolicyType, string> = {
  transfer_rules: '转账规则',
  contract_call_rules: '合约调用规则',
  address_rules: '地址规则',
  token_rules: '代币规则',
  chain_rules: '链规则',
};

// ─── Component ──────────────────────────────────────────────────────

export default function PolicyEditDrawer({
  open,
  onOpenChange,
  policy,
  policyType,
  onSave,
  onDelete,
}: PolicyEditDrawerProps) {
  // Common state
  const [name, setName] = useState('');
  const [effect, setEffect] = useState<PolicyEffect>('allow');

  // TransferRules state
  const [maxValuePerTx, setMaxValuePerTx] = useState('');
  const [maxValuePerHour, setMaxValuePerHour] = useState('');
  const [maxValuePerDay, setMaxValuePerDay] = useState('');
  const [maxValuePerWeek, setMaxValuePerWeek] = useState('');
  const [maxValuePerMonth, setMaxValuePerMonth] = useState('');
  const [maxCountPerHour, setMaxCountPerHour] = useState('');
  const [maxCountPerDay, setMaxCountPerDay] = useState('');
  const [maxCountPerWeek, setMaxCountPerWeek] = useState('');
  const [maxCountPerMonth, setMaxCountPerMonth] = useState('');

  // ContractCallRules state
  const [contracts, setContracts] = useState<ContractCallEntry[]>([]);
  const [contractMaxValuePerTx, setContractMaxValuePerTx] = useState('');
  const [contractMaxCountPerDay, setContractMaxCountPerDay] = useState('');

  // AddressRules state
  const [addresses, setAddresses] = useState<AddressEntry[]>([]);

  // TokenRules state
  const [tokens, setTokens] = useState<TokenEntry[]>([]);

  // ChainRules state
  const [selectedChains, setSelectedChains] = useState<Exclude<ChainId, 'all'>[]>([]);

  // Delete confirmation dialog
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // ─── Helpers ───────────────────────────────────────────────────────

  const numOrUndefined = (v: string): number | undefined => {
    const n = Number(v);
    return v.trim() === '' || isNaN(n) ? undefined : n;
  };

  const numToStr = (v: number | undefined): string =>
    v !== undefined && v !== null ? String(v) : '';

  // ─── Reset / init on open ─────────────────────────────────────────

  useEffect(() => {
    if (open) {
      if (policy) {
        // Editing existing policy
        setName(policy.name);
        setEffect(policy.effect);

        switch (policy.type) {
          case 'transfer_rules': {
            const c = policy.config;
            setMaxValuePerTx(numToStr(c.maxValuePerTx));
            setMaxValuePerHour(numToStr(c.maxValuePerHour));
            setMaxValuePerDay(numToStr(c.maxValuePerDay));
            setMaxValuePerWeek(numToStr(c.maxValuePerWeek));
            setMaxValuePerMonth(numToStr(c.maxValuePerMonth));
            setMaxCountPerHour(numToStr(c.maxCountPerHour));
            setMaxCountPerDay(numToStr(c.maxCountPerDay));
            setMaxCountPerWeek(numToStr(c.maxCountPerWeek));
            setMaxCountPerMonth(numToStr(c.maxCountPerMonth));
            break;
          }
          case 'contract_call_rules': {
            const c = policy.config;
            setContracts(c.contracts.map((e) => ({ ...e })));
            setContractMaxValuePerTx(numToStr(c.maxValuePerTx));
            setContractMaxCountPerDay(numToStr(c.maxCountPerDay));
            break;
          }
          case 'address_rules': {
            setAddresses(policy.config.addresses.map((e) => ({ ...e })));
            break;
          }
          case 'token_rules': {
            setTokens(policy.config.tokens.map((e) => ({ ...e })));
            break;
          }
          case 'chain_rules': {
            setSelectedChains([...policy.config.chains]);
            break;
          }
        }
      } else {
        // Creating new policy — reset everything
        setName('');
        setEffect('allow');
        setMaxValuePerTx('');
        setMaxValuePerHour('');
        setMaxValuePerDay('');
        setMaxValuePerWeek('');
        setMaxValuePerMonth('');
        setMaxCountPerHour('');
        setMaxCountPerDay('');
        setMaxCountPerWeek('');
        setMaxCountPerMonth('');
        setContracts([]);
        setContractMaxValuePerTx('');
        setContractMaxCountPerDay('');
        setAddresses([]);
        setTokens([]);
        setSelectedChains([]);
      }
    }
  }, [open, policy]);

  // ─── Derived ──────────────────────────────────────────────────────

  const currentType = policy?.type ?? policyType;
  const isEditing = policy !== null;

  // ─── Save handler ─────────────────────────────────────────────────

  const handleSave = () => {
    if (!name.trim()) {
      toast.error('请输入策略名称');
      return;
    }

    const type = policy?.type ?? policyType;
    if (!type) return;

    let config: AgentPolicy['config'];

    switch (type) {
      case 'transfer_rules': {
        const transferConfig: TransferRulesConfig = {};
        const vpt = numOrUndefined(maxValuePerTx);
        const vph = numOrUndefined(maxValuePerHour);
        const vpd = numOrUndefined(maxValuePerDay);
        const vpw = numOrUndefined(maxValuePerWeek);
        const vpm = numOrUndefined(maxValuePerMonth);
        const cph = numOrUndefined(maxCountPerHour);
        const cpd = numOrUndefined(maxCountPerDay);
        const cpw = numOrUndefined(maxCountPerWeek);
        const cpm = numOrUndefined(maxCountPerMonth);
        if (vpt !== undefined) transferConfig.maxValuePerTx = vpt;
        if (vph !== undefined) transferConfig.maxValuePerHour = vph;
        if (vpd !== undefined) transferConfig.maxValuePerDay = vpd;
        if (vpw !== undefined) transferConfig.maxValuePerWeek = vpw;
        if (vpm !== undefined) transferConfig.maxValuePerMonth = vpm;
        if (cph !== undefined) transferConfig.maxCountPerHour = cph;
        if (cpd !== undefined) transferConfig.maxCountPerDay = cpd;
        if (cpw !== undefined) transferConfig.maxCountPerWeek = cpw;
        if (cpm !== undefined) transferConfig.maxCountPerMonth = cpm;
        config = transferConfig;
        break;
      }
      case 'contract_call_rules': {
        const contractConfig: ContractCallRulesConfig = {
          contracts: contracts.filter((c) => c.contractAddress.trim() !== ''),
        };
        const mvpt = numOrUndefined(contractMaxValuePerTx);
        const mcpd = numOrUndefined(contractMaxCountPerDay);
        if (mvpt !== undefined) contractConfig.maxValuePerTx = mvpt;
        if (mcpd !== undefined) contractConfig.maxCountPerDay = mcpd;
        config = contractConfig;
        break;
      }
      case 'address_rules': {
        const addressConfig: AddressRulesConfig = {
          addresses: addresses.filter((a) => a.address.trim() !== ''),
        };
        config = addressConfig;
        break;
      }
      case 'token_rules': {
        const tokenConfig: TokenRulesConfig = {
          tokens: tokens.filter((t) => t.symbol.trim() !== ''),
        };
        config = tokenConfig;
        break;
      }
      case 'chain_rules': {
        const chainConfig: ChainRulesConfig = {
          chains: selectedChains,
        };
        config = chainConfig;
        break;
      }
      default:
        return;
    }

    onSave({
      name: name.trim(),
      type,
      effect,
      enabled: policy?.enabled ?? true,
      config,
    } as Omit<AgentPolicy, 'id' | 'createdAt' | 'updatedAt' | 'priority'>);

    onOpenChange(false);
    toast.success(isEditing ? '策略已更新' : '策略已添加');
  };

  // ─── Delete handler ───────────────────────────────────────────────

  const handleDelete = () => {
    setShowDeleteDialog(false);
    onDelete?.();
    onOpenChange(false);
    toast.success('策略已删除');
  };

  // ─── Contract entry helpers ───────────────────────────────────────

  const addContract = () => {
    setContracts((prev) => [
      ...prev,
      { contractAddress: '', label: '', network: 'ethereum' as ChainId },
    ]);
  };

  const updateContract = (index: number, field: keyof ContractCallEntry, value: string) => {
    setContracts((prev) =>
      prev.map((c, i) => (i === index ? { ...c, [field]: value } : c)),
    );
  };

  const removeContract = (index: number) => {
    setContracts((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Address entry helpers ────────────────────────────────────────

  const addAddress = () => {
    setAddresses((prev) => [
      ...prev,
      { address: '', label: '', network: 'ethereum' as ChainId },
    ]);
  };

  const updateAddress = (index: number, field: keyof AddressEntry, value: string) => {
    setAddresses((prev) =>
      prev.map((a, i) => (i === index ? { ...a, [field]: value } : a)),
    );
  };

  const removeAddress = (index: number) => {
    setAddresses((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Token entry helpers ──────────────────────────────────────────

  const addToken = () => {
    setTokens((prev) => [...prev, { symbol: '', name: '' }]);
  };

  const updateToken = (index: number, field: keyof TokenEntry, value: string) => {
    setTokens((prev) =>
      prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)),
    );
  };

  const removeToken = (index: number) => {
    setTokens((prev) => prev.filter((_, i) => i !== index));
  };

  // ─── Chain toggle ─────────────────────────────────────────────────

  const toggleChain = (chain: Exclude<ChainId, 'all'>) => {
    setSelectedChains((prev) =>
      prev.includes(chain)
        ? prev.filter((c) => c !== chain)
        : [...prev, chain],
    );
  };

  // ─── Sub-renders ──────────────────────────────────────────────────

  const renderTransferRulesForm = () => (
    <div className="space-y-4">
      {/* Amount limits */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Coins className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">金额限制</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">单笔上限 (USD)</label>
            <Input
              type="number"
              placeholder="不限制"
              value={maxValuePerTx}
              onChange={(e) => setMaxValuePerTx(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">小时额度</label>
            <Input
              type="number"
              placeholder="不限制"
              value={maxValuePerHour}
              onChange={(e) => setMaxValuePerHour(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">每日额度</label>
            <Input
              type="number"
              placeholder="不限制"
              value={maxValuePerDay}
              onChange={(e) => setMaxValuePerDay(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">每周额度</label>
            <Input
              type="number"
              placeholder="不限制"
              value={maxValuePerWeek}
              onChange={(e) => setMaxValuePerWeek(e.target.value)}
              className="mt-1"
            />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-muted-foreground">每月额度</label>
            <Input
              type="number"
              placeholder="不限制"
              value={maxValuePerMonth}
              onChange={(e) => setMaxValuePerMonth(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      {/* Count limits */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">频率限制</span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-muted-foreground">每小时笔数</label>
            <Input
              type="number"
              placeholder="不限制"
              value={maxCountPerHour}
              onChange={(e) => setMaxCountPerHour(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">每日笔数</label>
            <Input
              type="number"
              placeholder="不限制"
              value={maxCountPerDay}
              onChange={(e) => setMaxCountPerDay(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">每周笔数</label>
            <Input
              type="number"
              placeholder="不限制"
              value={maxCountPerWeek}
              onChange={(e) => setMaxCountPerWeek(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">每月笔数</label>
            <Input
              type="number"
              placeholder="不限制"
              value={maxCountPerMonth}
              onChange={(e) => setMaxCountPerMonth(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderContractCallRulesForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <FileCode className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">合约列表</span>
        </div>

        <div className="space-y-3">
          {contracts.map((contract, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-lg border bg-muted/30 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">合约地址</label>
                    <Input
                      placeholder="0x..."
                      value={contract.contractAddress}
                      onChange={(e) => updateContract(index, 'contractAddress', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">备注名称</label>
                    <Input
                      placeholder="可选"
                      value={contract.label ?? ''}
                      onChange={(e) => updateContract(index, 'label', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">网络</label>
                    <select
                      className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={contract.network}
                      onChange={(e) => updateContract(index, 'network', e.target.value)}
                    >
                      {CHAIN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  onClick={() => removeContract(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={addContract}
        >
          <Plus className="h-4 w-4 mr-1" />
          添加合约
        </Button>
      </div>

      {/* Additional limits */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-muted-foreground">单笔上限 (USD)</label>
          <Input
            type="number"
            placeholder="不限制"
            value={contractMaxValuePerTx}
            onChange={(e) => setContractMaxValuePerTx(e.target.value)}
            className="mt-1"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground">每日笔数</label>
          <Input
            type="number"
            placeholder="不限制"
            value={contractMaxCountPerDay}
            onChange={(e) => setContractMaxCountPerDay(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>
    </div>
  );

  const renderAddressRulesForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <MapPin className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">地址列表</span>
        </div>

        <div className="space-y-3">
          {addresses.map((addr, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-lg border bg-muted/30 p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 space-y-2">
                  <div>
                    <label className="text-xs text-muted-foreground">地址</label>
                    <Input
                      placeholder="0x... / T... / ..."
                      value={addr.address}
                      onChange={(e) => updateAddress(index, 'address', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">备注名称</label>
                    <Input
                      placeholder="可选"
                      value={addr.label ?? ''}
                      onChange={(e) => updateAddress(index, 'label', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">网络</label>
                    <select
                      className="mt-1 flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      value={addr.network}
                      onChange={(e) => updateAddress(index, 'network', e.target.value)}
                    >
                      {CHAIN_OPTIONS.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  onClick={() => removeAddress(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={addAddress}
        >
          <Plus className="h-4 w-4 mr-1" />
          添加地址
        </Button>
      </div>
    </div>
  );

  const renderTokenRulesForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Coins className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">代币列表</span>
        </div>

        <div className="space-y-3">
          {tokens.map((token, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="rounded-lg border bg-muted/30 p-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs text-muted-foreground">代币符号</label>
                    <Input
                      placeholder="如 USDT"
                      value={token.symbol}
                      onChange={(e) => updateToken(index, 'symbol', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-muted-foreground">代币名称</label>
                    <Input
                      placeholder="可选"
                      value={token.name ?? ''}
                      onChange={(e) => updateToken(index, 'name', e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground"
                  onClick={() => removeToken(index)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={addToken}
        >
          <Plus className="h-4 w-4 mr-1" />
          添加代币
        </Button>
      </div>
    </div>
  );

  const renderChainRulesForm = () => (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Link className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-semibold text-foreground">选择链</span>
        </div>

        <div className="flex flex-wrap gap-2">
          {CHAIN_OPTIONS.map((chain) => {
            const isSelected = selectedChains.includes(chain.value);
            return (
              <button
                key={chain.value}
                type="button"
                onClick={() => toggleChain(chain.value)}
                className={cn(
                  'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                  isSelected
                    ? 'bg-accent text-accent-foreground border-accent'
                    : 'bg-background text-muted-foreground border-input',
                )}
              >
                {chain.label}
              </button>
            );
          })}
        </div>

        {selectedChains.length === 0 && (
          <div className="flex items-center gap-1.5 mt-2 text-xs text-muted-foreground">
            <Info className="h-3.5 w-3.5" />
            <span>请至少选择一条链</span>
          </div>
        )}
      </div>
    </div>
  );

  const renderTypeForm = () => {
    switch (currentType) {
      case 'transfer_rules':
        return renderTransferRulesForm();
      case 'contract_call_rules':
        return renderContractCallRulesForm();
      case 'address_rules':
        return renderAddressRulesForm();
      case 'token_rules':
        return renderTokenRulesForm();
      case 'chain_rules':
        return renderChainRulesForm();
      default:
        return null;
    }
  };

  // ─── Render ───────────────────────────────────────────────────────

  return (
    <>
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent className="max-h-[80%] flex flex-col">
          <DrawerHeader className="text-left shrink-0">
            <DrawerTitle>
              {isEditing ? '编辑策略' : '添加策略'}
              {currentType && (
                <span className="ml-2 text-sm font-normal text-muted-foreground">
                  {POLICY_TYPE_LABELS[currentType]}
                </span>
              )}
            </DrawerTitle>
          </DrawerHeader>

          <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4">
            <div className="space-y-4">
              {/* ── Common section ────────────────────────────── */}

              {/* Policy name */}
              <div>
                <label className="text-xs text-muted-foreground">策略名称</label>
                <Input
                  placeholder="输入策略名称"
                  maxLength={30}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1"
                />
                <div className="mt-1 text-right text-xs text-muted-foreground">
                  {name.length}/30
                </div>
              </div>

              {/* Effect toggle */}
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">策略效果</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setEffect('allow')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                      effect === 'allow'
                        ? 'bg-success/10 border-emerald-500 text-success'
                        : 'bg-background border-input text-muted-foreground',
                    )}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    允许
                  </button>
                  <button
                    type="button"
                    onClick={() => setEffect('deny')}
                    className={cn(
                      'flex-1 flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2.5 text-sm font-medium transition-colors',
                      effect === 'deny'
                        ? 'bg-destructive/10 border-red-500 text-destructive'
                        : 'bg-background border-input text-muted-foreground',
                    )}
                  >
                    <XCircle className="h-4 w-4" />
                    拒绝
                  </button>
                </div>
              </div>

              {/* ── Type-specific form ────────────────────────── */}
              {currentType && renderTypeForm()}

              {/* ── Footer actions ────────────────────────────── */}
              <div className="pt-2 space-y-2">
                <Button className="w-full" onClick={handleSave}>
                  保存
                </Button>

                {isEditing && onDelete && (
                  <Button
                    variant="outline"
                    className="w-full text-destructive border-destructive/30"
                    onClick={() => setShowDeleteDialog(true)}
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    删除策略
                  </Button>
                )}
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* ── Delete confirmation dialog ─────────────────────────── */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除策略「{name}」吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
