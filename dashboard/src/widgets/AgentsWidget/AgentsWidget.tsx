import AddNewButton from "../../components/AddNewButton";
import AgentCard from "../../components/AgentCard";
import AgentDrawer from "../../components/AgentDrawer/AgentDrawer";
import AgentWizard from "../AgentWizard/AgentWizard";
import AgentsSkeleton from "../../components/Skeletons/AgentsSkeleton";
import Box from "@mui/material/Box";
import ConfirmationDialog from "../../components/ConfirmationDialog";
import DeleteButton from "../../components/DeleteButton/DeleteButton";
import { Grid } from "@mui/material";
import { publish } from "@nucleoidai/react-event";
import useAgent from "../../hooks/useAgent";
import useAgents from "../../hooks/useAgents";
import useInitialLoading from "../../hooks/useInitialLoading";
import { useNavigate } from "react-router-dom";
import useTeams from "../../hooks/useTeams";

import React, { useState } from "react";

function AgentsWidget({ teamId }) {
  const [updatedAgent, setUpdatedAgent] = useState(null);
  const [deleteFunction, setDeleteFunction] = useState(null);
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [formOpen, setFormOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);

  const navigate = useNavigate();
  const { deleteTeam } = useTeams();
  const { getTeamAgents, deleteAgent, createAgent } = useAgents();
  const { agents, loading } = getTeamAgents();
  const { updateAgent } = useAgent();

  const isInitialLoading = useInitialLoading(loading);

  function deleteTeams() {
    navigate("/teams");
  }

  const handleAgentClick = (agentId) => {
    const agent = agents.find((a) => a.id === agentId);

    if (!agent) return;

    setSelectedAgent(agent);
    setAgentDrawerOpen(true);
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
            setFormOpen(true);
            publish("AGENT_WIZARD_OPENED", { type: "ADD" });
          }}
        />

        {isInitialLoading
          ? Array.from({ length: 2 }).map((_, index) => (
              <Grid key={index} size={{ xs: 12, sm: 12, md: 6, lg: 4 }}>
                <AgentsSkeleton key={index} />
              </Grid>
            ))
          : agents.map((agent) => (
              <AgentCard
                key={agent.id}
                agent={agent}
                allAgentIds={agents.map((a) => a.id)}
                onView={() => handleAgentClick(agent.id)}
                onDelete={() => {
                  setDeleteFunction(() => () => deleteAgent(agent.id));
                  setDialogOpen(true);
                }}
                onEdit={() => {
                  setUpdatedAgent(agent);
                  setFormOpen(true);
                }}
              />
            ))}
      </Box>

      <Grid container justifyContent="center" mt={0} spacing={2}>
        <AgentWizard
          open={formOpen}
          onClose={() => {
            setFormOpen(false);
            setUpdatedAgent(null);
          }}
          itemProperties={["name", "description", "icon"]}
          onSubmit={updatedAgent ? updateAgent : createAgent}
          itemToEdit={updatedAgent}
        />
        <ConfirmationDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onConfirm={() => {
            deleteFunction();
            setDialogOpen(false);
          }}
          title="Delete Confirmation"
          content="Are you sure you want to delete this item?"
        />
        <DeleteButton
          onClickFunction={() => {
            setDeleteFunction(() => async () => {
              await deleteTeam(teamId);
              deleteTeams();
            });
            setDialogOpen(true);
          }}
        />
      </Grid>

      {agentDrawerOpen && (
        <AgentDrawer
          open={agentDrawerOpen}
          onClose={() => {
            setAgentDrawerOpen(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          initialTab="profile"
          allAgentIds={agents.map((a) => a.id)}
        />
      )}
    </>
  );
}

export default AgentsWidget;
