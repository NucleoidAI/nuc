import { Iconify } from "@canmingir/link/platform/components";
import TaskList from "../../components/TaskList/TaskList";
import useLoading from "../../hooks/useLoading";
import { useState } from "react";
import useTaskLogs from "../../hooks/useTaskLogs";
import useTasks from "../../hooks/useTasks";

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Card,
  Chip,
  Divider,
  IconButton,
  Skeleton,
  Slider,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";

const STATUS_COLOR = {
  COMPLETED: "success.main",
  FAILED: "error.main",
  SUPERVISED: "warning.main",
};

function ScoreBar({
  label,
  value,
  color,
}: {
  label: string;
  value: number | null;
  color: string;
}) {
  return (
    <Stack direction="row" alignItems="center" spacing={1} sx={{ minWidth: 0 }}>
      <Typography
        variant="caption"
        sx={{ width: 110, flexShrink: 0, color: "text.secondary" }}
      >
        {label}
      </Typography>
      <Box
        sx={{
          flex: 1,
          height: 6,
          borderRadius: 3,
          bgcolor: "action.hover",
          overflow: "hidden",
        }}
      >
        <Box
          sx={{
            width: `${(value ?? 0) * 100}%`,
            height: "100%",
            borderRadius: 3,
            bgcolor: color,
            transition: "width 0.3s ease",
          }}
        />
      </Box>
      <Typography
        variant="caption"
        sx={{ width: 36, textAlign: "right", fontWeight: 700 }}
      >
        {value !== null ? value.toFixed(2) : "—"}
      </Typography>
    </Stack>
  );
}

