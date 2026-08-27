import { Icon } from "@iconify/react";
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

  const teamId = storage.get("link", "projectid");

  const { mcps, loading } = getMCPs();

  const { acquiredMCPs: agentAcquiredMCPs } = getAgentAcquiredMCPs(
    agent?.id ?? ""
  );
  const { acquiredMCPs: teamAcquiredMCPs } = getAcquiredMCPs(teamId);

  const acquiredMCPs = agent ? agentAcquiredMCPs : teamAcquiredMCPs;

  const { getTeamById } = useTeam();
  const { team } = getTeamById(teamId);

  const isLoading = useLoading(loading);

  const [search, setSearch] = React.useState("");
  const [selectedProvider, setSelectedProvider] = React.useState<string | null>(
    null
  );

  const groupedMCPs = React.useMemo(() => {
    const query = search.trim().toLowerCase();

    const groups = new Map<
      string,
      { provider: string; label: string; icon?: string; skills: typeof mcps }
    >();

    mcps?.forEach((skill) => {
      const provider = skill.provider ?? "OTHER";

      if (query) {
        const providerMatches = provider.toLowerCase().includes(query);
        const skillMatches =
          skill.label.toLowerCase().includes(query) ||
          skill.action?.toLowerCase().includes(query) ||
          skill.description?.toLowerCase().includes(query);

        if (!providerMatches && !skillMatches) {
          return;
        }
      }

      if (!groups.has(provider)) {
        groups.set(provider, {
          provider,
          label: skill.label,
          icon: skill.icon,
          skills: [],
        });
      }

      groups.get(provider).skills.push(skill);
    });

    return Array.from(groups.values()).sort(
      (a, b) => b.skills.length - a.skills.length
    );
  }, [mcps, search]);

  const isSearching = search.trim().length > 0;

  const activeGroup =
    groupedMCPs.find((group) => group.provider === selectedProvider) ??
    (isSearching ? groupedMCPs[0] : undefined);
  const activeProvider = activeGroup?.provider ?? null;

  const visibleSkills = React.useMemo(() => {
    if (activeGroup) {
      return activeGroup.skills;
    }

    const maxLength = Math.max(
      0,
      ...groupedMCPs.map((group) => group.skills.length)
    );

    const shuffled = [];

    for (let i = 0; i < maxLength; i++) {
      groupedMCPs.forEach((group) => {
        if (group.skills[i]) {
          shuffled.push(group.skills[i]);
        }
      });
    }

    return shuffled;
  }, [activeGroup, groupedMCPs]);

  const { getAgents } = useAgent();
  const { agents } = getAgents();

  const dialogAgents = React.useMemo(
    () => (agent ? agents?.filter((a) => a.id === agent.id) : agents),
    [agent, agents]
  );

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

  const handleSkillClick = (skill) => {
    setSelectedSkill(skill);
    setSkillDialogOpen(true);
  };

  const handleSkillDialogClose = () => {
    setSkillDialogOpen(false);
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
              {!isSearching && (
                <ButtonBase
                  onClick={() => setSelectedProvider(null)}
                  sx={{
                    flexShrink: 0,
                    gap: 1,
                    px: 1.5,
                    py: 1,
                    borderRadius: 1,
                    border: 1,
                    borderColor: activeProvider
                      ? "divider"
                      : "background.paper",
                    bgcolor: activeProvider ? "transparent" : "action.selected",
                    "&:hover": { bgcolor: "action.hover" },
                  }}
                >
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    All
                  </Typography>
                  <Chip
                    label={groupedMCPs.reduce(
                      (total, group) => total + group.skills.length,
                      0
                    )}
                    size="small"
                    sx={{
                      bgcolor: "#1f232b",
                      color: "#fff",
                      fontWeight: 600,
                      "&:hover": { bgcolor: "#1f232b" },
                    }}
                  />
                </ButtonBase>
              )}

              {groupedMCPs.map((group) => {
                const isActive = group.provider === activeProvider;

                return (
                  <ButtonBase
                    key={group.provider}
                    onClick={() =>
                      setSelectedProvider(
                        isActive && !isSearching ? null : group.provider
                      )
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
                    {group.icon && (
                      <Icon icon={group.icon} width="24" height="24" />
                    )}
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {group.label}
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
              {visibleSkills.map((skill) => (
                <MCPs
                  key={skill.id}
                  title={skill.label}
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
          agents={agent ? dialogAgents : undefined}
          acquiredMCPs={acquiredMCPs}
          getTokens={getTokens}
        />
      </Box>
    </Box>
  );
};

export default AgentMCP;
