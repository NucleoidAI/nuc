import BlueprintFlowWidget from "../../widgets/BlueprintFlowWidget/BlueprintFlowWidget";
import { FlowDefinition } from "./helper";
import React from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  alpha,
} from "@mui/material";

interface AIResponse {
  flow: FlowDefinition;
}

interface Blueprint {
  id: string;
  title: string;
  description: string;
  agentId: string;
}

interface BlueprintFlowDialogProps {
  flowDialogOpen: boolean;
  handleFlowDialogClose: () => void;
  selectedItem: Blueprint;
  aiResponse?: AIResponse;
  setAiResponse?: (response: AIResponse | null) => void;
  taskId?: string;
}

const BlueprintFlowDialog = ({
  flowDialogOpen,
  handleFlowDialogClose,
  selectedItem,
  aiResponse,
  setAiResponse,
  taskId,
}: BlueprintFlowDialogProps) => {
  return (
    <Dialog
      open={flowDialogOpen}
      onClose={handleFlowDialogClose}
      maxWidth="xl"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: (theme) => theme.palette.background.default,
          backgroundImage: (theme) =>
            `radial-gradient(${alpha(
              theme.palette.divider,
              0.08
            )} 1px, transparent 1px)`,
          backgroundSize: "16px 16px",
        },
      }}
    >
      <DialogTitle>Flow Chart</DialogTitle>
      <DialogContent
        sx={{
          width: "100%",
          "&::-webkit-scrollbar": {
            display: "none",
          },
          msOverflowStyle: "none",
          scrollbarWidth: "none",
        }}
      >
        {selectedItem && (
          <BlueprintFlowWidget
            aiResponse={aiResponse}
            setAiResponse={setAiResponse}
            blueprint={selectedItem}
            taskId={taskId}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleFlowDialogClose} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default BlueprintFlowDialog;
