import { Iconify } from "@canmingir/link/platform/components";
import { fDateTime } from "../../utils/formatTime";
import { resolveTimeRange } from "../../utils/resolveTimeRange";
import useAgents from "../../hooks/useAgents";
import useLLMLogs from "../../hooks/useLLMLogs";
import { useTeamTasks } from "../../hooks/useTasks";

import {
  Box,
  Card,
  Chip,
  LinearProgress,
  Pagination,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

type TaskStatus = "COMPLETED" | "IN_PROGRESS" | "AWAITING" | "FAILED";

export const TIME_RANGES = [
  "Last hour",
  "Last 24 hours",
  "Today",
  "Yesterday",
  "Last 7 days",
  "Last 30 days",
  "This month",
  "Custom",
] as const;

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

const AGENTS_PER_PAGE = 10;
const TASKS_PER_PAGE = 10;

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="body2" color="text.secondary" noWrap>
        {label}
      </Typography>
      <Typography variant="h5" noWrap sx={{ mt: 0.5, fontWeight: 700 }}>
        {value}
      </Typography>
    </Card>
  );
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

function ReportsWidget() {
  const [range, setRange] = useState<string>("Last 7 days");
  const [statusFilter, setStatusFilter] = useState<"ALL" | TaskStatus>("ALL");
  const [agentsPage, setAgentsPage] = useState(1);
  const [tasksPage, setTasksPage] = useState(1);
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const { getTeamAgents } = useAgents();
  const { agents } = getTeamAgents();
  const { getUsageByTeam } = useLLMLogs();

  const resolvedRange = useMemo(
    () => resolveTimeRange(range, { from: customFrom, to: customTo }),
    [range, customFrom, customTo]
  );

  const { tasks } = useTeamTasks(resolvedRange);
  const { usage } = getUsageByTeam(resolvedRange);

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

  const mockAgents: {
    id: string;
    name: string;
    totalTasks: number;
    completed: number;
    inProgress: number;
    awaiting: number;
    failed: number;
    tokens: number;
  }[] = useMemo(() => {
    const byAgent = new Map<
      string,
      Omit<
        {
          id: string;
          name: string;
          totalTasks: number;
          completed: number;
          inProgress: number;
          awaiting: number;
          failed: number;
          tokens: number;
        },
        "id" | "name"
      >
    >();

    tasks.forEach((task) => {
      const entry = byAgent.get(task.agentId) ?? {
        totalTasks: 0,
        completed: 0,
        inProgress: 0,
        awaiting: 0,
        failed: 0,
        tokens: 0,
      };
      entry.totalTasks += 1;
      if (task.effectiveStatus === "COMPLETED") entry.completed += 1;
      else if (task.effectiveStatus === "FAILED") entry.failed += 1;
      else if (task.effectiveStatus === "AWAITING") entry.awaiting += 1;
      else entry.inProgress += 1;
      entry.tokens += usageByTaskId.get(task.id)?.tokens ?? 0;
      byAgent.set(task.agentId, entry);
    });

    return (agents ?? [])
      .map((agent) => {
        const entry = byAgent.get(agent.id);
        if (!entry) return null;
        return { id: agent.id, name: agent.name, ...entry };
      })
      .filter(
        (
          agent
        ): agent is {
          id: string;
          name: string;
          totalTasks: number;
          completed: number;
          inProgress: number;
          awaiting: number;
          failed: number;
          tokens: number;
        } => agent !== null
      );
  }, [tasks, agents, usageByTaskId]);

  const mockTasks: {
    id: string;
    description: string;
    agent: string;
    status: TaskStatus;
    startedAt: string;
    duration: string;
    tokens: number;
  }[] = useMemo(() => {
    return tasks.map((task) => {
      const taskUsage = usageByTaskId.get(task.id);
      return {
        id: task.id,
        description: task.description,
        agent: agentNameById.get(task.agentId) ?? task.agentId,
        status: task.effectiveStatus,
        startedAt: fDateTime(task.createdAt, "DD MMM, HH:mm") ?? "",
        duration: taskUsage
          ? `${(taskUsage.durationMs / 1000).toFixed(1)}s`
          : "-",
        tokens: taskUsage?.tokens ?? 0,
      };
    });
  }, [tasks, agentNameById, usageByTaskId]);

  const totals = useMemo(() => {
    return mockAgents.reduce(
      (acc, agent) => ({
        total: acc.total + agent.totalTasks,
        completed: acc.completed + agent.completed,
        inProgress: acc.inProgress + agent.inProgress,
        awaiting: acc.awaiting + agent.awaiting,
        failed: acc.failed + agent.failed,
        tokens: acc.tokens + agent.tokens,
      }),
      {
        total: 0,
        completed: 0,
        inProgress: 0,
        awaiting: 0,
        failed: 0,
        tokens: 0,
      }
    );
  }, [mockAgents]);

  const filteredTasks: {
    id: string;
    description: string;
    agent: string;
    status: TaskStatus;
    startedAt: string;
    duration: string;
    tokens: number;
  }[] = useMemo(() => {
    if (statusFilter === "ALL") return mockTasks;
    return mockTasks.filter((task) => task.status === statusFilter);
  }, [mockTasks, statusFilter]);

  const agentsPageCount = Math.max(
    1,
    Math.ceil(mockAgents.length / AGENTS_PER_PAGE)
  );
  const pagedAgents = mockAgents.slice(
    (agentsPage - 1) * AGENTS_PER_PAGE,
    agentsPage * AGENTS_PER_PAGE
  );

  const tasksPageCount = Math.max(
    1,
    Math.ceil(filteredTasks.length / TASKS_PER_PAGE)
  );
  const pagedTasks = filteredTasks.slice(
    (tasksPage - 1) * TASKS_PER_PAGE,
    tasksPage * TASKS_PER_PAGE
  );

  const statusFilters: Array<{
    key: "ALL" | TaskStatus;
    label: string;
    count: number;
  }> = [
    { key: "ALL", label: `All ${totals.total}`, count: totals.total },
    {
      key: "COMPLETED",
      label: `Completed ${totals.completed}`,
      count: totals.completed,
    },
    {
      key: "IN_PROGRESS",
      label: `In progress ${totals.inProgress}`,
      count: totals.inProgress,
    },
    {
      key: "AWAITING",
      label: `Awaiting supervision ${totals.awaiting}`,
      count: totals.awaiting,
    },
    { key: "FAILED", label: `Failed ${totals.failed}`, count: totals.failed },
  ];

  return (
    <Stack spacing={2}>
      <Card
        sx={{
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          p: 1,
        }}
      >
        <Tabs
          value={range}
          onChange={(_, value) => setRange(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            minHeight: 36,
            "& .MuiTab-root": {
              minHeight: 36,
              textTransform: "none",
              fontWeight: 600,
              px: 1.5,
            },
          }}
        >
          {TIME_RANGES.map((option) => (
            <Tab key={option} value={option} label={option} disableRipple />
          ))}
        </Tabs>

        {range === "Custom" && (
          <Stack
            direction="row"
            spacing={1}
            sx={{ flexWrap: "wrap", gap: 1, mt: 1 }}
          >
            <TextField
              type="date"
              size="small"
              label="From"
              slotProps={{ inputLabel: { shrink: true } }}
              value={customFrom}
              onChange={(e) => setCustomFrom(e.target.value)}
            />
            <TextField
              type="date"
              size="small"
              label="To"
              slotProps={{ inputLabel: { shrink: true } }}
              value={customTo}
              onChange={(e) => setCustomTo(e.target.value)}
            />
          </Stack>
        )}
      </Card>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(6, 1fr)",
          },
          gap: 1,
        }}
      >
        <SummaryCard
          label="Total tasks"
          value={totals.total.toLocaleString()}
        />
        <SummaryCard
          label="Completed"
          value={totals.completed.toLocaleString()}
        />
        <SummaryCard
          label="In progress"
          value={totals.inProgress.toLocaleString()}
        />
        <SummaryCard
          label="Awaiting supervision"
          value={totals.awaiting.toLocaleString()}
        />
        <SummaryCard label="Failed" value={totals.failed.toLocaleString()} />
        <SummaryCard label="Tokens used" value={formatTokens(totals.tokens)} />
      </Box>

      <Card
        sx={{
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 1.5, pb: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Agents overview
          </Typography>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Agent</TableCell>
                <TableCell align="right">Total tasks</TableCell>
                <TableCell align="right">Completed</TableCell>
                <TableCell align="right">In progress</TableCell>
                <TableCell align="right">Awaiting supervision</TableCell>
                <TableCell align="right">Failed</TableCell>
                <TableCell align="right">Failure rate</TableCell>
                <TableCell align="right">Tokens</TableCell>
                <TableCell sx={{ minWidth: 160 }}>Token share</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedAgents.map((agent) => {
                const failureRate = agent.totalTasks
                  ? (agent.failed / agent.totalTasks) * 100
                  : 0;
                const tokenShare = totals.tokens
                  ? (agent.tokens / totals.tokens) * 100
                  : 0;

                return (
                  <TableRow key={agent.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {agent.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{agent.totalTasks}</TableCell>
                    <TableCell align="right">{agent.completed}</TableCell>
                    <TableCell align="right">{agent.inProgress}</TableCell>
                    <TableCell align="right">{agent.awaiting}</TableCell>
                    <TableCell align="right">{agent.failed}</TableCell>
                    <TableCell align="right">
                      {failureRate.toFixed(1)}%
                    </TableCell>
                    <TableCell align="right">
                      {formatTokens(agent.tokens)}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress
                          variant="determinate"
                          value={tokenShare}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 1,
                            bgcolor: "action.hover",
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ minWidth: 40, textAlign: "right" }}
                        >
                          {tokenShare.toFixed(1)}%
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow sx={{ bgcolor: "background.default" }}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Team total
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {totals.total}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {totals.completed}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {totals.inProgress}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {totals.awaiting}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {totals.failed}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {totals.total
                    ? ((totals.failed / totals.total) * 100).toFixed(1)
                    : "0.0"}
                  %
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatTokens(totals.tokens)}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {mockAgents.length > AGENTS_PER_PAGE && (
          <Stack alignItems="center" sx={{ py: 1.5 }}>
            <Pagination
              count={agentsPageCount}
              page={agentsPage}
              onChange={(_, value) => setAgentsPage(value)}
            />
          </Stack>
        )}
      </Card>

      <Card
        sx={{
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Stack
          direction="column"
          alignItems="start"
          justifyContent="space-between"
          spacing={2}
          sx={{ p: 1.5 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            All tasks
          </Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
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
                variant={"outlined"}
                sx={{ fontWeight: 600 }}
              />
            ))}
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
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6}>
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
      </Card>
    </Stack>
  );
}

export default ReportsWidget;
