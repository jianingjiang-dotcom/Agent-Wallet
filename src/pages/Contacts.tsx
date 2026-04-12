import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Plus, Users, X } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ContactCard } from '@/components/ContactCard';
import { ContactDetailDrawer } from '@/components/ContactDetailDrawer';
import { useWallet } from '@/contexts/WalletContext';
import { Contact } from '@/types/wallet';

export default function ContactsPage() {
  const navigate = useNavigate();
  const { contacts } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'view' | 'add'>('view');

  // Sort by lastUsed (most recent first)
  const filteredContacts = useMemo(() => {
    let result = [...contacts];

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        contact =>
          contact.name.toLowerCase().includes(query) ||
          contact.address.toLowerCase().includes(query)
      );
    }

    // Sort by lastUsed
    result.sort((a, b) => {
      if (!a.lastUsed && !b.lastUsed) return 0;
      if (!a.lastUsed) return 1;
      if (!b.lastUsed) return -1;
      return new Date(b.lastUsed).getTime() - new Date(a.lastUsed).getTime();
    });

    return result;
  }, [contacts, searchQuery]);

  const handleContactClick = (contact: Contact) => {
    setSelectedContact(contact);
    setDrawerMode('view');
    setDrawerOpen(true);
  };

  const handleAddClick = () => {
    setSelectedContact(null);
    setDrawerMode('add');
    setDrawerOpen(true);
  };

  return (
    <>
      <AppLayout
        showNav={false}
        title="地址簿"
        showBack
        onBack={() => navigate('/profile')}
        rightAction={
          <Button
            variant="ghost"
            size="icon"
            onClick={handleAddClick}
          >
            <Plus className="w-5 h-5" />
          </Button>
        }
      >
        <div className="flex flex-col h-full">
          {/* Search Bar */}
          <div className="px-4 pt-2 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="搜索名称或地址"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-9 bg-muted/50 border-0"
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

          {/* Contacts List */}
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <AnimatePresence mode="wait">
              {filteredContacts.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="flex flex-col items-center justify-center h-full py-12"
                >
                  <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                    <Users className="w-10 h-10 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground mb-1">
                    {searchQuery ? '没有找到匹配的联系人' : '还没有联系人'}
                  </p>
                  <p className="text-sm text-muted-foreground/70 mb-4">
                    {searchQuery ? '尝试其他搜索词' : '添加常用地址，转账更便捷'}
                  </p>
                  {!searchQuery && (
                    <Button onClick={handleAddClick}>
                      添加第一个联系人
                    </Button>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="list"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  {filteredContacts.map((contact, index) => (
                    <motion.div
                      key={contact.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      <ContactCard
                        contact={contact}
                        onClick={() => handleContactClick(contact)}
                      />
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </AppLayout>

      <ContactDetailDrawer
        contact={selectedContact}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        mode={drawerMode}
      />
    </>
  );
}