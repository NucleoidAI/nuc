import AgentDrawer from "../../components/AgentDrawer/AgentDrawer";
import Chart from "react-apexcharts";
import SupervisionSummaryCard from "./SupervisionSummaryCard";
import { fElapsed } from "../../utils/formatTime";
import { resolveTimeRange } from "../../utils/resolveTimeRange";
import useAgents from "../../hooks/useAgents";
import useSupervisingStats from "../../hooks/useSupervisingStats";
import useSupervisings from "../../hooks/useSupervisings";
import useTaskStats from "../../hooks/useTaskStats";
import { useTheme } from "@mui/material/styles";

import {
  Box,
  Button,
  Card,
  Chip,
  MenuItem,
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

const TIME_RANGES = [
  "Last hour",
  "Last 24 hours",
  "Today",
  "Yesterday",
  "Last 7 days",
  "Last 30 days",
  "This month",
  "Custom",
];

function OperationWidget() {
  const theme = useTheme();
  const { getTeamAgents } = useAgents();
  const { agents } = getTeamAgents();
  const { getTeamSupervisingByStatus } = useSupervisings();
  const { getDailyRate } = useSupervisingStats();
  const { getDailyTrend } = useTaskStats();

  const [scope, setScope] = useState<"TEAM" | "AGENT">("TEAM");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
  const [trendScope, setTrendScope] = useState<string>("Team");
  const [dateRange, setDateRange] = useState<string>("Last 7 days");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const range = useMemo(
    () => resolveTimeRange(dateRange, { from: customFrom, to: customTo }),
    [dateRange, customFrom, customTo]
  );

  const agentById = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    (agents ?? []).forEach((agent) => map.set(agent.id, agent));
    return map;
  }, [agents]);

  const { supervisings } = getTeamSupervisingByStatus("IN_PROGRESS", range);

  const pending = useMemo(() => {
    return (supervisings ?? []).map(
      (item: {
        id: string;
        question: string;
        agentId: string;
        createdAt: string;
        status: "IN_PROGRESS" | "ANSWERED";
      }) => {
        const agent = agentById.get(item.agentId);
        return {
          id: item.id,
          task: item.question,
          agent: agent?.name ?? item.agentId,
          agentId: item.agentId,
          waiting: fElapsed(item.createdAt),
          step: "",
        };
      }
    );
  }, [supervisings, agentById]);

  const goToSupervising = (agentId: string) => {
    const agent = (agents ?? []).find((a) => a.id === agentId);
    if (!agent) return;

    setSelectedAgent(agent);
    setAgentDrawerOpen(true);
  };

  const agentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    pending.forEach((item) => {
      counts.set(item.agent, (counts.get(item.agent) ?? 0) + 1);
    });
    return counts;
  }, [pending]);

  const agentOptions = useMemo(
    () => Array.from(agentCounts.keys()),
    [agentCounts]
  );

  const filteredPending = useMemo(
    () =>
      scope === "TEAM" || !agentFilter
        ? pending
        : pending.filter((item) => item.agent === agentFilter),
    [pending, scope, agentFilter]
  );

  const { trend: taskTrend } = getDailyTrend({
    from: range.from,
    to: range.to,
  });

  const totalTasks = useMemo(
    () => taskTrend.reduce((sum, row) => sum + row.count, 0),
    [taskTrend]
  );

  const agentShares = useMemo(
    () =>
      agentOptions.map((agent) => ({
        agent,
        requests: agentCounts.get(agent) ?? 0,
      })),
    [agentOptions, agentCounts]
  );

  const trendScopeOptions = useMemo(
    () => ["Team", ...agentOptions],
    [agentOptions]
  );

  const trendAgentId =
    trendScope === "Team"
      ? undefined
      : (agents ?? []).find((a) => a.name === trendScope)?.id;

  const { trend: supervisionTrend } = getDailyRate({
    agentId: trendAgentId,
    from: range.from,
    to: range.to,
  });

  const trendSeries = [
    {
      name: trendScope,
      data: supervisionTrend.map((row) => Math.round(row.rate)),
    },
  ];

  const trendOptions = useChart({
    colors: [theme.palette.primary.main],
    xaxis: {
      categories: supervisionTrend.map((row) => row.day),
    },
    yaxis: {
      tickAmount: 5,
      min: 0,
      max: 100,
      labels: { formatter: (value: number) => `${value}%` },
    },
    stroke: { width: 2, curve: "smooth" },
    markers: { size: 3, hover: { size: 5 } },
    tooltip: {
      y: {
        formatter: (value: number) => `${value}%`,
      },
    },
  });

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
              onClick={() => setDateRange(option)}
              variant={dateRange === option ? "contained" : "outlined"}
              sx={{ fontWeight: 600, textTransform: "none" }}
            >
              {option}
            </Button>
          ))}
        </Stack>

        {dateRange === "Custom" && (
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

      <SupervisionSummaryCard
        totalRequests={pending.length}
        totalTasks={totalTasks}
        waiting={pending.length}
        agentShares={agentShares}
      />

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
          sx={{ px: 1, pt: 1 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Supervision rate per day
          </Typography>

          <Select
            size="small"
            value={trendScope}
            onChange={(e) => {
              const value = e.target.value;
              setTrendScope(value);
              if (value !== "Team") {
                const agent = (agents ?? []).find((a) => a.name === value);
                if (agent) {
                  setSelectedAgent(agent);
                }
              }
            }}
            sx={{ minWidth: 160 }}
            startAdornment={
              trendScope !== "Team" ? (
                <Box
                  sx={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    bgcolor: "primary.main",
                    mr: 1,
                  }}
                />
              ) : undefined
            }
          >
            {trendScopeOptions.map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Chart
          dir="ltr"
          type="line"
          series={trendSeries}
          options={trendOptions}
          height={300}
        />
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
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1.5}
          sx={{ p: 2 }}
        >
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Waiting for a decision
          </Typography>

          <Select
            size="small"
            value={agentFilter || "TEAM"}
            onChange={(e) => {
              const value = e.target.value;
              if (value === "TEAM") {
                setScope("TEAM");
                setAgentFilter("");
              } else {
                setScope("AGENT");
                setAgentFilter(value);
              }
            }}
            sx={{ minWidth: 180 }}
          >
            <MenuItem value="TEAM">Team</MenuItem>
            {agentOptions.map((agent) => (
              <MenuItem key={agent} value={agent}>
                {agent} ({agentCounts.get(agent)})
              </MenuItem>
            ))}
          </Select>
        </Stack>

        <Box
          sx={{
            overflowX: "auto",
            overflowY: "auto",
            height: "calc(100vh - 500px)",
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Waiting</TableCell>
                <TableCell>Agent</TableCell>
                <TableCell>Task</TableCell>
                <TableCell align="right">Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredPending.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Box sx={{ py: 6, textAlign: "center" }}>
                      <Iconify
                        icon="solar:shield-check-line-duotone"
                        width={40}
                        sx={{ color: "text.disabled", mb: 1 }}
                      />
                      <Typography variant="body2" color="text.disabled">
                        Nothing is waiting for a decision
                      </Typography>
                    </Box>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPending.map((item) => (
                  <TableRow
                    key={item.id}
                    hover
                    onClick={() => goToSupervising(item.agentId)}
                    sx={{ cursor: "pointer" }}
                  >
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {item.waiting}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.agent}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ maxWidth: 480 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {item.task}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Stack
                        direction="row"
                        spacing={1}
                        justifyContent="flex-end"
                        alignItems="center"
                      >
                        <Chip
                          label="Supervision"
                          size="small"
                          color="warning"
                          sx={{ fontWeight: 600 }}
                        />
                        {/* <Button
                          size="small"
                          variant="contained"
                          disableElevation
                          sx={{
                            bgcolor: "text.primary",
                            color: "background.paper",
                            "&:hover": { bgcolor: "text.primary" },
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            goToSupervising(item.agentId);
                          }}
                        >
                          Review
                        </Button> */}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Box>
      </Card>

      {agentDrawerOpen && (
        <AgentDrawer
          open={agentDrawerOpen}
          onClose={() => {
            setAgentDrawerOpen(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          initialTab="supervisings"
          allAgentIds={(agents ?? []).map((a) => a.id)}
        />
      )}
    </Stack>
  );
}

export default OperationWidget;
