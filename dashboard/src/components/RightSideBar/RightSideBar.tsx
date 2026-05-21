import React from "react";
import type { SxProps } from "@mui/system";
import type { Theme } from "@mui/material/styles";

import { Box, Portal } from "@mui/material";

type RightSideBarProps = {
  open?: boolean;
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
};

const RightSideBar = ({ open = true, children, sx }: RightSideBarProps) => {
  if (!open) return null;

  return (
    <Portal>
      <Box
        component="aside"
        sx={{
          position: "fixed",
          top: 0,
          right: 0,
          width: 56,
          height: "100vh",
          bgcolor: "background.default",
          borderLeft: (theme: Theme) => `dashed 1px ${theme.palette.divider}`,
          zIndex: (theme: Theme) => theme.zIndex.modal + 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pt: 1,
          pb: 2,
          overflowY: "auto",
          overflowX: "hidden",
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
          ...((sx as object) || {}),
        }}
      >
        {children}
      </Box>
    </Portal>
  );
};

export default RightSideBar;
