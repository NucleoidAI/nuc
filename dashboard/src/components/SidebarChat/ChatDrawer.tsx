import BlueprintSelector from "../BlueprintSelector";
import { Iconify } from "@canmingir/link/platform/components";
import { Scrollbar } from "@canmingir/link/platform/components";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";

import { Box, Drawer, IconButton, TextField, Typography } from "@mui/material";
import { LoadingMessage, MessageList } from "../PopChat/components";
import React, { memo, useCallback, useRef } from "react";

const DRAWER_WIDTH = 400;

interface ChatDrawerProps {
  title: string;
  open: boolean;
  onClose: () => void;
  history: { id?: string; content: string; role: string }[];
  selectedConversationId?: string;
  readOnly?: boolean;
  mute: boolean;
  onMuteToggle: () => void;
  showLoading: boolean;
  onSend: (content: string) => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Blueprints?: any[];
  selectedBlueprint?: string;
  onBlueprintChange?: (blueprint: string) => void;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  highlightedMessage: React.RefObject<HTMLDivElement>;
  onNewSession?: () => void;
}

const ChatDrawer = ({
  title,
  open,
  onClose,
  history,
  selectedConversationId,
  readOnly,
  mute,
  onMuteToggle,
  showLoading,
  onSend,
  Blueprints = [],
  selectedBlueprint,
  onBlueprintChange,
  messagesEndRef,
  highlightedMessage,
}: ChatDrawerProps) => {
  const inputRef = useRef(null);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        const content = inputRef.current?.value?.trim();
        if (content) {
          onSend(content);
          inputRef.current.value = "";
        }
      }
    },
    [onSend]
  );

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
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
              <IconButton onClick={onMuteToggle} size="small">
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
            <IconButton onClick={onClose} size="small">
              <Iconify
                icon="mdi:chevron-right"
                sx={{ width: 24, height: 24, color: "white" }}
              />
            </IconButton>
          </Stack>
        </Box>

        {Blueprints.length > 0 && !readOnly && (
          <Box sx={{ px: 2, pt: 1 }}>
            <BlueprintSelector
              Blueprints={Blueprints}
              selectedBlueprint={selectedBlueprint}
              onBlueprintChange={onBlueprintChange}
            />
          </Box>
        )}

        <Box
          sx={{
            flex: 1,
            overflow: "hidden",
            p: 2,
          }}
        >
          <Scrollbar sx={{ height: "100%" }}>
            <MessageList
              messages={
                history as { id: string; content: string; role: string }[]
              }
              selectedId={selectedConversationId}
              messagesEndRef={messagesEndRef}
              highlightedMessage={highlightedMessage}
            />
            {showLoading && <LoadingMessage messagesEndRef={messagesEndRef} />}
          </Scrollbar>
        </Box>

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
              sx={{
                "& .MuiOutlinedInput-root": {
                  bgcolor: (theme) =>
                    alpha(theme.palette.background.paper, 0.8),
                },
              }}
              slotProps={{
                input: {
                  endAdornment: (
                    <IconButton
                      onClick={() => {
                        const content = inputRef.current?.value?.trim();
                        if (content) {
                          onSend(content);
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
                },
              }}
            />
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default memo(ChatDrawer);
