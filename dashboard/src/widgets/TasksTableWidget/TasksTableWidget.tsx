import AgentDrawer from "../../components/AgentDrawer/AgentDrawer";
import { Iconify } from "@canmingir/link/platform/components";
import { fDateTime } from "../../utils/formatTime";
import useAgents from "../../hooks/useAgents";
import useLLMLogs from "../../hooks/useLLMLogs";
import useTaskStats from "../../hooks/useTaskStats";
import { useTeamTasks } from "../../hooks/useTasks";

import {
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

type TaskStatus = "COMPLETED" | "IN_PROGRESS" | "AWAITING" | "FAILED";

const STATUS_LABEL: Record<TaskStatus, string> = {
  COMPLETED: "Completed",
  IN_PROGRESS: "In progress",
  AWAITING: "Awaiting supervision",
  FAILED: "Failed",
};

const STATUS_COLOR: Record<
  TaskStatus,
  "success" | "error" | "primary" | "warning" | "default"
> = {
  COMPLETED: "success",
  IN_PROGRESS: "primary",
  AWAITING: "warning",
  FAILED: "error",
};

const TASKS_PER_PAGE = 10;

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function StatusChip({ status }: { status: TaskStatus }) {
  return (
    <Chip
      label={STATUS_LABEL[status]}
      size="small"
      color={STATUS_COLOR[status]}
      variant="filled"
      sx={{ fontWeight: 600 }}
    />
  );
}

function TasksTableWidget({ range }: { range: { from: string; to: string } }) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus>("ALL");
  const [agentFilter, setAgentFilter] = useState<string>("ALL");
  const [tasksPage, setTasksPage] = useState(1);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);

  const { getTeamAgents } = useAgents();
  const { agents } = getTeamAgents();
  const { getUsageByTeam } = useLLMLogs();
  const { getStatusCounts } = useTaskStats();
  const { tasks } = useTeamTasks(range);
  const { usage } = getUsageByTeam(range);
  const { counts: statusCounts } = getStatusCounts({
    agentId: agentFilter === "ALL" ? undefined : agentFilter,
    from: range.from,
    to: range.to,
  });

  const agentNameById = useMemo(() => {
    const map = new Map<string, string>();
    (agents ?? []).forEach((agent) => map.set(agent.id, agent.name));
    return map;
  }, [agents]);

  const usageByTaskId = useMemo(() => {
    const map = new Map<string, { tokens: number; durationMs: number }>();
    usage.forEach((item) => {
      const durationMs = item.logs.reduce(
        (sum, log) => sum + (log.durationMs ?? 0),
        0
      );
      map.set(item.task.id, {
        tokens: item.totals.totalTokens,
        durationMs,
      });
    });
    return map;
  }, [usage]);

  const taskRows = useMemo(() => {
    return tasks.map((task) => {
      const taskUsage = usageByTaskId.get(task.id);
      return {
        id: task.id,
        description: task.description,
        agent: agentNameById.get(task.agentId) ?? task.agentId,
        agentId: task.agentId,
        status: task.effectiveStatus,
        startedAt: fDateTime(task.createdAt, "DD MMM, HH:mm") ?? "",
        duration: taskUsage
          ? `${(taskUsage.durationMs / 1000).toFixed(1)}s`
          : "-",
        tokens: taskUsage?.tokens ?? 0,
      };
    });
  }, [tasks, agentNameById, usageByTaskId]);

  const filteredTasks = useMemo(() => {
    return taskRows
      .filter((task) => statusFilter === "ALL" || task.status === statusFilter)
      .filter((task) => agentFilter === "ALL" || task.agentId === agentFilter);
  }, [taskRows, statusFilter, agentFilter]);

  const goToTask = (agentId: string, taskId: string) => {
    const agent = (agents ?? []).find((a) => a.id === agentId);
    if (!agent) return;

    setSelectedAgent(agent);
    setSelectedTaskId(taskId);
    setAgentDrawerOpen(true);
  };

  const tasksPageCount = Math.max(
    1,
    Math.ceil(filteredTasks.length / TASKS_PER_PAGE)
  );
  const pagedTasks = filteredTasks.slice(
    (tasksPage - 1) * TASKS_PER_PAGE,
    tasksPage * TASKS_PER_PAGE
  );

  const statusFilters: Array<{ key: "ALL" | TaskStatus; label: string }> = [
    { key: "ALL", label: `All ${statusCounts.total}` },
    { key: "COMPLETED", label: `Completed ${statusCounts.COMPLETED}` },
    { key: "IN_PROGRESS", label: `In progress ${statusCounts.IN_PROGRESS}` },
    {
      key: "AWAITING",
      label: `Awaiting supervision ${statusCounts.AWAITING}`,
    },
    { key: "FAILED", label: `Failed ${statusCounts.FAILED}` },
  ];

  return (
    <Card
      sx={{
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ p: 1.5 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          All tasks
        </Typography>

        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          sx={{ flexWrap: "wrap", gap: 1 }}
          alignItems={{ xs: "flex-start", sm: "center" }}
        >
          {statusFilters.map((filter) => (
            <Chip
              key={filter.key}
              label={filter.label}
              size="small"
              onClick={() => {
                setStatusFilter(filter.key);
                setTasksPage(1);
              }}
              color={statusFilter === filter.key ? "primary" : "default"}
              variant="outlined"
              sx={{ fontWeight: 600 }}
            />
          ))}

          <FormControl sx={{ width: 150 }}>
            <Select
              size="small"
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setTasksPage(1);
              }}
            >
              <MenuItem value="ALL">All agents</MenuItem>
              {(agents ?? []).map((agent) => (
                <MenuItem key={agent.id} value={agent.id}>
                  {agent.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Stack>

      <Box sx={{ overflowX: "auto" }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Task</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Started</TableCell>
              <TableCell>Duration</TableCell>
              <TableCell align="right">Tokens</TableCell>
              <TableCell />
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTasks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <Iconify
                      icon="solar:clipboard-list-line-duotone"
                      width={40}
                      sx={{ color: "text.disabled", mb: 1 }}
                    />
                    <Typography variant="body2" color="text.disabled">
                      No tasks found for this filter
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              pagedTasks.map((task) => (
                <TableRow key={task.id} hover>
                  <TableCell sx={{ maxWidth: 200 }}>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {task.description}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{task.agent}</Typography>
                  </TableCell>
                  <TableCell>
                    <StatusChip status={task.status} />
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {task.startedAt}
                  </TableCell>
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {task.duration}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    {formatTokens(task.tokens)}
                  </TableCell>
                  <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                    {task.status === "FAILED" && (
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => goToTask(task.agentId, task.id)}
                      >
                        View task
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

      {filteredTasks.length > TASKS_PER_PAGE && (
        <Stack alignItems="center" sx={{ py: 1.5 }}>
          <Pagination
            count={tasksPageCount}
            page={tasksPage}
            onChange={(_, value) => setTasksPage(value)}
          />
        </Stack>
      )}

      {agentDrawerOpen && (
        <AgentDrawer
          open={agentDrawerOpen}
          onClose={() => {
            setAgentDrawerOpen(false);
            setSelectedAgent(null);
            setSelectedTaskId(null);
          }}
          agent={selectedAgent}
          initialTab="tasks"
          initialTaskId={selectedTaskId}
          allAgentIds={(agents ?? []).map((a) => a.id)}
        />
      )}
    </Card>
  );
}

export default TasksTableWidget;
