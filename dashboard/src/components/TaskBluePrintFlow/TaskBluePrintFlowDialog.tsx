import React from "react";
import TaskBluePrintFlow from "./TaskBluePrintFlow";

import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

const TaskBluePrintFlowDialog = ({
  flowDialogOpen,
  handleFlowDialogClose,
  selectedItem,
  aiResponse,
  setAiResponse,
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
          <TaskBluePrintFlow
            aiResponse={aiResponse}
            taskBluePrint={selectedItem}
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

export default TaskBluePrintFlowDialog;
