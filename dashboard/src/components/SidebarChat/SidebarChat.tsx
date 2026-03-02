import ChatDrawer from "./ChatDrawer";
import SessionPopover from "./SessionPopover";
import SidebarSessionList from "./SidebarSessionList";
import useChatSessions from "../../hooks/useChatSessions";
import { useEvent } from "@nucleoidai/react-event";
import useSound from "use-sound";

import React, { memo, useCallback, useEffect, useRef, useState } from "react";

type Message = { id?: string; content: string; role: string };

interface SidebarChatProps {
  selectedConversationId?: string;
  sessionId?: string;
  agentId?: string;
  title: string;
  open: boolean;
  handleToggle: () => void;
  handleNewUserMessage: (message: string) => void;
  history?: Message[];
  readOnly?: boolean;
  sound?: boolean;
  agent?: { id: string; name: string; icon: string };
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Blueprints?: any[];
  selectedBlueprint?: string;
  onBlueprintChange?: (blueprint: string) => void;
  onSessionSelect?: (sessionId: string, cachedMessages?: Message[]) => void;
}

const SidebarChat = ({
  selectedConversationId,
  sessionId,
  agentId,
  title,
  open,
  handleToggle,
  handleNewUserMessage,
  history = [],
  readOnly,
  sound,
  agent,
  Blueprints = [],
  selectedBlueprint,
  onBlueprintChange,
  onSessionSelect,
}: SidebarChatProps) => {
  const [aiResponded] = useEvent("AI_RESPONDED", null);
  const [conversationSent] = useEvent("CONVERSATION_SENT", null);

  const currentSessionId = sessionId || selectedConversationId;

  const { storedSessions, refresh, clearAll } = useChatSessions(
    currentSessionId,
    agentId,
    history,
    agent?.icon,
    agent?.name
  );

  const MessageSfx = "/src/components/PopChat/messageSFX.mp3";
  const [mute, setMute] = useState(false);
  const [loading, setLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [play] = useSound(MessageSfx);

  const messagesEndRef = useRef(null);
  const highlightedMessage = useRef(null);
  const lastSeenCountRef = useRef(0);

  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const [activeLogSessionId, setActiveLogSessionId] = useState("");

  const scrollToBottom = useCallback(() => {
    highlightedMessage.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  useEffect(() => {
    if (open) {
      lastSeenCountRef.current = history.length;
      setUnreadCount(0);
      setPopoverAnchor(null);
    }
  }, [open, history.length]);

  useEffect(() => {
    if (!open && history.length > lastSeenCountRef.current) {
      setUnreadCount(history.length - lastSeenCountRef.current);
    }
  }, [history, open]);

  useEffect(() => {
    scrollToBottom();
  }, [history, open, aiResponded, scrollToBottom]);

  useEffect(() => {
    if (selectedConversationId) scrollToBottom();
  }, [selectedConversationId, scrollToBottom]);

  useEffect(() => {
    if (!sound) {
      setLoading(false);
      return;
    } else if (aiResponded !== null) {
      setLoading(false);
      !mute && play();
    }
    // eslint-disable-next-line
  }, [aiResponded, mute, play]);

  const handleSend = useCallback(
    (content: string) => {
      if (!content.trim()) return;
      handleNewUserMessage(content);
      !mute && play();
      setLoading(true);
    },
    [handleNewUserMessage, mute, play]
  );

  const showLoading = useCallback(() => {
    if (conversationSent?.createdAt > aiResponded?.createdAt) return true;
    if (loading) return true;
    if (conversationSent && aiResponded === null) return true;
    return false;
  }, [conversationSent, aiResponded, loading]);

  const handleSessionClick = useCallback(
    (event: React.MouseEvent<HTMLElement>, sid: string) => {
      refresh();
      setActiveLogSessionId(sid);
      setPopoverAnchor(event.currentTarget);
    },
    [refresh]
  );

  const handleOpenFromPopover = useCallback(() => {
    setPopoverAnchor(null);
    if (activeLogSessionId && activeLogSessionId !== currentSessionId) {
      const cached = storedSessions.find(
        (s) => s.sessionId === activeLogSessionId
      );
      onSessionSelect?.(activeLogSessionId, cached?.messages);
    }
    if (!open) handleToggle();
  }, [
    handleToggle,
    open,
    activeLogSessionId,
    currentSessionId,
    onSessionSelect,
    storedSessions,
  ]);

  return (
    <>
      {!open && (
        <SidebarSessionList
          sessions={storedSessions}
          currentSessionId={currentSessionId}
          unreadCount={unreadCount}
          onToggleChat={handleToggle}
          onSessionClick={handleSessionClick}
          onClearAll={clearAll}
        />
      )}

      <SessionPopover
        anchorEl={popoverAnchor}
        onClose={() => setPopoverAnchor(null)}
        onOpenFullChat={handleOpenFromPopover}
        sessions={storedSessions}
        activeSessionId={activeLogSessionId}
        currentSessionId={currentSessionId}
        selectedConversationId={selectedConversationId}
        messagesEndRef={messagesEndRef}
        highlightedMessage={highlightedMessage}
      />

      <ChatDrawer
        title={title}
        open={open}
        onClose={handleToggle}
        history={history}
        selectedConversationId={selectedConversationId}
        readOnly={readOnly}
        mute={mute}
        onMuteToggle={() => setMute((prev) => !prev)}
        showLoading={showLoading()}
        onSend={handleSend}
        Blueprints={Blueprints}
        selectedBlueprint={selectedBlueprint}
        onBlueprintChange={onBlueprintChange}
        messagesEndRef={messagesEndRef}
        highlightedMessage={highlightedMessage}
      />
    </>
  );
};

export default memo(SidebarChat);
