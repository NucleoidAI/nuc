import BlueprintFlowWidget from "../../widgets/BlueprintFlowWidget/BlueprintFlowWidget";
import { FlowDefinition } from "./helper";
import React from "react";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
      slotProps={{
        paper: {
          sx: {
            backgroundColor: (theme) => theme.palette.background.default,
            position: "relative",
          },
        },
      }}
    >
      <DialogTitle>Flow Chart</DialogTitle>
      <DialogContent
        sx={{
          width: "100%",
          height: "calc(100vh - 160px)",
          p: 0,
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
            readOnly={true}
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
