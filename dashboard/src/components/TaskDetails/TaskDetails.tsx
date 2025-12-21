import AccountTreeIcon from "@mui/icons-material/AccountTree";
import FlowDialog from "../FlowDialog/FlowDialog";
import { Iconify } from "@canmingir/link/platform/components";
import SourcedAvatar from "../SourcedAvatar/SourcedAvatar";
import SupervisingTask from "../SupervisingTask/SupervisingTask";
import TaskIcon from "@mui/icons-material/Task";
import TaskResultDialog from "../TaskResultDialog/TaskResultDialog";
import TaskStepDialog from "../TaskStepDialog/TaskStepDialog";

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
} from "@mui/material";
import React, { useMemo, useState } from "react";

const TaskDetails = ({ task, steps, agentId, getSteps }) => {
  const [openFlow, setOpenFlow] = useState(false);
  const [stepResult, setStepResult] = useState(false);
  const [taskResult, setTaskResult] = useState(false);
  const [supervisingTask, setSupervisingTask] = useState(false);
  const [results, setResults] = useState(null);

  const safeSteps = useMemo(() => (Array.isArray(steps) ? steps : []), [steps]);

  if (!task) {
    return (
      <Box sx={{ py: 6, textAlign: "center", color: "text.secondary" }}>
        Select a task from the list to see details
      </Box>
    );
  }

  const statusLabel = task.status === "IN_PROGRESS" ? "In Progress" : "Done";

  return (
    <Stack spacing={2}>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <SourcedAvatar sx={{ width: 44, height: 44, bgcolor: "primary.main" }}>
          <TaskIcon />
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
          label={statusLabel}
          sx={{
            fontWeight: 900,
            cursor: "default",
            bgcolor:
              task.status === "IN_PROGRESS" ? "primary.main" : "success.main",
            color: "common.white",
            "&:hover": {
              bgcolor:
                task.status === "IN_PROGRESS" ? "primary.main" : "success.main",
            },
          }}
        />
      </Stack>

      <Stack direction="row" spacing={1}>
        <Tooltip title="Task Flow">
          <Fab
            size="small"
            color="default"
            onClick={() => {
              setOpenFlow(true);
              getSteps(task.id);
            }}
          >
            <AccountTreeIcon />
          </Fab>
        </Tooltip>

        <Tooltip title="Supervising">
          <Fab
            size="small"
            sx={{
              backgroundColor: (theme) => theme.palette.success.main,
              "&:hover": {
                backgroundColor: (theme) => theme.palette.success.dark,
              },
            }}
            onClick={() => setSupervisingTask(true)}
          >
            <Iconify icon="solar:users-group-rounded-bold" />
          </Fab>
        </Tooltip>

        {task.status !== "IN_PROGRESS" && (
          <Tooltip title="Task Details">
            <Fab
              size="small"
              color="default"
              onClick={() => setTaskResult(true)}
            >
              <Iconify icon="material-symbols:table-eye-outline" />
            </Fab>
          </Tooltip>
        )}
      </Stack>

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

        <Box sx={{ maxHeight: 500, overflow: "auto" }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Comment</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Result</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {safeSteps &&
                safeSteps.map((step, i) => (
                  <TableRow key={i} hover>
                    <TableCell sx={{ maxWidth: 320 }}>
                      <Typography
                        variant="body2"
                        sx={{
                          fontWeight: 700,
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {step.comment}
                      </Typography>
                    </TableCell>

                    <TableCell>
                      {new Date(step.createdAt).toDateString() ===
                      new Date().toDateString()
                        ? new Date(step.createdAt).toLocaleTimeString()
                        : new Date(step.createdAt).toLocaleDateString()}
                    </TableCell>

                    <TableCell>
                      <Chip
                        size="small"
                        label={
                          step.status === "IN_PROGRESS" ? "Running" : "Done"
                        }
                        sx={{
                          fontWeight: 800,
                          cursor: "default",
                          bgcolor:
                            step.status === "IN_PROGRESS"
                              ? "primary.main"
                              : "success.main",
                          color: "common.white",
                          "&:hover": {
                            bgcolor:
                              step.status === "IN_PROGRESS"
                                ? "primary.main"
                                : "success.main",
                          },
                        }}
                      />
                    </TableCell>

                    <TableCell align="right">
                      <Fab
                        size="small"
                        color="default"
                        onClick={() => {
                          setResults(step);
                          setStepResult(true);
                        }}
                        disabled={step.status === "IN_PROGRESS"}
                      >
                        <Iconify icon="material-symbols:folder-eye-outline" />
                      </Fab>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <SupervisingTask
        taskId={task.id}
        open={supervisingTask}
        setOpen={setSupervisingTask}
        agentId={agentId}
      />

      <TaskResultDialog open={taskResult} setOpen={setTaskResult} task={task} />

      <TaskStepDialog
        open={stepResult}
        setOpen={setStepResult}
        results={results}
      />

      <FlowDialog open={openFlow} setOpen={setOpenFlow} steps={steps} />
    </Stack>
  );
};

export default TaskDetails;
