import React from "react";
import ResponsibilityFlow from "./ResponsibilityFlow";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

const ResponsibilityFlowDialog = ({
  flowDialogOpen,
  handleFlowDialogClose,
  selectedItem,
  aiResponse,
  setAiResponse,
}: {
  flowDialogOpen: boolean;
  handleFlowDialogClose: () => void;
  selectedItem: {
    id: string;
    title: string;
    description: string;
    colleagueId: string;
  };
  aiResponse?: {
    flow: {
      nodes: {
        id: string;
        type: string;
        properties: {
          label: string;
          icon: string;
          action: string;
          description: string;
        };
        next: string[];
        true: string[];
        false: string[];
        createdAt: string;
      }[];
      edges: {
        id: string;
        source: string;
        target: string;
        style: {
          stroke: string;
        };
      }[];
    };
  };
  setAiResponse?: (response) => void;
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
            setAiResponse={setAiResponse}
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
