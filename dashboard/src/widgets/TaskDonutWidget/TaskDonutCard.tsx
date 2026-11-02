import Chart from "react-apexcharts";

import { useChart } from "@canmingir/link/platform/components";
import { useTheme } from "@mui/material/styles";
import { Box, Card, Stack, Typography } from "@mui/material";

function TaskDonutCard({
  breakdown,
}: {
  breakdown: {
    id: string;
    name: string;
    total: number;
    completed: number;
    failed: number;
    inProgress: number;
  };
}) {
  const theme = useTheme();

  const { total, completed, failed, inProgress } = breakdown;
  const completedPct = total ? (completed / total) * 100 : 0;
  const failedPct = total ? (failed / total) * 100 : 0;
  const inProgressPct = total ? (inProgress / total) * 100 : 0;

  const chartOptions = useChart({
    labels: ["Completed", "Failed", "In progress"],
    colors: [
      theme.palette.success.main,
      theme.palette.error.main,
      theme.palette.info.main,
    ],
    legend: { show: false },
    stroke: { width: 0 },
    dataLabels: { enabled: false },
    plotOptions: {
      pie: {
        donut: {
          size: "65%",
          labels: { show: false },
        },
      },
    },
    tooltip: {
      y: {
        formatter: (value: number) => `${value}`,
      },
    },
  });

  return (
    <Card
      sx={{
        p: 2,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        flex: 1,
        minWidth: 0,
      }}
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Box
          sx={{ position: "relative", width: 200, height: 200, flexShrink: 0 }}
        >
          <Chart
            dir="ltr"
            type="donut"
            series={[completed, failed, inProgress]}
            options={chartOptions}
            width="100%"
            height="100%"
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              {completedPct.toFixed(1)}%
            </Typography>
          </Box>
        </Box>

        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }} noWrap>
            {breakdown.name} · {total} tasks
          </Typography>

          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "success.main",
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {completed} · {completedPct.toFixed(1)}%
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "error.main",
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              Failed
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {failed} · {failedPct.toFixed(1)}%
            </Typography>
          </Stack>

          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              sx={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                bgcolor: "info.main",
                flexShrink: 0,
              }}
            />
            <Typography variant="caption" color="text.secondary">
              In progress
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 600 }}>
              {inProgress} · {inProgressPct.toFixed(1)}%
            </Typography>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}

export default TaskDonutCard;
