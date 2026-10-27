import AgentDonutCard from "./AgentDonutCard";
import Chart from "react-apexcharts";
import dayjs from "dayjs";
import { fDateTime } from "../../utils/formatTime";
import { resolveTimeRange } from "../../utils/resolveTimeRange";
import useAgents from "../../hooks/useAgents";
import useLLMLogs from "../../hooks/useLLMLogs";
import useTaskStats from "../../hooks/useTaskStats";
import { useTeamTasks } from "../../hooks/useTasks";
import { useTheme } from "@mui/material/styles";
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
  TextField,
  Typography,
} from "@mui/material";
import { Iconify, useChart } from "@canmingir/link/platform/components";
import { useMemo, useState } from "react";

const ROWS_PER_PAGE = 7;

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

type LogStatus = "COMPLETED" | "FAILED" | "IN_PROGRESS";

const STATUS_LABEL: Record<LogStatus, string> = {
  COMPLETED: "Completed",
  FAILED: "Failed",
  IN_PROGRESS: "In progress",
};

const STATUS_COLOR: Record<LogStatus, "success" | "error" | "info"> = {
  COMPLETED: "success",
  FAILED: "error",
  IN_PROGRESS: "info",
};

function StatusChip({ status }: { status: LogStatus }) {
  return (
    <Chip
      label={STATUS_LABEL[status]}
      size="small"
      color={STATUS_COLOR[status]}
      sx={{ fontWeight: 600 }}
    />
  );
}

