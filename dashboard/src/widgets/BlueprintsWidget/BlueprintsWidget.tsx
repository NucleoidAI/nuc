import AddIcon from "@mui/icons-material/Add";
import BlueprintCard from "../../components/BlueprintCard/BlueprintCard";
import BlueprintDrawer from "../../components/BlueprintDrawer/BlueprintDrawer";
import BlueprintFlowDialog from "../../components/BlueprintFlow/BlueprintFlowDialog";
import { Theme } from "@mui/material/styles";
import useBlueprint from "../../hooks/useBlueprint";
import { useEvent } from "@nucleoidai/react-event";

import { Box, Fab, Stack, useMediaQuery } from "@mui/material";
import React, { useState } from "react";

function BlueprintsWidget({ agentId }: { agentId: string }) {
  const [blueprintUpsertedEvent] = useEvent("BLUE_PRINT_UPSERTED", {
    Blueprint: null,
  });
  const [blueprintRemovedEvent] = useEvent("BLUE_PRINT_REMOVED", {
    Blueprint: null,
  });

  const { getBlueprint, removeBlueprint } = useBlueprint();

  const { Blueprint } = getBlueprint([
    blueprintUpsertedEvent.Blueprint,
    blueprintRemovedEvent.Blueprint,
  ]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [flowDialogOpen, setFlowDialogOpen] = useState(false);

  const handleDrawerOpen = (item) => {
    setSelectedItem(item);
    setDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setDrawerOpen(false);
    setSelectedItem(null);
  };

  const handleFlowDialogOpen = (item) => {
    setSelectedItem(item);
    setFlowDialogOpen(true);
  };

  const handleFlowDialogClose = () => {
    setFlowDialogOpen(false);
    setSelectedItem(null);
  };

  const lgScreen = useMediaQuery((theme: Theme) =>
    theme.breakpoints.down("lg")
  );

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
          {Blueprint?.map((item) => (
            <BlueprintCard
              key={item.id}
              item={item}
              handleDrawerOpen={handleDrawerOpen}
              handleFlowDialogOpen={handleFlowDialogOpen}
              removeBlueprint={removeBlueprint}
              agentId={item.agentId}
            />
          ))}
        </Box>
      </Box>
      {drawerOpen && (
        <BlueprintDrawer
          drawerOpen={drawerOpen}
          handleDrawerClose={handleDrawerClose}
          selectedItem={selectedItem}
          setSelectedItem={setSelectedItem}
          agentId={agentId}
        />
      )}

      {flowDialogOpen && (
        <BlueprintFlowDialog
          flowDialogOpen={flowDialogOpen}
          handleFlowDialogClose={handleFlowDialogClose}
          selectedItem={selectedItem}
        />
      )}

      <Stack
        sx={{
          position: lgScreen ? "absolute" : "fixed",
          bottom: lgScreen ? -60 : 10,
          right: lgScreen ? 0 : 5,
        }}
      >
        <Fab
          color="default"
          size="medium"
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
