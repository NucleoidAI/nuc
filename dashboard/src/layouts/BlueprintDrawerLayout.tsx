import AddIcon from "@mui/icons-material/Add";
import BlueprintChatTitle from "../components/BlueprintChat/BlueprintChatTitle";
import type { BlueprintContext as BlueprintContextData } from "../hooks/useBlueprint";
import BlueprintFlowWidget from "../widgets/BlueprintFlowWidget/BlueprintFlowWidget";
import BlueprintKnowledge from "../components/BlueprintKnowledge/BlueprintKnowledge";
import BlueprintSkill from "../components/BlueprintSkill/BlueprintSkill";
import CloseIcon from "@mui/icons-material/Close";
import { CodeEditor } from "../widgets/CodeEditor";
import { DrawerLayout } from "@canmingir/link/layouts";
import { FlowDefinition } from "../components/BlueprintFlow/helper";
import HorizontalSplitIcon from "@mui/icons-material/HorizontalSplit";
import LogicView from "../components/LogicView/LogicView";
import PsychologyIcon from "@mui/icons-material/Psychology";
import SettingsDialog from "../components/SettingsDialog/SettingsDialog";
import SettingsIcon from "@mui/icons-material/Settings";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import SupervisingChat from "../components/SupervisingChat";
import useBlueprint from "../hooks/useBlueprint";
import useSupervisings from "../hooks/useSupervisings";
import {
  Box,
  Dialog,
  DialogContent,
  Fab,
  Grid,
  IconButton,
  List,
  SvgIcon,
  Tooltip,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { publish, useEvent } from "@nucleoidai/react-event";
import { storage, useStorage } from "@nucleoidjs/webstorage";

type LogicRule = {
  id: string;
  name: string;
  description: string;
  code: string;
};

const defaultLogicRules: LogicRule[] = [
  {
    id: "rule-1",
    name: "Compliance Certificate Follow-up Flow Decision Model (DCM) for Missing Certificates Triggering Vendor Contact",
    description:
      "Use this rule when a product is missing its compliance certificate and the vendor must be contacted directly to obtain it. Flow: get product vendor, email vendor requesting the certificate, notify the user that the vendor was contacted, then complete. It exits after notifying the user; the certificate itself arrives out of band once the vendor responds.",
    code: `items = Product.filter(certificate=None)

for product in items:
    vendor = product.vendor
    email_vendor(vendor, "Please send the compliance certificate")
    notify_user(f"Contacted {vendor.name} for {product.name}")`,
  },
  {
    id: "rule-2",
    name: "Escalate Stale Tasks",
    description:
      "Use this rule to escalate tasks that have been pending for more than 48 hours without a status update, so the assigned supervisor is notified before the SLA is breached.",
    code: `tasks = Task.filter(status="PENDING")

for task in tasks:
    if task.hours_since_update() > 48:
        notify_supervisor(task, "SLA at risk")`,
  },
  {
    id: "rule-3",
    name: "Auto-tag Incoming Requests",
    description:
      "Use this rule to automatically tag new incoming requests based on keywords in their title, so they are routed to the right queue without manual triage.",
    code: `requests = Request.filter(tags=None)

for request in requests:
    tag = classify(request.title)
    request.tags = [tag]`,
  },
];

const BlueprintDrawerLayout = ({
  drawerOpen,
  handleDrawerClose,
  selectedItem,
  setAiResponse,
  aiResponse,
  setSelectedItem,
  taskId,
  agentId,
  usedNodeIds,
  lastUsedNodeId,
  failedNodeId,
  teamId,
  supervise,
}: {
  drawerOpen: boolean;
  handleDrawerClose: () => void;
  selectedItem: {
    id: string;
    title: string;
    description: string;
    agentId: string;
    skill?: string;
    executionMode?: "NORMAL" | "LITE";
    api?: boolean;
    context?: BlueprintContextData | null;
  };
  handleAiResponse?: (response: {
    flow: FlowDefinition;
    response?: string;
  }) => void;
  aiResponse?: { flow: FlowDefinition; response?: string };
  setAiResponse?: (response: {
    flow: FlowDefinition;
    response?: string;
  }) => void;
  setSelectedItem?: (item: {
    id: string;
    title: string;
    description: string;
    agentId: string;
  }) => void;
  taskId?: string;
  agentId?: string;
  usedNodeIds?: Set<string>;
  lastUsedNodeId?: string | null;
  failedNodeId?: string | null;
  teamId?: string;
  supervise?: {
    id: string;
    question?: string;
    answer?: string;
    status: string;
    blueprintId?: string;
    taskId?: string;
    conversationId?: string;
    sessionId?: string;
  };
}) => {
  const [title, setTitle] = useState(selectedItem?.title);
  const [description, setDescription] = useState(selectedItem?.description);
  const [skill, setSkill] = useState(selectedItem?.skill);
  const [skillLoading, setSkillLoading] = useState(false);
  const [context, setContext] = useState<BlueprintContextData | null>(
    selectedItem?.context ?? null
  );
  const [liveNodes, setLiveNodes] = useState([]);
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState(0);
  const [blocking, setBlocking] = useState<boolean>(true);
  const [liteMode, setLiteMode] = useState<boolean>(
    selectedItem?.executionMode === "LITE"
  );
  const [api, setApi] = useState<boolean>(Boolean(selectedItem?.api));
  const [showConnections] = useStorage(
    "greycollar",
    "blueprintdrawerlayout",
    "showconnections",
    false
  );
  const [superviseChatOpen, setSuperviseChatOpen] = useState<boolean>(
    !!supervise
  );
  const [editBlueprintOpen, setEditBlueprintOpen] = useState(false);

  const [logicEditorOpen, setLogicEditorOpen] = useState(false);
  const [logicRules, setLogicRules] = useState<LogicRule[]>(defaultLogicRules);
  const [selectedLogicRuleId, setSelectedLogicRuleId] = useState(
    defaultLogicRules[0].id
  );
  const selectedLogicRule =
    logicRules.find((rule) => rule.id === selectedLogicRuleId) ?? logicRules[0];

  const handleLogicCodeChange = (value: string) => {
    setLogicRules((prev) =>
      prev.map((rule) =>
        rule.id === selectedLogicRuleId ? { ...rule, code: value } : rule
      )
    );
  };

  const setShowConnections = (value: boolean) => {
    storage.set(
      "greycollar",
      "blueprintdrawerlayout",
      "showconnections",
      value
    );
  };

  const [reopenRequest] = useEvent<{ requestedAt: number | null }>(
    "SUPERVISOR_CHAT_REOPEN",
    { requestedAt: null }
  );

  const [highlightRequest] = useEvent<{ nodeId: string | null }>(
    "BLUEPRINT_HIGHLIGHT_NODE",
    { nodeId: null }
  );
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

  useEffect(() => {
    if (highlightRequest?.nodeId) {
      setSelectedNodeId(highlightRequest.nodeId);
    }
  }, [highlightRequest]);

  useEffect(() => {
    publish("BLUEPRINT_CONTEXT", { context: drawerOpen ? context : null });
  }, [drawerOpen, context]);

  useEffect(() => {
    return () => {
      publish("BLUEPRINT_CONTEXT", { context: null });
      publish("SUPERVISOR_CHAT", { canReopen: false });
    };
  }, []);

  useEffect(() => {
    publish("SUPERVISOR_CHAT", {
      canReopen: drawerOpen && !!supervise && !superviseChatOpen,
    });
  }, [drawerOpen, supervise, superviseChatOpen]);

  useEffect(() => {
    if (reopenRequest?.requestedAt && supervise) {
      setSuperviseChatOpen(true);
    }
  }, [reopenRequest, supervise]);

  const { patchBlueprint } = useBlueprint();
  const { approveBlueprintChat } = useSupervisings();

  const handleManualResolve = async (decision: "BLUEPRINT" | "KNOWLEDGE") => {
    if (!supervise?.id) return;
    await approveBlueprintChat({
      supervisingId: supervise.id,
      decision,
      answer:
        decision === "BLUEPRINT"
          ? "Blueprint manually updated"
          : "Knowledge manually added",
    });
  };

  const handleBlockingChange = async (value: boolean) => {
    setBlocking(value);
    if (selectedItem?.id) {
      await patchBlueprint(selectedItem.id, { blocking: value });
    }
  };

  const handleLiteModeChange = async (value: boolean) => {
    setLiteMode(value);
    if (selectedItem?.id) {
      await patchBlueprint(selectedItem.id, {
        executionMode: value ? "LITE" : "NORMAL",
      });
    }
  };

  useEffect(() => {
    setTitle(selectedItem?.title);
    setDescription(selectedItem?.description);
    setSkill(selectedItem?.skill);
    setContext(selectedItem?.context ?? null);
    setSelectedNodeId(null);
  }, [selectedItem]);

  useEffect(() => {
    setLiteMode(selectedItem?.executionMode === "LITE");
    setApi(Boolean(selectedItem?.api));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedItem?.id]);

  useEffect(() => {
    if (supervise) setSuperviseChatOpen(true);
  }, [supervise]);

  const flowContent = (
    <Box
      sx={{
        flex: 1,
        height: "100%",
        minHeight: 0,
        overflow: "hidden",
        position: "relative",
      }}
    >
      <BlueprintFlowWidget
        blueprint={{
          ...selectedItem,
          title,
          description,
          agentId: selectedItem?.agentId || agentId,
        }}
        aiResponse={aiResponse}
        setAiResponse={setAiResponse}
        taskId={taskId}
        setSelectedItem={setSelectedItem}
        usedNodeIds={usedNodeIds}
        lastUsedNodeId={lastUsedNodeId}
        failedNodeId={failedNodeId}
        selectedNodeId={selectedNodeId}
        agentId={agentId}
        teamId={teamId}
        blocking={blocking}
        onBlockingChange={handleBlockingChange}
        liteMode={liteMode}
        api={api}
        showConnections={showConnections}
        onSkillChange={setSkill}
        onSkillLoadingChange={setSkillLoading}
        onNodesChange={setLiveNodes}
        onContextChange={setContext}
        onSave={supervise ? () => handleManualResolve("BLUEPRINT") : undefined}
      />

      <Box
        sx={{
          position: "absolute",
          top: { xs: 8, sm: 12, md: 16 },
          left: { xs: 8, sm: 12, md: 16 },
          zIndex: 10,
          display: "flex",
          flexDirection: "column",
          gap: 1.5,
          maxWidth: { xs: "calc(100% - 80px)", sm: "50%", md: "45%" },
          maxHeight: "calc(100% - 32px)",
        }}
      >
        <BlueprintChatTitle title={title} setTitle={setTitle} />

        <BlueprintSkill
          skill={skill}
          skillLoading={skillLoading}
          showKnowledge={showKnowledge}
          blueprintId={selectedItem?.id}
          nodes={liveNodes}
        />

        {showKnowledge && (
          <BlueprintKnowledge
            setShowKnowledge={setShowKnowledge}
            selectedItem={selectedItem}
            agentId={agentId}
            teamId={teamId}
            onItemAdded={
              supervise ? () => handleManualResolve("KNOWLEDGE") : undefined
            }
          />
        )}
      </Box>

      <Tooltip title="Add Logic" placement="left">
        <Fab
          color="primary"
          onClick={() => setLogicEditorOpen((prev) => !prev)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 216,
            zIndex: 10,
          }}
        >
          <PsychologyIcon />
        </Fab>
      </Tooltip>

      <Tooltip
        title={showKnowledge ? "Collapse Knowledge" : "Expand Knowledge"}
        placement="left"
      >
        <Fab
          color="primary"
          onClick={() => setShowKnowledge((prev) => !prev)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 72,
            zIndex: 10,
          }}
        >
          <StickyNote2Icon />
        </Fab>
      </Tooltip>

      <Tooltip title="Edit Blueprint" placement="left">
        <Fab
          color="primary"
          onClick={() => setEditBlueprintOpen((prev) => !prev)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 168,
            zIndex: 10,
          }}
        >
          <SvgIcon>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="20"
              height="20"
              viewBox="0 0 20 20"
            >
              <path
                fill="white"
                d="M7.398 12.809a1.042 1.042 0 0 0 1.204-.003c.178-.13.313-.31.387-.518l.447-1.373a2.336 2.336 0 0 1 1.477-1.479l1.391-.45a1.045 1.045 0 0 0-.044-1.98l-1.375-.448a2.335 2.335 0 0 1-1.48-1.477l-.452-1.388a1.044 1.044 0 0 0-1.973.017l-.457 1.4a2.336 2.336 0 0 1-1.44 1.45l-1.39.447a1.045 1.045 0 0 0 .016 1.974l1.374.445a2.333 2.333 0 0 1 1.481 1.488l.452 1.391c.072.204.206.38.382.504m6.137 4.042a.806.806 0 0 0 1.226-.398l.248-.762a1.09 1.09 0 0 1 .26-.42c.118-.12.262-.208.42-.26l.772-.252a.8.8 0 0 0-.023-1.52l-.764-.25a1.075 1.075 0 0 1-.68-.678l-.252-.773a.8.8 0 0 0-1.518.01l-.247.762a1.068 1.068 0 0 1-.665.679l-.773.252a.8.8 0 0 0 .008 1.518l.763.247c.16.054.304.143.422.261c.119.119.207.263.258.422l.253.774a.8.8 0 0 0 .292.388"
              />
            </svg>
          </SvgIcon>
        </Fab>
      </Tooltip>

      <Tooltip
        title={
          showConnections
            ? "Hide parameter connections"
            : "Show parameter connections"
        }
        placement="left"
      >
        <Fab
          color="primary"
          onClick={() => setShowConnections(!showConnections)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 120,
            zIndex: 10,
          }}
        >
          <HorizontalSplitIcon />
        </Fab>
      </Tooltip>

      <Tooltip title="Settings" placement="left">
        <Fab
          color="primary"
          onClick={() => setShowSettings((prev) => !prev)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 24,
            zIndex: 10,
          }}
        >
          <SettingsIcon />
        </Fab>
      </Tooltip>

      <SettingsDialog
        showSettings={showSettings}
        setShowSettings={setShowSettings}
        settingsTab={settingsTab}
        setSettingsTab={setSettingsTab}
        blocking={blocking}
        setBlocking={handleBlockingChange}
        liteMode={liteMode}
        setLiteMode={handleLiteModeChange}
        api={api}
        setApi={setApi}
        blueprintId={selectedItem?.id}
      />
    </Box>
  );

  return (
    <DrawerLayout
      open={drawerOpen}
      onClose={handleDrawerClose}
      mode="fullscreen"
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2,
      }}
      contentSx={{
        p: 0,
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        data-cy="blueprint-drawer-layout"
        sx={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        role="presentation"
      >
        <Grid container sx={{ flex: 1, height: "100%" }} spacing={0}>
          <Grid
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              maxHeight: "100vh",
              position: "relative",
            }}
            size={{
              xs: 12,
            }}
          >
            {flowContent}
          </Grid>
        </Grid>

        {supervise && (
          <SupervisingChat
            open={superviseChatOpen}
            handleClose={() => setSuperviseChatOpen(false)}
            supervise={supervise}
            agentId={agentId}
          />
        )}

        {editBlueprintOpen && (
          <SupervisingChat
            open={editBlueprintOpen}
            handleClose={() => setEditBlueprintOpen(false)}
            title="Edit Blueprint"
            agentId={agentId || selectedItem?.agentId}
            blueprintId={selectedItem?.id}
          />
        )}

        {logicEditorOpen && (
          <Dialog
            type="medium"
            sx={{
              zIndex: (theme) => theme.zIndex.modal + 2,
            }}
            open={logicEditorOpen}
            onClose={() => setLogicEditorOpen(false)}
          >
            <DialogContent sx={{ p: 0, display: "flex", height: "100%" }}>
              <Box
                sx={{
                  width: 350,
                  display: "flex",
                  flexDirection: "column",
                  borderRight: 1,
                  borderColor: "divider",
                  borderRadius: "4px 0 0 4px",
                  bgcolor: (theme) =>
                    theme.palette.mode === "dark" ? "grey.900" : "grey.50",
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderBottom: 1,
                    borderColor: "divider",
                  }}
                >
                  <Box sx={{ width: 28 }} />
                  <Typography
                    variant="subtitle2"
                    fontWeight={600}
                    sx={{ textAlign: "center", flex: 1 }}
                  >
                    Logics
                  </Typography>
                  <Tooltip title="New session">
                    <IconButton size="small">
                      <AddIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                </Box>

                <List sx={{ flex: 1 }} dense>
                  {logicRules.map((rule) => (
                    <Box
                      onClick={() => setSelectedLogicRuleId(rule.id)}
                      key={rule.id}
                      sx={{
                        height: 56,
                        display: "flex",
                        alignItems: "center",
                        cursor: "default",
                        m: 0.5,
                        p: 1,
                        background: (theme) =>
                          rule.id === selectedLogicRuleId
                            ? theme.palette.action.selected
                            : theme.palette.action.hover,
                      }}
                    >
                      <Typography
                        sx={{
                          display: "-webkit-box",
                          WebkitBoxOrient: "vertical",
                          WebkitLineClamp: 2,
                          overflow: "hidden",
                        }}
                        variant="body2"
                      >
                        {rule.name}
                      </Typography>
                    </Box>
                  ))}
                </List>
              </Box>

              <Box
                sx={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minWidth: 0,
                }}
              >
                <Box
                  sx={{
                    position: "relative",
                  }}
                >
                  <LogicView
                    title="LOGIC.md"
                    content={selectedLogicRule?.description}
                    height="auto"
                    rounded={false}
                  />
                  <IconButton
                    size="small"
                    onClick={() => setLogicEditorOpen(false)}
                    sx={{
                      position: "absolute",
                      top: 8,
                      right: 16,
                      color: "common.white",
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                <Box sx={{ flex: 1, minHeight: 0 }}>
                  <CodeEditor
                    value={selectedLogicRule?.code ?? ""}
                    onChange={handleLogicCodeChange}
                    language="python"
                    path={`logic/${selectedLogicRule?.id}/main.py`}
                    themeMode="dark"
                    backgroundColor="#000000"
                    height="100%"
                  />
                </Box>
              </Box>
            </DialogContent>
          </Dialog>
        )}
      </Box>
    </DrawerLayout>
  );
};

export default BlueprintDrawerLayout;
