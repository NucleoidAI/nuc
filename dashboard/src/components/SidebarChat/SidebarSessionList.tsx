import { Iconify } from "@canmingir/link/platform/components";
import RightSideBar from "../RightSideBar/RightSideBar";
import type { StoredSession } from "../../hooks/useChatSessions";
import { alpha } from "@mui/material/styles";
import { cleanIconName } from "../../utils/cleanIconName";
import { publish } from "@nucleoidai/react-event";

import {
  Badge,
  Box,
  Divider,
  ListItemButton,
  Tooltip,
  Typography,
} from "@mui/material";
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

const itemSx = {
  borderRadius: "6px",
  fontSize: 9,
  minHeight: 36,
  lineHeight: "12px",
  textAlign: "center",
  flexDirection: "column",
  justifyContent: "center",
  padding: "3px",
  margin: "0 3px",
  fontWeight: 600,
  color: "text.secondary",
  width: "calc(100% - 6px)",
  transition: "all 0.2s ease-in-out",
};

const activeItemSx = {
  ...itemSx,
  fontWeight: 700,
  color: "primary.main",
  bgcolor: ({ palette }) => alpha(palette.primary.main, 0.08),
  "&:hover": {
    bgcolor: ({ palette }) => alpha(palette.primary.main, 0.16),
  },
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
          flex: "0 0 auto",
          mt: 2,
        }}
      >
        {/* New Chat */}
        <Tooltip
          title="New Chat"
          placement="left"
          enterDelay={1000}
          enterNextDelay={1000}
        >
          <ListItemButton
            onClick={() => {
              onNewSession?.();
              onToggleChat();
            }}
            sx={itemSx}
          >
            <Iconify
              icon="solar:add-square-bold-duotone"
              sx={{ width: 16, height: 16 }}
            />
            <Box
              component="span"
              sx={{
                display: "block",
                overflow: "hidden",
                whiteSpace: "nowrap",
                textOverflow: "ellipsis",
                width: "100%",
                mt: 0.5,
                textTransform: "capitalize",
              }}
            >
              New
            </Box>
          </ListItemButton>
        </Tooltip>

        {/* Open API */}
        {!beta && (
          <Tooltip
            title="Open API"
            placement="left"
            enterDelay={1000}
            enterNextDelay={1000}
          >
            <ListItemButton
              onClick={() => publish("SWAGGER_DIALOG_OPEN", { open: true })}
              sx={itemSx}
            >
              <Iconify
                icon="logos:swagger"
                sx={{
                  width: 16,
                  height: 16,
                  transition: "all 0.2s ease-in-out",
                }}
              />
              <Box
                component="span"
                sx={{
                  display: "block",
                  overflow: "hidden",
                  whiteSpace: "nowrap",
                  textOverflow: "ellipsis",
                  width: "100%",
                  mt: 0.5,
                  textTransform: "capitalize",
                }}
              >
                API
              </Box>
            </ListItemButton>
          </Tooltip>
        )}

        {/* Sessions */}
        {sessions.length > 0 && (
          <>
            <Divider
              flexItem
              sx={{
                my: 0.5,
                mx: 1,
                borderColor: (theme) => alpha(theme.palette.divider, 0.2),
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
                  <ListItemButton
                    onClick={(e) => onSessionClick(e, session.sessionId)}
                    sx={isCurrent ? activeItemSx : itemSx}
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
                          width: 16,
                          height: 16,
                          borderRadius: "5px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          bgcolor: (theme) =>
                            isCurrent
                              ? alpha(theme.palette.primary.main, 0.2)
                              : alpha(theme.palette.text.secondary, 0.1),
                        }}
                      >
                        {session.agentIcon ? (
                          <Iconify
                            icon={cleanIconName(session.agentIcon)}
                            sx={{ width: 12, height: 12 }}
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

                    <Box
                      component="span"
                      sx={{
                        display: "block",
                        overflow: "hidden",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        width: "100%",
                        mt: 0.5,
                        textTransform: "capitalize",
                      }}
                    >
                      {`Ses. ${sessionNum}`}
                    </Box>
                  </ListItemButton>
                </Tooltip>
              );
            })}

            <Divider
              flexItem
              sx={{
                mt: 0.5,
                mx: 1,
                borderColor: (theme) => alpha(theme.palette.divider, 0.2),
              }}
            />

            {/* Clear all */}
            <Tooltip title="Clear all sessions" placement="left">
              <ListItemButton
                onClick={onClearAll}
                sx={{
                  ...itemSx,
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.error.main, 0.08),
                    color: "error.main",
                  },
                }}
              >
                <Iconify
                  icon="solar:trash-bin-2-bold"
                  sx={{ width: 16, height: 16 }}
                />
                <Box
                  component="span"
                  sx={{
                    display: "block",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    width: "100%",
                    mt: 0.5,
                    textTransform: "capitalize",
                  }}
                >
                  Clear
                </Box>
              </ListItemButton>
            </Tooltip>
          </>
        )}
      </Box>
    </RightSideBar>
  );
};

export default memo(SidebarSessionList);
