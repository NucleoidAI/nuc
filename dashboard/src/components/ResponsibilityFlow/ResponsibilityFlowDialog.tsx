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
        }}
      >
        {selectedItem && (
          <ResponsibilityFlow
            aiResponse={aiResponse}
            responsibility={selectedItem}
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
