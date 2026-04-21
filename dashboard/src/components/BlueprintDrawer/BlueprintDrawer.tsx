import BlueprintChat from "../BlueprintChat/BlueprintChat";
import BlueprintChatTitle from "../BlueprintChat/BlueprintChatTitle";
import BlueprintFlowWidget from "../../widgets/BlueprintFlowWidget/BlueprintFlowWidget";
import { FlowDefinition } from "../BlueprintFlow/helper";

import {
  Box,
  Drawer,
  Fab,
  Grid,
  IconButton,
  Tooltip,
  alpha,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { ChatBubbleOutline, Close } from "@mui/icons-material";
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
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));

  const [title, setTitle] = useState(selectedItem?.title);
  const [description, setDescription] = useState(selectedItem?.description);
  const [createBlueprintHandler, setCreateBlueprintHandler] = useState(null);
  const [messages, setMessages] = useState([]);

  const [isChatOpen, setIsChatOpen] = useState(false);

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

  const getDrawerWidth = () => {
    if (isMobile) return "100vw";
    if (isChatOpen && !isTablet) return "90vw";
    return "85vw";
  };

  return (
    <Drawer
      anchor="right"
      open={drawerOpen}
      onClose={handleDrawerClose}
      sx={{
        zIndex: (theme) => theme.zIndex.modal + 2,
        "& .MuiDrawer-paper": {
          width: getDrawerWidth(),
          maxWidth: "100vw",
          transition: "width 0.3s ease-in-out",
        },
      }}
    >
      <Box
        sx={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          position: "relative",
          overflow: "hidden",
        }}
        role="presentation"
      >
        {!isChatOpen && (
          <IconButton
            onClick={handleDrawerClose}
            sx={{
              position: "absolute",
              top: 8,
              right: 8,
              zIndex: 1100,
              backgroundColor: theme.palette.background.paper,
              boxShadow: theme.shadows[2],
              "&:hover": {
                backgroundColor: theme.palette.grey[100],
              },
            }}
            size="small"
          >
            <Close />
          </IconButton>
        )}

        <Grid container sx={{ flex: 1, height: "100%" }} spacing={0}>
          <Grid
            item
            xs={12}
            md={isChatOpen ? 7 : 12}
            lg={isChatOpen ? 8 : 12}
            xl={isChatOpen ? 9 : 12}
            sx={{
              display: "flex",
              flexDirection: "column",
              height: "100%",
              maxHeight: "100vh",
              borderRight: isChatOpen
                ? `1px solid ${theme.palette.divider}`
                : "none",
              backgroundColor: (theme) => theme.palette.background.default,
              backgroundImage: (theme) => `
                  radial-gradient(
                    ${alpha(theme.palette.divider, 0.08)} 1px,
                    transparent 1px
                  )
                `,
              backgroundSize: "16px 16px",
              position: "relative",
            }}
          >
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
                />

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
          </Grid>

          {isChatOpen && (
            <Grid
              item
              xs={12}
              md={5}
              lg={4}
              xl={3}
              sx={{
                display: "flex",
                flexDirection: "column",
                position: "relative",
                height: "100%",
                maxHeight: "100vh",
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
                <Box
                  sx={{
                    p: 1,
                    display: "flex",
                    justifyContent: "flex-end",
                    alignItems: "center",
                  }}
                >
                  <IconButton size="small" onClick={() => setIsChatOpen(false)}>
                    <Close fontSize="small" />
                  </IconButton>
                </Box>
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
                />
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>
    </Drawer>
  );
};

export default BlueprintDrawer;
