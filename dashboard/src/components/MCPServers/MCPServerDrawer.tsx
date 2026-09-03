import { Icon } from "@iconify/react";
import React from "react";

import {
  Box,
  Button,
  Chip,
  Divider,
  Drawer,
  IconButton,
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
  MCPToolArg,
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

const MCPServerDrawer = ({
  open,
  onClose,
  serverId,
  providerName,
  icon,
  scope,
  envs,
  toolArgs,
  onCreateEnv,
  onDeleteEnv,
  onCreateToolArg,
  onDeleteToolArg,
}: {
  open: boolean;
  onClose: () => void;
  serverId?: string;
  providerName?: string;
  icon?: string | null;
  scope: MCPScope;
  envs: MCPServerEnv[];
  toolArgs: MCPToolArg[];
  onCreateEnv: (entry: { key: string; value: string }) => Promise<void>;
  onDeleteEnv: (envId: string) => Promise<void>;
  onCreateToolArg: (entry: {
    tool: string;
    key: string;
    value: string;
  }) => Promise<void>;
  onDeleteToolArg: (toolArgId: string) => Promise<void>;
}) => {
  const [tab, setTab] = React.useState(0);
  const [envKey, setEnvKey] = React.useState("");
  const [envValue, setEnvValue] = React.useState("");
  const [argTool, setArgTool] = React.useState("");
  const [argKey, setArgKey] = React.useState("");
  const [argValue, setArgValue] = React.useState("");

  const scopeName = scope.agentId ? "agent" : "team";

  const handleAddEnv = async () => {
    await onCreateEnv({ key: envKey.trim(), value: envValue });
    setEnvKey("");
    setEnvValue("");
  };

  const handleAddToolArg = async () => {
    await onCreateToolArg({
      tool: argTool.trim(),
      key: argKey.trim(),
      value: argValue,
    });
    setArgTool("");
    setArgKey("");
    setArgValue("");
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

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        New entries are saved at <strong>{scopeName}</strong> scope and override
        the server-wide defaults.
      </Typography>

      <Tabs value={tab} onChange={(_, value) => setTab(value)} sx={{ mb: 2 }}>
        <Tab label={`Env (${envs.length})`} />
        <Tab label={`Tool args (${toolArgs.length})`} />
      </Tabs>

      {tab === 0 && (
        <Stack spacing={2}>
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

      {tab === 1 && (
        <Stack spacing={2}>
          <Stack direction="row" spacing={1}>
            <TextField
              size="small"
              label="Tool"
              value={argTool}
              onChange={(event) => setArgTool(event.target.value)}
            />
            <TextField
              size="small"
              label="Key"
              value={argKey}
              onChange={(event) => setArgKey(event.target.value)}
            />
            <TextField
              size="small"
              label="Value"
              fullWidth
              value={argValue}
              onChange={(event) => setArgValue(event.target.value)}
            />
            <Button
              variant="contained"
              disabled={!argTool.trim() || !argKey.trim()}
              onClick={handleAddToolArg}
            >
              Add
            </Button>
          </Stack>
          <Divider />
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Tool</TableCell>
                <TableCell>Key</TableCell>
                <TableCell>Value</TableCell>
                <TableCell>Scope</TableCell>
                <TableCell align="right" />
              </TableRow>
            </TableHead>
            <TableBody>
              {toolArgs.map((toolArg) => (
                <TableRow key={toolArg.id}>
                  <TableCell>{toolArg.tool}</TableCell>
                  <TableCell>{toolArg.key}</TableCell>
                  <TableCell
                    sx={{
                      maxWidth: 140,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    }}
                  >
                    {toolArg.value}
                  </TableCell>
                  <TableCell>
                    <Chip size="small" label={scopeLabel(toolArg)} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      onClick={() => onDeleteToolArg(toolArg.id)}
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
