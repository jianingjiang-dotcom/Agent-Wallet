import { useState, useCallback, useRef, useEffect } from 'react';
import type { ChatSession, ChatMessage, ChatCard } from '@/types/chat';
import { loadSessions, saveSessions, createSession, clearAllSessions } from '@/lib/chat-storage';
import { generateId } from '@/lib/utils';

export function useChatHistory() {
  const [sessions, setSessions] = useState<ChatSession[]>(() => {
    const loaded = loadSessions();
    // Filter out empty sessions on init
    const nonEmpty = loaded.filter(s => s.messages.length > 0);
    if (nonEmpty.length !== loaded.length) {
      saveSessions(nonEmpty);
    }
    return nonEmpty;
  });
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(() => {
    const loaded = loadSessions().filter(s => s.messages.length > 0);
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

  const switchSession = useCallback((id: string | null) => {
    setCurrentSessionId(id);
    sessionIdRef.current = id;
  }, []);

  const addMessage = useCallback((msg: ChatMessage) => {
    let sid = sessionIdRef.current;

    // If no session exists, create one first (synchronously update ref + state)
    if (!sid) {
      const session = createSession();
      session.messages = [msg];
      session.title = msg.role === 'user' ? msg.content.slice(0, 20) : '新对话';
      session.updatedAt = Date.now();
      sid = session.id;
      sessionIdRef.current = session.id;
      setCurrentSessionId(session.id);
      setSessions(prev => {
        const updated = [session, ...prev];
        saveSessions(updated);
        return updated;
      });
      return;
    }

    // Find the session - it might have just been created by startNewSession
    // but not yet reflected in state, so also check if it exists
    setSessions(prev => {
      const found = prev.some(s => s.id === sid);
      let updated: ChatSession[];
      if (!found) {
        // Session was created but not yet in state (race condition)
        const session = createSession();
        session.id = sid!;
        session.messages = [msg];
        session.title = msg.role === 'user' ? msg.content.slice(0, 20) : '新对话';
        session.updatedAt = Date.now();
        updated = [session, ...prev];
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
            id: generateId(),
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
          m.id === messageId ? { ...m, feedback: m.feedback === feedback ? undefined : feedback } : m
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

  const cleanEmptySessions = useCallback(() => {
    setSessions(prev => {
      const next = prev.filter(s => s.messages.length > 0);
      saveSessions(next);
      return next;
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
    cleanEmptySessions,
  };
}
