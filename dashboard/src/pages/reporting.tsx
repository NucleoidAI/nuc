import AgentsOverviewWidget from "../widgets/AgentsOverviewWidget/AgentsOverviewWidget";
import { Iconify } from "@canmingir/link/platform/components";
import Page from "../components/Page/Page";
import TasksTableWidget from "../widgets/TasksTableWidget/TasksTableWidget";
import TimeRangePicker from "../components/TimeRangePicker/TimeRangePicker";
import { resolveTimeRange } from "../utils/resolveTimeRange";
import { Box, Button, Stack, Typography } from "@mui/material";
import { useMemo, useState } from "react";

function Reports() {
  const [range, setRange] = useState<string>("Last 30 days");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  const resolvedRange = useMemo(
    () => resolveTimeRange(range, { from: customFrom, to: customTo }),
    [range, customFrom, customTo]
  );
  return (
    <>
      <Page name="Reports" />
      <Box sx={{ px: 2 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          spacing={1}
          sx={{ mb: 1 }}
        >
          <Typography variant="h4" sx={{ fontWeight: 700 }}>
            Reports
          </Typography>

          <Stack direction="row" spacing={1} alignItems="center">
            <Button
              variant="contained"
              startIcon={<Iconify icon="solar:export-bold" width={18} />}
            >
              Export
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={2}>
          <TimeRangePicker
            range={range}
            onRangeChange={setRange}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />

          <AgentsOverviewWidget range={resolvedRange} />

          <TasksTableWidget range={resolvedRange} />
        </Stack>
      </Box>
    </>
  );
}

export default Reports;