function MonitoringWidget() {
  const theme = useTheme();
  const { getTeamAgents } = useAgents();
  const { agents } = getTeamAgents();
  const { getDailyTrend } = useTaskStats();
  const { getUsageByTeam } = useLLMLogs();

  const [range, setRange] = useState<string>("Last 7 days");
  const [statusFilter, setStatusFilter] = useState<"ALL" | LogStatus>("ALL");
  const [agentFilter, setAgentFilter] = useState<string>("ALL");
  const [page, setPage] = useState(1);
  const [trendScope, setTrendScope] = useState<string>("team");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const resolvedRange = useMemo(
    () => resolveTimeRange(range, { from: customFrom, to: customTo }),
    [range, customFrom, customTo]
  );

  const { tasks } = useTeamTasks(resolvedRange);
  const { usage } = getUsageByTeam(resolvedRange);

  const breakdownByAgent = useMemo(() => {
    const map = new Map<
      string,
      { total: number; completed: number; failed: number; inProgress: number }
    >();

    tasks.forEach((task) => {
      const entry = map.get(task.agentId) ?? {
        total: 0,
        completed: 0,
        failed: 0,
        inProgress: 0,
      };
      entry.total += 1;
      if (task.effectiveStatus === "COMPLETED") entry.completed += 1;
      else if (task.effectiveStatus === "FAILED") entry.failed += 1;
      else entry.inProgress += 1;
      map.set(task.agentId, entry);
    });

    return map;
  }, [tasks]);

  const mockTeamBreakdown = useMemo(() => {
    const totals = { total: 0, completed: 0, failed: 0, inProgress: 0 };
    breakdownByAgent.forEach((entry) => {
      totals.total += entry.total;
      totals.completed += entry.completed;
      totals.failed += entry.failed;
      totals.inProgress += entry.inProgress;
    });
    return { id: "team", name: "Team", ...totals };
  }, [breakdownByAgent]);

  const mockAgentBreakdowns = useMemo(
    () =>
      (agents ?? []).map((agent) => {
        const entry = breakdownByAgent.get(agent.id) ?? {
          total: 0,
          completed: 0,
          failed: 0,
          inProgress: 0,
        };
        return { id: agent.id, name: agent.name, ...entry };
      }),
    [agents, breakdownByAgent]
  );

  const selectedAgentBreakdown =
    trendScope === "team"
      ? null
      : mockAgentBreakdowns.find((agent) => agent.id === trendScope) ?? null;

  const { trend: taskTrend } = getDailyTrend({
    agentId: trendScope === "team" ? undefined : trendScope,
    from: resolvedRange.from,
    to: resolvedRange.to,
  });

  const trendDays = useMemo(() => {
    const start = dayjs(resolvedRange.from).startOf("day");
    const end = dayjs(resolvedRange.to).startOf("day");
    const days: string[] = [];

    for (
      let cursor = start;
      cursor.isBefore(end) || cursor.isSame(end);
      cursor = cursor.add(1, "day")
    ) {
      days.push(cursor.format("YYYY-MM-DD"));
    }

    return days;
  }, [resolvedRange.from, resolvedRange.to]);

  const trendOptions = useChart({
    chart: { stacked: false },
    colors: [theme.palette.success.main, theme.palette.error.main],
    xaxis: { categories: trendDays },
    yaxis: { tickAmount: 4 },
    legend: { show: false },
    stroke: { width: 2, curve: "smooth" },
    markers: { size: 0, hover: { size: 5 } },
  });

  const trendSeries = useMemo(() => {
    const days = trendDays;
    const completedByDay = new Map(
      taskTrend
        .filter((r) => r.status === "COMPLETED")
        .map((r) => [r.day, r.count])
    );
    const failedByDay = new Map(
      taskTrend
        .filter((r) => r.status === "FAILED")
        .map((r) => [r.day, r.count])
    );

    return [
      {
        name: "Completed",
        data: days.map((day) => completedByDay.get(day) ?? 0),
      },
      { name: "Failed", data: days.map((day) => failedByDay.get(day) ?? 0) },
    ];
  }, [taskTrend, trendDays]);

  const agentNameById = useMemo(() => {
    const map = new Map<string, string>();
    (agents ?? []).forEach((agent) => map.set(agent.id, agent.name));
    return map;
  }, [agents]);

  const logs = useMemo(() => {
    return usage.map((item) => ({
      id: item.task.id,
      time: fDateTime(item.task.createdAt, "DD MMM, HH:mm"),
      agent: agentNameById.get(item.task.agentId ?? "") ?? item.task.agentId,
      agentId: item.task.agentId,
      task: item.task.description,
      note: item.task.status === "FAILED" ? item.task.comment : null,
      status: item.task.status as LogStatus,
      duration: `${(
        item.logs.reduce((sum, log) => sum + (log.durationMs ?? 0), 0) / 1000
      ).toFixed(1)}s`,
      tokens: item.totals.totalTokens,
    }));
  }, [usage, agentNameById]);

  const filteredLogs = useMemo(() => {
    return logs
      .filter((log) => statusFilter === "ALL" || log.status === statusFilter)
      .filter((log) => agentFilter === "ALL" || log.agentId === agentFilter);
  }, [logs, statusFilter, agentFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredLogs.length / ROWS_PER_PAGE));
  const pagedLogs = filteredLogs.slice(
    (page - 1) * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE
  );

  const logCountsByStatus = useMemo(() => {
    const counts: Record<LogStatus, number> = {
      COMPLETED: 0,
      FAILED: 0,
      IN_PROGRESS: 0,
    };
    logs.forEach((log) => {
      counts[log.status] += 1;
    });
    return counts;
  }, [logs]);

  const statusFilters: Array<{ key: "ALL" | LogStatus; label: string }> = [
    { key: "ALL", label: `All ${logs.length}` },
    { key: "COMPLETED", label: `Completed ${logCountsByStatus.COMPLETED}` },
    { key: "FAILED", label: `Failed ${logCountsByStatus.FAILED}` },
    {
      key: "IN_PROGRESS",
      label: `In progress ${logCountsByStatus.IN_PROGRESS}`,
    },
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
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap", gap: 1 }}>
          {TIME_RANGES.map((option) => (
            <Button
              key={option}
              size="small"
              onClick={() => setRange(option)}
              variant={range === option ? "contained" : "outlined"}
              sx={{ fontWeight: 600, textTransform: "none" }}
            >
              {option}
            </Button>
          ))}
        </Stack>

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

      <Card
        sx={{
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          p: 1,
        }}
      >
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          sx={{ px: 1 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Tasks per day
          </Typography>

          <Select
            size="small"
            value={trendScope}
            onChange={(e) => setTrendScope(e.target.value)}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="team">Team</MenuItem>
            {mockAgentBreakdowns.map((agent) => (
              <MenuItem key={agent.id} value={agent.id}>
                {agent.name}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Chart
          dir="ltr"
          type="line"
          series={trendSeries}
          options={trendOptions}
          height={350}
        />
      </Card>

      <Stack
        direction={{ xs: "column", md: "row" }}
        spacing={1}
        sx={{ alignItems: "stretch" }}
      >
        <AgentDonutCard breakdown={mockTeamBreakdown} />
        {selectedAgentBreakdown && (
          <AgentDonutCard breakdown={selectedAgentBreakdown} />
        )}
      </Stack>

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
          sx={{ p: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Log
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
                  setPage(1);
                }}
                color={statusFilter === filter.key ? "primary" : "default"}
                variant={statusFilter === filter.key ? "filled" : "outlined"}
                sx={{ fontWeight: 600 }}
              />
            ))}

            <FormControl sx={{ width: 150 }}>
              <Select
                value={agentFilter}
                onChange={(e) => {
                  setAgentFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="ALL">All agents</MenuItem>
                {mockAgentBreakdowns.map((agent) => (
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
                <TableCell>Time</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Task</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Duration</TableCell>
                <TableCell align="right">Tokens</TableCell>
                <TableCell />
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7}>
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Iconify
                        icon="solar:clipboard-list-line-duotone"
                        width={40}
                        sx={{ color: "text.disabled", mb: 1 }}
                      />
                      <Typography variant="body2" color="text.disabled">
                        No log entries found for this filter
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                pagedLogs.map((log) => (
                  <TableRow key={log.id} hover>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {log.time}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{log.agent}</Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 420 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {log.task}
                      </Typography>
                      {log.note && (
                        <Typography variant="caption" color="error.main">
                          {log.note}
                        </Typography>
                      )}
                    </TableCell>
                    <TableCell>
                      <StatusChip status={log.status} />
                    </TableCell>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {log.duration}
                    </TableCell>
                    <TableCell align="right" sx={{ fontWeight: 600 }}>
                      {log.tokens.toLocaleString()}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {log.status === "FAILED" && (
                        <Button size="small" variant="outlined">
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

        {filteredLogs.length > 0 && (
          <Stack alignItems="center" sx={{ py: 2 }}>
            <Pagination
              count={pageCount}
              page={page}
              onChange={(_, value) => setPage(value)}
            />
          </Stack>
        )}
      </Card>
    </Stack>
  );
}

export default MonitoringWidget;
