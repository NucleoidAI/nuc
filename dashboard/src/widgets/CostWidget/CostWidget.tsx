import { Iconify } from "@canmingir/link/platform/components";
import ModelPricingDialog from "./ModelPricingDialog";
import useAgents from "../../hooks/useAgents";
import useLoading from "../../hooks/useLoading";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Card,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import useLLMLogs, { LLMLogEntry, TaskUsage } from "../../hooks/useLLMLogs";
import { useMemo, useState } from "react";
import useModelPricings, { ModelPricing } from "../../hooks/useModelPricings";

const TASK_STATUS_COLOR: Record<
  string,
  "success" | "error" | "primary" | "default"
> = {
  COMPLETED: "success",
  FAILED: "error",
  IN_PROGRESS: "primary",
};

function formatTokens(value: number | null | undefined): string {
  if (value === null || value === undefined) return "-";
  return value.toLocaleString();
}

function formatCost(value: number | null | undefined): string {
  if (!value) return "-";
  return `$${value.toFixed(6)}`;
}

function pricingKey(provider: string, model: string | null): string {
  return `${provider.trim().toLowerCase()}:${(model ?? "")
    .trim()
    .toLowerCase()}`;
}

// Cost is resolved on the client from the pricing table so edits in the
// pricing dialog reflect immediately. Provider-reported cost (OpenRouter)
// always wins over the calculated estimate.
function resolveLogCost(
  log: LLMLogEntry,
  pricingMap: Map<string, ModelPricing>
): LLMLogEntry {
  if (log.costSource === "provider" && log.cost !== null) {
    return log;
  }

  const pricing = pricingMap.get(pricingKey(log.provider, log.model));

  if (!pricing || (log.inputTokens === null && log.outputTokens === null)) {
    return { ...log, cost: null, costSource: null };
  }

  const cost =
    ((log.inputTokens ?? 0) / 1_000_000) * pricing.inputPricePerMillion +
    ((log.outputTokens ?? 0) / 1_000_000) * pricing.outputPricePerMillion;

  return { ...log, cost, costSource: "pricing" };
}

