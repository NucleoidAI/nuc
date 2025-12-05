import ColleagueWizard from "../ColleagueWizard/ColleagueWizard";
import { Flow } from "@canmingir/link/platform/components";
import ResponsibilityDrawer from "../../components/ResponsbilityDrawer/ResponsibilityDrawer";
import { TeamChartRenderer } from "./TeamChartRenderer";
import { storage } from "@nucleoidjs/webstorage";
import { teamChartPlugin } from "./TeamChartPlugin";
import useColleagues from "../../hooks/useColleagues";
import { useNavigate } from "react-router-dom";
import useOrganizations from "../../hooks/useOrganziationsV2";
import useResponsibility from "../../hooks/useResponsibility";
import useTeam from "../../hooks/useTeam";

import { Box, CircularProgress, Stack } from "@mui/material";
import React, { useMemo, useState } from "react";
import { toTeamTree, treeToLinked } from "./utils";

function TeamChart() {
  const navigate = useNavigate();

  const projectId = storage.get("projectId");
  const { teamById } = useTeam(projectId);
  const organizationId = teamById?.organizationId;

  const { organization, loading } =
    useOrganizations().getOrganizationById(organizationId);

  const { getResponsibility } = useResponsibility();
  const { responsibility: allResponsibilitiesRaw } = getResponsibility();

  const { createColleague } = useColleagues();

  const orgArray = Array.isArray(organization)
    ? organization
    : organization
    ? [organization]
    : [];

  const filteredOrganizations = orgArray.filter(
    (org) => org.colleagues && org.colleagues.length > 0 && org.id === projectId
  );

  const teamTree = useMemo(
    () => toTeamTree(filteredOrganizations, allResponsibilitiesRaw || []),
    [filteredOrganizations, allResponsibilitiesRaw]
  );

  const managerTree = useMemo(() => {
    if (!teamTree) return null;

    return {
      id: "manager-root",
      nodeKind: "manager",
      name: "Jack Shepherd",
      role: "CAO - Chief AI Officer",
      avatar: ":5:",
      children: [teamTree],
    };
  }, [teamTree]);

  const data = managerTree
    ? treeToLinked(managerTree)
    : { nodes: {}, roots: [] };

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleAddColleague = (teamId: string) => {
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

  const handleGoToColleaguePage = (colleagueNode) => {
    navigate(`/colleagues/${colleagueNode.id}`);
  };

  if (loading) {
    return (
      <Stack alignItems="center" justifyContent="center" sx={{ height: 200 }}>
        <CircularProgress />
      </Stack>
    );
  }

  if (!teamTree) {
    return <p>No team data found for this project.</p>;
  }

  const style = (node) => {
    const base =
      typeof TeamChartRenderer === "function"
        ? TeamChartRenderer(node)
        : TeamChartRenderer || {};

    return {
      ...base,
      onTeamAddColleague: (teamNode) => handleAddColleague(teamNode.id),
      onColleagueGoToPage: (colNode) => handleGoToColleaguePage(colNode),
      onResponsibilityOpen: (respNode) => handleDrawerOpen(respNode),
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
        }}
      >
        <Flow data={data} style={style} plugin={teamChartPlugin} />
      </Box>

      {dialogOpen && (
        <ColleagueWizard
          open={dialogOpen}
          onClose={handleCloseDialog}
          itemProperties={["name", "character", "role"]}
          onSubmit={(newColleague) => {
            if (!selectedTeamId) return;
            createColleague(newColleague, selectedTeamId);
          }}
          itemToEdit={null}
        />
      )}

      {drawerOpen && (
        <ResponsibilityDrawer
          drawerOpen={drawerOpen}
          handleDrawerClose={handleDrawerClose}
          selectedItem={selectedItem}
        />
      )}
    </>
  );
}

export default TeamChart;
