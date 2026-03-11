import { useMemo, useState } from 'react';
import { Users, Search, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Contact, ChainId } from '@/types/wallet';
import { getChainLabel } from '@/lib/chain-utils';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';

interface ContactDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: Contact[];
  onSelect: (contact: Contact) => void;
  selectedNetwork?: ChainId;
}

export function ContactDrawer({
  open,
  onOpenChange,
  contacts,
  onSelect,
  selectedNetwork,
}: ContactDrawerProps) {
  const [searchQuery, setSearchQuery] = useState('');

  // Filter contacts by network compatibility and search query
  const filteredContacts = useMemo(() => {
    let result = contacts;

    // Apply network filter
    if (selectedNetwork && selectedNetwork !== 'all') {
      // EVM compatible networks
      const evmNetworks = ['ethereum', 'bsc'];
      if (evmNetworks.includes(selectedNetwork)) {
        result = result.filter(contact => evmNetworks.includes(contact.network));
      } else {
        result = result.filter(contact => contact.network === selectedNetwork);
      }
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        contact =>
          contact.name.toLowerCase().includes(query) ||
          contact.address.toLowerCase().includes(query)
      );
    }

    return result;
  }, [contacts, selectedNetwork, searchQuery]);

  const handleSelect = (contact: Contact) => {
    onSelect(contact);
    onOpenChange(false);
  };

  // Reset search when drawer closes
  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      setSearchQuery('');
    }
    onOpenChange(newOpen);
  };

  return (
    <Drawer open={open} onOpenChange={handleOpenChange}>
      <DrawerContent className="max-h-[70vh] flex flex-col">
        <DrawerHeader className="border-b border-border/50 pb-3 flex-shrink-0">
          <DrawerTitle>选择联系人</DrawerTitle>
        </DrawerHeader>

        {/* Search Bar */}
        <div className="px-4 pt-3 pb-2 flex-shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="搜索名称或地址"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 bg-muted/50 border-0 h-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 min-h-0">
          <AnimatePresence mode="wait">
            {filteredContacts.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-12"
              >
                <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-3">
                  <Users className="w-6 h-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm">暂无联系人</p>
              </motion.div>
            ) : (
              <motion.div
                key="list"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-2"
              >
                {filteredContacts.map((contact, index) => (
                  <motion.button
                    key={contact.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.03 }}
                    onClick={() => handleSelect(contact)}
                    className={cn(
                      "w-full p-4 rounded-2xl bg-card border border-border/50",
                      "flex flex-col gap-1 text-left",
                      "hover:bg-muted/50 transition-colors"
                    )}
                  >
                    {/* Name + Chain Label */}
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-foreground truncate">
                        {contact.name || '未命名地址'}
                      </span>
                      <span className="text-xs text-muted-foreground px-1.5 py-0.5 bg-muted rounded flex-shrink-0">
                        {getChainLabel(contact.network as ChainId)}
                      </span>
                    </div>
                    {/* Full Address */}
                    <p className="font-mono text-sm text-muted-foreground break-all">
                      {contact.address}
                    </p>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DrawerContent>
    </Drawer>
  );
}
