import Card from "@mui/material/Card";
import CardContent from "@mui/material/CardContent";
import CardHeader from "@mui/material/CardHeader";
import Chart from "react-apexcharts";
import React from "react";
import useAgent from "../../hooks/useAgent";
import { useChart } from "@canmingir/link/platform/components";
import { useMediaQuery } from "@mui/material";

function PerformanceChart() {
  const { getAgents } = useAgent();

  const { agents } = getAgents();

  const isSmallScreen = useMediaQuery("(max-width:600px)");

  const agentNames =
    agents?.map((agent) => agent?.name?.replaceAll("_", " ")).filter(Boolean) ??
    [];
  const hasAgents = agentNames.length > 0;
  const names = hasAgents ? agentNames : ["No Activity"];
  const series = hasAgents ? new Array(agentNames.length).fill(1) : [1];

  const chartOptions = useChart({
    labels: names,
    colors: hasAgents
      ? new Array(agentNames.length).fill(undefined)
      : ["#344055"],
    legend: {
      position: "right",
      offsetX: -20,
      offsetY: 64,
      itemMargin: {
        vertical: 8,
      },
      formatter: (seriesName) => seriesName,
    },
    stroke: {
      show: false,
    },
    dataLabels: {
      enabled: true,
      dropShadow: {
        enabled: false,
      },
    },
    tooltip: {
      fillSeriesColor: true,
    },
    plotOptions: {
      pie: {
        donut: {
          labels: {
            show: false,
          },
        },
      },
    },
  });

  return (
    <Card
      key={2}
      style={{
        width: "100%",
        maxWidth: "100%",
        height: "100%",
        maxHeight: isSmallScreen ? "auto" : "600px",
        marginTop: "10px",
      }}
    >
      <CardHeader title="Team Activity" />
      <CardContent>
        <Chart dir="ltr" type="pie" series={series} options={chartOptions} />
      </CardContent>
    </Card>
  );
}
export default PerformanceChart;
