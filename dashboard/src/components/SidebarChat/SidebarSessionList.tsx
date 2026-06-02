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
  alignSelf: "center",
  flexDirection: "column",
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
  const sidebarSessions = sessions;

  return (
    <RightSideBar width={45} height={310}>
      <Box
        ref={wrapperRef}
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Tooltip
          title="New Chat"
          placement="left"
          enterDelay={1000}
          enterNextDelay={1000}
        >
          <Box
            onClick={() => {
              onNewSession?.();
              onToggleChat();
            }}
            sx={{
              ...btnBase,
              flexDirection: "column",
              gap: 0.5,
              mb: 0.5,
              color: "text.secondary",
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
              sx={{ width: 20, height: 20 }}
            />

            <Typography
              sx={{
                fontSize: "0.5rem",
                fontWeight: 500,
                letterSpacing: 0.5,
                lineHeight: 1,
                textTransform: "capitalize",
              }}
            >
              New
            </Typography>
          </Box>
        </Tooltip>

        {!beta && (
          <Tooltip
            title="Open API"
            placement="left"
            enterDelay={1000}
            enterNextDelay={1000}
          >
            <Box
              onClick={() => publish("SWAGGER_DIALOG_OPEN", { open: true })}
              sx={{
                ...btnBase,
                flexDirection: "column",
                gap: 0.5,
                mb: 1,
                color: "text.secondary",
                "&:hover": {
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark"
                      ? "rgba(255,255,255,0.1)"
                      : "rgba(0,0,0,0.08)",
                  transform: "scale(1.08)",
                },
              }}
            >
              <Iconify
                icon="logos:swagger"
                sx={{
                  width: 20,
                  height: 20,
                  transition: "all 0.2s ease-in-out",
                }}
              />

              <Typography
                sx={{
                  fontSize: "0.5rem",
                  fontWeight: 500,
                  letterSpacing: 0.5,
                  lineHeight: 1,
                  textTransform: "capitalize",
                }}
              >
                API
              </Typography>
            </Box>
          </Tooltip>
        )}

        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 1,
            width: "100%",
            overflowY: "auto",
            overflowX: "hidden",
            pb: 1,
            pt: 1,
            flex: 1,
            "&::-webkit-scrollbar": { display: "none" },
            scrollbarWidth: "none",
          }}
        >
          {sidebarSessions.map((session, idx) => {
            const isCurrent = session.sessionId === currentSessionId;
            const sessionNum = idx + 1;
            const hasUnread = isCurrent && unreadCount > 0;

            return (
              <Tooltip
                key={session.sessionId}
                title={
                  hasUnread
                    ? `${unreadCount} new · message${
                        unreadCount !== 1 ? "s" : ""
                      }`
                    : `${session.messages.length} message${
                        session.messages.length !== 1 ? "s" : ""
                      }`
                }
                placement="left"
                enterDelay={1000}
                enterNextDelay={1000}
              >
                <Box
                  onClick={(e) => onSessionClick(e, session.sessionId)}
                  sx={{
                    ...btnBase,
                    flexDirection: "column",
                    gap: 0.4,
                    color: isCurrent ? "primary.main" : "text.secondary",
                    borderColor: isCurrent
                      ? (theme) => alpha(theme.palette.primary.main, 0.28)
                      : "transparent",
                    boxShadow: isCurrent
                      ? (theme) =>
                          `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`
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
                        fontSize: "0.55rem",
                        minWidth: 14,
                        height: 14,
                        padding: "0 3px",
                        transform: "scale(0.85) translate(25%, -25%)",
                        transition: "all 0.2s ease",
                      },
                    }}
                  >
                    <Box
                      sx={{
                        width: 20,
                        height: 20,
                        borderRadius: "7px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        transition: "all 0.2s ease-in-out",
                        bgcolor: (theme) =>
                          isCurrent
                            ? alpha(theme.palette.primary.main, 0.2)
                            : alpha(theme.palette.text.secondary, 0.1),
                      }}
                    >
                      {session.agentIcon ? (
                        <Iconify
                          icon={cleanIconName(session.agentIcon)}
                          sx={{ width: 15, height: 15 }}
                        />
                      ) : (
                        <Typography
                          sx={{
                            fontSize: "0.65rem",
                            fontWeight: 800,
                            lineHeight: 1,
                          }}
                        >
                          {sessionNum}
                        </Typography>
                      )}
                    </Box>
                  </Badge>

                  <Typography
                    sx={{
                      fontSize: "0.55rem",
                      fontWeight: 700,
                      lineHeight: 1,
                      letterSpacing: 0.3,
                    }}
                  >
                    {`Ses. ${sessionNum}`}
                  </Typography>
                </Box>
              </Tooltip>
            );
          })}
        </Box>

        <Divider
          flexItem
          sx={{
            borderColor: (theme) => alpha(theme.palette.divider, 0.18),
            width: "100%",
            mb: 0.5,
          }}
        />

        <Tooltip
          title={
            sidebarSessions.length > 0 ? "Clear all sessions" : "No sessions"
          }
          placement="left"
        >
          <Box
            onClick={sidebarSessions.length > 0 ? onClearAll : undefined}
            sx={{
              ...btnBase,
              mb: -0.5,
              color:
                sidebarSessions.length > 0 ? "text.disabled" : "text.disabled",
              bgcolor: "transparent",
              opacity: sidebarSessions.length > 0 ? 1 : 0.4,
              cursor: sidebarSessions.length > 0 ? "pointer" : "not-allowed",
              ...(sidebarSessions.length > 0 && {
                "&:hover": {
                  bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                  color: "error.main",
                  borderColor: (theme) => alpha(theme.palette.error.main, 0.2),
                  transform: "scale(1.08)",
                },
              }),
            }}
          >
            <Iconify
              icon="solar:trash-bin-2-bold"
              sx={{
                width: 18,
                height: 18,
              }}
            />
          </Box>
        </Tooltip>
      </Box>
    </RightSideBar>
  );
};

export default memo(SidebarSessionList);
