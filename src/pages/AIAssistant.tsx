import { useRef, useState, useEffect } from 'react';
import { Menu } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { AssistantView, type AssistantViewHandle } from '@/components/chat/AssistantView';
import { ChatHistoryDrawer } from '@/components/chat/ChatHistoryDrawer';
import { useChatHistory } from '@/hooks/useChatHistory';

export default function AIAssistant() {
  const navigate = useNavigate();
  const assistantRef = useRef<AssistantViewHandle>(null);
  const [historyOpen, setHistoryOpen] = useState(false);
  const chatHistory = useChatHistory();

  // Clean up empty sessions on mount
  useEffect(() => {
    chatHistory.cleanEmptySessions();
  }, []);

  return (
    <ChatHistoryDrawer
      open={historyOpen}
      onOpenChange={setHistoryOpen}
      sessions={chatHistory.sessions.filter(s => s.messages.length > 0)}
      currentSessionId={chatHistory.currentSessionId}
      onSelectSession={chatHistory.switchSession}
      onDeleteSession={chatHistory.deleteSession}
      onNewSession={() => { assistantRef.current?.startNewSession(); setHistoryOpen(false); }}
    >
    <AppLayout
      showNav={false}
      showBack
      onBack={() => navigate(-1)}
      title="AI 助手"
      showSecurityBanner={false}
      pageBg="bg-page"
      rightAction={
        <motion.button
          className="flex items-center justify-center"
          onClick={() => setHistoryOpen(true)}
          whileTap={{ scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
        >
          <Menu className="w-6 h-6" strokeWidth={1.5} style={{ color: '#000000' }} />
        </motion.button>
      }
    >
      <AssistantView ref={assistantRef} chatHistory={chatHistory} hideNav />
    </AppLayout>
    </ChatHistoryDrawer>
  );
}
