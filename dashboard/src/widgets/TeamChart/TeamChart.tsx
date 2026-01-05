import AgentDrawer from "../../components/AgentDrawer/AgentDrawer";
import AgentWizard from "../AgentWizard/AgentWizard";
import { Flow } from "@canmingir/link/platform/components";
import TaskBluePrintDrawer from "../../components/TaskBluePrintDrawer/TaskBluePrintDrawer";
import { TeamChartRenderer } from "./TeamChartRenderer";
import TeamSkeleton from "../../components/Skeletons/TeamSkeleton";
import { storage } from "@nucleoidjs/webstorage";
import { teamChartPlugin } from "./TeamChartPlugin";
import useAgents from "../../hooks/useAgents";
import useOrganizations from "../../hooks/useOrganizations";
import useTaskBluePrint from "../../hooks/useTaskBluePrint";
import useTeam from "../../hooks/useTeams";

import { Box, CircularProgress, Stack } from "@mui/material";
import React, { useMemo, useState } from "react";
import { toTeamTree, treeToLinked } from "./utils";

function TeamChart() {
  const projectId = storage.get("projectId");
  const { getTeamById } = useTeam();
  const { team } = getTeamById(projectId);
  const organizationId = team?.organizationId;

  const { organization, loading } =
    useOrganizations().getOrganizationById(organizationId);

  const { getTaskBluePrint } = useTaskBluePrint();
  const { taskBluePrint: allTaskBluePrintsRaw } = getTaskBluePrint();

  const { createAgent } = useAgents();

  const orgArray = Array.isArray(organization)
    ? organization
    : organization
    ? [organization]
    : [];

  const filteredOrganizations = orgArray.filter(
    (org) => org.colleagues && org.colleagues.length > 0 && org.id === projectId
  );

  const teamTree = useMemo(
    () => toTeamTree(filteredOrganizations, allTaskBluePrintsRaw || []),
    [filteredOrganizations, allTaskBluePrintsRaw]
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
    | "taskBluePrints"
    | "supervisings"
    | "communication"
    | "integrations"
  >("profile");

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

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
      onTeamAddAgent: (teamNode) => handleAddAgent(teamNode.id),
      onAgentOpen: (colNode, tab) => handleAgentDrawerOpen(colNode, tab),
      onTaskBluePrintOpen: (respNode) => handleDrawerOpen(respNode),
    };
  };

  return (
    <>
      <Box
        sx={{
          width: "100%",
          height: "100%",
          minHeight: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",

          backgroundColor: (theme) => theme.palette.background.default,
          backgroundImage: (theme) => `
      radial-gradient(
        ${theme.palette.divider} 1px,
        transparent 1px
      )
    `,
          backgroundSize: "16px 16px",
        }}
      >
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
        <TaskBluePrintDrawer
          drawerOpen={drawerOpen}
          handleDrawerClose={handleDrawerClose}
          selectedItem={selectedItem}
        />
      )}

      {agentDrawer && (
        <AgentDrawer
          open={agentDrawer}
          onClose={handleAgentDrawerClose}
          agent={selectedAgent}
          initialTab={selectedAgentTab}
        />
      )}
    </>
  );
}

export default TeamChart;
