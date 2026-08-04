import AccountTreeIcon from "@mui/icons-material/AccountTree";
import BlueprintChatTitle from "../BlueprintChat/BlueprintChatTitle";
import BlueprintFlowWidget from "../../widgets/BlueprintFlowWidget/BlueprintFlowWidget";
import BlueprintKnowledge from "../BlueprintKnowledge/BlueprintKnowledge";
import BlueprintSkill from "../BlueprintSkill/BlueprintSkill";
import { DrawerLayout } from "@canmingir/link/layouts";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { FlowDefinition } from "../BlueprintFlow/helper";
import SettingsDialog from "../SettingsDialog/SettingsDialog";
import SettingsIcon from "@mui/icons-material/Settings";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import SupervisingChat from "../SupervisingChat";
import useBlueprint from "../../hooks/useBlueprint";
import useSupervisings from "../../hooks/useSupervisings";
import { Box, Fab, Grid, Tooltip } from "@mui/material";
import React, { useEffect, useState } from "react";

const BlueprintDrawer = ({
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
    pseudocode?: string;
    skill?: string;
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
    pseudocode?: string;
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
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState(0);
  const [blocking, setBlocking] = useState<boolean>(true);
  const [showConnections, setShowConnections] = useState<boolean>(false);
  const [superviseChatOpen, setSuperviseChatOpen] = useState<boolean>(
    !!supervise
  );
  const [editBlueprintOpen, setEditBlueprintOpen] = useState(false);

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

  useEffect(() => {
    setTitle(selectedItem?.title);
    setDescription(selectedItem?.description);
    setSkill(selectedItem?.skill);
  }, [selectedItem]);

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
        agentId={agentId}
        teamId={teamId}
        blocking={blocking}
        onBlockingChange={handleBlockingChange}
        showConnections={showConnections}
        onSkillChange={setSkill}
        onSkillLoadingChange={setSkillLoading}
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
            right: 24,
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
            right: 120,
            zIndex: 10,
          }}
        >
          <EditNoteIcon />
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
          color={showConnections ? "primary" : "default"}
          onClick={() => setShowConnections((prev) => !prev)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 168,
            zIndex: 10,
          }}
        >
          <AccountTreeIcon />
        </Fab>
      </Tooltip>

      <Tooltip title="Settings" placement="left">
        <Fab
          color="primary"
          onClick={() => setShowSettings((prev) => !prev)}
          sx={{
            position: "absolute",
            bottom: 24,
            right: 72,
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
      </Box>
    </DrawerLayout>
  );
};

export default BlueprintDrawer;
