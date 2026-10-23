import AddIcon from "@mui/icons-material/Add";
import BlueprintCard from "../../components/BlueprintCard/BlueprintCard";
import BlueprintDrawerLayout from "../../layouts/BlueprintDrawerLayout";
import BlueprintSkeleton from "../../components/Skeletons/BlueprintSkeleton";
import useBlueprint from "../../hooks/useBlueprint";
import { useEvent } from "@nucleoidai/react-event";
import useLoading from "../../hooks/useLoading";

import { Box, Fab, Stack, Typography } from "@mui/material";
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
  const [blueprintPatchedEvent] = useEvent("BLUEPRINT_PATCHED", {
    Blueprint: null,
  });

  const { getBlueprintsByAgent, removeBlueprint } = useBlueprint();

  const { Blueprint, loading } = getBlueprintsByAgent(
    [
      blueprintUpsertedEvent.Blueprint,
      blueprintRemovedEvent.Blueprint,
      blueprintPatchedEvent.Blueprint,
    ],
    agentId
  );

  const isLoading = useLoading(loading);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
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
          ) : Blueprint?.length > 0 ? (
            Blueprint.map((item) => (
              <BlueprintCard
                key={item.id}
                item={item}
                handleDrawerOpen={handleDrawerOpen}
                removeBlueprint={removeBlueprint}
                agentId={item.agentId}
              />
            ))
          ) : (
            <Stack
              sx={{
                alignItems: "center",
                justifyContent: "center",
                textAlign: "center",
                height: "calc(100dvh - 280px)",
                color: "text.secondary",
                overflow: "hidden",
              }}
            >
              <Typography variant="body2">No blueprints available</Typography>
            </Stack>
          )}
        </Box>
      </Box>
      {drawerOpen && (
        <BlueprintDrawerLayout
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
