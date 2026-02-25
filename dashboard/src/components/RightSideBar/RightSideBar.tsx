import { Box } from "@mui/material";
import React from "react";
import type { SxProps } from "@mui/system";
import type { Theme } from "@mui/material/styles";
import { alpha } from "@mui/material/styles";

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
    <Box
      component="aside"
      sx={{
        position: "fixed",
        top,
        right: 0,
        transform: "translateY(-50%)",
        width,
        height,
        bgcolor: (theme: Theme) => alpha(theme.palette.background.default, 0.6),
        borderRadius: "6px",
        zIndex: (theme: Theme) => theme.zIndex.drawer + 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        py: 1.5,
        gap: 1,
        ...((sx as object) || {}),
      }}
    >
      {children}
    </Box>
  );
};

export default RightSideBar;
