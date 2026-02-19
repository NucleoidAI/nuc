import BlueprintFlowWidget from "../../widgets/BlueprintFlowWidget/BlueprintFlowWidget";
import { Iconify } from "@canmingir/link/platform/components";
import PopupChatWidget from "../../widgets/PopupChatWidget/PopupChatWidget";
import TasksWidget from "../../widgets/TasksWidget/TasksWidget";
import { useState } from "react";

import {
  Box,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  Drawer,
  Fab,
  IconButton,
  Typography,
  alpha,
} from "@mui/material";

interface SupervisingTypeDialogProps {
  open: boolean;
  onClose: () => void;
  onSelectKnowledge: () => void;
  onSelectBlueprint: (blueprint: {
    id: string;
    title: string;
    description: string;
    agentId: string;
  }) => void;
  blueprint: {
    id: string;
    title: string;
    description: string;
    agentId: string;
  };
  supervise?: {
    id: string;
    conversationId?: string;
    sessionId?: string;
    agentId?: string;
    taskId?: string;
  };
  usedNodeIds?: Set<string>;
  lastUsedNodeId?: string | null;
  failedNodeId?: string | null;
}

const SupervisingTypeDialog = ({
  open,
  onClose,
  onSelectKnowledge,
  onSelectBlueprint,
  blueprint,
  usedNodeIds,
  lastUsedNodeId,
  failedNodeId,
  supervise,
}: SupervisingTypeDialogProps) => {
  const [popChatOpen, setPopChatOpen] = useState(false);
  const [taskDrawerOpen, setTaskDrawerOpen] = useState(false);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          p: 1,
        },
      }}
    >
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          pb: 2,
        }}
      >
        <Typography>Select Supervising Type</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Fab
            size="medium"
            color="inherit"
            onClick={() => setPopChatOpen(!popChatOpen)}
          >
            <Iconify
              icon={
                popChatOpen
                  ? "solar:chat-round-line-linear"
                  : "solar:chat-round-line-bold"
              }
              sx={{ width: 26, height: 26 }}
            />
          </Fab>
          <Fab
            size="medium"
            color="inherit"
            onClick={() => setTaskDrawerOpen(true)}
          >
            <Iconify
              icon="solar:clipboard-list-bold"
              sx={{ width: 26, height: 26 }}
            />
          </Fab>
        </Box>
      </DialogTitle>
      <DialogContent
        sx={{
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: "row",
            gap: 2,
            pb: 2,
          }}
        >
          <Box
            onClick={onSelectKnowledge}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              p: 3,
              borderRadius: 2,
              border: "2px solid",
              borderColor: "rgba(33, 150, 243, 0.2)",
              backgroundColor: "rgba(33, 150, 243, 0.05)",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "#2196f3",
                backgroundColor: "rgba(33, 150, 243, 0.1)",
                boxShadow: "0 4px 12px rgba(33, 150, 243, 0.2)",
              },
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: "rgba(33, 150, 243, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Iconify
                icon="solar:chat-round-line-bold"
                sx={{ width: 32, height: 32, color: "#2196f3" }}
              />
            </Box>
            <Typography variant="h6" sx={{ color: "#2196f3", fontWeight: 600 }}>
              Knowledge
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                fontSize: "0.875rem",
              }}
            >
              Add general knowledge
            </Typography>
          </Box>

          <Box
            onClick={() => onSelectBlueprint(blueprint)}
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 2,
              p: 3,
              borderRadius: 2,
              border: "2px solid",
              borderColor: "rgba(255, 152, 0, 0.2)",
              backgroundColor: "rgba(255, 152, 0, 0.05)",
              cursor: "pointer",
              transition: "all 0.2s ease-in-out",
              "&:hover": {
                borderColor: "#ff9800",
                backgroundColor: "rgba(255, 152, 0, 0.1)",
                boxShadow: "0 4px 12px rgba(255, 152, 0, 0.2)",
              },
            }}
          >
            <Box
              sx={{
                width: 60,
                height: 60,
                borderRadius: "50%",
                backgroundColor: "rgba(255, 152, 0, 0.15)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Iconify
                icon="healthicons:crisis-response-center-person-outline"
                sx={{ width: 32, height: 32, color: "#ff9800" }}
              />
            </Box>
            <Typography variant="h6" sx={{ color: "#ff9800", fontWeight: 600 }}>
              Blueprint
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "text.secondary",
                textAlign: "center",
                fontSize: "0.875rem",
              }}
            >
              Manage specific blueprints
            </Typography>
            {failedNodeId ? (
              <Chip
                icon={
                  <Iconify
                    icon="solar:close-circle-bold"
                    sx={{ width: 16, height: 16 }}
                    color="inherit"
                    style={{ color: "#f44336" }}
                  />
                }
                label="Step failed"
                size="small"
                sx={{
                  backgroundColor: "rgba(244, 67, 54, 0.1)",
                  color: "#f44336",
                  fontWeight: 500,
                  border: "1px solid rgba(244, 67, 54, 0.3)",
                  mt: 1,
                }}
              />
            ) : usedNodeIds && usedNodeIds.size > 0 ? (
              <Chip
                icon={
                  <Iconify
                    icon="solar:lightbulb-bolt-outline"
                    sx={{ width: 16, height: 16 }}
                    color="inherit"
                    style={{ color: "#2196f3" }}
                  />
                }
                label={`${usedNodeIds.size} step${
                  usedNodeIds.size > 1 ? "s" : ""
                } completed`}
                size="small"
                sx={{
                  backgroundColor: "rgba(33, 150, 243, 0.1)",
                  color: "#2196f3",
                  fontWeight: 500,
                  border: "1px solid rgba(33, 150, 243, 0.3)",
                  mt: 1,
                }}
              />
            ) : null}
          </Box>
        </Box>

        {((usedNodeIds && usedNodeIds.size > 0) || failedNodeId) && (
          <Box
            sx={{
              mb: 2,
              borderRadius: 3,
              backgroundColor: "background.paper",
              border: "1px solid",
              borderColor: "divider",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
              overflow: "hidden",
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                p: 2.5,
                cursor: "pointer",
                "&:hover": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{
                  color: "text.primary",
                  fontWeight: 600,
                  fontSize: "0.875rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                <Iconify
                  icon="solar:list-check-bold-duotone"
                  sx={{ width: 18, height: 18, color: "text.secondary" }}
                />
                {failedNodeId
                  ? "Failed Blueprint Steps"
                  : usedNodeIds
                  ? "Blueprint Steps"
                  : "Completed Blueprint Steps"}
              </Typography>
            </Box>

            <Box
              sx={{
                height: 500,
                p: 2,
                position: "relative",
                backgroundColor: (theme) => theme.palette.background.paper,
                backgroundSize: "16px 16px",
                backgroundImage: (theme) =>
                  `radial-gradient(${alpha(
                    theme.palette.divider,
                    0.08
                  )} 1px, transparent 1px)`,
              }}
            >
              <BlueprintFlowWidget
                blueprint={blueprint}
                usedNodeIds={usedNodeIds}
                lastUsedNodeId={lastUsedNodeId}
                failedNodeId={failedNodeId}
                isSuperviseFlow={true}
              />
            </Box>
          </Box>
        )}
      </DialogContent>

      <PopupChatWidget
        readOnly={true}
        openPopChat={popChatOpen}
        setOpenPopChat={setPopChatOpen}
        conversationId={supervise?.conversationId}
        sessionId={supervise?.sessionId}
      />

      <Drawer
        anchor="right"
        open={taskDrawerOpen}
        onClose={() => setTaskDrawerOpen(false)}
        sx={{
          zIndex: (theme) => theme.zIndex.modal + 2,
        }}
        PaperProps={{
          sx: {
            width: { xs: "100%", sm: "90%", md: "80%", lg: "70%" },
            maxWidth: 1400,
          },
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            p: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Task Details
          </Typography>
          <IconButton onClick={() => setTaskDrawerOpen(false)}>
            <Iconify icon="material-symbols:close" />
          </IconButton>
        </Box>
        <Box sx={{ overflow: "auto", height: "100%", mt: 2 }}>
          <TasksWidget
            agentId={supervise?.agentId}
            fromDrawer={true}
            supervisionRaised={true}
            taskId={supervise?.taskId}
          />
        </Box>
      </Drawer>
    </Dialog>
  );
};

export default SupervisingTypeDialog;
