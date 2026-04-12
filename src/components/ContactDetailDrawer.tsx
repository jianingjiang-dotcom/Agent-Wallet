import { useState, useEffect } from 'react';
import { Trash2, Copy, Check, ChevronDown, Scan } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useWallet } from '@/contexts/WalletContext';
import { toast } from '@/lib/toast';
import { Contact, AddressBookChainId, ADDRESS_BOOK_CHAINS } from '@/types/wallet';
import { ChainIcon } from '@/components/ChainIcon';
import { cn, copyToClipboard } from '@/lib/utils';
import { validateAddress, getAddressPlaceholder, getChainName } from '@/lib/chain-utils';
import { QRScanner } from '@/components/QRScanner';
import { ParsedQRData } from '@/lib/qr-parser';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface ContactDetailDrawerProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode?: 'view' | 'add';
}

export function ContactDetailDrawer({ 
  contact, 
  open, 
  onOpenChange,
  mode = 'view'
}: ContactDetailDrawerProps) {
  const { contacts, addContact, updateContact, removeContact } = useWallet();

  const isAddMode = mode === 'add';

  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [network, setNetwork] = useState<AddressBookChainId>('evm');
  const [notes, setNotes] = useState('');
  const [copied, setCopied] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showNetworkDrawer, setShowNetworkDrawer] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);


  // Helper to normalize chain to address book format
  const normalizeChainForAddressBook = (chainId: string): AddressBookChainId => {
    if (chainId === 'ethereum' || chainId === 'bsc') return 'evm';
    return chainId as AddressBookChainId;
  };

  // Reset form when drawer opens or contact changes
  useEffect(() => {
    if (open) {
      if (isAddMode) {
        // Reset to empty state for add mode
        setName('');
        setAddress('');
        setNetwork('evm');
        setNotes('');
        setHasChanges(false);
      } else if (contact) {
        // Populate with contact data for edit mode
        setName(contact.name || '');
        setAddress(contact.address);
        setNetwork(normalizeChainForAddressBook(contact.network));
        setNotes(contact.notes || '');
        setHasChanges(false);
      }
    }
  }, [open, contact, isAddMode]);

  // Track changes for edit mode
  useEffect(() => {
    if (!isAddMode && contact) {
      const changed = 
        name !== (contact.name || '') ||
        address !== contact.address ||
        network !== contact.network ||
        notes !== (contact.notes || '');
      setHasChanges(changed);
    }
  }, [name, address, network, notes, contact, isAddMode]);

  const isValidAddress = validateAddress(address, network);

  // Show validation error only when user has entered something
  const showAddressError = address.length > 0 && !isValidAddress;


  const handleCopyAddress = async () => {
    if (!address) return;
    const ok = await copyToClipboard(address);
    if (ok) {
      setCopied(true);
      toast.success('已复制');
      setTimeout(() => setCopied(false), 2000);
    } else {
      toast.error('复制失败');
    }
  };

  const handleSave = async () => {
    // Validate name
    if (!name.trim()) {
      toast.error('请输入联系人名称');
      return;
    }

    // Validate address
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
      c => c.address.toLowerCase() === address.toLowerCase() && c.id !== contact?.id
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
        notes: notes.trim(),
        tags: [],
        isWhitelisted: false,
        isOfficial: false,
      };

      if (isAddMode) {
        addContact(contactData);
        toast.success('联系人已添加', `${name} 已添加到地址簿`);
        onOpenChange(false);
      } else if (contact) {
        updateContact(contact.id, contactData);
        toast.success('联系人已更新', `${name} 的信息已保存`);
        onOpenChange(false);
      }
    } catch (error) {
      toast.error('保存失败', '请稍后重试');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    if (!contact) return;
    removeContact(contact.id);
    toast.success('联系人已删除', `${contact.name || '未命名地址'} 已从地址簿移除`);
    onOpenChange(false);
    setShowDeleteDialog(false);
  };

  const handleClose = () => {
    // Reset state when closing
    setShowDeleteDialog(false);
    setShowNetworkDrawer(false);
    setShowQRScanner(false);
    onOpenChange(false);
  };

  const handleQRScan = (data: ParsedQRData) => {
    if (data.address) {
      setAddress(data.address);
      // Auto-detect network from QR if available, normalize to address book format
      if (data.network) {
        setNetwork(normalizeChainForAddressBook(data.network));
      }
    }
  };

  const selectedChain = ADDRESS_BOOK_CHAINS.find(c => c.id === network) || ADDRESS_BOOK_CHAINS[0];

  // For view mode, don't render if no contact
  if (!isAddMode && !contact) return null;

  // Determine if save button should be enabled
  const canSave = isAddMode 
    ? (name.trim() && address.trim() && isValidAddress)
    : (hasChanges && name.trim() && address.trim() && isValidAddress);

  return (
    <>
      <Drawer open={open} onOpenChange={handleClose}>
        <DrawerContent className="max-h-[85vh]">
          <DrawerHeader className="text-left">
            <DrawerTitle>{isAddMode ? '添加联系人' : '联系人详情'}</DrawerTitle>
          </DrawerHeader>

          <div className="flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto px-4 pb-4 space-y-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="drawer-name">名称 *</Label>
                <Input
                  id="drawer-name"
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
                  <button 
                    onClick={() => setShowNetworkDrawer(true)}
                    className="w-full flex items-center gap-3 h-12 px-3 rounded-xl bg-background border border-input transition-colors"
                  >
                    <ChainIcon chainId={network} size="sm" />
                    <span className="flex-1 text-left font-medium">{selectedChain.name}</span>
                    <ChevronDown className="w-4 h-4 text-muted-foreground" />
                  </button>
                  <DrawerContent>
                    <DrawerHeader>
                      <DrawerTitle>选择网络</DrawerTitle>
                    </DrawerHeader>
                    <div className="p-4 space-y-2">
                      {ADDRESS_BOOK_CHAINS.map((chain) => (
                        <button
                          key={chain.id}
                          onClick={() => {
                            const oldIsEVM = network === 'evm';
                            const newIsEVM = chain.id === 'evm';
                            setNetwork(chain.id);
                            setShowNetworkDrawer(false);
                            // Clear address if switching between incompatible networks
                            if (oldIsEVM !== newIsEVM && address) {
                              setAddress('');
                            }
                          }}
                          className={cn(
                            "w-full flex items-center gap-3 p-4 rounded-xl transition-colors",
                            network === chain.id
                              ? "bg-primary/10 border border-primary"
                              : "bg-muted/50 border border-transparent"
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
                <Label htmlFor="drawer-address">地址 *</Label>
                <div className="relative">
                  <Input
                    id="drawer-address"
                    placeholder={getAddressPlaceholder(network)}
                    value={address}
                    onChange={(e) => setAddress(e.target.value.trim())}
                    className="font-mono text-sm pr-24"
                  />
                  <div className="absolute right-1 top-1/2 -translate-y-1/2 flex">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-9 w-9"
                      onClick={() => setShowQRScanner(true)}
                    >
                      <Scan className="w-5 h-5 text-muted-foreground" />
                    </Button>
                    {!isAddMode && address && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-9 w-9"
                        onClick={handleCopyAddress}
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    )}
                  </div>
                </div>

                {/* Address validation error */}
                {showAddressError && (
                  <p className="text-xs text-destructive mt-1.5">
                    地址格式不正确
                  </p>
                )}

              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label htmlFor="drawer-notes">备注</Label>
                <Textarea
                  id="drawer-notes"
                  placeholder="添加备注信息（可选）"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, 200))}
                  rows={2}
                  maxLength={200}
                />
                <p className="text-xs text-muted-foreground text-right">
                  {notes.length}/200
                </p>
              </div>

              {/* Delete Button - Only show in edit mode */}
              {!isAddMode && (
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-12 text-destructive"
                  onClick={() => setShowDeleteDialog(true)}
                >
                  <Trash2 className="w-5 h-5" />
                  删除联系人
                </Button>
              )}
            </div>

            {/* Bottom Actions */}
            <div className="p-4 border-t border-border/50">
              <Button
                onClick={handleSave}
                disabled={isSaving || !canSave}
                size="lg"
                className="w-full"
              >
                {isSaving ? '保存中...' : (isAddMode ? '添加联系人' : '确认修改')}
              </Button>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Delete Confirmation - Only for edit mode */}
      {!isAddMode && contact && (
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                确定要删除联系人 "{contact.name || '未命名地址'}" 吗？此操作无法撤销。
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
      )}

      {/* QR Scanner */}
      <QRScanner
        isOpen={showQRScanner}
        onClose={() => setShowQRScanner(false)}
        onScan={handleQRScan}
      />
    </>
  );
}
