import AgentLayout from "../../layouts/AgentLayout";
import { Iconify } from "@canmingir/link/platform/components";

import { Box, Button, Dialog, DialogContent } from "@mui/material";
import React, { useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AgentDrawer = ({ open, onClose, agent, initialTab }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const handleClose = useCallback(() => {
    onClose?.();

    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname, onClose]);

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="xl"
      fullWidth
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
        sx={{ p: 1, mt: 3, width: "100%", height: "80vh" }}
      >
        <AgentLayout agent={agent} loading={false} initialTab={initialTab} />
      </DialogContent>
    </Dialog>
  );
};

export default AgentDrawer;
