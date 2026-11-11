import http from "@canmingir/link/platform/http";
import { storage } from "@nucleoidjs/webstorage";

import { useCallback, useEffect, useMemo, useState } from "react";

const SESSIONS_STORAGE_KEY = "nuc.sidebarchatsessions";
const MAX_SESSIONS = 5;

export type StoredSession = {
  sessionId: string;
  agentId?: string;
  messages: { id?: string; content: string; role: string }[];
  lastUpdated: number;
  agentIcon?: string;
  agentName?: string;
  type?: string;
};

type BackendConversation = {
  id: string;
  role: "ASSISTANT" | "USER";
  content: string | null;
  createdAt: string;
};

type BackendSession = {
  id: string;
  agentId: string;
  type?: string;
  conversations: BackendConversation[];
};

export const readSessions = (): StoredSession[] => {
  const raw = storage.get(SESSIONS_STORAGE_KEY);
  return Array.isArray(raw) ? raw : [];
};

const writeSessions = (sessions: StoredSession[]) => {
  storage.set(SESSIONS_STORAGE_KEY, sessions);
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
    type: existing?.type,
  };
  if (idx >= 0) {
    sessions[idx] = entry;
  } else {
    sessions.unshift(entry);
  }
  writeSessions(sessions.slice(0, MAX_SESSIONS));
};

const toStoredSession = (
  session: BackendSession,
  agentIcon?: string,
  agentName?: string
): StoredSession => {
  const lastConversation =
    session.conversations[session.conversations.length - 1];

  return {
    sessionId: session.id,
    agentId: session.agentId,
    type: session.type,
    messages: session.conversations.map((c) => ({
      id: c.id,
      content: c.content ?? "",
      role: c.role,
    })),
    lastUpdated: lastConversation
      ? new Date(lastConversation.createdAt).getTime()
      : 0,
    agentIcon,
    agentName,
  };
};

export default function useChatSessions(
  currentSessionId: string | undefined,
  agentId: string | undefined,
  history: StoredSession["messages"],
  agentIcon?: string,
  agentName?: string
) {
  const [fetchedSessions, setFetchedSessions] = useState<StoredSession[]>([]);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const fetchSessions = useCallback(() => {
    if (!agentId) return;
    http
      .get(`/agents/${agentId}/sessions`)
      .then((response) => {
        const sessions = (response?.data || []).map((session: BackendSession) =>
          toStoredSession(session, agentIcon, agentName)
        );
        setFetchedSessions(sessions);
      })
      .catch(() => {
        // keep whatever was previously loaded
      });
  }, [agentId, agentIcon, agentName]);

  useEffect(() => {
    setDismissedIds(new Set());
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    if (history.length === 0 || !currentSessionId) return;
    upsertSession(currentSessionId, agentId, history, agentIcon, agentName);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [history, currentSessionId, agentId, agentIcon, agentName]);

  const refresh = useCallback(() => {
    setDismissedIds(new Set());
    fetchSessions();
  }, [fetchSessions]);

  const clearAll = useCallback(() => {
    setDismissedIds(
      (prev) => new Set([...prev, ...fetchedSessions.map((s) => s.sessionId)])
    );
  }, [fetchedSessions]);

  const storedSessions = useMemo(() => {
    const visible = fetchedSessions.filter(
      (s) => !dismissedIds.has(s.sessionId)
    );

    if (currentSessionId && history.length > 0) {
      const liveSession: StoredSession = {
        sessionId: currentSessionId,
        agentId,
        messages: history,
        lastUpdated: Date.now(),
        agentIcon,
        agentName,
      };

      const rest = visible.filter((s) => s.sessionId !== currentSessionId);

      return [liveSession, ...rest].slice(0, MAX_SESSIONS);
    }

    return visible.slice(0, MAX_SESSIONS);
  }, [
    fetchedSessions,
    dismissedIds,
    currentSessionId,
    history,
    agentId,
    agentIcon,
    agentName,
  ]);

  return { storedSessions, refresh, clearAll };
}
