import BlueprintChat from "../BlueprintChat/BlueprintChat";
import BlueprintChatTitle from "../BlueprintChat/BlueprintChatTitle";
import BlueprintFlowWidget from "../../widgets/BlueprintFlowWidget/BlueprintFlowWidget";
import { ChatBubbleOutline } from "@mui/icons-material";
import { DrawerLayout } from "@canmingir/link/layouts";
import { FlowDefinition } from "../BlueprintFlow/helper";
import Knowledge from "../../widgets/Knowledge/Knowledge";
import StickyNote2Icon from "@mui/icons-material/StickyNote2";

import {
  Box,
  Fab,
  Grid,
  Tooltip,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useCallback, useEffect, useState } from "react";

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
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [title, setTitle] = useState(selectedItem?.title);
  const [description, setDescription] = useState(selectedItem?.description);
  const [createBlueprintHandler, setCreateBlueprintHandler] = useState(null);
  const [messages, setMessages] = useState([]);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<"wide" | "fullscreen">("wide");

  useEffect(() => {
    setTitle(selectedItem?.title);
    setDescription(selectedItem?.description);
  }, [selectedItem]);

  const handleTitleChange = useCallback((newTitle) => {
    setTitle(newTitle);
  }, []);

  const handleDescriptionChange = useCallback((newDescription) => {
    setDescription(newDescription);
  }, []);

  const handleCreateBlueprint = useCallback((handler) => {
    setCreateBlueprintHandler(() => handler);
  }, []);

  const handleMessagesChange = useCallback((newMessages) => {
    setMessages(newMessages);
  }, []);

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
          messages={messages}
          handleCreateBlueprint={createBlueprintHandler}
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

        <Tooltip
          title={
            drawerMode === "wide"
              ? "Show Knowledge Panel"
              : "Hide Knowledge Panel"
          }
          placement="left"
        >
          <Fab
            color="primary"
            onClick={() =>
              setDrawerMode((prev) => (prev === "wide" ? "fullscreen" : "wide"))
            }
            sx={{
              position: "absolute",
              bottom: 24,
              right: 96,
              zIndex: 10,
            }}
          >
            <StickyNote2Icon />
          </Fab>
        </Tooltip>

        {!isChatOpen && (
          <Tooltip title="Open Assistant Chat" placement="left">
            <Fab
              color="primary"
              aria-label="chat"
              onClick={() => setIsChatOpen(true)}
              sx={{
                position: "absolute",
                bottom: 24,
                right: 24,
                zIndex: 10,
              }}
            >
              <ChatBubbleOutline />
            </Fab>
          </Tooltip>
        )}
      </Box>
    </Box>
  );

  return (
    <DrawerLayout
      open={drawerOpen}
      onClose={handleDrawerClose}
      mode={drawerMode}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2,
      }}
      paperSx={
        drawerMode === "wide"
          ? {
              width: isChatOpen && !isTablet ? "90vw" : "85vw",
              transition: "width 0.3s ease-in-out",
            }
          : undefined
      }
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
        {drawerMode === "fullscreen" ? (
          <Grid container sx={{ flex: 1, height: "100%" }} spacing={0}>
            <Grid
              size={{ xs: 12, md: 4 }}
              sx={{
                pt: 1,
                position: "relative",
                mt: 1,
                borderRight: `1px solid ${theme.palette.divider}`,
                overflow: "auto",
              }}
            >
              <Knowledge
                agentId={selectedItem?.agentId || agentId}
                blueprintId={selectedItem?.id}
                teamId={teamId}
              />
            </Grid>
            <Grid
              size={{ xs: 12, md: 8 }}
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                maxHeight: "100vh",
              }}
            >
              {flowContent}
            </Grid>
          </Grid>
        ) : (
          <Grid container sx={{ flex: 1, height: "100%" }} spacing={0}>
            <Grid
              sx={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
                maxHeight: "100vh",
                borderRight: isChatOpen
                  ? `1px solid ${theme.palette.divider}`
                  : "none",
                // backgroundColor: (theme) => theme.palette.background.default,
                position: "relative",
              }}
              size={{
                xs: 12,
                md: isChatOpen ? 7 : 12,
                lg: isChatOpen ? 8 : 12,
                xl: isChatOpen ? 9 : 12,
              }}
            >
              {flowContent}
            </Grid>

            {isChatOpen && (
              <Grid
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  position: "relative",
                  height: "100%",
                  maxHeight: "100vh",
                }}
                size={{
                  xs: 12,
                  md: 5,
                  lg: 4,
                  xl: 3,
                }}
              >
                <Box
                  sx={{
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                    minHeight: 0,
                  }}
                >
                  <BlueprintChat
                    selectedItem={selectedItem}
                    setAiResponse={setAiResponse}
                    aiResponse={aiResponse}
                    setSelectedItem={setSelectedItem}
                    onTitleChange={handleTitleChange}
                    onDescriptionChange={handleDescriptionChange}
                    onCreateBlueprint={handleCreateBlueprint}
                    onMessagesChange={handleMessagesChange}
                    taskId={taskId}
                    agentId={agentId}
                    setIsChatOpen={setIsChatOpen}
                  />
                </Box>
              </Grid>
            )}
          </Grid>
        )}
      </Box>
    </DrawerLayout>
  );
};

export default BlueprintDrawer;
