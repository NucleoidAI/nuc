import AgentsOverviewWidget from "../AgentsOverviewWidget/AgentsOverviewWidget";
import { Stack } from "@mui/material";
import TasksTableWidget from "../TasksTableWidget/TasksTableWidget";
import TimeRangePicker from "../../components/TimeRangePicker/TimeRangePicker";
import { resolveTimeRange } from "../../utils/resolveTimeRange";

import { useMemo, useState } from "react";

function ReportsWidget() {
  const [range, setRange] = useState<string>("Last 7 days");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const resolvedRange = useMemo(
    () => resolveTimeRange(range, { from: customFrom, to: customTo }),
    [range, customFrom, customTo]
  );

  return (
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
  );
}

export default ReportsWidget;
