import AgentLayout from "../../layouts/AgentLayout";
import { Iconify } from "@canmingir/link/platform/components";
import React from "react";

import { Box, Button, Dialog, DialogContent } from "@mui/material";

const AgentDrawer = ({ open, onClose, agent, initialTab }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xl"
      sx={{
        "& .MuiDialog-paper": {
          position: "relative",
          overflow: "visible",
        },
      }}
    >
      <Box
        sx={{
          position: "absolute",
          top: -15,
          right: -15,
          zIndex: 10,
        }}
      >
        <Button
          onClick={onClose}
          sx={{
            minWidth: 0,
            width: 40,
            height: 40,
            borderRadius: "50%",
            bgcolor: "background.paper",
            boxShadow: 3,
          }}
        >
          <Iconify icon="material-symbols:close" width={20} />
        </Button>
      </Box>

      <DialogContent
        dividers
        sx={{ p: 1, mt: 3, width: "80vw", height: "80vh" }}
      >
        <AgentLayout agent={agent} loading={false} initialTab={initialTab} />
      </DialogContent>
    </Dialog>
  );
};

export default AgentDrawer;
