import BlueprintFlow from "./BlueprintFlow";
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

const BlueprintFlowDialog = ({
  flowDialogOpen,
  handleFlowDialogClose,
  selectedItem,
  aiResponse,
  taskId,
}: {
  flowDialogOpen: boolean;
  handleFlowDialogClose: () => void;
  selectedItem: Blueprint;
  aiResponse?: AIResponse;
  taskId?: string;
}) => {
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
            `radial-gradient(${theme.palette.divider} 1px, transparent 1px)`,
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
          <BlueprintFlow
            aiResponse={aiResponse}
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