function LogCard({
  log,
  onScoreChange,
  onScoreDelete,
}: {
  log: {
    id: string;
    parameters: object | null;
    output: string | null;
    hallucinationScore: number | null;
    knowledgeScore: number | null;
    superviseScore: number | null;
    resultScore: number | null;
    status: "COMPLETED" | "FAILED" | "SUPERVISED";
    createdAt: string;
  };
  onScoreChange: (logId: string, score: number) => void;
  onScoreDelete: (logId: string) => void;
}) {
  const [hasScore, setHasScore] = useState(log.superviseScore !== null);
  const [localScore, setLocalScore] = useState<number>(
    log.superviseScore ?? 0.5
  );
  const [dirty, setDirty] = useState(false);

  const handleConfirm = () => {
    onScoreChange(log.id, localScore);
    setHasScore(true);
    setDirty(false);
  };

  const handleDelete = () => {
    onScoreDelete(log.id);
    setHasScore(false);
    setLocalScore(0.5);
    setDirty(false);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        p: 1,
        borderRadius: 2,
        borderColor: "divider",
      }}
    >
      <Stack spacing={1.5}>
        <Stack
          direction="row"
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="caption" color="text.disabled">
            {new Date(log.createdAt).toLocaleString()}
          </Typography>
          <Chip
            size="small"
            label={log.status}
            sx={{
              fontWeight: 800,
              fontSize: 11,
              bgcolor: STATUS_COLOR[log.status],
              color: "common.white",
              "& .MuiChip-label": { px: 1 },
            }}
          />
        </Stack>

        {log.parameters && (
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "text.secondary" }}
            >
              Parameters
            </Typography>
            <Box
              component="pre"
              sx={{
                mt: 0.5,
                p: 1,
                bgcolor: "action.hover",
                borderRadius: 1,
                fontSize: 11,
                overflow: "auto",
                maxHeight: 120,
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {JSON.stringify(log.parameters, null, 2)}
            </Box>
          </Box>
        )}

        {log.output && (
          <Box>
            <Typography
              variant="caption"
              sx={{ fontWeight: 700, color: "text.secondary" }}
            >
              Output
            </Typography>
            <Box
              sx={{
                mt: 0.5,
                p: 1,
                bgcolor: "action.hover",
                borderRadius: 1,
                fontSize: 12,
                overflow: "auto",
                maxHeight: 120,
                fontFamily: "monospace",
                whiteSpace: "pre-wrap",
                wordBreak: "break-all",
              }}
            >
              {log.output}
            </Box>
          </Box>
        )}

        <Divider />

        <Stack spacing={0.75}>
          <ScoreBar
            label="Knowledge"
            value={log.knowledgeScore}
            color="primary.main"
          />
          <ScoreBar
            label="Hallucination"
            value={log.hallucinationScore}
            color={
              (log.hallucinationScore ?? 0) > 0.6
                ? "error.main"
                : (log.hallucinationScore ?? 0) > 0.3
                ? "warning.main"
                : "success.main"
            }
          />
          <ScoreBar label="Result" value={log.resultScore} color="info.main" />
          <Divider />
          <Stack
            direction="row"
            alignItems="center"
            spacing={1}
            sx={{ minWidth: 0 }}
          >
            <Typography
              variant="caption"
              sx={{
                width: 110,
                flexShrink: 0,
                color: "text.secondary",
              }}
            >
              Supervise
            </Typography>
            <Slider
              size="small"
              min={0}
              max={1}
              step={0.01}
              value={localScore}
              onChange={(_e, val) => {
                const next = Array.isArray(val) ? val[0] : val;
                if (!hasScore) setHasScore(true);
                setLocalScore(next);
                setDirty(next !== (log.superviseScore ?? 0));
              }}
              sx={{
                flex: 1,
                color: !hasScore
                  ? "text.disabled"
                  : localScore > 0.6
                  ? "success.main"
                  : localScore > 0.3
                  ? "warning.main"
                  : "error.main",
                py: 0,
                "& .MuiSlider-rail": { height: 6, borderRadius: 3 },
                "& .MuiSlider-track": { height: 6, borderRadius: 3 },
                "& .MuiSlider-thumb": {
                  width: 12,
                  height: 12,
                  "&:hover": {
                    boxShadow: "none",
                  },
                },
              }}
            />
            <Typography
              variant="caption"
              sx={{
                width: 36,
                textAlign: "right",
                fontWeight: 700,
                flexShrink: 0,
              }}
            >
              {hasScore ? localScore.toFixed(2) : "—"}
            </Typography>
            <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
              <Tooltip title="Confirm">
                <span>
                  <IconButton
                    size="small"
                    disabled={!dirty}
                    onClick={handleConfirm}
                    sx={{ color: dirty ? "success.main" : undefined }}
                  >
                    <Iconify icon="eva:checkmark-fill" width={14} />
                  </IconButton>
                </span>
              </Tooltip>
              <Tooltip title="Delete score">
                <span>
                  <IconButton
                    size="small"
                    disabled={!hasScore}
                    onClick={handleDelete}
                    sx={{ color: hasScore ? "error.main" : undefined }}
                  >
                    <Iconify icon="solar:trash-bin-trash-bold" width={14} />
                  </IconButton>
                </span>
              </Tooltip>
            </Stack>
          </Stack>
        </Stack>
      </Stack>
    </Card>
  );
}

const STEP_STATUS_COLOR: Record<string, string> = {
  COMPLETED: "success.main",
  FAILED: "error.main",
  IN_PROGRESS: "primary.main",
  SUPERVISED_NEEDED: "warning.main",
  WAITING_FOR_USER: "info.main",
  LOW_CONFIDENCE: "warning.dark",
};

