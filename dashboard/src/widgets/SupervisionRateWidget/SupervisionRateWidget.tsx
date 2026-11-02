import Chart from "react-apexcharts";
import { useChart } from "@canmingir/link/platform/components";

import { Box, Card, Divider, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const PALETTE_KEYS = [
  "primary",
  "info",
  "warning",
  "success",
  "error",
] as const;

const MAX_ROWS_PER_COLUMN = 5;

function SupervisionRateWidget({
  totalRequests,
  totalTasks,
  waiting,
  agentShares,
}: {
  totalRequests: number;
  totalTasks: number;
  waiting: number;
  agentShares: { agent: string; requests: number }[];
}) {
  const theme = useTheme();

  const supervisionRate = totalTasks ? (totalRequests / totalTasks) * 100 : 0;

  const colors = agentShares.map((_, index) => {
    const key = PALETTE_KEYS[index % PALETTE_KEYS.length];
    const base = theme.palette[key].main;
    return index < PALETTE_KEYS.length ? base : alpha(base, 0.5);
  });

  const chartOptions = useChart({
    labels: agentShares.map((item) => item.agent),
    colors,
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
        formatter: (value: number) => `${value} requests`,
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
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={3}
        alignItems="center"
      >
        <Stack
          direction="row"
          spacing={2}
          alignItems="center"
          sx={{ flex: 1, minWidth: 0 }}
        >
          <Box
            sx={{
              position: "relative",
              width: 180,
              height: 180,
              flexShrink: 0,
            }}
          >
            {totalRequests > 0 ? (
              <Chart
                dir="ltr"
                type="donut"
                series={agentShares.map((item) => item.requests)}
                options={chartOptions}
                width="100%"
                height="100%"
              />
            ) : (
              <Box
                sx={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  border: "8px solid",
                  borderColor: "divider",
                }}
              />
            )}
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
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {supervisionRate.toFixed(0)}%
              </Typography>
            </Box>
          </Box>

          <Stack spacing={0.75} sx={{ minWidth: 0 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
              Supervision
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {totalRequests} requests in {totalTasks} tasks
            </Typography>

            <Box
              sx={{
                mt: 0.5,
                display: "grid",
                gridTemplateRows: `repeat(${Math.min(
                  agentShares.length,
                  MAX_ROWS_PER_COLUMN
                )}, auto)`,
                gridAutoFlow: "column",
                columnGap: 2,
                rowGap: 0.5,
              }}
            >
              {agentShares.map((item, index) => (
                <Stack
                  key={item.agent}
                  direction="row"
                  spacing={0.75}
                  alignItems="center"
                  sx={{ minWidth: 0 }}
                >
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      bgcolor: colors[index],
                      flexShrink: 0,
                    }}
                  />
                  <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                    {item.agent}
                  </Typography>
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    noWrap
                    sx={{ flexShrink: 0 }}
                  >
                    {item.requests} requests
                  </Typography>
                </Stack>
              ))}
            </Box>
          </Stack>
        </Stack>

        <Divider
          orientation="vertical"
          flexItem
          sx={{ display: { xs: "none", sm: "block" } }}
        />

        <Stack alignItems="center" sx={{ minWidth: 100 }}>
          <Typography
            variant="h3"
            color="primary.main"
            sx={{ fontWeight: 700 }}
          >
            {waiting}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            waiting
          </Typography>
        </Stack>
      </Stack>
    </Card>
  );
}

export default SupervisionRateWidget;
