import { Stack } from "@mui/material";
import TaskDonutWidget from "../TaskDonutWidget/TaskDonutWidget";
import TaskSeriesWidget from "../TaskSeriesWidget/TaskSeriesWidget";
import TasksTableWidget from "../TasksTableWidget/TasksTableWidget";
import TimeRangePicker from "../../components/TimeRangePicker/TimeRangePicker";
import { resolveTimeRange } from "../../utils/resolveTimeRange";
import useAgents from "../../hooks/useAgents";

import { useMemo, useState } from "react";

function MonitoringWidget() {
  const { getTeamAgents } = useAgents();
  const { agents } = getTeamAgents();

  const [range, setRange] = useState<string>("Last 30 days");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");
  const [selectedAgentId, setSelectedAgentId] = useState<string>("team");

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

      <TaskSeriesWidget
        agents={agents ?? []}
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
  );
}

export default MonitoringWidget;
