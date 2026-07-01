import BlueprintChatTitle from "../BlueprintChat/BlueprintChatTitle";
import BlueprintFlowWidget from "../../widgets/BlueprintFlowWidget/BlueprintFlowWidget";
import CloseIcon from "@mui/icons-material/Close";
import { DrawerLayout } from "@canmingir/link/layouts";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { FlowDefinition } from "../BlueprintFlow/helper";
import Knowledge from "../../widgets/Knowledge/Knowledge";
import SettingsDialog from "../SettingsDialog/SettingsDialog";
import SettingsIcon from "@mui/icons-material/Settings";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";
import SupervisingChat from "../SupervisingChat";
import useBlueprint from "../../hooks/useBlueprint";
import { v4 as uuid } from "uuid";
import { Box, Fab, Grid, IconButton, Tooltip } from "@mui/material";
import {
  GlassCard,
  GlassCardContent,
} from "@canmingir/link/platform/components";
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
  const [showKnowledge, setShowKnowledge] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState(0);
  const [blocking, setBlocking] = useState<boolean>(true);
  const [superviseChatOpen, setSuperviseChatOpen] = useState<boolean>(
    !!supervise
  );
  const [editBlueprintOpen, setEditBlueprintOpen] = useState(false);

  const { patchBlueprint } = useBlueprint();

  const handleBlockingChange = async (value: boolean) => {
    setBlocking(value);
    if (selectedItem?.id) {
      await patchBlueprint(selectedItem.id, { blocking: value });
    }
  };

  useEffect(() => {
    setTitle(selectedItem?.title);
    setDescription(selectedItem?.description);
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
        <BlueprintChatTitle
          title={title}
          description={description}
          setTitle={setTitle}
        />

        {showKnowledge && (
          <GlassCard
            sx={{
              height: "85vh",
              overflow: "hidden",
              position: "relative",
            }}
          >
            <GlassCardContent>
              <Tooltip title="Close" placement="right">
                <IconButton
                  size="small"
                  onClick={() => setShowKnowledge(false)}
                  sx={{ position: "absolute", top: 8, right: 8, zIndex: 99 }}
                >
                  <CloseIcon />
                </IconButton>
              </Tooltip>
              <Knowledge
                agentId={selectedItem?.agentId || agentId}
                blueprintId={selectedItem?.id}
                teamId={teamId}
              />
            </GlassCardContent>
          </GlassCard>
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

        {selectedItem?.id && (
          <SupervisingChat
            open={editBlueprintOpen}
            handleClose={() => setEditBlueprintOpen(false)}
            title="Edit Blueprint"
            agentId={agentId || selectedItem?.agentId}
            sessionId={uuid()}
          />
        )}
      </Box>
    </DrawerLayout>
  );
};

export default BlueprintDrawer;
