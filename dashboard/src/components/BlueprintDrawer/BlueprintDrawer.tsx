import BlueprintChatTitle from "../BlueprintChat/BlueprintChatTitle";
import BlueprintFlowWidget from "../../widgets/BlueprintFlowWidget/BlueprintFlowWidget";
import CloseFullscreenIcon from "@mui/icons-material/CloseFullscreen";
import Draggable from "react-draggable";
import { DrawerLayout } from "@canmingir/link/layouts";
import { FlowDefinition } from "../BlueprintFlow/helper";
import Knowledge from "../../widgets/Knowledge/Knowledge";
import OpenInFullIcon from "@mui/icons-material/OpenInFull";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";

import {
  Box,
  Card,
  Grid,
  IconButton,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
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
}) => {
  const theme = useTheme();

  const [title, setTitle] = useState(selectedItem?.title);
  const [description, setDescription] = useState(selectedItem?.description);
  const [knowledgeExpanded, setKnowledgeExpanded] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    setTitle(selectedItem?.title);
    setDescription(selectedItem?.description);
  }, [selectedItem]);

  const flowContent = (
    <Box
      sx={{
        flex: 1,
        padding: { xs: 1, sm: 1.5, md: 3 },
        display: "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
      }}
    >
      <Box sx={{ flexShrink: 0 }}>
        <BlueprintChatTitle
          title={title}
          description={description}
          setTitle={setTitle}
        />
      </Box>
      <Box
        sx={{
          flex: 2,
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
        />
      </Box>
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

            <Draggable
              handle=".knowledge-drag-handle"
              bounds="parent"
              defaultPosition={{ x: 0, y: 0 }}
              onStart={() => setIsDragging(false)}
              onDrag={() => setIsDragging(true)}
            >
              <Card
                elevation={4}
                sx={{
                  position: "absolute",
                  top: 130,
                  left: 24,
                  width: knowledgeExpanded ? "550px" : "180px",
                  maxHeight: knowledgeExpanded ? "calc(100% - 32px)" : "44px",
                  display: "flex",
                  flexDirection: "column",
                  background: `linear-gradient(135deg, ${theme.palette.primary.main}08 0%, ${theme.palette.secondary.main}05 100%)`,
                  backdropFilter: "blur(10px)",
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 2,
                  overflow: "hidden",
                  zIndex: 9,
                  transition:
                    "width 300ms cubic-bezier(0.22, 1, 0.36, 1), max-height 300ms cubic-bezier(0.22, 1, 0.36, 1)",
                }}
              >
                <Box
                  className="knowledge-drag-handle"
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    px: 1.5,
                    flexShrink: 0,
                    minHeight: "44px",
                    cursor: "pointer",
                    borderBottom: knowledgeExpanded
                      ? `1px solid ${theme.palette.divider}`
                      : "none",
                  }}
                  onClick={() => {
                    if (!isDragging) {
                      setKnowledgeExpanded((prev) => !prev);
                    }
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <StickyNote2Icon
                      sx={{ fontSize: 18, color: "primary.main" }}
                    />
                    <Typography variant="body2" fontWeight={600} noWrap>
                      Knowledge
                    </Typography>
                  </Box>
                  <Tooltip
                    title={knowledgeExpanded ? "Collapse" : "Expand"}
                    placement="right"
                  >
                    <IconButton
                      size="small"
                      sx={{ ml: 1 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setKnowledgeExpanded((prev) => !prev);
                      }}
                    >
                      {knowledgeExpanded ? (
                        <CloseFullscreenIcon sx={{ fontSize: 16 }} />
                      ) : (
                        <OpenInFullIcon sx={{ fontSize: 16 }} />
                      )}
                    </IconButton>
                  </Tooltip>
                </Box>

                {knowledgeExpanded && (
                  <Box
                    sx={{
                      flex: 1,
                      overflow: "auto",
                      position: "relative",
                      p: 1,
                    }}
                  >
                    <Knowledge
                      agentId={selectedItem?.agentId || agentId}
                      blueprintId={selectedItem?.id}
                      teamId={teamId}
                    />
                  </Box>
                )}
              </Card>
            </Draggable>
          </Grid>
        </Grid>
      </Box>
    </DrawerLayout>
  );
};

export default BlueprintDrawer;
