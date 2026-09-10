import type { BlueprintContext } from "../../hooks/useBlueprint";
import BlueprintContextDetails from "../../components/BlueprintContextDetails/BlueprintContextDetails";
import useAgent from "../../hooks/useAgent";
import useBlueprint from "../../hooks/useBlueprint";
import useChatSessions from "../../hooks/useChatSessions";
import useSession from "../../hooks/useSession";

import { Box, Drawer, IconButton, Portal, Typography } from "@mui/material";
import {
  DevTool,
  Iconify,
  SidebarChat,
} from "@canmingir/link/platform/components";
import { publish, useEvent } from "@nucleoidai/react-event";
import { useCallback, useEffect, useState } from "react";

interface AgentDevToolWidgetProps {
  readOnly?: boolean;
  conversationId?: string;
  sound?: boolean;
  agentId?: string;
  beta?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const AgentDevToolWidget = ({
  readOnly,
  conversationId,
  sound,
  agentId,
  beta,
  onOpenChange,
}: AgentDevToolWidgetProps) => {
  const [open, setOpen] = useState(false);
  const [contextOpen, setContextOpen] = useState(false);
  const [selectedBlueprint, setSelectedBlueprint] = useState("");
  const [messages, setMessages] = useState([]);

  const [blueprintContext] = useEvent<{ context: BlueprintContext | null }>(
    "BLUEPRINT_CONTEXT",
    { context: null }
  );
  const context = blueprintContext?.context ?? null;

  const [superviseChat] = useEvent<{ canReopen: boolean }>("SUPERVISOR_CHAT", {
    canReopen: false,
  });
  const canReopenSupervise = Boolean(superviseChat?.canReopen);

  const {
    sessionId,
    conversations,
    sendMessage,
    switchSession,
    createSession,
    getSession,
  } = useSession(agentId);

  const { getBlueprint } = useBlueprint();
  const { Blueprint } = getBlueprint();

  const { getAgent } = useAgent();
  const { agent } = getAgent(agentId);

  const currentSessionId = sessionId || conversationId;

  const { storedSessions, refresh, clearAll } = useChatSessions(
    currentSessionId,
    agentId,
    messages,
    agent?.icon,
    agent?.name
  );

  useEffect(() => {
    onOpenChange?.(open);
  }, [open, onOpenChange]);

  useEffect(() => {
    if (conversations.length > 0) {
      setMessages(conversations);
    }
  }, [conversations]);

  useEffect(() => {
    if (open && sessionId) {
      getSession(sessionId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sessionId]);

  useEffect(() => {
    if (!context) setContextOpen(false);
  }, [context]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleBlueprintChange = useCallback(
    (blueprintId: string) => {
      setSelectedBlueprint(blueprintId);
      setMessages([]);
      createSession(blueprintId || undefined);
    },
    [createSession]
  );

  const handleSessionSelect = useCallback(
    async (
      selectedSessionId: string,
      cachedMessages?: { id?: string; content: string; role: string }[]
    ) => {
      if (cachedMessages?.length) {
        setMessages(cachedMessages);
      }
      try {
        await switchSession(selectedSessionId);
        getSession(selectedSessionId);
      } catch {
        getSession(selectedSessionId);
      }
    },
    [switchSession, getSession]
  );

  const handleNewSession = useCallback(() => {
    setMessages([]);
    createSession();
  }, [createSession]);

  const handleNewUserMessage = async (content: string) => {
    setMessages((prevMessages) => [...prevMessages, { role: "USER", content }]);
    sendMessage(content);
  };

  return (
    <Portal>
      <DevTool
        open={open}
        handleToggle={handleToggle}
        selectedConversationId={conversationId || null}
        sessionId={sessionId}
        history={messages}
        storedSessions={storedSessions}
        refreshSessions={refresh}
        clearAllSessions={clearAll}
        onSessionSelect={handleSessionSelect}
        onNewSession={handleNewSession}
        beta={beta}
        topActions={[
          ...(canReopenSupervise
            ? [
                {
                  icon: "solar:users-group-rounded-bold",
                  label: "Supervise",
                  tooltip: "Reopen resolve supervise chat",
                  onClick: () =>
                    publish("SUPERVISOR_CHAT_REOPEN", {
                      requestedAt: Date.now(),
                    }),
                  sx: {
                    color: "#ffa726",
                    "&:hover": {
                      color: "#ffa726",
                      bgcolor: "rgba(255, 152, 0, 0.12)",
                      borderColor: "rgba(255, 152, 0, 0.3)",
                      transform: "scale(1.08)",
                    },
                  },
                },
              ]
            : []),
          ...(context
            ? [
                {
                  icon: "solar:layers-minimalistic-bold",
                  label: "Context",
                  tooltip: "Blueprint context",
                  onClick: () => setContextOpen(true),
                },
              ]
            : []),
        ]}
      >
        {({ open: chatOpen, handleToggle: chatToggle, onNewSession }) => (
          <SidebarChat
            title="Chat"
            open={chatOpen}
            handleToggle={chatToggle}
            history={messages}
            handleNewUserMessage={handleNewUserMessage}
            readOnly={readOnly}
            sessionId={sessionId}
            selectedConversationId={conversationId || undefined}
            sound={sound}
            Presets={
              Blueprint
                ? Array.isArray(Blueprint)
                  ? Blueprint
                  : [Blueprint]
                : []
            }
            selectedPreset={selectedBlueprint}
            onPresetChange={handleBlueprintChange}
            onNewSession={onNewSession}
          />
        )}
      </DevTool>
      <Drawer
        anchor="right"
        open={Boolean(context) && contextOpen}
        onClose={() => setContextOpen(false)}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 4 }}
        slotProps={{ paper: { sx: { width: 420, p: 2 } } }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            mb: 0.5,
          }}
        >
          <Typography variant="subtitle1">Contexts</Typography>
          <IconButton size="small" onClick={() => setContextOpen(false)}>
            <Iconify
              icon="solar:close-circle-bold"
              sx={{ width: 16, height: 16 }}
            />
          </IconButton>
        </Box>

        <Typography variant="caption" color="text.secondary">
          What this flow was built from
        </Typography>

        <Box sx={{ mt: 2 }}>
          <BlueprintContextDetails context={context} />
        </Box>
      </Drawer>
    </Portal>
  );
};

export default AgentDevToolWidget;
