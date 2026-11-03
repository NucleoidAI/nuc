import AgentDrawer from "../../components/AgentDrawer/AgentDrawer";
import { Stack } from "@mui/material";
import SupervisionRateSeries from "../SupervisionRateSeries/SupervisionRateSeries";
import SupervisionRateWidget from "../SupervisionRateWidget/SupervisionRateWidget";
import SupervisionTable from "../../components/SupervisionTable/SupervisionTable";
import TimeRangePicker from "../../components/TimeRangePicker/TimeRangePicker";
import { fElapsed } from "../../utils/formatTime";
import { resolveTimeRange } from "../../utils/resolveTimeRange";
import useAgents from "../../hooks/useAgents";
import useSupervisings from "../../hooks/useSupervisings";

import { useMemo, useState } from "react";

function OperationWidget() {
  const { getTeamAgents } = useAgents();
  const { agents } = getTeamAgents();
  const { getTeamSupervisingByStatus } = useSupervisings();
  const [scope, setScope] = useState<"TEAM" | "AGENT">("TEAM");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);
  const [dateRange, setDateRange] = useState<string>("Last 30 days");
  const [customFrom, setCustomFrom] = useState<string>("");
  const [customTo, setCustomTo] = useState<string>("");

  const range = useMemo(
    () => resolveTimeRange(dateRange, { from: customFrom, to: customTo }),
    [dateRange, customFrom, customTo]
  );

  const agentById = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    (agents ?? []).forEach((agent) => map.set(agent.id, agent));
    return map;
  }, [agents]);

  const { supervisings } = getTeamSupervisingByStatus("IN_PROGRESS", range);

  const pending = useMemo(() => {
    return (supervisings ?? []).map(
      (item: {
        id: string;
        question: string;
        agentId: string;
        createdAt: string;
        status: "IN_PROGRESS" | "ANSWERED";
      }) => {
        const agent = agentById.get(item.agentId);
        return {
          id: item.id,
          task: item.question,
          agent: agent?.name ?? item.agentId,
          agentId: item.agentId,
          waiting: fElapsed(item.createdAt),
          step: "",
        };
      }
    );
  }, [supervisings, agentById]);

  const goToSupervising = (agentId: string) => {
    const agent = (agents ?? []).find((a) => a.id === agentId);
    if (!agent) return;

    setSelectedAgent(agent);
    setAgentDrawerOpen(true);
  };

  const agentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    pending.forEach((item) => {
      counts.set(item.agent, (counts.get(item.agent) ?? 0) + 1);
    });
    return counts;
  }, [pending]);

  const agentOptions = useMemo(
    () => Array.from(agentCounts.keys()),
    [agentCounts]
  );

  const filteredPending = useMemo(
    () =>
      scope === "TEAM" || !agentFilter
        ? pending
        : pending.filter((item) => item.agent === agentFilter),
    [pending, scope, agentFilter]
  );

  return (
    <Stack spacing={2}>
      <TimeRangePicker
        range={dateRange}
        onRangeChange={setDateRange}
        customFrom={customFrom}
        customTo={customTo}
        onCustomFromChange={setCustomFrom}
        onCustomToChange={setCustomTo}
      />

      <SupervisionRateWidget
        range={range}
        agentOptions={agentOptions}
        agentCounts={agentCounts}
      />

      <SupervisionRateSeries
        agents={agents}
        agentOptions={agentOptions}
        range={range}
        setSelectedAgent={setSelectedAgent}
      />

      <SupervisionTable
        agentFilter={agentFilter}
        setAgentFilter={setAgentFilter}
        setScope={setScope}
        agentOptions={agentOptions}
        agentCounts={agentCounts}
        filteredPending={filteredPending}
        goToSupervising={goToSupervising}
      />

      {agentDrawerOpen && (
        <AgentDrawer
          open={agentDrawerOpen}
          onClose={() => {
            setAgentDrawerOpen(false);
            setSelectedAgent(null);
          }}
          agent={selectedAgent}
          initialTab="supervisings"
          allAgentIds={(agents ?? []).map((a) => a.id)}
        />
      )}
    </Stack>
  );
}

export default OperationWidget;
