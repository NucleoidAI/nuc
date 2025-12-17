import AddIcon from "@mui/icons-material/Add";
import AddTaskDialog from "../../components/AddTaskDialog/AddTaskDialog";
import StatusToolbar from "../../components/StatusToolbar/StatusToolbar";
import TaskCard from "../../components/TaskCard/TaskCard";
import useTasks from "../../hooks/useTasks";

import { Box, Fab, Stack } from "@mui/material";
import React, { useState } from "react";

function TasksWidget({ agentId }) {
  const { tasks, getSteps, steps, createTask } = useTasks(agentId);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  const [selectedStatus, setSelectedStatus] = useState("All");
  const [open, setOpen] = useState(false);

  const task = tasks.filter(
    (task) =>
      selectedStatus === "All" || (task && task.status === selectedStatus)
  );

  const handleChange = (event) => {
    setSelectedStatus(event.target.value);
  };

  const handleExpand = (taskId) => {
    getSteps(taskId);
    setExpandedTaskId((prevTaskId) => (prevTaskId === taskId ? null : taskId));
  };

  return (
    <Box
      sx={{
        width: "100%",
        px: 2,
        pb: 2,
        minHeight: "calc(100vh - 240px)",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
        <StatusToolbar
          statuses={["All", "DONE", "IN_PROGRESS"]}
          handleChange={handleChange}
          selectedStatus={selectedStatus}
        />
        {task.length > 0 ? (
          task.map((t, i) => (
            <TaskCard
              agentId={agentId}
              task={t}
              key={i}
              getSteps={() => getSteps(t.id)}
              onExpand={() => handleExpand(t.id)}
              expanded={expandedTaskId === t.id}
              steps={steps}
            />
          ))
        ) : (
          <Stack sx={{ textAlign: "center", my: 4, color: "text.secondary" }}>
            No tasks available for the selected status
          </Stack>
        )}

        <Stack
          sx={{
            position: "fixed",
            bottom: 10,
            right: 10,
          }}
        >
          <Fab
            variant="button"
            color="default"
            size="medium"
            sx={{
              mt: 2,
              zIndex: 0,
            }}
            data-cy="add-task-button"
            onClick={() => {
              setOpen(true);
              setExpandedTaskId(null);
            }}
          >
            <AddIcon />
          </Fab>
        </Stack>

        <AddTaskDialog
          open={open}
          setOpen={setOpen}
          createTask={createTask}
          agentId={agentId}
        />
      </Box>
    </Box>
  );
}

export default TasksWidget;
