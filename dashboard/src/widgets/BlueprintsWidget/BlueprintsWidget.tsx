import AddIcon from "@mui/icons-material/Add";
import BlueprintCard from "../../components/BlueprintCard/BlueprintCard";
import BlueprintDrawer from "../../components/BlueprintDrawer/BlueprintDrawer";
import BlueprintFlowDialog from "../../components/BlueprintFlow/BlueprintFlowDialog";
import BlueprintSkeleton from "../../components/Skeletons/BlueprintSkeleton";
import useBlueprint from "../../hooks/useBlueprint";
import { useEvent } from "@nucleoidai/react-event";
import useLoading from "../../hooks/useLoading";

import { Box, Fab, Stack } from "@mui/material";
import React, { useState } from "react";

function BlueprintsWidget({
  agentId,
  teamId,
}: {
  agentId: string;
  teamId?: string;
}) {
  const [blueprintUpsertedEvent] = useEvent("BLUEPRINT_UPSERTED", {
    Blueprint: null,
  });
  const [blueprintRemovedEvent] = useEvent("BLUEPRINT_REMOVED", {
    Blueprint: null,
  });

  const { getBlueprint, removeBlueprint } = useBlueprint();

  const { Blueprint, loading } = getBlueprint([
    blueprintUpsertedEvent.Blueprint,
    blueprintRemovedEvent.Blueprint,
  ]);

  const isLoading = useLoading(loading);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [flowDialogOpen, setFlowDialogOpen] = useState(false);
  const [aiResponse, setAiResponse] = useState(null);

  const handleDrawerOpen = (item) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedItem(null);
    setAiResponse(null);
  };

  const handleFlowDialogOpen = (item) => {
    setSelectedItem(item);
    setFlowDialogOpen(true);
  };

  const handleFlowDialogClose = () => {
    setFlowDialogOpen(false);
    setSelectedItem(null);
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
        <Box sx={{ mt: 2 }}>
          {isLoading ? (
            <>
              {[...Array(Blueprint?.length)].map((_, i) => (
                <BlueprintSkeleton key={i} />
              ))}
            </>
          ) : (
            Blueprint?.map((item) => (
              <BlueprintCard
                key={item.id}
                item={item}
                handleDrawerOpen={handleDrawerOpen}
                handleFlowDialogOpen={handleFlowDialogOpen}
                removeBlueprint={removeBlueprint}
                agentId={item.agentId}
              />
            ))
          )}
        </Box>
      </Box>
      {drawerOpen && (
        <BlueprintDrawer
          drawerOpen={drawerOpen}
          handleDrawerClose={handleDrawerClose}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          setAiResponse={setAiResponse}
          aiResponse={aiResponse}
          agentId={agentId}
          teamId={teamId}
        />
      )}

      {flowDialogOpen && (
        <BlueprintFlowDialog
          flowDialogOpen={flowDialogOpen}
          handleFlowDialogClose={handleFlowDialogClose}
          selectedItem={selectedItem}
          aiResponse={aiResponse}
          setAiResponse={setAiResponse}
        />
      )}

      <Stack
        sx={{
          position: "absolute",
          right: 16,
          bottom: 16,
        }}
      >
        <Fab
          color="default"
          sx={{ mt: 2, zIndex: 0 }}
          onClick={() => handleDrawerOpen(null)}
        >
          <AddIcon />
        </Fab>
      </Stack>
    </Box>
  );
}

export default BlueprintsWidget;
