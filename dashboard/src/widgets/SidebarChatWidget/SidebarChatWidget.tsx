import { SidebarChat } from "@canmingir/link/platform/components";
import useAgent from "../../hooks/useAgent";
import useBlueprint from "../../hooks/useBlueprint";
import useChatSessions from "../../hooks/useChatSessions";
import useSession from "../../hooks/useSession";

import { useCallback, useEffect, useState } from "react";

interface SidebarChatWidgetProps {
  readOnly?: boolean;
  conversationId?: string;
  sessionId?: string;
  sound?: boolean;
  agentId?: string;
  beta?: boolean;
  open: boolean;
  onToggle: () => void;
}

const SidebarChatWidget = ({
  readOnly,
  conversationId,
  sound,
  agentId,
  open,
  onToggle,
  beta,
}: SidebarChatWidgetProps) => {
  const [selectedBlueprint, setSelectedBlueprint] = useState("");

  const {
    sessionId,
    conversations,
    sendMessage,
    switchSession,
    createSession,
    getSession,
  } = useSession(agentId);

  const handleBlueprintChange = useCallback(
    (blueprintId: string) => {
      setSelectedBlueprint(blueprintId);
      setMessages([]);
      createSession(blueprintId || undefined);
    },
    [createSession]
  );
  const { getBlueprint } = useBlueprint();
  const { Blueprint } = getBlueprint();

  const { getAgent } = useAgent();
  const { agent } = getAgent(agentId);

  const [messages, setMessages] = useState([]);

  const currentSessionId = sessionId || conversationId;

  const { storedSessions, refresh, clearAll } = useChatSessions(
    currentSessionId,
    agentId,
    messages,
    agent?.icon,
    agent?.name
  );

  useEffect(() => {
    if (conversations.length > 0) {
      setMessages(conversations);
    }
  }, [conversations]);

  useEffect(() => {
    if (open && sessionId) {
      getSession(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sessionId]);

  const handleSessionSelect = useCallback(
    async (
      selectedSessionId: string,
      cachedMessages?: { id?: string; content: string; role: string }[]
    ) => {
      if (cachedMessages?.length) {
        setMessages(cachedMessages);
      }
      try {
        await switchSession(selectedSessionId);
        getSession(selectedSessionId);
      } catch {
        getSession(selectedSessionId);
      }
    },
    [switchSession, getSession]
  );

  const handleNewSession = useCallback(() => {
    setMessages([]);
    createSession();
  }, [createSession]);

  const handleNewUserMessage = async (content: string) => {
    const newMessage = {
      role: "USER",
      content,
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    sendMessage(content);
  };

  return (
    <SidebarChat
      title="Chat"
      open={open}
      handleToggle={onToggle}
      history={messages}
      handleNewUserMessage={handleNewUserMessage}
      readOnly={readOnly}
      sessionId={sessionId}
      agent={agent}
      selectedConversationId={conversationId || null}
      sound={sound}
      Presets={
        Blueprint ? (Array.isArray(Blueprint) ? Blueprint : [Blueprint]) : []
      }
      selectedPreset={selectedBlueprint}
      onPresetChange={handleBlueprintChange}
      onSessionSelect={handleSessionSelect}
      onNewSession={handleNewSession}
      beta={beta}
      storedSessions={storedSessions}
      refreshSessions={refresh}
      clearAllSessions={clearAll}
    />
  );
};

export default SidebarChatWidget;
