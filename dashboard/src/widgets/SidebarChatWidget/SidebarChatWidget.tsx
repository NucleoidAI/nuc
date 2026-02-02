import SidebarChat from "../../components/SidebarChat";
import useBlueprint from "../../hooks/useBlueprint";
import useSession from "../../hooks/useSession";

import { useEffect, useState } from "react";

interface SidebarChatWidgetProps {
  readOnly?: boolean;
  conversationId?: string;
  sessionId?: string;
  sound?: boolean;
  agentId?: string;
  open: boolean;
  onToggle: () => void;
}

const SidebarChatWidget = ({
  readOnly,
  conversationId,
  sessionId,
  sound,
  agentId,
  open,
  onToggle,
}: SidebarChatWidgetProps) => {
  const [selectedBlueprint, setSelectedBlueprint] = useState("");

  const { conversations, sendMessage, getSession } = useSession(agentId);
  const { getBlueprint } = useBlueprint();
  const { Blueprint } = getBlueprint();

  const [messages, setMessages] = useState([]);

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
      selectedConversationId={conversationId || null}
      sound={sound}
      Blueprints={
        Blueprint ? (Array.isArray(Blueprint) ? Blueprint : [Blueprint]) : []
      }
      selectedBlueprint={selectedBlueprint}
      onBlueprintChange={setSelectedBlueprint}
    />
  );
};

export default SidebarChatWidget;
