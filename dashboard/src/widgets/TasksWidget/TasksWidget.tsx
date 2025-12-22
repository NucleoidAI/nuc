import AddIcon from "@mui/icons-material/Add";
import AddTaskDialog from "../../components/AddTaskDialog/AddTaskDialog";
import { Iconify } from "@canmingir/link/platform/components";
import StatusToolbar from "../../components/StatusToolbar/StatusToolbar";
import TaskDetails from "../../components/TaskDetails/TaskDetails";
import TaskList from "../../components/TaskList/TaskList";
import useTasks from "../../hooks/useTasks";
import { useTheme } from "@mui/material/styles";

import {
  Box,
  Card,
  Dialog,
  DialogContent,
  Fab,
  IconButton,
  Stack,
  TextField,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";

function TasksWidget({ agentId }: { agentId: string }) {
  const { tasks, steps, getSteps, createTask } = useTasks(agentId);

  const [selectedStatus, setSelectedStatus] = useState("All");
  const [openCreate, setOpenCreate] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedTask, setSelectedTask] = useState({
    id: "",
    description: "",
    status: "",
    createdAt: "",
    comment: "",
    result: "",
  });

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const filteredTasks = useMemo(() => {
    const q = query.trim().toLowerCase();

    return (tasks || [])
      .filter(
        (t) => selectedStatus === "All" || (t && t.status === selectedStatus)
      )
      .filter(
        (t) =>
          !q ||
          String(t?.description || "")
            .toLowerCase()
            .includes(q)
      )
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  }, [tasks, selectedStatus, query]);

  useEffect(() => {
    if (!selectedTask && filteredTasks.length) {
      setSelectedTask(filteredTasks[0]);
    }
    // eslint-disable-next-line
  }, [filteredTasks.length]);

  useEffect(() => {
    if (!selectedTask?.id) return;

    getSteps(selectedTask.id);
    const interval = setInterval(() => {
      getSteps(selectedTask.id);
    }, 2000);

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, [selectedTask?.id]);

  const handleTaskSelect = (task) => {
    setSelectedTask(task);
  };

  return (
    <Box
      sx={{
        width: "100%",
        px: { xs: 1, md: 2 },
        pb: 2,
        minHeight: "calc(100vh - 240px)",
      }}
    >
      <Stack spacing={2}>
        <Card
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            p: 2,
          }}
        >
          <Stack spacing={2}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={2}
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <StatusToolbar
                statuses={["All", "COMPLETED", "IN_PROGRESS"]}
                selectedStatus={selectedStatus}
                handleChange={(e) => setSelectedStatus(e.target.value)}
              />

              <TextField
                fullWidth
                size="small"
                placeholder="Search tasks by description..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <Iconify
                      icon="eva:search-fill"
                      sx={{ color: "text.disabled", mr: 1 }}
                    />
                  ),
                }}
              />
            </Stack>
          </Stack>
        </Card>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", md: "380px 1fr" },
            gap: 2,
            alignItems: "start",
          }}
        >
          <Card
            sx={{
              borderRadius: 2,
              overflow: "hidden",
              border: "1px solid",
              borderColor: "divider",
              minHeight: "calc(100vh - 380px)",
            }}
          >
            <TaskList
              tasks={filteredTasks}
              selectedTask={selectedTask}
              onTaskSelect={handleTaskSelect}
            />
          </Card>

          <>
            {isMobile ? (
              <Dialog
                open={Boolean(selectedTask)}
                onClose={() => setSelectedTask(null)}
                fullScreen
                PaperProps={{
                  sx: {
                    borderRadius: 0,
                  },
                }}
              >
                <Box
                  sx={{
                    px: 2,
                    py: 1.5,
                    borderBottom: "1px solid",
                    borderColor: "divider",
                    bgcolor: "background.default",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "flex-end",
                  }}
                >
                  <IconButton onClick={() => setSelectedTask(null)}>
                    <Iconify icon="material-symbols:close" />
                  </IconButton>
                </Box>

                <DialogContent sx={{ p: 2 }}>
                  <TaskDetails
                    task={selectedTask}
                    steps={steps}
                    agentId={agentId}
                    getSteps={getSteps}
                  />
                </DialogContent>
              </Dialog>
            ) : (
              <Card
                sx={{
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  minHeight: "calc(100vh - 380px)",
                  overflow: "hidden",
                  display: { xs: "none", md: "block" },
                }}
              >
                <Box
                  sx={{
                    p: 2,
                    maxHeight: "calc(100vh - 440px)",
                    overflow: "auto",
                  }}
                >
                  <TaskDetails
                    task={selectedTask}
                    steps={steps}
                    agentId={agentId}
                    getSteps={getSteps}
                  />
                </Box>
              </Card>
            )}
          </>
        </Box>

        <Tooltip title="Add New Task" placement="left">
          <Fab
            color="default"
            size="medium"
            data-cy="add-task-button"
            onClick={() => setOpenCreate(true)}
            sx={{
              position: "fixed",
              bottom: 24,
              right: 24,
              zIndex: 1000,
              boxShadow: 6,
            }}
          >
            <AddIcon />
          </Fab>
        </Tooltip>

        <AddTaskDialog
          open={openCreate}
          setOpen={setOpenCreate}
          createTask={createTask}
          agentId={agentId}
        />
      </Stack>
    </Box>
  );
}

export default TasksWidget;
