import { useRef, useState } from 'react';
import { Plus, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssistantView, type AssistantViewHandle } from '@/components/chat/AssistantView';
import { ChatHistoryDrawer } from '@/components/chat/ChatHistoryDrawer';
import { useChatHistory } from '@/hooks/useChatHistory';

export default function AIAssistant() {
  const assistantRef = useRef<AssistantViewHandle>(null);
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
    <AppLayout
      showNav
      title="AI 助手"
      pageBg="bg-page"
      rightAction={
        <motion.button
          className="flex items-center justify-center w-9 h-9"
          onClick={() => assistantRef.current?.startNewSession()}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Plus className="w-5 h-5" strokeWidth={1.5} style={{ color: '#000000' }} />
        </motion.button>
      }
      leftAction={
        <motion.button
          className="flex items-center justify-center w-9 h-9"
          onClick={() => setHistoryOpen(true)}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <History className="w-5 h-5" strokeWidth={1} style={{ color: '#000000' }} />
        </motion.button>
      }
    >
      <AssistantView ref={assistantRef} chatHistory={chatHistory} />
    </AppLayout>
    </ChatHistoryDrawer>
  );
}
