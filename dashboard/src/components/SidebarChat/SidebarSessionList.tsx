import { Iconify } from "@canmingir/link/platform/components";
import RightSideBar from "../RightSideBar/RightSideBar";
import type { StoredSession } from "../../hooks/useChatSessions";
import { alpha } from "@mui/material/styles";
import { cleanIconName } from "../../utils/cleanIconName";
import { publish } from "@nucleoidai/react-event";

import { Badge, Box, Divider, Tooltip, Typography } from "@mui/material";
import React, { memo } from "react";

interface SidebarSessionListProps {
  sessions: StoredSession[];
  currentSessionId?: string;
  unreadCount: number;
  onToggleChat: () => void;
  onSessionClick: (
    event: React.MouseEvent<HTMLElement>,
    sessionId: string
  ) => void;
  onClearAll: () => void;
  onNewSession?: () => void;
  wrapperRef?: React.Ref<HTMLDivElement>;
  beta?: boolean;
}

const btnBase = {
  width: 32,
  height: 32,
  borderRadius: "10px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
  flexShrink: 0,
  transition: "all 0.18s ease",
  border: "1px solid transparent",
};

const SidebarSessionList = ({
  sessions,
  currentSessionId,
  unreadCount,
  onToggleChat,
  onSessionClick,
  onClearAll,
  onNewSession,
  wrapperRef,
  beta,
}: SidebarSessionListProps) => {
  return (
    <RightSideBar>
      <Box
        ref={wrapperRef}
        sx={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 0.5,
        }}
      >
        {/* New Chat */}
        <Tooltip
          title="New Chat"
          placement="left"
          enterDelay={600}
          enterNextDelay={600}
        >
          <Box
            onClick={() => {
              onNewSession?.();
              onToggleChat();
            }}
            sx={{
              ...btnBase,
              color: "text.secondary",
              bgcolor: (theme) =>
                theme.palette.mode === "dark"
                  ? "rgba(255,255,255,0.06)"
                  : "rgba(0,0,0,0.05)",
              "&:hover": {
                color: "primary.main",
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                transform: "scale(1.08)",
              },
            }}
          >
            <Iconify
              icon="solar:add-square-bold-duotone"
              sx={{ width: 17, height: 17 }}
            />
          </Box>
        </Tooltip>

        {/* Open API */}
        {!beta && (
          <Tooltip
            title="Open API"
            placement="left"
            enterDelay={600}
            enterNextDelay={600}
          >
            <Box
              onClick={() => publish("SWAGGER_DIALOG_OPEN", { open: true })}
              sx={{
                ...btnBase,
                color: "text.secondary",
                bgcolor: (theme) =>
                  theme.palette.mode === "dark"
                    ? "rgba(255,255,255,0.06)"
                    : "rgba(0,0,0,0.05)",
                "&:hover": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.08)",
                  transform: "scale(1.08)",
                },
              }}
            >
              <Iconify icon="logos:swagger" sx={{ width: 15, height: 15 }} />
            </Box>
          </Tooltip>
        )}

        {/* Sessions */}
        {sessions.length > 0 && (
          <>
            <Divider
              flexItem
              sx={{
                my: 0.5,
                mx: 0.5,
                borderColor: (theme) => alpha(theme.palette.divider, 0.18),
              }}
            />

            {sessions.map((session, idx) => {
              const isCurrent = session.sessionId === currentSessionId;
              const sessionNum = idx + 1;
              const hasUnread = isCurrent && unreadCount > 0;

              return (
                <Tooltip
                  key={session.sessionId}
                  title={
                    hasUnread
                      ? `${unreadCount} new message${
                          unreadCount !== 1 ? "s" : ""
                        }`
                      : `Session ${sessionNum} · ${
                          session.messages.length
                        } msg${session.messages.length !== 1 ? "s" : ""}`
                  }
                  placement="left"
                  enterDelay={600}
                  enterNextDelay={600}
                >
                  <Box
                    onClick={(e) => onSessionClick(e, session.sessionId)}
                    sx={{
                      ...btnBase,
                      position: "relative",
                      borderRadius: "10px",
                      color: isCurrent ? "primary.main" : "text.secondary",
                      bgcolor: isCurrent
                        ? (theme) => alpha(theme.palette.primary.main, 0.14)
                        : (theme) =>
                            theme.palette.mode === "dark"
                              ? "rgba(255,255,255,0.06)"
                              : "rgba(0,0,0,0.05)",
                      borderColor: isCurrent
                        ? (theme) => alpha(theme.palette.primary.main, 0.28)
                        : "transparent",
                      boxShadow: isCurrent
                        ? (theme) =>
                            `0 0 0 1px ${alpha(
                              theme.palette.primary.main,
                              0.2
                            )}`
                        : "none",
                      "&:hover": {
                        bgcolor: isCurrent
                          ? (theme) => alpha(theme.palette.primary.main, 0.2)
                          : (theme) =>
                              theme.palette.mode === "dark"
                                ? "rgba(255,255,255,0.1)"
                                : "rgba(0,0,0,0.08)",
                        transform: "scale(1.08)",
                      },
                    }}
                  >
                    <Badge
                      badgeContent={hasUnread ? unreadCount : 0}
                      color="error"
                      max={9}
                      sx={{
                        "& .MuiBadge-badge": {
                          fontSize: "0.5rem",
                          minWidth: 13,
                          height: 13,
                          padding: "0 2px",
                          transform: "scale(0.9) translate(40%, -40%)",
                        },
                      }}
                    >
                      {session.agentIcon ? (
                        <Iconify
                          icon={cleanIconName(session.agentIcon)}
                          sx={{ width: 16, height: 16 }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontSize: "0.6rem",
                            fontWeight: 800,
                            lineHeight: 1,
                            color: "inherit",
                          }}
                        >
                          {sessionNum}
                        </Typography>
                      )}
                    </Badge>
                  </Box>
                </Tooltip>
              );
            })}

            <Divider
              flexItem
              sx={{
                my: 0.5,
                mx: 0.5,
                borderColor: (theme) => alpha(theme.palette.divider, 0.18),
              }}
            />

            {/* Clear all */}
            <Tooltip
              title="Clear all sessions"
              placement="left"
              enterDelay={600}
            >
              <Box
                onClick={onClearAll}
                sx={{
                  ...btnBase,
                  color: "text.disabled",
                  bgcolor: "transparent",
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                    color: "error.main",
                    borderColor: (theme) =>
                      alpha(theme.palette.error.main, 0.2),
                    transform: "scale(1.08)",
                  },
                }}
              >
                <Iconify
                  icon="solar:trash-bin-2-bold"
                  sx={{ width: 15, height: 15 }}
                />
              </Box>
            </Tooltip>
          </>
        )}
      </Box>
    </RightSideBar>
  );
};

export default memo(SidebarSessionList);
