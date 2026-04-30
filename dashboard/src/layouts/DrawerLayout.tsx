import { Close } from "@mui/icons-material";
import React from "react";

import {
  DialogActions,
  DialogContent,
  DialogTitle,
  Drawer,
  IconButton,
  SxProps,
  Theme,
} from "@mui/material";

export type DrawerMode = "narrow" | "wide" | "fullscreen";

interface DrawerLayoutProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: React.ReactNode;
  extraActions?: React.ReactNode;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
  paperSx?: SxProps<Theme>;
  titleSx?: SxProps<Theme>;
  mode?: DrawerMode;
}

const NARROW_WIDTH = 450;
const modeWidth: Record<DrawerMode, string | number | undefined> = {
  narrow: NARROW_WIDTH,
  wide: undefined,
  fullscreen: "100vw",
};

const DrawerLayout = ({
  open,
  onClose,
  children,
  title,
  extraActions,
  sx,
  contentSx,
  paperSx,
  titleSx,
  mode = "fullscreen",
}: DrawerLayoutProps) => {
  const width = modeWidth[mode];

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      sx={sx}
      slotProps={{
        paper: {
          sx: {
            backgroundColor: (theme) =>
              `${theme.palette.background.default} !important`,
            display: "flex",
            flexDirection: "column",
            maxWidth: "100vw",
            width: width ?? { xs: "100vw", sm: "90vw", md: "85vw" },
            transition: "width 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
            "@keyframes slideInFromRight": {
              from: { transform: "translateX(100%)" },
              to: { transform: "translateX(0)" },
            },
            animation: open
              ? "slideInFromRight 400ms cubic-bezier(0.22, 1, 0.36, 1) forwards"
              : "none",
            ...((paperSx as object) ?? {}),
          },
        },
      }}
    >
      {title && (
        <DialogTitle sx={{ flexShrink: 0, ...((titleSx as object) ?? {}) }}>
          {title}
        </DialogTitle>
      )}

      <DialogContent
        sx={{ flex: 1, overflow: "auto", ...((contentSx as object) ?? {}) }}
      >
        {children}
      </DialogContent>

      <DialogActions sx={{ position: "absolute", top: -10, right: 0 }}>
        {extraActions}
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogActions>
    </Drawer>
  );
};

export default DrawerLayout;
