import AddNewButton from "../../components/AddNewButton";
import AgentCard from "../../components/AgentCard";
import AgentWizard from "../AgentWizard/AgentWizard";
import AgentsSkeleton from "../../components/Skeletons/AgentsSkeleton";
import Box from "@mui/material/Box";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import DeleteButton from "../../components/DeleteButton/DeleteButton";
import { Grid } from "@mui/material";
import { publish } from "@nucleoidai/react-event";
import useAgent from "../../hooks/useAgent";
import useAgents from "../../hooks/useAgents";
import { useNavigate } from "react-router-dom";
import useTeams from "../../hooks/useTeams";
import useUIState from "../../hooks/useUIState";

import React, { useState } from "react";

function AgentsWidget({ teamId }) {
  const [updatedAgent, setUpdatedAgent] = useState(null);
  const [deleteFunction, setDeleteFunction] = useState(null);
  const navigate = useNavigate();
  const { uiState, openForm, closeForm, openDialog, closeDialog } =
    useUIState();

  const { deleteTeam } = useTeams();
  const { getTeamAgents, deleteAgent, createAgent } = useAgents();

  const { agents, loading } = getTeamAgents();

  const { updateAgent } = useAgent();

  function deleteTeams() {
    //dispatch({ type: "TEAM_DELETE" });
    navigate("/teams");
  }

  const handleAgentClick = (colleagueId) => {
    navigate(`/colleagues/${colleagueId}`);
  };

  return (
    <>
      <Box
        gap={3}
        data-cy={"service-card"}
        display="grid"
        gridTemplateColumns={{
          xs: "repeat(1, 1fr)",
          sm: "repeat(2, 1fr)",
          md: "repeat(3, 1fr)",
          lg: "repeat(4, 1fr)",
          xl: "repeat(5, 1fr)",
        }}
        sx={{
          "@media (max-width:600px)": {
            position: "relative",
            left: "50%",
            transform: "translateX(-40%)",
          },
        }}
      >
        <AddNewButton
          type={"wideButton"}
          addNew={"Agent"}
          onClickFunction={() => {
            openForm();
            publish("COLLEAGUE_WIZARD_OPENED", { type: "ADD" });
          }}
        />

        {loading
          ? Array.from({ length: 1 }).map((_, index) => (
              <Grid item xs={12} sm={12} md={6} lg={4} key={index}>
                <AgentsSkeleton key={index} />
              </Grid>
            ))
          : agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                onView={() => handleAgentClick(agent.id)}
                onDelete={() => {
                  setDeleteFunction(() => () => deleteAgent(agent.id));
                  openDialog();
                }}
                onEdit={() => {
                  setUpdatedAgent(agent);
                  openForm();
                }}
              />
            ))}
      </Box>
      <Grid container justifyContent="center" mt={0} spacing={2}>
        <AgentWizard
          open={uiState.formOpen}
          onClose={() => {
            closeForm();
            setUpdatedAgent(null);
          }}
          itemProperties={["name", "description", "icon"]}
          onSubmit={updatedAgent ? updateAgent : createAgent}
          itemToEdit={updatedAgent}
        />
        <ConfirmationDialog
          open={uiState.dialogOpen}
          onClose={closeDialog}
          onConfirm={() => {
            deleteFunction();
            closeDialog();
          }}
          title="Delete Confirmation"
          content="Are you sure you want to delete this item?"
        />
        <DeleteButton
          onClickFunction={() => (
            setDeleteFunction(() => async () => {
              await deleteTeam(teamId);
              deleteTeams();
            }),
            openDialog()
          )}
        />
      </Grid>
    </>
  );
}

export default AgentsWidget;
