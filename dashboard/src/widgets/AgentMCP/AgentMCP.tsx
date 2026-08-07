import { Icon } from "@iconify/react";
import IncomingDrawer from "../../components/IncomingDrawer/IncomingDrawer";
import MCPSkeleton from "../../components/Skeletons/MCPSkeleton";
import MCPs from "../../components/MCPs/MCPs";
import React from "react";
import SkillDialog from "../../components/Skills/SkillDialog";
import { storage } from "@nucleoidjs/webstorage";
import useAcquiredMCPs from "../../hooks/useAcquiredMCPs";
import useAgent from "../../hooks/useAgent";
import useLoading from "../../hooks/useLoading";
import useTeam from "../../hooks/useTeams";

import {
  Box,
  ButtonBase,
  Chip,
  Grid,
  InputAdornment,
  TextField,
  Typography,
} from "@mui/material";

const AgentMCP = ({ agent }: { agent?: { id: string; name: string } }) => {
  const { getMCPs, getAgentAcquiredMCPs, getAcquiredMCPs, getTokens } =
    useAcquiredMCPs();

  const teamId = storage.get("projectId");

  const { mcps, loading } = getMCPs();

  // Both hooks are called unconditionally to satisfy the rules of hooks; the
  // relevant result is selected based on whether the widget runs in agent
  // mode (agent prop present) or team mode (MCPs page, no agent).
  const { acquiredMCPs: agentAcquiredMCPs } = getAgentAcquiredMCPs(
    agent?.id ?? ""
  );
  const { acquiredMCPs: teamAcquiredMCPs } = getAcquiredMCPs(teamId);

  const acquiredMCPs = agent ? agentAcquiredMCPs : teamAcquiredMCPs;

  const { getTeamById } = useTeam();
  const { team } = getTeamById(teamId);

  const isLoading = useLoading(loading);

  const instructions = [
    { id: "1", instruction: "Clone the repository from GitHub." },
    {
      id: "2",
      instruction: "Install the necessary dependencies using `npm install`.",
    },
    { id: "3", instruction: "Run the project using `npm start`." },
    {
      id: "4",
      instruction: "Follow the documentation for further MCP steps.",
    },
  ];

  const [search, setSearch] = React.useState("");
  const [selectedProvider, setSelectedProvider] = React.useState<string | null>(
    null
  );

  const groupedMCPs = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    const groups = new Map<
      string,
      { provider: string; icon?: string; skills: typeof mcps }
    >();

    mcps?.forEach((skill) => {
      const provider = skill.provider ?? "OTHER";

      if (query) {
        const providerMatches = provider.toLowerCase().includes(query);
        const skillMatches =
          skill.action?.toLowerCase().includes(query) ||
          skill.description?.toLowerCase().includes(query);

        if (!providerMatches && !skillMatches) {
          return;
        }
      }

      if (!groups.has(provider)) {
        groups.set(provider, { provider, icon: skill.icon, skills: [] });
      }

      groups.get(provider).skills.push(skill);
    });

    return Array.from(groups.values()).sort(
      (a, b) => b.skills.length - a.skills.length
    );
  }, [mcps, search]);

  const activeGroup =
    groupedMCPs.find((group) => group.provider === selectedProvider) ??
    groupedMCPs[0];
  const activeProvider = activeGroup?.provider;

  const { getAgents } = useAgent();
  const { agents } = getAgents();

  const [skillDialogOpen, setSkillDialogOpen] = React.useState(false);
  const [selectedSkill, setSelectedSkill] = React.useState<{
    id: string;
    name: string;
    icon: string;
    title: string;
    action: string;
    description: string;
    oauth: {
      scope: string;
      tokenUrl: string;
      clientId: string;
      redirectUri: string;
    };
  } | null>(null);

  const [drawerOpen, setDrawerOpen] = React.useState(false);

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);

    if (agent) {
      setDrawerOpen(true);
    } else {
      setSkillDialogOpen(true);
    }
  };

  const handleSkillDialogClose = () => {
    setSkillDialogOpen(false);
    setSelectedSkill(null);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedSkill(null);
  };

  return (
    <Box
      sx={{
        width: "100%",
        px: 2,
        pb: 2,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <TextField
          fullWidth
          size="small"
          placeholder="Search providers or tools..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
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
        {isLoading ? (
          <Grid container spacing={2}>
            {Array.from({
              length: 4,
            }).map((_, i) => (
              <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}>
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
              {groupedMCPs.map((group) => {
                const isActive = group.provider === activeProvider;

                return (
                  <ButtonBase
                    key={group.provider}
                    onClick={() => setSelectedProvider(group.provider)}
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
                    {group.icon && (
                      <Icon icon={group.icon} width="24" height="24" />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {group.provider}
                    </Typography>
                    <Chip
                      label={group.skills.length}
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

            <Grid container spacing={2} sx={{ mb: 1 }}>
              {activeGroup?.skills.map((skill) => (
                <MCPs
                  key={skill.id}
                  title={skill.provider}
                  description={skill.description}
                  icon={skill.icon}
                  onSkillClick={handleSkillClick}
                  id={skill.id}
                  oauth={skill.oauth}
                  action={skill.action}
                  size={
                    agent
                      ? { xs: 12, sm: 6, md: 4, lg: 3 }
                      : { xs: 12, sm: 6, md: 6, lg: 4 }
                  }
                />
              ))}
            </Grid>
          </>
        )}

        <SkillDialog
          open={skillDialogOpen}
          handleClose={handleSkillDialogClose}
          skill={selectedSkill}
          team={agent ? undefined : team}
          agents={agent ? agents : undefined}
          acquiredMCPs={acquiredMCPs}
          getTokens={getTokens}
        />

        {agent && (
          <IncomingDrawer
            selectedSkill={selectedSkill}
            instructions={instructions}
            drawerOpen={drawerOpen}
            handleDrawerClose={handleDrawerClose}
            agent={agent}
          />
        )}
      </Box>
    </Box>
  );
};

export default AgentMCP;
