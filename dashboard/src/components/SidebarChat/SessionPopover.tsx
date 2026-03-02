import { Iconify } from "@canmingir/link/platform/components";
import { MessageList } from "../PopChat/components";
import { Scrollbar } from "@canmingir/link/platform/components";
import Stack from "@mui/material/Stack";
import { StoredSession } from "../../hooks/useChatSessions";
import { alpha } from "@mui/material/styles";
import { cleanIconName } from "../../utils/cleanIconName";

import { Box, IconButton, Popover, Tooltip, Typography } from "@mui/material";
import React, { memo, useEffect, useRef } from "react";

interface SessionPopoverProps {
  anchorEl: HTMLElement | null;
  onClose: () => void;
  onOpenFullChat: () => void;
  sessions: StoredSession[];
  activeSessionId: string;
  currentSessionId?: string;
  selectedConversationId?: string;
  messagesEndRef: React.RefObject<HTMLDivElement>;
  highlightedMessage: React.RefObject<HTMLDivElement>;
}

const SessionPopover = ({
  anchorEl,
  onClose,
  onOpenFullChat,
  sessions,
  activeSessionId,
  currentSessionId,
  selectedConversationId,
  messagesEndRef,
  highlightedMessage,
}: SessionPopoverProps) => {
  const session = sessions.find((s) => s.sessionId === activeSessionId);
  const isCurrent = activeSessionId === currentSessionId;
  const popoverEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (anchorEl) {
      setTimeout(() => {
        popoverEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    }
  }, [anchorEl, activeSessionId]);

  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{ vertical: "center", horizontal: "left" }}
      transformOrigin={{ vertical: "center", horizontal: "right" }}
      slotProps={{
        paper: {
          sx: {
            width: 360,
            height: 500,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: "16px",
            bgcolor: (theme) =>
              alpha(
                theme.palette.mode === "dark"
                  ? theme.palette.grey[900]
                  : theme.palette.common.white,
                0.88
              ),
            backdropFilter: "blur(20px) saturate(180%)",
            WebkitBackdropFilter: "blur(20px) saturate(180%)",
            border: (theme) =>
              `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            boxShadow: (theme) =>
              `0 8px 40px ${alpha(theme.palette.common.black, 0.22)}`,
            mr: 1,
          },
        },
      }}
    >
      <Box
        sx={{
          flexShrink: 0,
          px: 2,
          py: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(
              theme.palette.grey[900],
              0.97
            )} 0%, ${alpha(theme.palette.grey[800], 0.97)} 100%)`,
          borderBottom: (theme) =>
            `1px solid ${alpha(theme.palette.common.white, 0.06)}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={1}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: "9px",
              bgcolor: (theme) => (theme.palette.primary.main, 0.2),
              border: (theme) =>
                `1px solid ${alpha(theme.palette.primary.main, 0.3)}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            {session?.agentIcon ? (
              <Iconify
                icon={cleanIconName(session.agentIcon)}
                sx={{ width: 18, height: 18 }}
              />
            ) : (
              <Typography
                sx={{
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  color: (theme) =>
                    isCurrent
                      ? theme.palette.primary.light
                      : theme.palette.warning.light,
                }}
              >
                {session?.agentName?.[0] ?? "?"}
              </Typography>
            )}
          </Box>
          <Box>
            <Typography
              variant="subtitle2"
              sx={{ color: "white", fontWeight: 700, lineHeight: 1.2 }}
            >
              {session?.agentName}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: (theme) => alpha(theme.palette.common.white, 0.5),
                lineHeight: 1,
              }}
            >
              {isCurrent ? "Current · " : "Session · "}
              {session?.messages.length ?? 0} msg
              {session ? ` · ${session.agentName}` : ""}
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" spacing={0.5}>
          <Tooltip title="Open full chat" placement="top">
            <IconButton
              size="small"
              onClick={onOpenFullChat}
              sx={{
                color: (theme) => alpha(theme.palette.common.white, 0.7),
                "&:hover": { bgcolor: alpha("#fff", 0.08), color: "white" },
              }}
            >
              <Iconify
                icon="solar:maximize-square-bold"
                sx={{ width: 16, height: 16 }}
              />
            </IconButton>
          </Tooltip>
          <IconButton
            size="small"
            onClick={onClose}
            sx={{
              color: (theme) => alpha(theme.palette.common.white, 0.7),
              "&:hover": { bgcolor: alpha("#fff", 0.08), color: "white" },
            }}
          >
            <Iconify icon="mdi:close" sx={{ width: 16, height: 16 }} />
          </IconButton>
        </Stack>
      </Box>

      <Box sx={{ flex: 1, minHeight: 0, overflow: "hidden" }}>
        {session ? (
          <Scrollbar sx={{ height: "100%", px: 1.5, py: 1 }}>
            <MessageList
              messages={
                session.messages as {
                  id: string;
                  content: string;
                  role: string;
                }[]
              }
              selectedId={isCurrent ? selectedConversationId : undefined}
              messagesEndRef={messagesEndRef}
              highlightedMessage={highlightedMessage}
            />
            <div ref={popoverEndRef} />
          </Scrollbar>
        ) : (
          <Box
            sx={{
              height: "100%",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              opacity: 0.4,
            }}
          >
            <Iconify icon="solar:history-bold" sx={{ width: 32, height: 32 }} />
            <Typography variant="caption">No messages yet</Typography>
          </Box>
        )}
      </Box>
    </Popover>
  );
};

export default memo(SessionPopover);
