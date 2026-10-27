import { Iconify } from "@canmingir/link/platform/components";
import React from "react";
import TaskIcon from "@mui/icons-material/Task";

import {
  Box,
  Chip,
  List,
  ListItem,
  ListItemButton,
  Stack,
  Typography,
  alpha,
} from "@mui/material";

const TaskList = ({
  tasks,
  selectedTask,
  onTaskSelect,
}: {
  tasks: {
    id: string;
    description: string;
    status: string;
    createdAt: string;
  }[];
  selectedTask: { id: string };
  onTaskSelect: (task: {
    id: string;
    description: string;
    status: string;
    createdAt: string;
  }) => void;
}) => {
  if (!tasks || tasks.length === 0) {
    return (
      <Box sx={{ p: 6, textAlign: "center" }}>
        <Iconify
          icon="solar:inbox-line-duotone"
          width={64}
          sx={{ color: "text.disabled", mb: 2 }}
        />
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No tasks found
        </Typography>
        <Typography variant="body2" color="text.disabled">
          Try adjusting your filters or create a new task
        </Typography>
      </Box>
    );
  }

  return (
    <List
      disablePadding
      sx={{
        height: "100%",
        overflow: "auto",
      }}
    >
      {tasks.map((task) => {
        const isSelected = selectedTask?.id === task.id;
        const isInProgress = task.status === "IN_PROGRESS";
        const isFailed = task.status === "FAILED";

        return (
          <ListItem
            key={task.id}
            disablePadding
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
              "&:last-child": { borderBottom: "none" },
            }}
          >
            <ListItemButton
              selected={isSelected}
              onClick={() => onTaskSelect(task)}
              sx={{
                p: 1,
                position: "relative",
                "&:hover": {
                  bgcolor: isSelected
                    ? (theme) => alpha(theme.palette.primary.main, 0.08)
                    : "action.hover",
                },
                "&.Mui-selected": {
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                  "&:hover": {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  },
                },
              }}
            >
              <Stack
                direction="row"
                spacing={1}
                sx={{ width: "100%", alignItems: "center" }}
              >
                <Box
                  sx={{
                    width: 20,
                    height: 20,
                    borderRadius: 1.5,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    bgcolor: isInProgress
                      ? alpha("#1976d2", 0.1)
                      : alpha("#2e7d32", 0.1),
                    color: isInProgress ? "primary.main" : "success.main",
                    flexShrink: 0,
                  }}
                >
                  <TaskIcon />
                </Box>

                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography
                    variant="body2"
                    sx={{
                      fontWeight: 700,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      display: "-webkit-box",
                      WebkitBoxOrient: "vertical",
                      lineHeight: 1,
                    }}
                  >
                    {task.description}
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    flexWrap="wrap"
                    sx={{ gap: 0.5 }}
                  >
                    <Chip
                      size="small"
                      label={
                        isInProgress
                          ? "In Progress"
                          : isFailed
                          ? "Failed"
                          : "Completed"
                      }
                      sx={{
                        mt: 0.5,
                        height: 20,
                        fontSize: 11,
                        fontWeight: 800,
                        bgcolor: isInProgress
                          ? "primary.main"
                          : isFailed
                          ? "error.main"
                          : "success.main",
                        color: "common.white",
                        "& .MuiChip-label": { px: 1 },
                        "&:hover": {
                          bgcolor: isInProgress
                            ? "primary.main"
                            : "success.main",
                        },
                      }}
                    />

                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 0.5,
                        mt: 1,
                        ml: 1,
                      }}
                    >
                      <Iconify icon="solar:calendar-linear" width={12} />
                      {new Date(task.createdAt).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                        year:
                          new Date(task.createdAt).getFullYear() !==
                          new Date().getFullYear()
                            ? "numeric"
                            : undefined,
                      })}
                    </Typography>
                  </Stack>
                </Box>
              </Stack>
            </ListItemButton>
          </ListItem>
        );
      })}
    </List>
  );
};

export default TaskList;
