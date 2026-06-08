import AddIcon from "@mui/icons-material/Add";
import AddTaskDialog from "../../components/AddTaskDialog/AddTaskDialog";
import { Iconify } from "@canmingir/link/platform/components";
import StatusToolbar from "../../components/StatusToolbar/StatusToolbar";
import TaskDetails from "../../components/TaskDetails/TaskDetails";
import TaskList from "../../components/TaskList/TaskList";
import { useEvent } from "@nucleoidai/react-event";
import useLoading from "../../hooks/useLoading";
import useTasks from "../../hooks/useTasks";
import { useTheme } from "@mui/material/styles";

import {
  Box,
  Card,
  Dialog,
  DialogContent,
  Fab,
  IconButton,
  Skeleton,
  Stack,
  TextField,
  Tooltip,
  useMediaQuery,
} from "@mui/material";
import React, { useEffect, useMemo, useState } from "react";

function TasksWidget({
  agentId,
  taskId,
  supervisionRaised = false,
}: {
  agentId: string;
  taskId?: string;
  supervisionRaised?: boolean;
}) {
  const [aiResponded] = useEvent("AI_RESPONDED", null);

  const { tasks, steps, getSteps, createTask, loading } = useTasks(agentId, [
    aiResponded,
  ]);

  const isLoading = useLoading(loading);

  const [selectedStatus, setSelectedStatus] = useState<
    "All" | "COMPLETED" | "IN_PROGRESS"
  >("All");
  const [openCreate, setOpenCreate] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [selectedTask, setSelectedTask] = useState<{
    id: string;
    description: string;
    status: string;
    createdAt: string;
    comment: string;
    result: string | object | object[];
  }>({
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
    if (supervisionRaised && taskId && tasks) {
      const task = tasks.find((t) => t.id === taskId);
      if (task) {
        setSelectedTask(task);
      }
    } else if (!selectedTask && filteredTasks.length) {
      setSelectedTask(filteredTasks[0]);
    }
    // eslint-disable-next-line
  }, [filteredTasks.length, supervisionRaised, taskId, tasks]);

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
      }}
    >
      <Stack spacing={2}>
        {!supervisionRaised && (
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
                  slotProps={{
                    input: {
                      startAdornment: (
                        <Iconify
                          icon="eva:search-fill"
                          sx={{ color: "text.disabled", mr: 1 }}
                        />
                      ),
                    },
                  }}
                />
              </Stack>
            </Stack>
          </Card>
        )}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: supervisionRaised
              ? "1fr"
              : { xs: "1fr", md: "380px 1fr" },
            gap: 2,
            alignItems: "start",
          }}
        >
          {!supervisionRaised && (
            <Card
              sx={{
                borderRadius: 2,
                overflow: "hidden",
                border: "1px solid",
                borderColor: "divider",
                minHeight: "calc(100vh - 380px)",
              }}
            >
              {isLoading ? (
                <Stack sx={{ p: 2, gap: 1.5 }}>
                  {[...Array(6)].map((_, i) => (
                    <Skeleton
                      key={i}
                      variant="rounded"
                      height={56}
                      sx={{ borderRadius: 1 }}
                    />
                  ))}
                </Stack>
              ) : (
                <TaskList
                  tasks={filteredTasks}
                  selectedTask={selectedTask}
                  onTaskSelect={handleTaskSelect}
                />
              )}
            </Card>
          )}

          <>
            {isMobile ? (
              <Dialog
                open={Boolean(selectedTask)}
                onClose={() => setSelectedTask(null)}
                fullScreen
                slotProps={{
                  paper: {
                    sx: {
                      borderRadius: 0,
                    },
                  },
                }}
              >
                <Box
                  sx={{
                    px: 1,
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
                    maxHeight: "calc(100vh - 380px)",
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

        {!supervisionRaised && (
          <Tooltip title="Add New Task" placement="left">
            <Fab
              color="default"
              data-cy="add-task-button"
              onClick={() => setOpenCreate(true)}
              sx={{
                position: "absolute",
                right: 16,
                bottom: 16,
                zIndex: 1000,
                boxShadow: 6,
              }}
            >
              <AddIcon />
            </Fab>
          </Tooltip>
        )}

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
