import { Endpoint } from "../types";
import React from "react";
import { publish } from "@nucleoidai/react-event";

import {
  APITree,
  Iconify,
  ResourceMenu,
} from "@canmingir/link/platform/components";
import { Box, Button, Stack, Typography, useTheme } from "@mui/material";

const LeftSideApiTree = ({
  api,
  expanded,
  selectedTreeItem,
  setExpanded,
  setSelectedTreeItem,
  contextMenu,
  setContextMenu,
  selected,
}: {
  api: Endpoint[];
  expanded: string[];
  selectedTreeItem: string | null;
  setExpanded: (ids: string[]) => void;
  setSelectedTreeItem: (itemId: string | null) => void;
  contextMenu: {
    anchor: { clientX: number; clientY: number } | null;
    open: boolean;
  };
  setContextMenu: (menu: {
    anchor: { clientX: number; clientY: number } | null;
    open: boolean;
  }) => void;
  selected: { path: string; method: string } | null;
}) => {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: 280,
        flexShrink: 0,
        height: 500,
        display: "flex",
        flexDirection: "column",
        borderRight: `1px solid ${theme.palette.divider}`,
        pr: 2,
      }}
    >
      <Stack
        direction="row"
        justifyContent="space-between"
        alignItems="center"
        sx={{ mb: 2 }}
      >
        <Typography variant="h6">Endpoints</Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<Iconify icon="mdi:plus" width={18} />}
          onClick={() =>
            publish("API_DIALOG_OPEN", {
              open: true,
              type: "resource",
              action: "add",
            })
          }
        >
          Add
        </Button>
      </Stack>

      <Box
        sx={{ flex: 1, overflow: "auto" }}
        onContextMenu={(e) => {
          e.preventDefault();
          setContextMenu({
            anchor: { clientX: e.clientX, clientY: e.clientY },
            open: true,
          });
        }}
        onDoubleClick={() => {
          if (selected?.method)
            publish("API_DIALOG_OPEN", {
              open: true,
              type: "method",
              action: "edit",
            });
        }}
      >
        <APITree
          api={api}
          theme={theme}
          expanded={expanded}
          selected={selectedTreeItem}
          onExpand={(_e: unknown, ids: string[]) => setExpanded(ids)}
          onSelect={(_e: unknown, itemId: string | null) => {
            setSelectedTreeItem(itemId);
            if (!itemId) return;
            try {
              const decoded = JSON.parse(window.atob(itemId));
              if (decoded?.path && decoded?.method) {
                publish("SELECTED_API_CHANGED", {
                  path: decoded.path,
                  method: decoded.method,
                });
                return;
              }
            } catch {
              /* path node */
            }
            publish("SELECTED_API_CHANGED", {
              path: itemId,
              method: null,
            });
          }}
        />
      </Box>

      <ResourceMenu
        anchor={contextMenu.anchor}
        openMenu={contextMenu.open}
        handleClose={() => setContextMenu({ anchor: null, open: false })}
      />
    </Box>
  );
};

export default LeftSideApiTree;
