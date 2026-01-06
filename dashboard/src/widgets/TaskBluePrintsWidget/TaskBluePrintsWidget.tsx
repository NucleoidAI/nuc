import AddIcon from "@mui/icons-material/Add";
import TaskBluePrintCard from "../../components/TaskBluePrintCard/TaskBluePrintCard";
import TaskBluePrintDrawer from "../../components/TaskBluePrintDrawer/TaskBluePrintDrawer";
import TaskBluePrintFlowDialog from "../../components/TaskBluePrintFlow/TaskBluePrintFlowDialog";
import { Theme } from "@mui/material/styles";
import { useEvent } from "@nucleoidai/react-event";
import useTaskBluePrint from "../../hooks/useTaskBluePrint";

import { Box, Fab, Stack, useMediaQuery } from "@mui/material";
import React, { useState } from "react";

function TaskBluePrintsWidget({ agentId }: { agentId: string }) {
  const [taskBluePrintUpsertedEvent] = useEvent("TASK_BLUE_PRINT_UPSERTED", {
    taskBluePrint: null,
  });
  const [taskBluePrintRemovedEvent] = useEvent("TASK_BLUE_PRINT_REMOVED", {
    taskBluePrint: null,
  });

  const { getTaskBluePrint, removeTaskBluePrint } = useTaskBluePrint();

  const { taskBluePrint } = getTaskBluePrint([
    taskBluePrintUpsertedEvent.taskBluePrint,
    taskBluePrintRemovedEvent.taskBluePrint,
  ]);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [aiResponse, setAiResponse] = useState(null);
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
          {taskBluePrint?.map((item) => (
            <TaskBluePrintCard
              key={item.id}
              item={item}
              handleDrawerOpen={handleDrawerOpen}
              handleFlowDialogOpen={handleFlowDialogOpen}
              removeTaskBluePrint={removeTaskBluePrint}
              agentId={item.agentId}
            />
          ))}
        </Box>
      </Box>
      <TaskBluePrintDrawer
        drawerOpen={drawerOpen}
        handleDrawerClose={handleDrawerClose}
        selectedItem={selectedItem}
        setAiResponse={setAiResponse}
        aiResponse={aiResponse}
        setSelectedItem={setSelectedItem}
        agentId={agentId}
      />
      <TaskBluePrintFlowDialog
        flowDialogOpen={flowDialogOpen}
        handleFlowDialogClose={handleFlowDialogClose}
        selectedItem={selectedItem}
        aiResponse={aiResponse}
        setAiResponse={setAiResponse}
      />

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

export default TaskBluePrintsWidget;
