import Page from "../components/Page/Page";
import TaskDonutWidget from "../widgets/TaskDonutWidget/TaskDonutWidget";
import TaskSeriesWidget from "../widgets/TaskSeriesWidget/TaskSeriesWidget";
import TasksTableWidget from "../widgets/TasksTableWidget/TasksTableWidget";
import TimeRangePicker from "../components/TimeRangePicker/TimeRangePicker";
import { resolveTimeRange } from "../utils/resolveTimeRange";
import { Box, Stack } from "@mui/material";
import { useMemo, useState } from "react";

function Monitoring() {
  const [range, setRange] = useState<string>("Last 30 days");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("team");

  const resolvedRange = useMemo(
    () => resolveTimeRange(range, { from: customFrom, to: customTo }),
    [range, customFrom, customTo]
  );
  return (
    <>
      <Page name="Monitoring" />
      <Box sx={{ px: 2 }}>
        <Stack spacing={2}>
          <TimeRangePicker
            range={range}
            onRangeChange={setRange}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
          />

          <TaskSeriesWidget
            range={resolvedRange}
            selectedAgentId={selectedAgentId}
            onSelectAgent={setSelectedAgentId}
          />

          <TaskDonutWidget
            range={resolvedRange}
            selectedAgentId={selectedAgentId}
          />

          <TasksTableWidget range={resolvedRange} />
        </Stack>
      </Box>
    </>
  );
}

export default Monitoring;
