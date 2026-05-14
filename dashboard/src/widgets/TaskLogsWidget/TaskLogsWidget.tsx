import { Iconify } from "@canmingir/link/platform/components";
import TaskList from "../../components/TaskList/TaskList";
import useLoading from "../../hooks/useLoading";
import useTaskLogs from "../../hooks/useTaskLogs";
import useTasks from "../../hooks/useTasks";

import {
  Box,
  Card,
  Chip,
  Divider,
  Skeleton,
  Slider,
  Stack,
  Typography,
  alpha,
} from "@mui/material";
import React, { useState } from "react";

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
      <Typography variant="caption" sx={{ width: 110, flexShrink: 0, color: "text.secondary" }}>
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
      <Typography variant="caption" sx={{ width: 36, textAlign: "right", fontWeight: 700 }}>
        {value != null ? value.toFixed(2) : "—"}
      </Typography>
    </Stack>
  );
}

function LogCard({
  log,
  onScoreChange,
}: {
  log: {
    id: string;
    parameters: object | null;
    output: string | null;
    hallucinationScore: number | null;
    superviseScore: number | null;
    reviewScore: number | null;
    status: "COMPLETED" | "FAILED" | "SUPERVISED";
    createdAt: string;
  };
  onScoreChange: (logId: string, score: number) => void;
}) {
  const [localScore, setLocalScore] = useState<number>(log.superviseScore ?? 0);
  const [dirty, setDirty] = useState(false);

  const handleCommit = (_e: Event, val: number | number[]) => {
    const score = Array.isArray(val) ? val[0] : val;
    onScoreChange(log.id, score);
    setDirty(false);
  };

  return (
    <Card
      variant="outlined"
      sx={{
        p: 2,
        borderRadius: 2,
        borderColor: "divider",
        "&:hover": { borderColor: "primary.main" },
      }}
    >
      <Stack spacing={1.5}>
        <Stack direction="row" justifyContent="space-between" alignItems="center">
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
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
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
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
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
          <ScoreBar label="Review" value={log.reviewScore} color="info.main" />
        </Stack>

        <Divider />

        <Box>
          <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="caption" sx={{ fontWeight: 700, color: "text.secondary" }}>
              Supervise Score
            </Typography>
            <Typography variant="caption" sx={{ fontWeight: 900, color: dirty ? "primary.main" : "text.secondary" }}>
              {localScore.toFixed(2)}
            </Typography>
          </Stack>
          <Slider
            size="small"
            min={0}
            max={1}
            step={0.01}
            value={localScore}
            onChange={(_e, val) => {
              setLocalScore(Array.isArray(val) ? val[0] : val);
              setDirty(true);
            }}
            onChangeCommitted={handleCommit}
            sx={{
              color: localScore > 0.6 ? "success.main" : localScore > 0.3 ? "warning.main" : "error.main",
            }}
          />
        </Box>
      </Stack>
    </Card>
  );
}

