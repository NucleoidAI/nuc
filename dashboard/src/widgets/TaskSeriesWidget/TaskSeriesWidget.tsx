import Chart from "react-apexcharts";
import dayjs from "dayjs";
import useAgents from "../../hooks/useAgents";
import { useChart } from "@canmingir/link/platform/components";
import { useMemo } from "react";
import useTaskStats from "../../hooks/useTaskStats";
import { useTheme } from "@mui/material/styles";

import { Card, MenuItem, Select, Stack, Typography } from "@mui/material";

function TaskSeriesWidget({
  range,
  selectedAgentId,
  onSelectAgent,
}: {
  range: { from: string; to: string };
  selectedAgentId: string;
  onSelectAgent: (agentId: string) => void;
}) {
  const theme = useTheme();
  const { getTeamAgents } = useAgents();
  const { agents } = getTeamAgents();
  const { getDailyTrend } = useTaskStats();

  const { trend: taskTrend } = getDailyTrend({
    agentId: selectedAgentId === "team" ? undefined : selectedAgentId,
    from: range.from,
    to: range.to,
  });

  const trendDays = useMemo(() => {
    const start = dayjs(range.from).startOf("day");
    const end = dayjs(range.to).startOf("day");
    const days: string[] = [];

    for (
      let cursor = start;
      cursor.isBefore(end) || cursor.isSame(end);
      cursor = cursor.add(1, "day")
    ) {
      days.push(cursor.format("YYYY-MM-DD"));
    }

    return days;
  }, [range.from, range.to]);

  const trendSeries = useMemo(() => {
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
        data: trendDays.map((day) => completedByDay.get(day) ?? 0),
      },
      {
        name: "Failed",
        data: trendDays.map((day) => failedByDay.get(day) ?? 0),
      },
    ];
  }, [taskTrend, trendDays]);

  const trendOptions = useChart({
    chart: { stacked: false },
    colors: [theme.palette.success.main, theme.palette.error.main],
    xaxis: { categories: trendDays },
    yaxis: { tickAmount: 4 },
    legend: { show: false },
    stroke: { width: 2, curve: "smooth" },
    markers: { size: 0, hover: { size: 5 } },
  });

  return (
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
          value={selectedAgentId}
          onChange={(e) => onSelectAgent(e.target.value)}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="team">Team</MenuItem>
          {(agents ?? []).map((agent) => (
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
  );
}

export default TaskSeriesWidget;
