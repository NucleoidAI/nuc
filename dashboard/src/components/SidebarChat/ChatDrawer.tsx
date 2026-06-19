import BlueprintSelector from "../BlueprintSelector";
import Editor from "@monaco-editor/react";
import { Iconify } from "@canmingir/link/platform/components";
import { Scrollbar } from "@canmingir/link/platform/components";
import Stack from "@mui/material/Stack";
import { alpha } from "@mui/material/styles";

import {
  Box,
  Drawer,
  IconButton,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import { LoadingMessage, MessageList } from "../PopChat/components";
import React, { memo, useCallback, useRef, useState } from "react";

const DRAWER_WIDTH = 400;

type InputMode = "chat" | "json";

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

const DEFAULT_JSON = `{\n  \n}`;

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
  const [inputMode, setInputMode] = useState<InputMode>("chat");
  const [jsonValue, setJsonValue] = useState(DEFAULT_JSON);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleModeChange = useCallback(
    (_: React.MouseEvent<HTMLElement>, newMode: InputMode | null) => {
      if (newMode) setInputMode(newMode);
    },
    []
  );

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

  const handleJsonChange = useCallback((value: string | undefined) => {
    const v = value ?? "";
    setJsonValue(v);
    try {
      JSON.parse(v);
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON");
    }
  }, []);

  const handleJsonSend = useCallback(() => {
    try {
      const parsed = JSON.parse(jsonValue);
      onSend(JSON.stringify(parsed));
      setJsonValue(DEFAULT_JSON);
      setJsonError(null);
    } catch {
      setJsonError("Invalid JSON — fix before sending");
    }
  }, [jsonValue, onSend]);

  const handleJsonKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        handleJsonSend();
      }
    },
    [handleJsonSend]
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

        {/* Messages */}
        <Box sx={{ flex: 1, overflow: "hidden", p: 2 }}>
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

        {/* Input Area */}
        {!readOnly && (
          <Box
            sx={{
              borderTop: (theme) =>
                `1px solid ${alpha(theme.palette.divider, 0.1)}`,
              bgcolor: (theme) => alpha(theme.palette.grey[900], 0.5),
            }}
          >
            {/* Mode Toggle */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                px: 2,
                pt: 1.5,
                pb: 1,
                gap: 1,
              }}
            >
              <ToggleButtonGroup
                value={inputMode}
                exclusive
                onChange={handleModeChange}
                size="small"
                sx={{
                  "& .MuiToggleButton-root": {
                    px: 1.5,
                    py: 0.5,
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    letterSpacing: 0.5,
                    textTransform: "uppercase",
                    color: (theme) => alpha(theme.palette.text.secondary, 0.7),
                    borderColor: (theme) => alpha(theme.palette.divider, 0.3),
                    "&.Mui-selected": {
                      color: (theme) => theme.palette.primary.light,
                      bgcolor: (theme) =>
                        alpha(theme.palette.primary.main, 0.15),
                      borderColor: (theme) =>
                        alpha(theme.palette.primary.main, 0.4),
                    },
                  },
                }}
              >
                <ToggleButton value="chat">
                  <Iconify
                    icon="solar:chat-round-line-bold-duotone"
                    sx={{ width: 14, height: 14, mr: 0.5 }}
                  />
                  Chat
                </ToggleButton>
                <ToggleButton value="json">
                  <Iconify
                    icon="solar:code-bold-duotone"
                    sx={{ width: 14, height: 14, mr: 0.5 }}
                  />
                  JSON
                </ToggleButton>
              </ToggleButtonGroup>
            </Box>

            {/* Chat Input */}
            {inputMode === "chat" && (
              <Box sx={{ px: 2, pb: 2 }}>
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
                            sx={{ width: 20, height: 20 }}
                          />
                        </IconButton>
                      ),
                    },
                  }}
                />
              </Box>
            )}

            {/* JSON Input */}
            {inputMode === "json" && (
              <Box sx={{ px: 2, pb: 2 }} onKeyDown={handleJsonKeyDown}>
                <Box
                  sx={{
                    border: (theme) =>
                      `1px solid ${
                        jsonError
                          ? theme.palette.error.main
                          : alpha(theme.palette.primary.main, 0.3)
                      }`,
                    borderRadius: 1,
                    overflow: "hidden",
                    bgcolor: "#1e1e1e",
                  }}
                >
                  <Editor
                    height="160px"
                    defaultLanguage="json"
                    value={jsonValue}
                    onChange={handleJsonChange}
                    theme="vs-dark"
                    options={{
                      minimap: { enabled: false },
                      fontSize: 12,
                      lineNumbers: "off",
                      scrollBeyondLastLine: false,
                      wordWrap: "on",
                      tabSize: 2,
                      folding: false,
                      glyphMargin: false,
                      lineDecorationsWidth: 0,
                      lineNumbersMinChars: 0,
                      padding: { top: 8, bottom: 8 },
                    }}
                  />
                </Box>

                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    mt: 1,
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      color: jsonError
                        ? "error.main"
                        : (theme) => alpha(theme.palette.text.secondary, 0.5),
                      fontSize: "0.7rem",
                    }}
                  >
                    {jsonError ?? "⌘↵ to send"}
                  </Typography>
                  <Tooltip title="Send JSON (⌘↵)" placement="top">
                    <span>
                      <IconButton
                        onClick={handleJsonSend}
                        size="small"
                        disabled={!!jsonError}
                        sx={{
                          color: (theme) =>
                            jsonError
                              ? theme.palette.action.disabled
                              : theme.palette.primary.light,
                        }}
                      >
                        <Iconify
                          icon="material-symbols:send"
                          sx={{ width: 18, height: 18 }}
                        />
                      </IconButton>
                    </span>
                  </Tooltip>
                </Box>
              </Box>
            )}
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default memo(ChatDrawer);