function StepRow({
  step,
  selected,
  onClick,
}: {
  step: {
    id: string;
    action: string;
    comment: string | null;
    status: string;
    createdAt: string;
  };
  selected: boolean;
  onClick: () => void;
}) {
  const statusColor: Record<string, string> = {
    COMPLETED: "success.main",
    FAILED: "error.main",
    IN_PROGRESS: "primary.main",
    SUPERVISED_NEEDED: "warning.main",
    WAITING_FOR_USER: "info.main",
    LOW_CONFIDENCE: "warning.dark",
  };

  return (
    <Box
      onClick={onClick}
      sx={{
        px: 2,
        py: 1.25,
        cursor: "pointer",
        borderBottom: "1px solid",
        borderColor: "divider",
        bgcolor: selected ? (theme) => alpha(theme.palette.primary.main, 0.08) : "transparent",
        "&:hover": {
          bgcolor: (theme) =>
            selected
              ? alpha(theme.palette.primary.main, 0.12)
              : alpha(theme.palette.action.hover, 0.5),
        },
        transition: "background 0.15s",
      }}
    >
      <Stack direction="row" spacing={1.5} alignItems="center">
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: statusColor[step.status] ?? "text.disabled",
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
            bgcolor: statusColor[step.status] ?? "text.disabled",
            color: "common.white",
            "& .MuiChip-label": { px: 0.75 },
            flexShrink: 0,
          }}
        />
      </Stack>
    </Box>
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

  const [selectedStep, setSelectedStep] = useState<{
    id: string;
    action: string;
    comment: string | null;
    status: string;
    createdAt: string;
  } | null>(null);

  const { getLogsByStep, updateSuperviseScore } = useTaskLogs();

  const { logs: stepLogs, loading: stepLogsLoading } = getLogsByStep(
    selectedStep?.id ?? ""
  );

  const isLogsLoading = useLoading(stepLogsLoading);

  const handleTaskSelect = (task: {
    id: string;
    description: string;
    status: string;
    createdAt: string;
  }) => {
    setSelectedTask(task);
    setSelectedStep(null);
    getSteps(task.id);
  };

  const handleStepSelect = (step: {
    id: string;
    action: string;
    comment: string | null;
    status: string;
    createdAt: string;
  }) => {
    setSelectedStep((prev) => (prev?.id === step.id ? null : step));
  };

  return (
    <Box sx={{ width: "100%", px: { xs: 1, md: 2 }, pb: 2 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "340px 1fr" },
          gap: 2,
          alignItems: "start",
        }}
      >
        {/* Task List */}
        <Card
          sx={{
            borderRadius: 2,
            border: "1px solid",
            borderColor: "divider",
            minHeight: "calc(100vh - 320px)",
            overflow: "hidden",
          }}
        >
          <Box sx={{ px: 2, py: 1.5, bgcolor: "background.default", borderBottom: "1px solid", borderColor: "divider" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
              Tasks
            </Typography>
          </Box>
          {isTasksLoading ? (
            <Stack sx={{ p: 2, gap: 1.5 }}>
              {[...Array(6)].map((_, i) => (
                <Skeleton key={i} variant="rounded" height={56} sx={{ borderRadius: 1 }} />
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

        {/* Right Panel */}
        <Stack spacing={2}>
          {/* Steps Panel */}
          <Card
            sx={{
              borderRadius: 2,
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
            }}
          >
            <Box sx={{ px: 2, py: 1.5, bgcolor: "background.default", borderBottom: "1px solid", borderColor: "divider" }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <Iconify icon="material-symbols:linear-scale" width={18} sx={{ color: "text.secondary" }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                  Steps
                  {selectedStep && (
                    <Typography
                      component="span"
                      variant="caption"
                      sx={{ ml: 1, color: "primary.main", fontWeight: 700 }}
                    >
                      — click selected step to deselect
                    </Typography>
                  )}
                </Typography>
              </Stack>
            </Box>

            {!selectedTask ? (
              <Box sx={{ p: 4, textAlign: "center" }}>
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
              <Box sx={{ p: 4, textAlign: "center" }}>
                <Typography variant="body2" color="text.disabled">
                  No steps found for this task
                </Typography>
              </Box>
            ) : (
              <Box sx={{ maxHeight: 260, overflow: "auto" }}>
                {(steps ?? []).map((step) => (
                  <StepRow
                    key={step.id}
                    step={step}
                    selected={selectedStep?.id === step.id}
                    onClick={() => handleStepSelect(step)}
                  />
                ))}
              </Box>
            )}
          </Card>

          {/* Logs Panel — only visible when a step is selected */}
          {selectedStep && (
            <Card
              sx={{
                borderRadius: 2,
                border: "1px solid",
                borderColor: "divider",
                overflow: "hidden",
              }}
            >
              <Box
                sx={{
                  px: 2,
                  py: 1.5,
                  bgcolor: "background.default",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Iconify icon="solar:document-text-bold" width={18} sx={{ color: "text.secondary" }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
                    Logs — {selectedStep.comment || selectedStep.action}
                  </Typography>
                  {stepLogs.length > 0 && (
                    <Chip
                      size="small"
                      label={stepLogs.length}
                      sx={{ height: 18, fontSize: 11, "& .MuiChip-label": { px: 0.75 } }}
                    />
                  )}
                </Stack>
              </Box>

              <Box sx={{ p: 2, maxHeight: "calc(100vh - 520px)", overflow: "auto" }}>
                {isLogsLoading ? (
                  <Stack spacing={1.5}>
                    {[...Array(3)].map((_, i) => (
                      <Skeleton key={i} variant="rounded" height={120} sx={{ borderRadius: 2 }} />
                    ))}
                  </Stack>
                ) : stepLogs.length === 0 ? (
                  <Box sx={{ textAlign: "center", py: 4 }}>
                    <Iconify
                      icon="solar:document-text-line-duotone"
                      width={48}
                      sx={{ color: "text.disabled", mb: 1 }}
                    />
                    <Typography variant="body2" color="text.disabled">
                      No logs for this step
                    </Typography>
                  </Box>
                ) : (
                  <Stack spacing={2}>
                    {stepLogs.map((log) => (
                      <LogCard
                        key={log.id}
                        log={log}
                        onScoreChange={updateSuperviseScore}
                      />
                    ))}
                  </Stack>
                )}
              </Box>
            </Card>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

export default TaskLogsWidget;
