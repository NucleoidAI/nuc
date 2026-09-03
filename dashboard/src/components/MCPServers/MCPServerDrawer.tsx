import { Icon } from "@iconify/react";
import React from "react";

import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import type {
  MCPScope,
  MCPServerEnv,
  MCPTool,
} from "../../hooks/useMCPServers";

const FALLBACK_ICON = "mdi:server-network";

function scopeLabel(entry: { teamId: string | null; agentId: string | null }) {
  if (entry.agentId) {
    return "Agent";
  }

  if (entry.teamId) {
    return "Team";
  }

  return "Server";
}

function toolName(action: string) {
  const [, ...rest] = action.split(":");

  return rest.join(":") || action;
}

const MCPServerDrawer = ({
  open,
  onClose,
  serverId,
  providerName,
  icon,
  scope,
  tools,
  envs,
  onCreateEnv,
  onDeleteEnv,
}: {
  open: boolean;
  onClose: () => void;
  serverId?: string;
  providerName?: string;
  icon?: string | null;
  scope: MCPScope;
  tools: MCPTool[];
  envs: MCPServerEnv[];
  onCreateEnv: (entry: { key: string; value: string }) => Promise<void>;
  onDeleteEnv: (envId: string) => Promise<void>;
}) => {
  const [tab, setTab] = React.useState(0);
  const [envKey, setEnvKey] = React.useState("");
  const [envValue, setEnvValue] = React.useState("");

  const scopeName = scope.agentId ? "agent" : "team";

  const handleAddEnv = async () => {
    await onCreateEnv({ key: envKey.trim(), value: envValue });
    setEnvKey("");
    setEnvValue("");
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      slotProps={{ paper: { sx: { width: { xs: "100%", sm: 520 }, p: 2 } } }}
    >
      <Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
        <Icon icon={icon ?? FALLBACK_ICON} width="28" height="28" />
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="h6" noWrap>
            {serverId}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {providerName}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <Icon icon="mdi:close" width="20" height="20" />
        </IconButton>
      </Box>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label={`Tools (${tools.length})`} />
        <Tab label={`Env (${envs.length})`} />
      </Tabs>

      {tab === 0 &&
        (tools.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography variant="body2" color="text.secondary">
              This server exposes no tools.
            </Typography>
          </Box>
        ) : (
          <List dense disablePadding>
            {tools.map((tool) => (
              <ListItem key={tool.id} alignItems="flex-start" disableGutters>
                <ListItemIcon sx={{ minWidth: 40, mt: 0.5 }}>
                  <Icon
                    icon={tool.icon ?? icon ?? FALLBACK_ICON}
                    width="22"
                    height="22"
                  />
                </ListItemIcon>
                <ListItemText
                  primary={toolName(tool.action)}
                  secondary={tool.description}
                  slotProps={{
                    primary: { variant: "subtitle2" },
                    secondary: { variant: "body2" },
                  }}
                />
              </ListItem>
            ))}
          </List>
        ))}

      {tab === 1 && (
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            New variables are saved at <strong>{scopeName}</strong> scope and
            override the server-wide defaults.
          </Typography>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Key"
              value={envKey}
              onChange={(event) => setEnvKey(event.target.value)}
            />
            <TextField
              size="small"
              label="Value"
              fullWidth
              value={envValue}
              onChange={(event) => setEnvValue(event.target.value)}
            />
            <Button
              variant="contained"
              disabled={!envKey.trim()}
              onClick={handleAddEnv}
            >
              Add
            </Button>
          </Stack>
          <Divider />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Key</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Scope</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {envs.map((env) => (
                <TableRow key={env.id}>
                  <TableCell>{env.key}</TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 160,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {env.value}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={scopeLabel(env)} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => onDeleteEnv(env.id)}
                    >
                      <Icon icon="mdi:delete-outline" width="18" height="18" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Stack>
      )}
    </Drawer>
  );
};

export default MCPServerDrawer;
