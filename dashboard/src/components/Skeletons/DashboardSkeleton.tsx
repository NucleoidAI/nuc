import PerformanceSkeleton from "./PerformanceSkeleton";
import React from "react";
import { TwoSideLayout } from "@canmingir/link/layouts";

import { Box, Card, Skeleton, Stack } from "@mui/material";

function SummaryWidgetSkeleton() {
  return (
    <Card
      sx={{
        height: "100%",
        display: "flex",
        alignItems: "center",
        p: 2,
      }}
    >
      <Box sx={{ flexGrow: 1 }}>
        <Skeleton variant="text" sx={{ width: "40%", maxWidth: 140 }} />

        <Stack
          direction="row"
          alignItems="center"
          spacing={1}
          sx={{ mt: 2, mb: 1 }}
        >
          <Skeleton variant="circular" sx={{ width: 24, height: 24 }} />
          <Skeleton variant="text" sx={{ width: 42 }} />
        </Stack>

        <Skeleton
          variant="text"
          sx={{ width: "52%", maxWidth: 120, height: 42 }}
        />
      </Box>

      <Box sx={{ width: 80, display: "flex", justifyContent: "center" }}>
        <Skeleton
          variant="rounded"
          sx={{ width: 80, height: 40, borderRadius: 2 }}
        />
      </Box>
    </Card>
  );
}

function TotalMessagesSkeleton() {
  return (
    <Card sx={{ p: 3, borderRadius: 2, mt: "20px" }}>
      <Box
        sx={{
          mb: 3,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
        }}
      >
        <Box sx={{ flexGrow: 1 }}>
          <Skeleton variant="text" sx={{ width: "32%", maxWidth: 170 }} />
          <Skeleton
            variant="text"
            sx={{ width: "24%", maxWidth: 120, height: 48 }}
          />
        </Box>

        <Box sx={{ minWidth: 120 }}>
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            justifyContent="flex-end"
          >
            <Skeleton variant="circular" sx={{ width: 20, height: 20 }} />
            <Skeleton variant="text" sx={{ width: 42 }} />
          </Stack>
          <Skeleton variant="text" sx={{ width: "100%", maxWidth: 120 }} />
        </Box>
      </Box>

      <Skeleton
        variant="rounded"
        sx={{ width: "100%", height: 118, borderRadius: 2 }}
      />
    </Card>
  );
}

function DashboardSkeleton() {
  return (
    <TwoSideLayout
      rows={{
        fourthRow: [
          <SummaryWidgetSkeleton key="response-rate" />,
          <SummaryWidgetSkeleton key="supervising-rate" />,
          <SummaryWidgetSkeleton key="knowledge-size" />,
          <SummaryWidgetSkeleton key="task-rate" />,
        ],
        secondRow: [
          <PerformanceSkeleton key="usage-chart" />,
          <PerformanceSkeleton key="team-activity" />,
        ],
        thirdRow: [<TotalMessagesSkeleton key="total-messages" />],
      }}
    />
  );
}

export default DashboardSkeleton;
