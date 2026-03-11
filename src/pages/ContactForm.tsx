import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scan, AlertTriangle, Check, Loader2 } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/lib/toast';
import { ChainId, SUPPORTED_CHAINS, RiskColor } from '@/types/wallet';
import { ChainIcon } from '@/components/ChainIcon';
import { QRScanner } from '@/components/QRScanner';
import { cn } from '@/lib/utils';
import { validateAddress, getAddressPlaceholder, getChainName } from '@/lib/chain-utils';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';

const AVAILABLE_CHAINS = SUPPORTED_CHAINS.filter(c => c.id !== 'all');

export default function ContactFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { contacts, addContact, updateContact, scanAddressRisk } = useWallet();

  const isEditing = !!id;
  const existingContact = isEditing ? contacts.find(c => c.id === id) : null;

  const [name, setName] = useState(existingContact?.name || '');
  const [address, setAddress] = useState(existingContact?.address || '');
  const [network, setNetwork] = useState<ChainId>(existingContact?.network as ChainId || 'ethereum');
  const [notes, setNotes] = useState(existingContact?.notes || '');

  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showNetworkDrawer, setShowNetworkDrawer] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [riskResult, setRiskResult] = useState<{ score: RiskColor; reasons: string[] } | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const isValidAddress = validateAddress(address, network);

  // Scan address risk when address changes
  useEffect(() => {
    if (isValidAddress && address) {
      setIsScanning(true);
      const timer = setTimeout(async () => {
        const result = await scanAddressRisk(address);
        setRiskResult({ score: result.score, reasons: result.reasons });
        setIsScanning(false);
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setRiskResult(null);
    }
  }, [address, isValidAddress, scanAddressRisk]);

  const handleQRScan = (data: { address: string }) => {
    setAddress(data.address);
    setShowQRScanner(false);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('请输入联系人名称');
      return;
    }

    if (!address.trim()) {
      toast.error('请输入地址');
      return;
    }

    if (!isValidAddress) {
      toast.error('地址格式不正确', `请输入有效的 ${getChainName(network)} 地址`);
      return;
    }

    // Check for duplicate address
    const duplicate = contacts.find(
      c => c.address.toLowerCase() === address.toLowerCase() && c.id !== id
    );
    if (duplicate) {
      toast.error('地址已存在', `该地址已保存为 "${duplicate.name || '未命名地址'}"`);
      return;
    }

    setIsSaving(true);

    try {
      const contactData = {
        name: name.trim(),
        address: address.trim(),
        network,
        tags: [],
        isWhitelisted: false,
        isOfficial: false,
        notes: notes.trim(),
      };

      if (isEditing && id) {
        updateContact(id, contactData);
        toast.success('联系人已更新', `${name} 的信息已保存`);
      } else {
        addContact(contactData);
        toast.success('联系人已添加', `${name} 已添加到地址簿`);
      }

      navigate('/profile/contacts');
    } catch (error) {
      toast.error('保存失败', '请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const selectedChain = AVAILABLE_CHAINS.find(c => c.id === network) || AVAILABLE_CHAINS[0];

  return (
    <AppLayout
      showNav={false}
      title={isEditing ? '编辑联系人' : '添加联系人'}
      showBack
      onBack={() => navigate('/profile/contacts')}
    >
      <div className="flex flex-col h-full">
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">名称 *</Label>
            <Input
              id="name"
              placeholder="输入联系人名称"
              value={name}
              onChange={(e) => setName(e.target.value.slice(0, 20))}
              maxLength={20}
            />
            <p className="text-xs text-muted-foreground text-right">
              {name.length}/20
            </p>
          </div>

          {/* Network */}
          <div className="space-y-2">
            <Label>网络 *</Label>
            <Drawer open={showNetworkDrawer} onOpenChange={setShowNetworkDrawer}>
              <DrawerTrigger asChild>
                <button className="w-full flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
                  <ChainIcon chainId={network} size="sm" />
                  <span className="flex-1 text-left">{selectedChain.name}</span>
                </button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>选择网络</DrawerTitle>
                </DrawerHeader>
                <div className="p-4 space-y-2">
                  {AVAILABLE_CHAINS.map((chain) => (
                    <button
                      key={chain.id}
                      onClick={() => {
                        setNetwork(chain.id);
                        setShowNetworkDrawer(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-3 p-4 rounded-xl transition-colors",
                        network === chain.id
                          ? "bg-primary/10 border border-primary"
                          : "bg-muted/50 border border-transparent hover:bg-muted"
                      )}
                    >
                      <ChainIcon chainId={chain.id} size="sm" />
                      <span className="flex-1 text-left font-medium">{chain.name}</span>
                      {network === chain.id && (
                        <Check className="w-5 h-5 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </DrawerContent>
            </Drawer>
          </div>

          {/* Address */}
          <div className="space-y-2">
            <Label htmlFor="address">地址 *</Label>
            <div className="relative">
              <Input
                id="address"
                placeholder={getAddressPlaceholder(network)}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="pr-12 font-mono text-sm"
              />
              <button
                onClick={() => setShowQRScanner(true)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 hover:bg-muted rounded-lg transition-colors"
              >
                <Scan className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            {/* Address validation & risk */}
            {address && (
              <div className="space-y-2">
                {!isValidAddress && (
                  <p className="text-xs text-destructive">
                    地址格式不正确
                  </p>
                )}
                {isScanning && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    正在扫描地址风险...
                  </div>
                )}
                {riskResult && !isScanning && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-3 rounded-lg text-sm",
                      riskResult.score === 'green' && "bg-success/10 text-success",
                      riskResult.score === 'yellow' && "bg-warning/10 text-warning",
                      riskResult.score === 'red' && "bg-destructive/10 text-destructive"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      {riskResult.score === 'green' ? (
                        <Check className="w-4 h-4" />
                      ) : (
                        <AlertTriangle className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {riskResult.score === 'green' && '地址安全'}
                        {riskResult.score === 'yellow' && '中等风险'}
                        {riskResult.score === 'red' && '高风险地址'}
                      </span>
                    </div>
                    {riskResult.reasons.length > 0 && (
                      <ul className="mt-2 space-y-1 text-xs opacity-80">
                        {riskResult.reasons.map((reason, i) => (
                          <li key={i}>• {reason}</li>
                        ))}
                      </ul>
                    )}
                  </motion.div>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">备注</Label>
            <Textarea
              id="notes"
              placeholder="添加备注信息（可选）"
              value={notes}
              onChange={(e) => setNotes(e.target.value.slice(0, 200))}
              rows={3}
              maxLength={200}
            />
            <p className="text-xs text-muted-foreground text-right">
              {notes.length}/200
            </p>
          </div>
        </div>

        {/* Save Button */}
        <div className="p-4 border-t border-border/50">
          <Button
            onClick={handleSave}
            disabled={isSaving || !name || !address || !isValidAddress}
            size="lg"
            className="w-full"
          >
            {isSaving ? '保存中...' : (isEditing ? '保存修改' : '添加联系人')}
          </Button>
        </div>
      </div>

      {/* QR Scanner */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
    </AppLayout>
  );
}
