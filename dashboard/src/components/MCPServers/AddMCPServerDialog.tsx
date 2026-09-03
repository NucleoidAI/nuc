import { Icon } from "@iconify/react";
import React from "react";

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  TextField,
  Typography,
} from "@mui/material";

import type { MCPProvider, MCPServer } from "../../hooks/useMCPServers";

const FALLBACK_ICON = "mdi:server-network";

const AddMCPServerDialog = ({
  open,
  onClose,
  servers,
  providersById,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  servers: MCPServer[];
  providersById: Map<string, MCPProvider>;
  onSelect: (serverId: string) => Promise<void>;
}) => {
  const [search, setSearch] = React.useState("");

  const visibleServers = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) {
      return servers;
    }

    return servers.filter((server) => {
      const providerName = providersById.get(server.mcpProviderId)?.name ?? "";

      return (
        server.id.toLowerCase().includes(query) ||
        providerName.toLowerCase().includes(query)
      );
    });
  }, [providersById, search, servers]);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        Add MCP server
        <IconButton size="small" onClick={onClose}>
          <Icon icon="mdi:close" width="20" height="20" />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <TextField
          fullWidth
          size="small"
          placeholder="Search servers or providers..."
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          sx={{ mb: 2 }}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <Icon icon="mdi:magnify" width="20" height="20" />
                </InputAdornment>
              ),
            },
          }}
        />

        {visibleServers.length === 0 ? (
          <Box sx={{ py: 4, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              Every server is already assigned.
            </Typography>
          </Box>
        ) : (
          <List dense>
            {visibleServers.map((server) => {
              const providerName = providersById.get(
                server.mcpProviderId
              )?.name;

              return (
                <ListItemButton
                  key={server.id}
                  onClick={async () => {
                    await onSelect(server.id);
                    onClose();
                  }}
                >
                  <ListItemIcon>
                    <Icon
                      icon={server.icon ?? FALLBACK_ICON}
                      width="24"
                      height="24"
                    />
                  </ListItemIcon>
                  <ListItemText primary={server.id} secondary={providerName} />
                </ListItemButton>
              );
            })}
          </List>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AddMCPServerDialog;
