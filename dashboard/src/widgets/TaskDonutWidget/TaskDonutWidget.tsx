import { Stack } from "@mui/material";
import TaskDonutCard from "./TaskDonutCard";
import { useMemo } from "react";
import useTaskStats from "../../hooks/useTaskStats";

function TaskDonutWidget({
  range,
  selectedAgentId,
}: {
  range: { from: string; to: string };
  selectedAgentId: string;
}) {
  const { getAgentOverview } = useTaskStats();

  const { overview } = getAgentOverview({ from: range.from, to: range.to });

  const teamBreakdown = useMemo(() => {
    const totals = overview.reduce(
      (acc, agent) => {
        acc.total += agent.total;
        acc.completed += agent.COMPLETED;
        acc.failed += agent.FAILED;
        acc.inProgress += agent.IN_PROGRESS + agent.AWAITING;
        return acc;
      },
      { total: 0, completed: 0, failed: 0, inProgress: 0 }
    );
    return { id: "team", name: "Team", ...totals };
  }, [overview]);

  const selectedAgentBreakdown = useMemo(() => {
    if (selectedAgentId === "team") return null;
    const agent = overview.find((a) => a.agentId === selectedAgentId);
    if (!agent) return null;
    return {
      id: agent.agentId,
      name: agent.name,
      total: agent.total,
      completed: agent.COMPLETED,
      failed: agent.FAILED,
      inProgress: agent.IN_PROGRESS + agent.AWAITING,
    };
  }, [overview, selectedAgentId]);

  return (
    <Stack
      direction={{ xs: "column", md: "row" }}
      spacing={1}
      sx={{ alignItems: "stretch" }}
    >
      <TaskDonutCard breakdown={teamBreakdown} />
      {selectedAgentBreakdown && (
        <TaskDonutCard breakdown={selectedAgentBreakdown} />
      )}
    </Stack>
  );
}

export default TaskDonutWidget;
