import AgentDrawer from "../../components/AgentDrawer/AgentDrawer";
import { Iconify } from "@canmingir/link/platform/components";
import { fElapsed } from "../../utils/formatTime";
import useAgents from "../../hooks/useAgents";
import useSupervisings from "../../hooks/useSupervisings";

import {
  Box,
  Card,
  Chip,
  MenuItem,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const SupervisionTable = ({
  range,
}: {
  range: { from: string; to: string };
}) => {
  const { getTeamAgents } = useAgents();
  const { agents } = getTeamAgents();
  const { getTeamSupervisingWithAgents } = useSupervisings();

  const [scope, setScope] = useState<"TEAM" | "AGENT">("TEAM");
  const [agentFilter, setAgentFilter] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [agentDrawerOpen, setAgentDrawerOpen] = useState(false);

  const { supervisings } = getTeamSupervisingWithAgents("IN_PROGRESS", range);

  const pending = useMemo(() => {
    return supervisings.map((item) => ({
      id: item.id,
      task: item.question,
      agent: item.Agent,
      waiting: fElapsed(item.createdAt),
      step: "",
    }));
  }, [supervisings]);

  const agentCounts = useMemo(() => {
    const counts = new Map<string, number>();
    pending.forEach((item) => {
      counts.set(item.agent.name, (counts.get(item.agent.name) ?? 0) + 1);
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
        : pending.filter((item) => item.agent.name === agentFilter),
    [pending, scope, agentFilter]
  );

  const goToSupervising = (agent: { id: string; name: string }) => {
    setSelectedAgent(agent);
    setAgentDrawerOpen(true);
  };

  return (
    <Card
      sx={{
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
        overflow: "hidden",
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={1.5}
        sx={{ p: 2 }}
      >
        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
          Waiting for a decision
        </Typography>

        <Select
          size="small"
          value={agentFilter || "TEAM"}
          onChange={(e) => {
            const value = e.target.value;
            if (value === "TEAM") {
              setScope("TEAM");
              setAgentFilter("");
            } else {
              setScope("AGENT");
              setAgentFilter(value);
            }
          }}
          sx={{ minWidth: 180 }}
        >
          <MenuItem value="TEAM">Team</MenuItem>
          {agentOptions.map((agent) => (
            <MenuItem key={agent} value={agent}>
              {agent} ({agentCounts.get(agent)})
            </MenuItem>
          ))}
        </Select>
      </Stack>

      <Box
        sx={{
          overflowX: "auto",
          overflowY: "auto",
          height: "calc(100vh - 500px)",
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Waiting</TableCell>
              <TableCell>Agent</TableCell>
              <TableCell>Task</TableCell>
              <TableCell align="right">Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredPending.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>
                  <Box sx={{ py: 6, textAlign: "center" }}>
                    <Iconify
                      icon="solar:shield-check-line-duotone"
                      width={40}
                      sx={{ color: "text.disabled", mb: 1 }}
                    />
                    <Typography variant="body2" color="text.disabled">
                      Nothing is waiting for a decision
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            ) : (
              filteredPending.map((item) => (
                <TableRow
                  key={item.id}
                  hover
                  onClick={() => goToSupervising(item.agent)}
                  sx={{ cursor: "pointer" }}
                >
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {item.waiting}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.agent.name}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ maxWidth: 480 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {item.task}
                    </Typography>
                  </TableCell>
                  <TableCell align="right">
                    <Stack
                      direction="row"
                      spacing={1}
                      justifyContent="flex-end"
                      alignItems="center"
                    >
                      <Chip
                        label="Supervision"
                        size="small"
                        color="warning"
                        sx={{ fontWeight: 600 }}
                      />
                    </Stack>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Box>

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
    </Card>
  );
};

export default SupervisionTable;
