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
  isCompact?: boolean;
  onMouseEnter?: () => void;
  wrapperRef?: React.Ref<HTMLDivElement>;
}

const SidebarSessionList = ({
  sessions,
  currentSessionId,
  unreadCount,
  onToggleChat,
  onSessionClick,
  onClearAll,
  onNewSession,
  isCompact = true,
  onMouseEnter,
  wrapperRef,
}: SidebarSessionListProps) => {
  const sidebarSessions = sessions;

  return (
    <RightSideBar width={75} height={420}>
      <Box
        ref={wrapperRef}
        onMouseEnter={onMouseEnter}
        sx={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Tooltip title="New Chat" placement="left">
          <Box
            onClick={() => {
              onNewSession?.();
              onToggleChat();
            }}
            sx={{
              width: isCompact ? 35 : 65,
              height: isCompact ? 35 : 50,
              borderRadius: isCompact ? "10px" : "12px",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 0.5,
              mb: 1,
              alignSelf: "center",
              color: (theme) => theme.palette.text.secondary,
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                color: (theme) => theme.palette.primary.main,
              },
            }}
          >
            <Iconify
              icon="solar:add-square-bold-duotone"
              sx={{ width: 22, height: 22 }}
            />
            <Typography
              sx={{
                width: isCompact ? 20 : 22,
                height: isCompact ? 20 : 22,
                transition: "all 0.2s ease-in-out",
              }}
            >
              New
            </Typography>
          </Box>
        </Tooltip>

        {sidebarSessions.length > 0 && (
          <>
            <Divider
              flexItem
              sx={{
                width: "100%",
                borderColor: (theme) => alpha(theme.palette.divider, 0.2),
              }}
            />
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 0.75,
                width: "100%",
                overflowY: "auto",
                overflowX: "hidden",
                pb: 1,
                pt: 1,
                "&::-webkit-scrollbar": { display: "none" },
                scrollbarWidth: "none",
              }}
            >
              {sidebarSessions.map((session, idx) => {
                const isCurrent = session.sessionId === currentSessionId;
                const sessionNum = sidebarSessions.length - idx;
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
                  >
                    <Box
                      onClick={(e) => onSessionClick(e, session.sessionId)}
                      sx={{
                        width: isCompact ? 35 : 65,
                        height: isCompact ? 35 : 50,
                        borderRadius: isCompact ? "10px" : "12px",
                        cursor: "pointer",
                        flexShrink: 0,
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: 0.4,
                        color: (theme) =>
                          isCurrent
                            ? theme.palette.primary.main
                            : theme.palette.text.secondary,
                        bgcolor: (theme) =>
                          isCurrent
                            ? alpha(theme.palette.primary.main, 0.1)
                            : "transparent",
                        border: (theme) =>
                          `1px solid ${
                            isCurrent
                              ? alpha(theme.palette.primary.main, 0.25)
                              : "transparent"
                          }`,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": {
                          bgcolor: (theme) =>
                            alpha(theme.palette.primary.main, 0.1),
                          color: (theme) => theme.palette.primary.main,
                          borderColor: (theme) =>
                            alpha(theme.palette.primary.main, 0.25),
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
                            transform: isCompact
                              ? "scale(0.85) translate(25%, -25%)"
                              : "scale(1) translate(50%, -50%)",
                            transition: "all 0.2s ease",
                          },
                        }}
                      >
                        <Box
                          sx={{
                            width: isCompact ? 22 : 24,
                            height: isCompact ? 22 : 24,
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

                      {!isCompact && (
                        <Typography
                          sx={{
                            fontSize: "0.55rem",
                            fontWeight: 700,
                            lineHeight: 1,
                            letterSpacing: 0.3,
                          }}
                        >
                          {`Session ${sessionNum}`}
                        </Typography>
                      )}
                    </Box>
                  </Tooltip>
                );
              })}
            </Box>
            <Divider
              flexItem
              sx={{
                mb: 1,
                width: "100%",
                borderColor: (theme) => alpha(theme.palette.divider, 0.2),
              }}
            />
            <Tooltip title="Clear all sessions" placement="left">
              <Box
                onClick={onClearAll}
                sx={{
                  mt: "auto",
                  mb: isCompact ? 1 : 0,
                  width: isCompact ? 35 : 65,
                  height: isCompact ? 35 : 36,
                  borderRadius: "10px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  alignSelf: "center",
                  color: (theme) => theme.palette.text.secondary,
                  transition: "all 0.2s ease-in-out",
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                    color: (theme) => theme.palette.error.main,
                  },
                }}
              >
                <Iconify
                  icon="solar:trash-bin-2-bold"
                  sx={{
                    width: isCompact ? 16 : 18,
                    height: isCompact ? 16 : 18,
                  }}
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
