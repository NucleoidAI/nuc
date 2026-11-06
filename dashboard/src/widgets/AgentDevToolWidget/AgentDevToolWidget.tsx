import ApiCallPanel from "./ApiCallPanel";
import ApiSessionView from "./ApiSessionView";
import type { BlueprintContext } from "../../hooks/useBlueprint";
import BlueprintContextDetails from "../../components/BlueprintContextDetails/BlueprintContextDetails";
import BlueprintExecutions from "../BlueprintExecutions";
import ChatTimeline from "./ChatTimeline";
import { DrawerLayout } from "@canmingir/link/layouts";
import type { Theme } from "@mui/material/styles";
import { loadApiCall } from "./apiSession";
import useAgent from "../../hooks/useAgent";
import useBlueprint from "../../hooks/useBlueprint";
import useBlueprintExecution from "../../hooks/useBlueprintExecution";
import useChatSessions from "../../hooks/useChatSessions";
import useSession from "../../hooks/useSession";
import useSessionSteps from "../../hooks/useSessionSteps";
import { Box, Portal, ThemeProvider, Typography } from "@mui/material";
import { DevTool, SidebarChat } from "@canmingir/link/platform/components";
import {
  type DevToolBlueprint,
  inputFieldsOf,
  variablesTemplateOf,
} from "./blueprintInputs";
import { publish, useEvent } from "@nucleoidai/react-event";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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
  const runRef = useRef(0);

  const {
    apiCall,
    setApiCall,
    execute: executeBlueprint,
    reset: resetApiCall,
  } = useBlueprintExecution();

  useEffect(
    () => () => {
      runRef.current += 1;
    },
    []
  );

  const [blueprintContext] = useEvent<{ context: BlueprintContext | null }>(
    "BLUEPRINT_CONTEXT",
    { context: null }
  );
  const context = blueprintContext?.context ?? null;

  const [blueprintDebug] = useEvent<{ blueprintId: string | null }>(
    "BLUEPRINT_DEBUG",
    { blueprintId: null }
  );
  const debugBlueprintId = blueprintDebug?.blueprintId ?? null;
  const [executionsOpen, setExecutionsOpen] = useState(false);

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
    sendVariables,
  } = useSession(agentId, { debug: true });

  const { getBlueprint } = useBlueprint();
  const { Blueprint } = getBlueprint([], agentId);

  const selected = useMemo(() => {
    const blueprints: DevToolBlueprint[] = Blueprint
      ? Array.isArray(Blueprint)
        ? Blueprint
        : [Blueprint]
      : [];
    return blueprints.find(({ id }) => id === selectedBlueprint);
  }, [Blueprint, selectedBlueprint]);

  const inputFields = useMemo(() => inputFieldsOf(selected), [selected]);
  const jsonTemplate = useMemo(() => variablesTemplateOf(selected), [selected]);

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

  useEffect(() => {
    if (!debugBlueprintId) setExecutionsOpen(false);
  }, [debugBlueprintId]);

  const handleToggle = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const handleBlueprintChange = useCallback(
    (blueprintId: string) => {
      if (!blueprintId) return;
      setSelectedBlueprint(blueprintId);
      runRef.current += 1;
      resetApiCall();
      setMessages([]);
      createSession(blueprintId);
    },
    [createSession, resetApiCall]
  );

  useEffect(() => {
    if (!Array.isArray(Blueprint) || selected) return;
    const [first] = Blueprint as DevToolBlueprint[];
    if (first) handleBlueprintChange(first.id);
  }, [Blueprint, selected, handleBlueprintChange]);

  const handleSessionSelect = useCallback(
    async (
      selectedSessionId: string,
      cachedMessages?: { id?: string; content: string; role: string }[]
    ) => {
      const stored = storedSessions.find(
        (session) => session.sessionId === selectedSessionId
      ) as { type?: string } | undefined;

      if (stored?.type === "API" && agentId) {
        runRef.current += 1;
        const call = await loadApiCall(agentId, selectedSessionId).catch(
          () => null
        );
        if (call) {
          if (call.blueprintId) setSelectedBlueprint(call.blueprintId);
          setApiCall(call);
        }
        return;
      }

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
    [storedSessions, agentId, switchSession, getSession, setApiCall]
  );

  const handleNewSession = useCallback(() => {
    setMessages([]);
    createSession(selectedBlueprint || undefined);
  }, [createSession, selectedBlueprint]);

  const handleSubmitForm = useCallback(
    async (values: Record<string, unknown>) => {
      if (!selected) return "Select a blueprint first";
      return executeBlueprint(selected.id, values);
    },
    [selected, executeBlueprint]
  );

  const handleSubmitJson = useCallback(
    async (value: unknown) => {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return "Variables must be a JSON object";
      }

      try {
        await sendVariables(value as Record<string, unknown>);
      } catch (error) {
        return error instanceof Error ? error.message : "Failed to send JSON";
      }
    },
    [sendVariables]
  );

  const sessionSteps = useSessionSteps({
    agentId,
    sessionId,
    enabled: open && Boolean(selected) && !selected?.api,
  });

  const playgroundTitle =
    (selected?.api ? apiCall?.taskName : sessionSteps.taskName) ?? "Playground";

  const handleNewUserMessage = async (content: string) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { role: "USER", content, createdAt: new Date().toISOString() },
    ]);
    sendMessage(content);
  };

  const handleOutputClick = useCallback((nodeId: string) => {
    publish("BLUEPRINT_HIGHLIGHT_NODE", { nodeId });
    setContextOpen(false);
  }, []);

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
        renderSession={(session) =>
          (session as { type?: string }).type === "API" && agentId ? (
            <ApiSessionView agentId={agentId} sessionId={session.sessionId} />
          ) : undefined
        }
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
          ...(debugBlueprintId
            ? [
                {
                  icon: "solar:history-bold",
                  label: "Executions",
                  tooltip: "Blueprint executions",
                  onClick: () => setExecutionsOpen(true),
                },
              ]
            : []),
        ]}
      >
        {({ open: chatOpen, handleToggle: chatToggle, onNewSession }) => (
          <ThemeProvider
            theme={(theme: Theme) => ({
              ...theme,
              zIndex: {
                ...theme.zIndex,
                drawer: theme.zIndex.modal + 3,
                modal: theme.zIndex.modal + 4,
              },
            })}
          >
            <SidebarChat
              title={playgroundTitle}
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
              inputFields={inputFields}
              onSubmitForm={selected?.api ? handleSubmitForm : undefined}
              jsonTemplate={jsonTemplate}
              onSubmitJson={
                selected && !selected.api ? handleSubmitJson : undefined
              }
              presetRequired
              panel={
                selected?.api ? (
                  <ApiCallPanel call={apiCall} />
                ) : (
                  <ChatTimeline
                    messages={messages}
                    steps={sessionSteps.steps}
                    running={sessionSteps.running}
                  />
                )
              }
              inputModes={selected?.api ? ["form"] : ["chat", "json"]}
            />
          </ThemeProvider>
        )}
      </DevTool>
      <DrawerLayout
        anchor="right"
        mode="narrow"
        open={Boolean(context) && contextOpen}
        onClose={() => setContextOpen(false)}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 4 }}
        slotProps={{ paper: { sx: { width: 420, p: 2 } } }}
        title={
          <Box
            display="flex"
            justifyContent="space-between"
            alignItems="center"
            sx={{ pr: 6 }}
          >
            <Typography variant="h6">Context</Typography>
          </Box>
        }
      >
        <Box>
          <BlueprintContextDetails
            context={context}
            onOutputClick={handleOutputClick}
          />
        </Box>
      </DrawerLayout>
      <DrawerLayout
        anchor="right"
        mode="narrow"
        open={Boolean(debugBlueprintId) && executionsOpen}
        onClose={() => setExecutionsOpen(false)}
        sx={{ zIndex: (theme) => theme.zIndex.modal + 4 }}
        slotProps={{
          paper: {
            sx: { width: 420, pt: 2, display: "flex", flexDirection: "column" },
          },
        }}
        title={
          <Box sx={{ px: 2, pr: 6 }}>
            <Typography variant="h6">Executions</Typography>
          </Box>
        }
      >
        {debugBlueprintId && (
          <BlueprintExecutions blueprintId={debugBlueprintId} />
        )}
      </DrawerLayout>
    </Portal>
  );
};

export default AgentDevToolWidget;
