import { useRef, useState } from 'react';
import { Plus, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssistantView, type AssistantViewHandle } from '@/components/chat/AssistantView';
import { ChatHistoryDrawer } from '@/components/chat/ChatHistoryDrawer';
import { HeaderActions } from '@/components/HeaderActions';
import { ProfileSidebar } from '@/components/ProfileSidebar';
import { useChatHistory } from '@/hooks/useChatHistory';

export default function AIAssistant() {
  const assistantRef = useRef<AssistantViewHandle>(null);
  const [showProfileDrawer, setShowProfileDrawer] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const chatHistory = useChatHistory();

  return (
    <ChatHistoryDrawer
      open={historyOpen}
      onOpenChange={setHistoryOpen}
      sessions={chatHistory.sessions}
      currentSessionId={chatHistory.currentSessionId}
      onSelectSession={chatHistory.switchSession}
      onDeleteSession={chatHistory.deleteSession}
    >
    <ProfileSidebar open={showProfileDrawer} onOpenChange={setShowProfileDrawer}>
    <AppLayout
      showNav
      title="AI 助手"
      pageBg="bg-page"
      rightAction={<HeaderActions onMenuClick={() => setShowProfileDrawer(true)} />}
      leftAction={
        <div className="flex items-center gap-3">
          <motion.button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-background card-elevated no-card-shadow"
            onClick={() => setHistoryOpen(true)}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <History className="w-5 h-5" strokeWidth={1} style={{ color: '#000000' }} />
          </motion.button>
          <motion.button
            className="flex items-center justify-center w-9 h-9 rounded-full bg-background card-elevated no-card-shadow"
            onClick={() => assistantRef.current?.startNewSession()}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          >
            <Plus className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
          </motion.button>
        </div>
      }
    >
      <AssistantView ref={assistantRef} chatHistory={chatHistory} />
    </AppLayout>
    </ProfileSidebar>
    </ChatHistoryDrawer>
  );
}