function StepAccordion({
  step,
}: {
  step: {
    id: string;
    action: string;
    comment: string | null;
    status: string;
    createdAt: string;
  };
}) {
  const [expanded, setExpanded] = useState(false);
  const { getLogsByStep, updateSuperviseScore, deleteSuperviseScore } =
    useTaskLogs();
  const { logs, loading } = getLogsByStep(expanded ? step.id : "");
  const isLoading = useLoading(loading);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_, isExpanded) => setExpanded(isExpanded)}
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
        sx={{
          px: 1,
          minHeight: 48,
          "&.Mui-expanded": { minHeight: 48 },
          "& .MuiAccordionSummary-content": { my: 0.75 },
        }}
      >
        <Stack
          direction="row"
          spacing={1.5}
          alignItems="center"
          sx={{ flex: 1, minWidth: 0, mr: 1 }}
        >
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              bgcolor: STEP_STATUS_COLOR[step.status] ?? "text.disabled",
              flexShrink: 0,
            }}
          />
          <Box sx={{ flex: 1, minWidth: 0 }}>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {step.comment || step.action}
            </Typography>
            <Typography variant="caption" color="text.disabled">
              {new Date(step.createdAt).toLocaleString()}
            </Typography>
          </Box>
          <Chip
            size="small"
            label={step.status.replace(/_/g, " ")}
            sx={{
              fontSize: 10,
              fontWeight: 800,
              bgcolor: STEP_STATUS_COLOR[step.status] ?? "text.disabled",
              color: "common.white",
              "& .MuiChip-label": { px: 0.75 },
              flexShrink: 0,
            }}
          />
        </Stack>
      </AccordionSummary>

      <AccordionDetails sx={{ p: 1, pt: 0 }}>
        {isLoading ? (
          <Stack spacing={1.5}>
            {[...Array(2)].map((_, i) => (
              <Skeleton
                key={i}
                variant="rounded"
                height={100}
                sx={{ borderRadius: 1 }}
              />
            ))}
          </Stack>
        ) : logs.length === 0 ? (
          <Box sx={{ textAlign: "center", py: 2 }}>
            <Iconify
              icon="solar:document-text-line-duotone"
              width={36}
              sx={{ color: "text.disabled", mb: 0.5 }}
            />
            <Typography variant="body2" color="text.disabled">
              No logs for this step
            </Typography>
          </Box>
        ) : (
          <Stack spacing={1}>
            {logs.map((log) => (
              <LogCard
                key={log.id}
                log={log}
                onScoreChange={updateSuperviseScore}
                onScoreDelete={deleteSuperviseScore}
              />
            ))}
          </Stack>
        )}
      </AccordionDetails>
    </Accordion>
  );
}

function TaskLogsWidget({ agentId }: { agentId: string }) {
  const { tasks, loading: tasksLoading, steps, getSteps } = useTasks(agentId);
  const isTasksLoading = useLoading(tasksLoading);

  const [selectedTask, setSelectedTask] = useState<{
    id: string;
    description: string;
    status: string;
    createdAt: string;
  } | null>(null);

  const handleTaskSelect = (task: {
    id: string;
    description: string;
    status: string;
    createdAt: string;
  }) => {
    setSelectedTask(task);
    getSteps(task.id);
  };

  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "400px 1fr" },
        gap: 1,
        alignItems: "start",
        height: "80vh",
      }}
    >
      {/* Task List */}
      <Card
        sx={{
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          height: "100%",
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
            Tasks
          </Typography>
        </Box>
        {isTasksLoading ? (
          <Stack sx={{ p: 2, gap: 1.5 }}>
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
          <TaskList
            tasks={tasks ?? []}
            selectedTask={selectedTask}
            onTaskSelect={handleTaskSelect}
          />
        )}
      </Card>

      {/* Steps + Logs Panel */}
      <Card
        sx={{
          borderRadius: 1,
          border: "1px solid",
          borderColor: "divider",
          overflow: "hidden",
          height: "100%",
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
          <Stack direction="row" alignItems="center" spacing={1}>
            <Iconify
              icon="material-symbols:linear-scale"
              width={18}
              sx={{ color: "text.secondary" }}
            />
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>
              Steps
            </Typography>
          </Stack>
        </Box>

        {!selectedTask ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Iconify
              icon="solar:inbox-line-duotone"
              width={48}
              sx={{ color: "text.disabled", mb: 1 }}
            />
            <Typography variant="body2" color="text.disabled">
              Select a task to see its steps
            </Typography>
          </Box>
        ) : steps && steps.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" color="text.disabled">
              No steps found for this task
            </Typography>
          </Box>
        ) : (
          <Box sx={{ overflow: "auto", height: "calc(100% - 41px)" }}>
            {(steps ?? []).map((step) => (
              <StepAccordion key={step.id} step={step} />
            ))}
          </Box>
        )}
      </Card>
    </Box>
  );
}

export default TaskLogsWidget;
