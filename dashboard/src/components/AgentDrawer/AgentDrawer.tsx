import AgentLayout from "../../layouts/AgentLayout";
import { Iconify } from "@canmingir/link/platform/components";

import { Box, Button, Dialog, DialogContent } from "@mui/material";
import React, { useCallback, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const AgentDrawer = ({
  open,
  onClose,
  agent,
  initialTab,
  initialTaskId = null,
  allAgentIds,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [chatOpen, setChatOpen] = useState(false);

  const handleClose = useCallback(() => {
    onClose?.();

    navigate(location.pathname, { replace: true });
  }, [navigate, location.pathname, onClose]);

  return (
    <Dialog
      open={open}
      disableEnforceFocus={chatOpen}
      onClose={handleClose}
      type="large"
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
          onClick={handleClose}
          sx={{
            minWidth: 0,
            width: 40,
            height: 40,
            borderRadius: "50%",
            bgcolor: "background.paper",
            boxShadow: 1,
            "&:hover": {
              bgcolor: "background.paper",
            },
          }}
        >
          <Iconify icon="material-symbols:close" width={20} />
        </Button>
      </Box>
      <DialogContent
        sx={{
          p: 1,
          mt: 3,
          width: "100%",
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <AgentLayout
          agent={agent}
          loading={false}
          initialTab={initialTab}
          initialTaskId={initialTaskId}
          allAgentIds={allAgentIds}
          onChatOpenChange={setChatOpen}
        />
      </DialogContent>
    </Dialog>
  );
};

export default AgentDrawer;
