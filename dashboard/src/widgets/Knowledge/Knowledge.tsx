import AddIcon from "@mui/icons-material/Add";
import AddItemDialog from "../../components/AddItemDialog/AddItemDialog";
import DeleteConfirmation from "../../components/DeleteConfirmation/DeleteConfirmation";
import KnowledgeBaseSkeleton from "../../components/Skeletons/KnowledgeBaseSkeleton";
import KnowledgeTable from "../../components/KnowledgeTable/KnowledgeTable";
import TypeToolbar from "../../components/TypeToolbar/TypeToolbar";
import useAgent from "../../hooks/useAgent";
import useBlueprint from "../../hooks/useBlueprint";
import useInitialLoading from "../../hooks/useInitialLoading";
import useKnowledge from "../../hooks/useKnowledge";
import useOrganizations from "../../hooks/useOrganizations";
import { useTable } from "@canmingir/link/platform/components";
import useTeams from "../../hooks/useTeams";

import { Box, Fab, Stack } from "@mui/material";
import { useEffect, useState } from "react";

function Knowledge({
  agentId,
  teamId,
  blueprintId,
}: {
  agentId?: string;
  teamId?: string;
  blueprintId?: string;
}) {
  const {
    getAgentKnowledges,
    deleteKnowledge,
    createKnowledge,
    getTeamKnowledges,
  } = useKnowledge();

  const { knowledges, loading: agentKnowledgesLoading } =
    getAgentKnowledges(agentId);
  const { knowledges: teamKnowledges, loading: teamKnowledgesLoading } =
    getTeamKnowledges(teamId);
  const isLoading = agentKnowledgesLoading || teamKnowledgesLoading;

  const { getTeamById } = useTeams();

  const { team } = getTeamById(teamId);
  const { getBlueprintWithId, getBlueprint } = useBlueprint();

  const { getOrganizations } = useOrganizations();

  const { organizations, loading: organizationLoading } = getOrganizations();
  const { blueprint } = getBlueprintWithId(blueprintId);
  const { Blueprint } = getBlueprint();

  const { getAgents } = useAgent();
  const { agents } = getAgents();

  const table = useTable();

  const isInitialLoading = useInitialLoading(isLoading);

  const ALL_KNOWLEDGE_TYPES = ["ALL", "URL", "TEXT", "QA"].sort((a, b) => {
    if (a === "ALL") return -1;
    if (b === "ALL") return 1;
    if (a === "URL") return -1;
    if (b === "URL") return 1;
    return 0;
  });

  const ADD_ITEM_TYPES = ALL_KNOWLEDGE_TYPES.filter((type) => type !== "ALL");

  const [selectedType, setSelectedType] = useState(ALL_KNOWLEDGE_TYPES[0]);

  const [open, setOpen] = useState(false);

  const [selectedItem, setSelectedItem] = useState([]);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);

  const source = agentId ? knowledges : teamKnowledges;

  const filteredKnowledges =
    selectedType === "ALL"
      ? source
      : source.filter((k) => k?.type === selectedType);

  const doesOrganizationMatchTeamCoach = (organization, currentTeam) => {
    if (!currentTeam) {
      return false;
    }

    if (organization.id === currentTeam.organizationId) {
      return true;
    }

    if (organization.coachId && currentTeam.coachId) {
      return organization.coachId === currentTeam.coachId;
    }

    if (organization.coach && currentTeam.coach) {
      return organization.coach === currentTeam.coach;
    }

    return false;
  };

  const filteredOrganizations = organizations?.filter((organization) =>
    doesOrganizationMatchTeamCoach(organization, team)
  );

  const selectableBlueprints = (Blueprint || []).filter((item) => {
    if (blueprintId) {
      return item.id === blueprintId;
    }

    if (agentId) {
      return item.agentId === agentId;
    }

    return false;
  });

  const handleChange = (event) => {
    setSelectedType(event.target.value);
  };

  const handleDeleteClick = (item) => {
    setSelectedItem(item);
    setOpenDeleteDialog(true);
  };

  const handleDelete = async (item) => {
    if (item) {
      const deleteResponse = await deleteKnowledge(item);
      if (deleteResponse) {
        knowledges.filter((knowledge) => knowledge.id !== item.id);
      }
    }
  };

  useEffect(() => {
    if (
      !ALL_KNOWLEDGE_TYPES.includes(selectedType) &&
      ALL_KNOWLEDGE_TYPES.length > 0
    ) {
      setSelectedType(ALL_KNOWLEDGE_TYPES[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType]);

  return (
    <Box
      sx={{
        width: "100%",
        px: 2,
        pb: 2,
      }}
    >
      <TypeToolbar
        types={ALL_KNOWLEDGE_TYPES}
        selectedType={selectedType}
        handleChange={handleChange}
      />

      <Box
        sx={{
          flex: 1,
          pb: 10,
        }}
      >
        {isInitialLoading ? (
          <KnowledgeBaseSkeleton />
        ) : filteredKnowledges?.length > 0 ? (
          <KnowledgeTable
            table={table}
            selectedType={selectedType}
            knowledges={filteredKnowledges}
            handleDeleteClick={handleDeleteClick}
          />
        ) : (
          <Stack sx={{ textAlign: "center", my: 4, color: "text.secondary" }}>
            No data available for {selectedType} type
          </Stack>
        )}
      </Box>

      <Stack
        sx={{
          position: "absolute",
          right: 16,
          bottom: 16,
        }}
      >
        <Fab
          variant="button"
          color="default"
          size="medium"
          sx={{ zIndex: 1 }}
          data-cy="add-knowledge-button"
          onClick={() => {
            setOpen(true);
          }}
        >
          <AddIcon />
        </Fab>
      </Stack>

      <DeleteConfirmation
        openDeleteDialog={openDeleteDialog}
        setOpenDeleteDialog={setOpenDeleteDialog}
        handleDelete={handleDelete}
        selectedItem={selectedItem}
      />
      {!organizationLoading ? (
        <AddItemDialog
          types={ADD_ITEM_TYPES}
          selectedType={selectedType === "ALL" ? "URL" : selectedType}
          open={open}
          setOpen={setOpen}
          addItem={createKnowledge}
          agentId={agentId}
          teamId={teamId}
          blueprintId={blueprintId}
          blueprint={blueprint}
          blueprints={selectableBlueprints}
          teamById={team}
          agents={agents}
          organizations={filteredOrganizations}
        />
      ) : null}
    </Box>
  );
}
export default Knowledge;
