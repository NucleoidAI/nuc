import { Iconify } from "@canmingir/link/platform/components";
import StepScoresAccordion from "./StepScoresAccordion";
import TaskList from "../../components/TaskList/TaskList";
import useAgents from "../../hooks/useAgents";
import useLoading from "../../hooks/useLoading";
import { useState } from "react";
import useTasks from "../../hooks/useTasks";

import {
  Box,
  Card,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

function TaskScoresWidget() {
  const { getTeamAgents } = useAgents();
  const { agents, loading } = getTeamAgents();

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const {
    tasks,
    loading: tasksLoading,
    steps,
    getSteps,
  } = useTasks(selectedAgentId);

  const isTasksLoading = useLoading(tasksLoading);
  const isLoading = useLoading(loading);

  const [selectedTask, setSelectedTask] = useState<{
    id: string;
    description: string;
    status: string;
    createdAt: string;
  } | null>(null);

  const handleTaskSelect = (task: {
    id: string;
    description: string;
    status: string;
    createdAt: string;
  }) => {
    setSelectedTask(task);
    getSteps(task.id);
  };

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={2}
        sx={{ mb: 1 }}
      >
        <Box sx={{ minWidth: 240 }}>
          {isLoading ? (
            <Skeleton variant="rounded" height={40} sx={{ borderRadius: 1 }} />
          ) : (
            <FormControl fullWidth>
              <InputLabel>Agents</InputLabel>
              <Select
                label="Agents"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                renderValue={(val) => {
                  if (!val) return "Select an agent";
                  const agent = agents?.find(
                    (a: { id: string; name: string; icon?: string }) =>
                      a.id === val
                  );
                  return (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {agent?.icon && (
                        <Iconify icon={agent.icon} width={20} height={20} />
                      )}
                      <span>{agent?.name ?? val}</span>
                    </Stack>
                  );
                }}
              >
                <MenuItem value="" disabled>
                  Select an agent
                </MenuItem>
                {(agents ?? []).map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {agent.icon && (
                        <Iconify icon={agent.icon} width={20} height={20} />
                      )}
                      <span>{agent.name}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
      </Stack>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "400px 1fr" },
          gap: 1,
          alignItems: "start",
          height: "80vh",
        }}
      >
        <Card
          sx={{
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            height: "100%",
          }}
        >
          <Box
            sx={{
              p: 1,
              bgcolor: "background.default",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              Tasks
            </Typography>
          </Box>
          {isTasksLoading ? (
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
              tasks={tasks ?? []}
              selectedTask={selectedTask}
              onTaskSelect={handleTaskSelect}
            />
          )}
        </Card>

        <Card
          sx={{
            borderRadius: 1,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden",
            height: "100%",
          }}
        >
          <Box
            sx={{
              p: 1,
              bgcolor: "background.default",
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack direction="row" alignItems="center" spacing={1}>
              <Iconify
                icon="material-symbols:linear-scale"
                width={18}
                sx={{ color: "text.secondary" }}
              />
              <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
                Steps
              </Typography>
            </Stack>
          </Box>

          {!selectedTask ? (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Iconify
                icon="solar:inbox-line-duotone"
                width={48}
                sx={{ color: "text.disabled", mb: 1 }}
              />
              <Typography variant="body2" color="text.disabled">
                Select a task to see its steps
              </Typography>
            </Box>
          ) : steps && steps.length === 0 ? (
            <Box sx={{ p: 2, textAlign: "center" }}>
              <Typography variant="body2" color="text.disabled">
                No steps found for this task
              </Typography>
            </Box>
          ) : (
            <Box sx={{ overflow: "auto", height: "calc(100% - 41px)" }}>
              {(steps ?? []).map((step) => (
                <StepScoresAccordion key={step.id} step={step} />
              ))}
            </Box>
          )}
        </Card>
      </Box>
    </>
  );
}

export default TaskScoresWidget;
