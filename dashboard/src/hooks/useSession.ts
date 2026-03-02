import config from "../../config";
import http from "@canmingir/link/platform/http";
import { io } from "socket.io-client";
import { publish } from "@nucleoidai/react-event";
import { readSessions } from "./useChatSessions";
import { storage } from "@nucleoidjs/webstorage";

import { useCallback, useEffect, useRef, useState } from "react";

function getLastSessionId(agentId: string): string | null {
  const sessions = readSessions();
  const match = sessions.find((s) => s.agentId === agentId);
  return match?.sessionId ?? null;
}

function useSession(agentId) {
  const savedSessionId = agentId ? getLastSessionId(agentId) : null;

  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(savedSessionId);
  const socketRef = useRef(null);

  const { host, path } = config.socket;

  const token = storage.get("link", "accessToken");

  useEffect(
    () => {
      const existingSessionId = agentId ? getLastSessionId(agentId) : null;

      socketRef.current = io(host, {
        path,
        auth: { token },
        query: {
          agentId,
          ...(existingSessionId ? { sessionId: existingSessionId } : {}),
        },
      });

      const socket = socketRef.current;

      socket.on("connect", () => {
        console.log("Connected to socket server");
      });

      socket.on("session_started", ({ sessionId: id }) => {
        setSessionId(id);
      });

      socket.on("ai_message", ({ content }) => {
        setConversations((prev) => [...prev, { role: "AI", content }]);
        publish("AI_RESPONDED", { content });
      });

      socket.on("error_message", ({ message }) => {
        setError(message);
        publish("AI_ERROR", { message });
      });

      return () => {
        socket.off("connect");
        socket.off("session_started");
        socket.off("ai_message");
        socket.off("error_message");
        socket.disconnect();
      };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const sendMessage = useCallback((content) => {
    setLoading(true);
    socketRef.current.emit("customer_message", { content }, (response) => {
      if (response.error) {
        setError(response.error);
      } else {
        publish("CONVERSATION_SENT", response.data);
        setConversations((prev) => [...prev, { role: "USER", content }]);
      }
      setLoading(false);
    });
  }, []);

  const switchSession = useCallback((targetSessionId: string) => {
    return new Promise<void>((resolve, reject) => {
      socketRef.current.emit(
        "switch_session",
        { sessionId: targetSessionId },
        (response) => {
          if (response.status === "success") {
            setSessionId(targetSessionId);
            resolve();
          } else {
            reject(new Error(response.error || "Failed to switch session"));
          }
        }
      );
    });
  }, []);

  const getSession = useCallback(async (id) => {
    if (id) {
      http.get(`/sessions/${id}`).then((response) => {
        setConversations(response.data);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    sessionId,
    getSession,
    loading,
    error,
    conversations,
    sendMessage,
    switchSession,
    clearError,
  };
}

export default useSession;
