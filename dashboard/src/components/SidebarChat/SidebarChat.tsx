import BlueprintSelector from "../BlueprintSelector";
import { Iconify } from "@canmingir/link/platform/components";
import { Scrollbar } from "@canmingir/link/platform/components";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";
import { useEvent } from "@nucleoidai/react-event";
import useSound from "use-sound";

import {
  Box,
  Drawer,
  IconButton,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { LoadingMessage, MessageList } from "../PopChat/components";
import React, { memo, useCallback, useEffect, useRef, useState } from "react";

const DRAWER_WIDTH = 400;

const sub = { item: null };
const response = (res) => {
  sub.item = res;
};

export const handleAddResponseMessage = (ret) => {
  sub.item(ret);
};

interface SidebarChatProps {
  selectedConversationId?: string;
  title: string;
  open: boolean;
  handleToggle: () => void;
  handleNewUserMessage: (message: string) => void;
  history?: { id?: string; content: string; role: string }[];
  readOnly?: boolean;
  sound?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Blueprints?: any[];
  selectedBlueprint?: string;
  onBlueprintChange?: (blueprint: string) => void;
}

const SidebarChat = ({
  selectedConversationId,
  title,
  open,
  handleToggle,
  handleNewUserMessage,
  history = [],
  readOnly,
  sound,
  Blueprints = [],
  selectedBlueprint,
  onBlueprintChange,
}: SidebarChatProps) => {
  const [aiResponded] = useEvent("AI_RESPONDED", null);
  const [conversationSent] = useEvent("CONVERSATION_SENT", null);

  const MessageSfx = "/src/components/PopChat/messageSFX.mp3";

  const [messages, setMessages] = useState([]);
  const [mute, setMute] = useState(false);
  const [loading, setLoading] = useState(false);

  const [play] = useSound(MessageSfx);
  const inputRef = useRef(null);
  const messagesEndRef = useRef(null);
  const highlightedMessage = useRef(null);

  const scrollToBottom = useCallback(() => {
    highlightedMessage.current?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  }, []);

  const handleSend = useCallback(
    (messageContent: string) => {
      if (!messageContent.trim()) return;

      setMessages((prev) => [
        ...prev,
        { content: messageContent, role: "USER" },
      ]);
      handleNewUserMessage(messageContent);
      !mute && play();
      setLoading(true);
    },
    [handleNewUserMessage, mute, play]
  );

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const content = inputRef.current?.value?.trim();
        if (content) {
          handleSend(content);
          inputRef.current.value = "";
        }
      }
    },
    [handleSend]
  );

  const changeMute = useCallback(() => {
    setMute((prev) => !prev);
  }, []);

  useEffect(() => {
    response((ret) => {
      setMessages((prev) => [...prev, { content: ret, role: "AI" }]);
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    setMessages(history);
  }, [history]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, open, aiResponded, scrollToBottom]);

  useEffect(() => {
    if (selectedConversationId) {
      scrollToBottom();
    }
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

  const renderIndicator = useCallback(() => {
    if (conversationSent?.createdAt > aiResponded?.createdAt) return true;
    if (loading) return true;
    if (conversationSent && aiResponded === null) return true;
    return false;
  }, [conversationSent, aiResponded, loading]);

  return (
    <>
      {/* Toggle Tab - Right Edge */}
      {!open && (
        <Tooltip title="Open Chat" placement="left">
          <Box
            onClick={handleToggle}
            sx={{
              position: "fixed",
              right: 0,
              top: "50%",
              transform: "translateY(-50%)",
              zIndex: 1201,
              bgcolor: (theme) => theme.palette.primary.main,
              color: "white",
              py: 2,
              px: 1,
              borderRadius: "8px 0 0 8px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 1,
              boxShadow: 3,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                bgcolor: (theme) => theme.palette.primary.dark,
                px: 1.5,
              },
            }}
          >
            <Iconify
              icon="solar:chat-round-bold"
              sx={{ width: 24, height: 24 }}
            />
            <Typography
              sx={{
                writingMode: "vertical-rl",
                textOrientation: "mixed",
                fontSize: "0.75rem",
                fontWeight: 600,
                letterSpacing: 1,
              }}
            >
              Chat
            </Typography>
          </Box>
        </Tooltip>
      )}

      {/* Sidebar Drawer */}
      <Drawer
        anchor="right"
        open={open}
        onClose={handleToggle}
        variant="persistent"
        sx={{
          width: open ? DRAWER_WIDTH : 0,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            boxSizing: "border-box",
            border: "none",
            boxShadow: (theme) => theme.shadows[8],
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            bgcolor: (theme) => theme.palette.background.default,
          }}
        >
          {/* Header */}
          <Box
            sx={{
              bgcolor: (theme) => alpha(theme.palette.grey[900], 0.9),
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              p: 2,
              borderBottom: (theme) =>
                `1px solid ${alpha(theme.palette.divider, 0.1)}`,
            }}
          >
            <Typography variant="h6" sx={{ color: "white", fontWeight: 600 }}>
              {title}
            </Typography>
            <Stack direction="row" spacing={1}>
              {!readOnly && (
                <IconButton onClick={changeMute} size="small">
                  <Iconify
                    icon={
                      mute
                        ? "solar:volume-cross-bold-duotone"
                        : "solar:volume-loud-bold-duotone"
                    }
                    sx={{ width: 20, height: 20, color: "white" }}
                  />
                </IconButton>
              )}
              <IconButton onClick={handleToggle} size="small">
                <Iconify
                  icon="mdi:chevron-right"
                  sx={{ width: 24, height: 24, color: "white" }}
                />
              </IconButton>
            </Stack>
          </Box>

          {/* Blueprint Selector */}
          {Blueprints.length > 0 && !readOnly && (
            <Box sx={{ px: 2, pt: 1 }}>
              <BlueprintSelector
                Blueprints={Blueprints}
                selectedBlueprint={selectedBlueprint}
                onBlueprintChange={onBlueprintChange}
              />
            </Box>
          )}

          {/* Messages Area */}
          <Box
            sx={{
              flex: 1,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <Scrollbar sx={{ flex: 1, p: 2 }}>
              <MessageList
                messages={history}
                selectedId={selectedConversationId}
                messagesEndRef={messagesEndRef}
                highlightedMessage={highlightedMessage}
              />
              {renderIndicator() && <LoadingMessage />}
            </Scrollbar>
          </Box>

          {/* Input Area */}
          {!readOnly && (
            <Box
              sx={{
                p: 2,
                borderTop: (theme) =>
                  `1px solid ${alpha(theme.palette.divider, 0.1)}`,
                bgcolor: (theme) => alpha(theme.palette.grey[900], 0.5),
              }}
            >
              <TextField
                variant="outlined"
                autoComplete="off"
                fullWidth
                placeholder="Type a message..."
                inputRef={inputRef}
                onKeyDown={handleKeyDown}
                size="small"
                InputProps={{
                  endAdornment: (
                    <IconButton
                      onClick={() => {
                        const content = inputRef.current?.value?.trim();
                        if (content) {
                          handleSend(content);
                          inputRef.current.value = "";
                        }
                      }}
                      size="small"
                    >
                      <Iconify
                        icon="material-symbols:send"
                        sx={{
                          width: 20,
                          height: 20,
                          color: (theme) =>
                            inputRef.current?.value
                              ? theme.palette.primary.main
                              : "inherit",
                        }}
                      />
                    </IconButton>
                  ),
                }}
                sx={{
                  "& .MuiOutlinedInput-root": {
                    bgcolor: (theme) =>
                      alpha(theme.palette.background.paper, 0.8),
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Drawer>
    </>
  );
};

export default memo(SidebarChat);
