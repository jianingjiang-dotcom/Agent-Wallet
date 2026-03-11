import { useRef } from 'react';
import { Plus, History } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Button } from '@/components/ui/button';
import { AssistantView, type AssistantViewHandle } from '@/components/chat/AssistantView';

export default function AIAssistant() {
  const assistantRef = useRef<AssistantViewHandle>(null);

  return (
    <AppLayout
      showNav
      showBack
      backIcon={History}
      onBack={() => assistantRef.current?.openHistory()}
      title="AI 助手"
      rightAction={
        <Button variant="ghost" size="icon" onClick={() => assistantRef.current?.startNewSession()} className="h-8 w-8 rounded-lg">
          <Plus className="w-4 h-4" />
        </Button>
      }
    >
      <AssistantView ref={assistantRef} />
    </AppLayout>
  );
}
