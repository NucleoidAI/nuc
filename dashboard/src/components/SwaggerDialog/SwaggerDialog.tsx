import { Iconify } from "@canmingir/link/platform/components";
import { KeyboardArrowDown } from "@mui/icons-material";
import { SWAGGER_URL } from "../../utils/hosts";
import { publish } from "@nucleoidai/react-event";

import { AppBar, Box, Dialog, IconButton, Toolbar } from "@mui/material";
import React, { useState } from "react";

const SwaggerDialog = ({
  swaggerOpen,
  setSwaggerOpen,
}: {
  swaggerOpen: boolean;
  setSwaggerOpen: (open: boolean) => void;
}) => {
  const [iframeKey, setIframeKey] = useState(0);
  return (
    <Dialog
      fullScreen
      open={swaggerOpen}
      PaperProps={{ sx: { borderRadius: "0 !important" } }}
    >
      <AppBar
        sx={{
          position: "relative",
          backgroundColor: "#343a43",
          color: "#e0e0e0",
        }}
      >
        <Toolbar>
          <Box
            sx={{
              width: "100%",
              display: "flex",
              alignItems: "center",
              gap: 2,
            }}
          >
            <IconButton
              edge="start"
              onClick={() => {
                publish("SWAGGER_DIALOG_OPEN", { open: false });
                setSwaggerOpen(false);
                fetch(`${SWAGGER_URL}/swagger/reset`, {
                  method: "POST",
                });
                setIframeKey((prev) => prev + 1);
              }}
              aria-label="close"
            >
              <KeyboardArrowDown sx={{ color: "#e0e0e0" }} fontSize="large" />
            </IconButton>
            <Iconify icon="logos:swagger" width={28} />
            <Box component="span" sx={{ fontSize: "1.1rem", fontWeight: 600 }}>
              API Documentation
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      {swaggerOpen && (
        <iframe
          key={iframeKey}
          title="Swagger"
          src={`${SWAGGER_URL}/swagger`}
          style={{ width: "100%", height: "100%", border: 0 }}
          sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
        />
      )}
    </Dialog>
  );
};

export default SwaggerDialog;
