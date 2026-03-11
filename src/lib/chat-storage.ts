import type { ChatSession } from '@/types/chat';

const STORAGE_KEY = 'ai_chat_history';
const MAX_SESSIONS = 50;
const MAX_MESSAGES_PER_SESSION = 100;

export function loadSessions(): ChatSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as ChatSession[];
  } catch {
    return [];
  }
}

export function saveSessions(sessions: ChatSession[]) {
  // Enforce limits
  const trimmed = sessions.slice(0, MAX_SESSIONS).map(s => ({
    ...s,
    messages: s.messages.slice(-MAX_MESSAGES_PER_SESSION),
  }));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
}

export function createSession(): ChatSession {
  return {
    id: crypto.randomUUID(),
    title: '新对话',
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function clearAllSessions() {
  localStorage.removeItem(STORAGE_KEY);
}
