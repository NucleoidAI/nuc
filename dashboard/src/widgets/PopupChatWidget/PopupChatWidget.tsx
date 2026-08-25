import useBlueprint from "../../hooks/useBlueprint";
import { useEvent } from "@nucleoidai/react-event";
import useSession from "../../hooks/useSession";

import { Badge, Fab } from "@mui/material";
import { Iconify, SidebarChat } from "@canmingir/link/platform/components";
import React, { useCallback, useEffect, useState } from "react";

const PopupChatWidget = ({
  readOnly,
  conversationId,
  openPopChat,
  setOpenPopChat,
  sessionId,
  sound,
  agentId,
}: {
  readOnly?: boolean;
  conversationId?: string;
  openPopChat?: boolean;
  setOpenPopChat?: (open: boolean) => void;
  sessionId?: string;
  sound?: boolean;
  agentId?: string;
}) => {
  const [open, setOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState("");

  const {
    conversations,
    sendMessage,
    getSession,
    createSession,
    error,
    clearError,
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

  const [aiResponded] = useEvent("AI_RESPONDED", null);

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (conversations.length > 0) {
      setMessages(conversations);
    }
  }, [conversations]);

  useEffect(() => {
    if (aiResponded !== null) {
      setUnreadMessages(true);
    }
  }, [aiResponded]);

  useEffect(() => {
    if (openPopChat && sessionId) {
      getSession(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [openPopChat, sessionId]);

  const handleNewUserMessage = async (content) => {
    const newMessage = {
      role: "USER",
      content,
    };

    setMessages((prevMessages) => [...prevMessages, newMessage]);
    sendMessage(content);
  };

  const handleClose = () => {
    openPopChat ? setOpenPopChat(false) : setOpen(false);
    setUnreadMessages(false);
  };

  return (
    <>
      <SidebarChat
        clearError={clearError}
        error={error}
        title={`Test Chat Session`}
        open={openPopChat || open}
        handleToggle={handleClose}
        history={messages}
        handleNewUserMessage={handleNewUserMessage}
        readOnly={readOnly}
        selectedConversationId={conversationId || null}
        sound={sound}
        Presets={Array.isArray(Blueprint) ? Blueprint : [Blueprint]}
        selectedPreset={selectedBlueprint}
        onPresetChange={handleBlueprintChange}
        sx={{}}
      />
      {!open && !readOnly && (
        <Fab onClick={() => setOpen(!open)}>
          <Badge
            anchorOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            color="success"
            overlap="circular"
            badgeContent=" "
            invisible={!unreadMessages}
          >
            <Iconify
              icon={
                open ? "solar:chat-round-bold-duotone" : "solar:chat-round-bold"
              }
              sx={{ width: 24, height: 24 }}
            />
          </Badge>
        </Fab>
      )}
    </>
  );
};

export default PopupChatWidget;
