import Chart from "react-apexcharts";
import { useChart } from "@canmingir/link/platform/components";
import useSupervisingStats from "../../hooks/useSupervisingStats";
import { useTheme } from "@mui/material/styles";

import { Box, Card, MenuItem, Select, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";

const SupervisionRateSeries = ({
  agents,
  agentOptions,
  range,
  setSelectedAgent,
}: {
  agents: { id: string; name: string }[];
  agentOptions: string[];
  range: { from: string; to: string };
  setSelectedAgent: (agent: { id: string; name: string }) => void;
}) => {
  const theme = useTheme();
  const [trendScope, setTrendScope] = useState<string>("Team");

  const { getDailyRate } = useSupervisingStats();

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
  );
};

export default SupervisionRateSeries;
