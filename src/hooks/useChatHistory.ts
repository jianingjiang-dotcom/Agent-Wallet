import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatSession, ChatMessage, ChatCard } from '@/types/chat';
import { loadSessions, saveSessions, createSession, clearAllSessions } from '@/lib/chat-storage';

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => loadSessions());
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const loaded = loadSessions();
    return loaded.length > 0 ? loaded[0].id : null;
  });

  // Use a ref to always have the latest currentSessionId in callbacks
  const sessionIdRef = useRef(currentSessionId);
  useEffect(() => {
    sessionIdRef.current = currentSessionId;
  }, [currentSessionId]);

  const currentSession = sessions.find(s => s.id === currentSessionId) ?? null;

  const persist = useCallback((next: ChatSession[]) => {
    setSessions(next);
    saveSessions(next);
  }, []);

  const startNewSession = useCallback(() => {
    const session = createSession();
    setSessions(prev => {
      const next = [session, ...prev];
      saveSessions(next);
      return next;
    });
    setCurrentSessionId(session.id);
    sessionIdRef.current = session.id;
    return session;
  }, []);

  const switchSession = useCallback((id: string) => {
    setCurrentSessionId(id);
    sessionIdRef.current = id;
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    const sid = sessionIdRef.current;
    setSessions(prev => {
      let updated: ChatSession[];
      if (!sid) {
        const session = createSession();
        session.messages = [msg];
        session.title = msg.role === 'user' ? msg.content.slice(0, 20) : '新对话';
        session.updatedAt = Date.now();
        updated = [session, ...prev];
        setCurrentSessionId(session.id);
        sessionIdRef.current = session.id;
      } else {
        updated = prev.map(s => {
          if (s.id !== sid) return s;
          const messages = [...s.messages, msg];
          const title = s.messages.length === 0 && msg.role === 'user'
            ? msg.content.slice(0, 20)
            : s.title;
          return { ...s, messages, title, updatedAt: Date.now() };
        });
      }
      saveSessions(updated);
      return updated;
    });
  }, []);

  const updateLastAssistantMessage = useCallback((content: string) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== sid) return s;
        const msgs = [...s.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
          msgs[lastIdx] = { ...msgs[lastIdx], content };
        } else {
          msgs.push({
            id: crypto.randomUUID(),
            role: 'assistant',
            content,
            timestamp: Date.now(),
          });
        }
        return { ...s, messages: msgs, updatedAt: Date.now() };
      });
      return updated;
    });
  }, []);

  const persistCurrent = useCallback(() => {
    setSessions(prev => {
      saveSessions(prev);
      return prev;
    });
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions(prev => {
      const next = prev.filter(s => s.id !== id);
      saveSessions(next);
      if (sessionIdRef.current === id) {
        const newId = next.length > 0 ? next[0].id : null;
        setCurrentSessionId(newId);
        sessionIdRef.current = newId;
      }
      return next;
    });
  }, []);

  const clearAll = useCallback(() => {
    clearAllSessions();
    setSessions([]);
    setCurrentSessionId(null);
    sessionIdRef.current = null;
  }, []);

  const removeLastAssistantMessage = useCallback(() => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== sid) return s;
        const msgs = [...s.messages];
        if (msgs.length > 0 && msgs[msgs.length - 1].role === 'assistant') {
          msgs.pop();
        }
        return { ...s, messages: msgs, updatedAt: Date.now() };
      });
      saveSessions(updated);
      return updated;
    });
  }, []);

  const setMessageFeedback = useCallback((messageId: string, feedback: 'positive' | 'negative') => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== sid) return s;
        const msgs = s.messages.map(m =>
          m.id === messageId ? { ...m, feedback } : m
        );
        return { ...s, messages: msgs };
      });
      saveSessions(updated);
      return updated;
    });
  }, []);

  const setCardOnLastAssistant = useCallback((card: ChatCard) => {
    const sid = sessionIdRef.current;
    if (!sid) return;
    setSessions(prev => {
      const updated = prev.map(s => {
        if (s.id !== sid) return s;
        const msgs = [...s.messages];
        const lastIdx = msgs.length - 1;
        if (lastIdx >= 0 && msgs[lastIdx].role === 'assistant') {
          msgs[lastIdx] = { ...msgs[lastIdx], card };
        }
        return { ...s, messages: msgs };
      });
      return updated;
    });
  }, []);

  return {
    sessions,
    currentSession,
    currentSessionId,
    startNewSession,
    switchSession,
    addMessage,
    updateLastAssistantMessage,
    persistCurrent,
    deleteSession,
    clearAll,
    setCardOnLastAssistant,
    removeLastAssistantMessage,
    setMessageFeedback,
  };
}
