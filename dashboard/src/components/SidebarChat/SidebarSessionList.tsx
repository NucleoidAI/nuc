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
    <RightSideBar width={45} height={370}>
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
              width: 35,
              height: 35,
              borderRadius: "10px",
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
              sx={{ width: 20, height: 20 }}
            />

            <Typography
              sx={{
                fontSize: "0.5rem",
                fontWeight: 500,
                letterSpacing: 0.5,
                lineHeight: 1,
                textTransform: "uppercase",
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
                width: 35,
                height: 35,
                borderRadius: "10px",
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
                  textTransform: "uppercase",
                }}
              >
                API
              </Typography>
            </Box>
          </Tooltip>
        )}

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
                        width: 35,
                        height: 35,
                        borderRadius: "10px",
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
                  width: 35,
                  height: 35,
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
                    width: 20,
                    height: 20,
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
