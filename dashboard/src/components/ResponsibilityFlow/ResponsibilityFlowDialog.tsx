import { FlowDefinition } from "./helper";

import React from "react";
import ResponsibilityFlow from "./ResponsibilityFlow";

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

interface Responsibility {
  id: string;
  title: string;
  description: string;
  colleagueId: string;
}

const ResponsibilityFlowDialog = ({
  flowDialogOpen,
  handleFlowDialogClose,
  selectedItem,
  aiResponse,
  taskId,
}: {
  flowDialogOpen: boolean;
  handleFlowDialogClose: () => void;
  selectedItem: Responsibility;
  aiResponse?: AIResponse;
  taskId?: string;
}) => {
  return (
    <Dialog
      open={flowDialogOpen}
      onClose={handleFlowDialogClose}
      maxWidth="xl"
      fullWidth
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
          <ResponsibilityFlow
            aiResponse={aiResponse}
            responsibility={selectedItem}
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

export default ResponsibilityFlowDialog;
