import IncomingDrawer from "../../components/IncomingDrawer/IncomingDrawer";
import MCPSkeleton from "../../components/Skeletons/MCPSkeleton";
import MCPTabs from "../../components/MCPTabs/MCPTabs";
import MCPs from "../../components/MCPs/MCPs";
import React from "react";
import SkillDialog from "../../components/Skills/SkillDialog";
import useAcquiredMCPs from "../../hooks/useAcquiredMCPs";
import useAgent from "../../hooks/useAgent";
import useInitialLoading from "../../hooks/useInitialLoading";

import { Box, Grid } from "@mui/material";

const AgentMCP = ({ agent }: { agent: { id: string; name: string } }) => {
  const { getMCPs, getAgentAcquiredMCPs, getTokens } = useAcquiredMCPs();

  const { mcps, loading } = getMCPs();

  const { acquiredMCPs } = getAgentAcquiredMCPs(agent.id);

  const isInitialLoading = useInitialLoading(loading);

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

  const tabs = [
    { id: "8a9b0c1d-2e3f-4g5h-6i7j-8k9l0m1n2o3p", title: "Incoming" },
    { id: "7a8b9c0d-1e2f-3g4h-5i6j-7k8l9m0n1o2p", title: "Outgoing" },
  ];

  const { getAgents } = useAgent();
  const { agents } = getAgents();

  const [selectedTab, setSelectedTab] = React.useState(0);
  const [skillDialogOpen, setSkillDialogOpen] = React.useState(false);
  const [selectedSkill, setSelectedSkill] = React.useState<{
    id: string;
    name: string;
    icon: string;
    title: string;
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
    if (selectedTab === 0) {
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

  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };

  const incomingMCPs = mcps.filter((skill) => skill.direction === "INCOMING");
  const outgoingMCPs = mcps.filter((skill) => skill.direction === "OUTGOING");

  return (
    <Box
      sx={{
        width: "100%",
        px: 2,
        pb: 2,
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <MCPTabs
          selectedTab={selectedTab}
          handleTabChange={handleTabChange}
          tabs={tabs}
        />

        {isInitialLoading ? (
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
            {selectedTab === 0 && (
              <Grid container spacing={2}>
                {incomingMCPs?.map((skill) => (
                  <MCPs
                    key={skill.id}
                    title={skill.provider}
                    description={skill.description}
                    icon={skill.icon}
                    onSkillClick={handleSkillClick}
                    id={skill.id}
                    oauth={skill.oauth}
                  />
                ))}
              </Grid>
            )}

            {selectedTab === 1 && (
              <Grid container spacing={2}>
                {outgoingMCPs?.map((skill) => (
                  <MCPs
                    key={skill.id}
                    title={skill.provider}
                    description={skill.description}
                    icon={skill.icon}
                    onSkillClick={handleSkillClick}
                    id={skill.id}
                    oauth={skill.oauth}
                  />
                ))}
              </Grid>
            )}
          </>
        )}

        <SkillDialog
          open={skillDialogOpen}
          handleClose={handleSkillDialogClose}
          skill={selectedSkill}
          agents={agents}
          acquiredMCPs={acquiredMCPs}
          getTokens={getTokens}
        />

        <IncomingDrawer
          selectedSkill={selectedSkill}
          instructions={instructions}
          drawerOpen={drawerOpen}
          handleDrawerClose={handleDrawerClose}
          agent={agent}
        />
      </Box>
    </Box>
  );
};

export default AgentMCP;
