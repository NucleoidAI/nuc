import AddMCPServerDialog from "../../components/MCPServers/AddMCPServerDialog";
import { Icon } from "@iconify/react";
import MCPServerCard from "../../components/MCPServers/MCPServerCard";
import MCPServerDrawer from "../../components/MCPServers/MCPServerDrawer";
import MCPSkeleton from "../../components/Skeletons/MCPSkeleton";
import React from "react";
import { storage } from "@nucleoidjs/webstorage";
import useLoading from "../../hooks/useLoading";
import useMCPServers from "../../hooks/useMCPServers";

import {
  Box,
  Button,
  ButtonBase,
  Chip,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

import type {
  MCPServer,
  MCPServerEnv,
  MCPTool,
} from "../../hooks/useMCPServers";

const FALLBACK_ICON = "mdi:server-network";

const AgentMCP = ({ agent }: { agent?: { id: string; name: string } }) => {
  const teamId = storage.get("link", "projectid");

  const scope = React.useMemo(
    () => (agent ? { agentId: agent.id } : { teamId }),
    [agent, teamId]
  );

  const {
    assign,
    deleteEnv,
    getAllServers,
    getAssignedServers,
    getProviders,
    listEnvs,
    listTools,
    setEnv,
  } = useMCPServers();

  const { providers } = getProviders();
  const { servers: allServers } = getAllServers();
  const {
    servers: assignedServers,
    loading,
    refetch,
  } = getAssignedServers(scope);

  const isLoading = useLoading(loading);

  const [search, setSearch] = React.useState("");
  const [selectedProvider, setSelectedProvider] = React.useState<string | null>(
    null
  );
  const [addOpen, setAddOpen] = React.useState(false);
  const [activeServer, setActiveServer] = React.useState<MCPServer | null>(
    null
  );
  const [envs, setEnvs] = React.useState<MCPServerEnv[]>([]);
  const [tools, setTools] = React.useState<MCPTool[]>([]);

  const providersById = React.useMemo(
    () => new Map(providers.map((provider) => [provider.id, provider])),
    [providers]
  );

  const providerNameOf = React.useCallback(
    (server: MCPServer) => providersById.get(server.mcpProviderId)?.name,
    [providersById]
  );

  const assignedProviders = React.useMemo(() => {
    const grouped = new Map<string, { count: number; icon: string | null }>();

    assignedServers.forEach((server) => {
      const entry = grouped.get(server.mcpProviderId) ?? {
        count: 0,
        icon: null,
      };

      grouped.set(server.mcpProviderId, {
        count: entry.count + 1,
        icon: entry.icon ?? server.icon,
      });
    });

    return Array.from(grouped.entries())
      .map(([providerId, entry]) => ({
        provider: providersById.get(providerId),
        count: entry.count,
        icon: entry.icon,
      }))
      .filter((entry) => entry.provider)
      .sort((a, b) => b.count - a.count);
  }, [assignedServers, providersById]);

  const visibleServers = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    return assignedServers.filter((server) => {
      if (selectedProvider && server.mcpProviderId !== selectedProvider) {
        return false;
      }

      if (!query) {
        return true;
      }

      const providerName = providerNameOf(server) ?? "";

      return (
        server.id.toLowerCase().includes(query) ||
        providerName.toLowerCase().includes(query)
      );
    });
  }, [assignedServers, providerNameOf, search, selectedProvider]);

  const assignableServers = React.useMemo(() => {
    const assignedIds = new Set(assignedServers.map((server) => server.id));

    return allServers.filter((server) => !assignedIds.has(server.id));
  }, [allServers, assignedServers]);

  const loadServerConfig = async (serverId: string) => {
    const [serverTools, serverEnvs] = await Promise.all([
      listTools(serverId),
      listEnvs(serverId, scope),
    ]);

    setTools(serverTools);
    setEnvs(serverEnvs);
  };

  const handleOpenServer = async (server: MCPServer) => {
    setActiveServer(server);
    await loadServerConfig(server.id);
  };

  const handleCloseDrawer = () => {
    setActiveServer(null);
    setEnvs([]);
    setTools([]);
  };

  const handleAssign = async (serverId: string) => {
    await assign({ serverId, ...scope });
    await refetch();
  };

  return (
    <Box sx={{ width: "100%", px: 2, pb: 2 }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1 }}>
          <TextField
            fullWidth
            size="small"
            placeholder="Search servers or providers..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
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
          <Button
            variant="contained"
            sx={{ flexShrink: 0 }}
            startIcon={<Icon icon="mdi:plus" width="20" height="20" />}
            onClick={() => setAddOpen(true)}
          >
            Add server
          </Button>
        </Box>

        {isLoading ? (
          <Grid container spacing={2}>
            {Array.from({ length: 4 }).map((_, index) => (
              <Grid key={index} size={{ xs: 12, sm: 6, md: 3 }}>
                <MCPSkeleton />
              </Grid>
            ))}
          </Grid>
        ) : (
          <>
            <Box
              sx={{
                display: "flex",
                gap: 1,
                overflowX: "auto",
                pb: 1,
                scrollbarWidth: "none",
                "&::-webkit-scrollbar": { display: "none" },
              }}
            >
              <ButtonBase
                onClick={() => setSelectedProvider(null)}
                sx={{
                  flexShrink: 0,
                  gap: 1,
                  px: 1.5,
                  py: 1,
                  borderRadius: 1,
                  border: 1,
                  borderColor: selectedProvider
                    ? "divider"
                    : "background.paper",
                  bgcolor: selectedProvider ? "transparent" : "action.selected",
                  "&:hover": { bgcolor: "action.hover" },
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  All
                </Typography>
                <Chip
                  label={assignedServers.length}
                  size="small"
                  sx={{
                    bgcolor: "#1f232b",
                    color: "#fff",
                    fontWeight: 600,
                    "&:hover": { bgcolor: "#1f232b" },
                  }}
                />
              </ButtonBase>

              {assignedProviders.map(({ provider, count, icon }) => {
                const isActive = provider.id === selectedProvider;

                return (
                  <ButtonBase
                    key={provider.id}
                    onClick={() =>
                      setSelectedProvider(isActive ? null : provider.id)
                    }
                    sx={{
                      flexShrink: 0,
                      gap: 1,
                      px: 1.5,
                      py: 1,
                      borderRadius: 1,
                      border: 1,
                      borderColor: isActive ? "background.paper" : "divider",
                      bgcolor: isActive ? "action.selected" : "transparent",
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    <Icon icon={icon ?? FALLBACK_ICON} width="24" height="24" />
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {provider.name}
                    </Typography>
                    <Chip
                      label={count}
                      size="small"
                      sx={{
                        bgcolor: "#1f232b",
                        color: "#fff",
                        fontWeight: 600,
                        "&:hover": { bgcolor: "#1f232b" },
                      }}
                    />
                  </ButtonBase>
                );
              })}
            </Box>

            {visibleServers.length === 0 ? (
              <Box sx={{ py: 6, textAlign: "center" }}>
                <Typography variant="body2" color="text.secondary">
                  No MCP server assigned to this {agent ? "agent" : "team"} yet.
                </Typography>
              </Box>
            ) : (
              <Grid container spacing={2} sx={{ mb: 1 }}>
                {visibleServers.map((server) => (
                  <Grid
                    key={server.id}
                    size={
                      agent
                        ? { xs: 12, sm: 6, md: 4, lg: 3 }
                        : { xs: 12, sm: 6, md: 6, lg: 4 }
                    }
                  >
                    <MCPServerCard
                      serverId={server.id}
                      providerName={providerNameOf(server)}
                      description={server.description}
                      icon={server.icon}
                      onOpen={() => handleOpenServer(server)}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </>
        )}

        <AddMCPServerDialog
          open={addOpen}
          onClose={() => setAddOpen(false)}
          servers={assignableServers}
          providersById={providersById}
          onSelect={handleAssign}
        />

        <MCPServerDrawer
          open={Boolean(activeServer)}
          onClose={handleCloseDrawer}
          serverId={activeServer?.id}
          providerName={activeServer ? providerNameOf(activeServer) : undefined}
          icon={activeServer?.icon}
          scope={scope}
          tools={tools}
          envs={envs}
          onCreateEnv={async (entry) => {
            await setEnv({ serverId: activeServer.id, ...entry, ...scope });
            await loadServerConfig(activeServer.id);
          }}
          onDeleteEnv={async (key) => {
            await deleteEnv({ serverId: activeServer.id, key, ...scope });
            await loadServerConfig(activeServer.id);
          }}
        />
      </Box>
    </Box>
  );
};

export default AgentMCP;