function SummaryCard({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <Card
      sx={{
        p: 2,
        flex: 1,
        minWidth: 160,
        borderRadius: 1,
        border: "1px solid",
        borderColor: "divider",
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1}>
        <Iconify icon={icon} width={20} sx={{ color: "text.secondary" }} />
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
      <Typography variant="h5" sx={{ mt: 0.5, fontWeight: 700 }}>
        {value}
      </Typography>
    </Card>
  );
}

function TaskUsageAccordion({ usage }: { usage: TaskUsage }) {
  const { task, totals, logs } = usage;

  return (
    <Accordion
      disableGutters
      elevation={0}
      sx={{
        borderBottom: "1px solid",
        borderColor: "divider",
        "&:before": { display: "none" },
        bgcolor: "transparent",
      }}
    >
      <AccordionSummary
        expandIcon={<Iconify icon="eva:chevron-down-fill" width={18} />}
        sx={{ px: 1.5 }}
      >
        <Stack
          direction="row"
          alignItems="center"
          spacing={2}
          sx={{ width: "100%", pr: 1 }}
        >
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
              {task.description}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {new Date(task.createdAt).toLocaleString()}
            </Typography>
          </Box>
          <Chip
            label={task.status}
            size="small"
            color={TASK_STATUS_COLOR[task.status] ?? "default"}
            variant="outlined"
          />
          <Stack alignItems="flex-end" sx={{ minWidth: 110 }}>
            <Typography variant="body2" sx={{ fontWeight: 700 }}>
              {formatTokens(totals.totalTokens)} tokens
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totals.calls} calls
              {totals.cost ? ` · ${formatCost(totals.cost)}` : ""}
            </Typography>
          </Stack>
        </Stack>
      </AccordionSummary>
      <AccordionDetails sx={{ p: 0 }}>
        {logs.length === 0 ? (
          <Typography
            variant="body2"
            color="text.disabled"
            sx={{ p: 2, textAlign: "center" }}
          >
            No LLM logs recorded for this task
          </Typography>
        ) : (
          <Box sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Time</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Provider / Model</TableCell>
                  <TableCell align="right">Input</TableCell>
                  <TableCell align="right">Output</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="right">Cost</TableCell>
                  <TableCell align="right">Duration</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </TableCell>
                    <TableCell>{log.source ?? "-"}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap>
                        {log.provider}
                        {log.model ? ` · ${log.model}` : ""}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      {formatTokens(log.inputTokens)}
                    </TableCell>
                    <TableCell align="right">
                      {formatTokens(log.outputTokens)}
                    </TableCell>
                    <TableCell align="right">
                      {formatTokens(log.totalTokens)}
                    </TableCell>
                    <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                      {formatCost(log.cost)}
                    </TableCell>
                    <TableCell align="right">
                      {log.durationMs !== null ? `${log.durationMs} ms` : "-"}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Box>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

function CostWidget() {
  const { getTeamAgents } = useAgents();
  const { agents, loading } = getTeamAgents();

  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  const { getUsageByAgent } = useLLMLogs();
  const { usage: rawUsage, loading: usageLoading } =
    getUsageByAgent(selectedAgentId);

  const { getPricings } = useModelPricings();
  const { pricings, fetch: fetchPricings } = getPricings();

  const [pricingOpen, setPricingOpen] = useState(false);

  const isLoading = useLoading(loading);
  const isUsageLoading = useLoading(usageLoading);

  const usage = useMemo(() => {
    const pricingMap = new Map(
      (pricings ?? []).map((pricing) => [
        pricingKey(pricing.provider, pricing.model),
        pricing,
      ])
    );

    return rawUsage.map((taskUsage) => {
      const logs = taskUsage.logs.map((log) => resolveLogCost(log, pricingMap));

      return {
        ...taskUsage,
        logs,
        totals: {
          ...taskUsage.totals,
          cost: logs.reduce((sum, log) => sum + (log.cost ?? 0), 0),
        },
      };
    });
  }, [rawUsage, pricings]);

  const grandTotals = usage.reduce(
    (acc, { totals }) => ({
      inputTokens: acc.inputTokens + totals.inputTokens,
      outputTokens: acc.outputTokens + totals.outputTokens,
      totalTokens: acc.totalTokens + totals.totalTokens,
      cost: acc.cost + totals.cost,
      calls: acc.calls + totals.calls,
    }),
    { inputTokens: 0, outputTokens: 0, totalTokens: 0, cost: 0, calls: 0 }
  );

  return (
    <>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 2 }}
      >
        <Box sx={{ minWidth: 240 }}>
          {isLoading ? (
            <Skeleton variant="rounded" height={40} sx={{ borderRadius: 1 }} />
          ) : (
            <FormControl fullWidth>
              <InputLabel>Agents</InputLabel>
              <Select
                label="Agents"
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                renderValue={(val) => {
                  if (!val) return "Select an agent";
                  const agent = agents?.find(
                    (a: { id: string; name: string; icon?: string }) =>
                      a.id === val
                  );
                  return (
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {agent?.icon && (
                        <Iconify icon={agent.icon} width={20} height={20} />
                      )}
                      <span>{agent?.name ?? val}</span>
                    </Stack>
                  );
                }}
              >
                <MenuItem value="" disabled>
                  Select an agent
                </MenuItem>
                {(agents ?? []).map((agent) => (
                  <MenuItem key={agent.id} value={agent.id}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      {agent.icon && (
                        <Iconify icon={agent.icon} width={20} height={20} />
                      )}
                      <span>{agent.name}</span>
                    </Stack>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
        </Box>
        <Button
          variant="outlined"
          startIcon={<Iconify icon="solar:tag-price-line-duotone" width={18} />}
          onClick={() => setPricingOpen(true)}
        >
          Pricing
        </Button>
      </Stack>

      {!selectedAgentId ? (
        <Box sx={{ p: 6, textAlign: "center" }}>
          <Iconify
            icon="solar:wallet-money-line-duotone"
            width={48}
            sx={{ color: "text.disabled", mb: 1 }}
          />
          <Typography variant="body2" color="text.disabled">
            Select an agent to see LLM usage of its last 50 tasks
          </Typography>
        </Box>
      ) : isUsageLoading ? (
        <Stack sx={{ gap: 1.5 }}>
          <Stack direction="row" sx={{ gap: 1.5 }}>
            {[...Array(4)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={88}
                sx={{ borderRadius: 1, flex: 1 }}
              />
            ))}
          </Stack>
          {[...Array(6)].map((_, i) => (
            <Skeleton
              key={i}
              variant="rounded"
              height={56}
              sx={{ borderRadius: 1 }}
            />
          ))}
        </Stack>
      ) : (
        <>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            sx={{ mb: 2 }}
          >
            <SummaryCard
              icon="solar:document-text-line-duotone"
              label="Input Tokens"
              value={formatTokens(grandTotals.inputTokens)}
            />
            <SummaryCard
              icon="solar:chat-round-line-duotone"
              label="Output Tokens"
              value={formatTokens(grandTotals.outputTokens)}
            />
            <SummaryCard
              icon="solar:calculator-line-duotone"
              label="Total Tokens"
              value={formatTokens(grandTotals.totalTokens)}
            />
            <SummaryCard
              icon="solar:wallet-money-line-duotone"
              label="Cost"
              value={
                grandTotals.cost ? formatCost(grandTotals.cost) : "No cost data"
              }
            />
          </Stack>

          <Card
            sx={{
              borderRadius: 1,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Box
              sx={{
                p: 1,
                bgcolor: "background.default",
                borderBottom: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                Last {usage.length} Tasks
              </Typography>
            </Box>
            {usage.length === 0 ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.disabled">
                  No tasks found for this agent
                </Typography>
              </Box>
            ) : (
              usage.map((taskUsage) => (
                <TaskUsageAccordion key={taskUsage.task.id} usage={taskUsage} />
              ))
            )}
          </Card>
        </>
      )}

      <ModelPricingDialog
        open={pricingOpen}
        onClose={() => setPricingOpen(false)}
        onChanged={() => fetchPricings()}
      />
    </>
  );
}

export default CostWidget;
