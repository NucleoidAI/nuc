import useTaskStats from "../../hooks/useTaskStats";

import {
  Box,
  Card,
  LinearProgress,
  Pagination,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useMemo, useState } from "react";

const AGENTS_PER_PAGE = 10;

function formatTokens(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(2)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}K`;
  return value.toLocaleString();
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <Card
      sx={{
        p: 1.5,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Typography variant="body2" color="text.secondary" noWrap>
        {label}
      </Typography>
      <Typography variant="h5" noWrap sx={{ mt: 0.5, fontWeight: 700 }}>
        {value}
      </Typography>
    </Card>
  );
}

function AgentsOverviewWidget({
  range,
}: {
  range: { from: string; to: string };
}) {
  const { getAgentOverview, getTokenUsage } = useTaskStats();
  const [agentsPage, setAgentsPage] = useState(1);

  const { overview } = getAgentOverview({ from: range.from, to: range.to });
  const { usage } = getTokenUsage({ from: range.from, to: range.to });

  const totals = useMemo(() => {
    const statusTotals = overview.reduce(
      (acc, agent) => ({
        total: acc.total + agent.total,
        completed: acc.completed + agent.COMPLETED,
        inProgress: acc.inProgress + agent.IN_PROGRESS,
        awaiting: acc.awaiting + agent.AWAITING,
        failed: acc.failed + agent.FAILED,
      }),
      { total: 0, completed: 0, inProgress: 0, awaiting: 0, failed: 0 }
    );
    return { ...statusTotals, tokens: usage.totalTokens };
  }, [overview, usage]);

  const agentsPageCount = Math.max(
    1,
    Math.ceil(overview.length / AGENTS_PER_PAGE)
  );
  const pagedAgents = overview.slice(
    (agentsPage - 1) * AGENTS_PER_PAGE,
    agentsPage * AGENTS_PER_PAGE
  );

  return (
    <Stack spacing={2}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, 1fr)",
            sm: "repeat(3, 1fr)",
            md: "repeat(6, 1fr)",
          },
          gap: 1,
        }}
      >
        <SummaryCard
          label="Total tasks"
          value={totals.total.toLocaleString()}
        />
        <SummaryCard
          label="Completed"
          value={totals.completed.toLocaleString()}
        />
        <SummaryCard
          label="In progress"
          value={totals.inProgress.toLocaleString()}
        />
        <SummaryCard
          label="Awaiting supervision"
          value={totals.awaiting.toLocaleString()}
        />
        <SummaryCard label="Failed" value={totals.failed.toLocaleString()} />
        <SummaryCard label="Tokens used" value={formatTokens(totals.tokens)} />
      </Box>

      <Card
        sx={{
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 1.5, pb: 0 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
            Agents overview
          </Typography>
        </Box>
        <Box sx={{ overflowX: "auto" }}>
          <Table sx={{ mt: 1 }}>
            <TableHead>
              <TableRow>
                <TableCell>Agent</TableCell>
                <TableCell align="right">Total tasks</TableCell>
                <TableCell align="right">Completed</TableCell>
                <TableCell align="right">In progress</TableCell>
                <TableCell align="right">Awaiting supervision</TableCell>
                <TableCell align="right">Failed</TableCell>
                <TableCell align="right">Failure rate</TableCell>
                <TableCell align="right">Tokens</TableCell>
                <TableCell sx={{ minWidth: 160 }}>Token share</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedAgents.map((agent) => {
                const tokenShare = totals.tokens
                  ? (agent.totalTokens / totals.tokens) * 100
                  : 0;

                return (
                  <TableRow key={agent.agentId} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {agent.name}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">{agent.total}</TableCell>
                    <TableCell align="right">{agent.COMPLETED}</TableCell>
                    <TableCell align="right">{agent.IN_PROGRESS}</TableCell>
                    <TableCell align="right">{agent.AWAITING}</TableCell>
                    <TableCell align="right">{agent.FAILED}</TableCell>
                    <TableCell align="right">
                      {agent.failureRate.toFixed(1)}%
                    </TableCell>
                    <TableCell align="right">
                      {formatTokens(agent.totalTokens)}
                    </TableCell>
                    <TableCell>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <LinearProgress
                          variant="determinate"
                          value={tokenShare}
                          sx={{
                            flex: 1,
                            height: 6,
                            borderRadius: 1,
                            bgcolor: "action.hover",
                          }}
                        />
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ minWidth: 40, textAlign: "right" }}
                        >
                          {tokenShare.toFixed(1)}%
                        </Typography>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow sx={{ bgcolor: "background.default" }}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 700 }}>
                    Team total
                  </Typography>
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {totals.total}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {totals.completed}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {totals.inProgress}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {totals.awaiting}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {totals.failed}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {totals.total
                    ? ((totals.failed / totals.total) * 100).toFixed(1)
                    : "0.0"}
                  %
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 700 }}>
                  {formatTokens(totals.tokens)}
                </TableCell>
                <TableCell sx={{ fontWeight: 700 }}>100%</TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </Box>

        {overview.length > AGENTS_PER_PAGE && (
          <Stack alignItems="center" sx={{ py: 1.5 }}>
            <Pagination
              count={agentsPageCount}
              page={agentsPage}
              onChange={(_, value) => setAgentsPage(value)}
            />
          </Stack>
        )}
      </Card>
    </Stack>
  );
}

export default AgentsOverviewWidget;
