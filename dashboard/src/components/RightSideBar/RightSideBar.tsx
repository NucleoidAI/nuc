import React from "react";
import type { SxProps } from "@mui/system";
import type { Theme } from "@mui/material/styles";

import { Box, Portal } from "@mui/material";

type RightSideBarProps = {
  width?: number | string;
  height?: number | string;
  top?: number | string;
  open?: boolean;
  children?: React.ReactNode;
  sx?: SxProps<Theme>;
};

const RightSideBar = ({
  width = 62,
  height = "auto",
  top = "50%",
  open = true,
  children,
  sx,
}: RightSideBarProps) => {
  if (!open) return null;

  return (
    <Portal>
      <Box
        component="aside"
        sx={{
          position: "fixed",
          top,
          right: 0,
          transform: "translateY(-50%)",
          width,
          height,
          bgcolor: (theme: Theme) =>
            theme.palette.mode === "dark"
              ? "background.paper"
              : "rgba(255, 255, 255, 0.85)",
          backdropFilter: "blur(16px) saturate(180%)",
          WebkitBackdropFilter: "blur(16px) saturate(180%)",
          border: (theme: Theme) =>
            `1px solid ${
              theme.palette.mode === "dark"
                ? "rgba(255,255,255,0.07)"
                : "rgba(0,0,0,0.07)"
            }`,
          borderRadius: "4px",
          boxShadow: (theme: Theme) =>
            theme.palette.mode === "dark"
              ? "0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)"
              : "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.04)",
          zIndex: (theme: Theme) => theme.zIndex.modal + 3,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          py: 1.5,
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
