import AccountTreeIcon from "@mui/icons-material/AccountTree";
import FlowDialog from "../FlowDialog/FlowDialog";
import { Iconify } from "@canmingir/link/platform/components";
import SourcedAvatar from "../SourcedAvatar/SourcedAvatar";
import StepComment from "./StepComment";
import TaskFlowStepDialog from "../FlowDialog/TaskFlowStepDialog";
import TaskIcon from "@mui/icons-material/Task";
import TaskLogsDrawer from "../../widgets/TaskLogs";
import TaskResultDialog from "../TaskResultDialog/TaskResultDialog";

import {
  Box,
  Chip,
  Fab,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
  alpha,
} from "@mui/material";
import React, { useEffect, useRef, useState } from "react";

type TaskStep = {
  comment: string;
  createdAt: string;
  status: string;
  action?: string;
  parameters?: unknown;
  result: string | object | object[];
};

const TaskDetails = ({
  task,
  steps,
  getSteps,
  isExpanded = false,
  onToggleExpand,
}: {
  task: {
    status: string;
    createdAt: string;
    comment: string;
    result: string | object | object[];
    description: string;
    id: string;
    debug?: boolean;
  };
  steps: TaskStep[];
  getSteps: (taskId: string) => void;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}) => {
  const [openFlow, setOpenFlow] = useState<boolean>(false);
  const [taskResult, setTaskResult] = useState<boolean>(false);
  const [logsOpen, setLogsOpen] = useState<boolean>(false);
  const stepsEndRef = useRef<HTMLDivElement>(null);
  const prevStepsLengthRef = useRef(steps?.length ?? 0);

  useEffect(() => {
    const currentLength = steps?.length ?? 0;
    if (currentLength > prevStepsLengthRef.current) {
      stepsEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    prevStepsLengthRef.current = currentLength;
  }, [steps]);

  const [selectedStep, setSelectedStep] = useState<TaskStep | null>(null);

  if (!task || !task.id) {
    return (
      <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
        Select a task from the list to see details.
      </Box>
    );
  }

  const statusMap = {
    IN_PROGRESS: {
      label: "In Progress",
      color: "primary.main",
    },
    COMPLETED: {
      label: "Completed",
      color: "success.main",
    },
    FAILED: {
      label: "Failed",
      color: "error.main",
    },
    WAITING_FOR_USER: {
      label: "Waiting for user",
      color: "warning.main",
    },
    WAITING_FOR_APPROVAL: {
      label: "Waiting for approval",
      color: "warning.main",
    },
    SUPERVISED_NEEDED: {
      label: "Supervision Raised",
      color: "info.main",
    },
    PINNED: {
      label: "Pinned",
      color: "secondary.main",
    },
  };

  const isDebug = Boolean(task.debug);

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <SourcedAvatar
          sx={{
            width: 44,
            height: 44,
            bgcolor: isDebug ? "transparent" : "primary.main",
            ...(isDebug && {
              color: "warning.main",
              border: "1px dashed",
              borderColor: "warning.main",
              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.12),
            }),
          }}
        >
          {isDebug ? (
            <Iconify icon="solar:bug-bold" width={24} />
          ) : (
            <TaskIcon />
          )}
        </SourcedAvatar>

        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography variant="h6" sx={{ fontWeight: 900 }}>
            {task.description}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Created: {new Date(task.createdAt).toLocaleString()}
          </Typography>
        </Box>

        <Chip
          size="small"
          label={statusMap[task.status]?.label}
          sx={{
            fontWeight: 900,
            cursor: "default",
            bgcolor: statusMap[task.status]?.color,
            color: "common.white",
            "&:hover": {
              bgcolor: statusMap[task.status]?.color,
            },
          }}
        />
      </Stack>

      <Stack direction="row" spacing={1}>
        <Tooltip title="Task Flow">
          <Fab
            data-cy="task-flow-button"
            color="default"
            onClick={() => {
              setOpenFlow(true);
              getSteps(task.id);
            }}
          >
            <AccountTreeIcon />
          </Fab>
        </Tooltip>

        {task.status !== "IN_PROGRESS" && (
          <Tooltip title="Task Details">
            <Fab color="default" onClick={() => setTaskResult(true)}>
              <Iconify icon="material-symbols:table-eye-outline" />
            </Fab>
          </Tooltip>
        )}

        <Tooltip title="Logs">
          <Fab
            data-cy="task-logs-button"
            color="default"
            onClick={() => setLogsOpen(true)}
          >
            <Iconify icon="solar:document-text-linear" />
          </Fab>
        </Tooltip>

        {onToggleExpand && (
          <Tooltip title={isExpanded ? "Minimize" : "Expand"}>
            <Fab
              data-cy="task-details-toggle-expand"
              color="default"
              onClick={onToggleExpand}
              sx={{ ml: "auto" }}
            >
              <Iconify
                icon={isExpanded ? "boxicons:minimize" : "boxicons:maximize"}
              />
            </Fab>
          </Tooltip>
        )}
      </Stack>

      <TaskLogsDrawer
        taskId={logsOpen ? task.id : null}
        onClose={() => setLogsOpen(false)}
      />

      <Box
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 2,
          overflow: "hidden",
        }}
      >
        <Box sx={{ px: 2, py: 1.25, bgcolor: "background.default" }}>
          <Typography variant="subtitle2" sx={{ fontWeight: 900 }}>
            Steps
          </Typography>
        </Box>

        <Box>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Comment</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Details</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {steps &&
                steps.map((step, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ width: "100%", maxWidth: 0 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        <StepComment
                          comment={step.comment}
                          parameters={step.parameters}
                        />
                      </Typography>
                    </TableCell>

                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      {new Date(step.createdAt).toDateString() ===
                      new Date().toDateString()
                        ? new Date(step.createdAt).toLocaleTimeString()
                        : new Date(step.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell sx={{ whiteSpace: "nowrap" }}>
                      <Chip
                        size="small"
                        label={statusMap[step.status]?.label}
                        sx={{
                          fontWeight: 800,
                          cursor: "default",
                          bgcolor: statusMap[step.status]?.color,
                          color: "common.white",
                          "&:hover": {
                            bgcolor: statusMap[step.status]?.color,
                          },
                        }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Fab
                        color="default"
                        onClick={() => {
                          setSelectedStep(step);
                        }}
                      >
                        <Iconify icon="material-symbols:folder-eye-outline" />
                      </Fab>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
        <div ref={stepsEndRef} />
      </Box>

      <TaskResultDialog open={taskResult} setOpen={setTaskResult} task={task} />

      <TaskFlowStepDialog
        open={Boolean(selectedStep)}
        onClose={() => setSelectedStep(null)}
        step={
          selectedStep && {
            ...selectedStep,
            label:
              selectedStep.action?.replace(/^PLATFORM:/i, "") ||
              selectedStep.comment ||
              "Step",
            inputs: [],
            outputs: [],
          }
        }
      />

      <FlowDialog open={openFlow} setOpen={setOpenFlow} steps={steps} />
    </Stack>
  );
};

export default TaskDetails;
