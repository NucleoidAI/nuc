import AgentDrawer from "../../components/AgentDrawer/AgentDrawer";
import AgentWizard from "../AgentWizard/AgentWizard";
import BlueprintDrawerLayout from "../../layouts/BlueprintDrawerLayout";
import { Flow } from "@canmingir/link/platform/components";
import { Iconify } from "@canmingir/link/platform/components";
import { TeamChartRenderer } from "./TeamChartRenderer";
import TeamSkeleton from "../../components/Skeletons/TeamSkeleton";
import { publish } from "@nucleoidai/react-event";
import { storage } from "@nucleoidjs/webstorage";
import { teamChartPlugin } from "./TeamChartPlugin";
import useAgents from "../../hooks/useAgents";
import useBlueprint from "../../hooks/useBlueprint";
import { useLocation } from "react-router-dom";
import useOrganizations from "../../hooks/useOrganizations";
import useTeam from "../../hooks/useTeams";

import {
  Box,
  CircularProgress,
  IconButton,
  Stack,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import React, { useMemo, useState } from "react";
import { toTeamTree, treeToLinked } from "./utils";

function TeamChart() {
  const theme = useTheme();
  const lgUp = useMediaQuery(theme.breakpoints.up("lg"));

  const location = useLocation();
  const showNavButton = !lgUp && location.pathname.includes("/team");

  const projectId = storage.get("projectId");
  const { getTeamById } = useTeam();
  const { team } = getTeamById(projectId);
  const organizationId = team?.organizationId;

  const { organization, loading } =
    useOrganizations().getOrganizationById(organizationId);

  const { getBlueprint } = useBlueprint();
  const { Blueprint: allBlueprintsRaw } = getBlueprint();

  const { createAgent } = useAgents();

  const orgArray = Array.isArray(organization)
    ? organization
    : organization
    ? [organization]
    : [];

  const filteredOrganizations = orgArray.filter(
    (org) => org.agents && org.agents.length > 0 && org.id === projectId
  );

  const allAgentIds = filteredOrganizations.flatMap((org) =>
    (org.agents || []).map((agent) => agent.id)
  );

  const teamTree = useMemo(
    () => toTeamTree(filteredOrganizations, allBlueprintsRaw || []),
    [filteredOrganizations, allBlueprintsRaw]
  );

  const data = teamTree ? treeToLinked(teamTree) : { nodes: {}, roots: [] };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [agentDrawer, setAgentDrawer] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedAgentTab, setSelectedAgentTab] = useState<
    | "profile"
    | "knowledge-base"
    | "tasks"
    | "Blueprints"
    | "supervisings"
    | "communication"
    | "mcps"
  >("profile");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);

  const handleAddAgent = (teamId: string) => {
    setSelectedTeamId(teamId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setSelectedTeamId(null);
  };

  const handleDrawerOpen = (item) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedItem(null);
    setAiResponse(null);
  };

  const handleAgentDrawerOpen = (agentNode, tab) => {
    setSelectedAgent(agentNode);
    setSelectedAgentTab(tab);
    setAgentDrawer(true);
  };

  const handleAgentDrawerClose = () => {
    setAgentDrawer(false);
    setSelectedAgent(null);
    setSelectedAgentTab("profile");
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: 200 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!teamTree) {
    return <TeamSkeleton />;
  }

  const style = (node) => {
    const base =
      typeof TeamChartRenderer === "function"
        ? TeamChartRenderer(node)
        : TeamChartRenderer || {};

    return {
      ...base,
      allAgentIds,
      onTeamAddAgent: (teamNode) => handleAddAgent(teamNode.id),
      onAgentOpen: (colNode, tab) => handleAgentDrawerOpen(colNode, tab),
      onBlueprintOpen: (respNode) => handleDrawerOpen(respNode),
    };
  };

  return (
    <>
      {showNavButton && (
        <IconButton
          sx={{
            top: 10,
            left: 10,
          }}
          data-cy="open-nav-button"
          onClick={() =>
            publish("PLATFORM_NAV_OPENED", { layout: "fullScreen" })
          }
        >
          <Iconify icon="mingcute:menu-fill" sx={{ width: 28, height: 28 }} />
        </IconButton>
      )}

      <Box>
        <Flow data={data} style={style} plugin={teamChartPlugin} />
      </Box>

      {dialogOpen && (
        <AgentWizard
          open={dialogOpen}
          onClose={handleCloseDialog}
          itemProperties={["name", "description"]}
          onSubmit={(newAgent) => {
            if (!selectedTeamId) return;
            createAgent(newAgent, selectedTeamId);
          }}
          itemToEdit={null}
        />
      )}

      {drawerOpen && (
        <BlueprintDrawerLayout
          drawerOpen={drawerOpen}
          handleDrawerClose={handleDrawerClose}
          selectedItem={selectedItem}
          setAiResponse={setAiResponse}
          aiResponse={aiResponse}
        />
      )}

      {agentDrawer && (
        <AgentDrawer
          open={agentDrawer}
          onClose={handleAgentDrawerClose}
          agent={selectedAgent}
          initialTab={selectedAgentTab}
          allAgentIds={allAgentIds}
        />
      )}
    </>
  );
}

export default TeamChart;
