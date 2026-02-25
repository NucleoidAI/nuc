import { useCallback, useEffect, useState } from "react";

const SESSIONS_STORAGE_KEY = "sidebar-chat-sessions";
const MAX_SESSIONS = 5;

export interface StoredSession {
  sessionId: string;
  agentId?: string;
  messages: { id?: string; content: string; role: string }[];
  lastUpdated: number;
  agentIcon?: string;
  agentName?: string;
}

export const readSessions = (): StoredSession[] => {
  const raw = localStorage.getItem(SESSIONS_STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
};

const writeSessions = (sessions: StoredSession[]) => {
  localStorage.setItem(SESSIONS_STORAGE_KEY, JSON.stringify(sessions));
};

const upsertSession = (
  sessionId: string,
  agentId: string,
  messages: StoredSession["messages"],
  agentIcon?: string,
  agentName?: string
) => {
  if (messages.length === 0) return;
  const sessions = readSessions();
  const idx = sessions.findIndex((s) => s.sessionId === sessionId);
  const existing = idx >= 0 ? sessions[idx] : null;
  const entry: StoredSession = {
    sessionId,
    agentId: existing?.agentId || agentId,
    messages,
    lastUpdated: Date.now(),
    agentIcon: existing?.agentIcon || agentIcon,
    agentName: existing?.agentName || agentName,
  };
  if (idx >= 0) {
    sessions[idx] = entry;
  } else {
    sessions.unshift(entry);
  }
  writeSessions(sessions.slice(0, MAX_SESSIONS));
};

export default function useChatSessions(
  currentSessionId: string | undefined,
  agentId: string | undefined,
  history: StoredSession["messages"],
  agentIcon?: string,
  agentName?: string
) {
  const [storedSessions, setStoredSessions] =
    useState<StoredSession[]>(readSessions);

  const refresh = useCallback(() => setStoredSessions(readSessions()), []);

  useEffect(() => {
    if (history.length === 0 || !currentSessionId) return;
    upsertSession(currentSessionId, agentId, history, agentIcon, agentName);
    refresh();
  }, [history, currentSessionId, agentId, agentIcon, agentName, refresh]);

  const clearAll = useCallback(() => {
    writeSessions([]);
    setStoredSessions([]);
  }, []);

  return { storedSessions, refresh, clearAll };
}
