import ReplyIcon from "@mui/icons-material/Reply";
import { cleanIconName } from "../../utils/cleanIconName";
import { fDateTime } from "../../utils/formatTime";
import useAgent from "../../hooks/useAgent";
import { useEffect } from "react";
import useTask from "../../hooks/useTask";
import { useTheme } from "@mui/material/styles";

import {
  Chip,
  IconButton,
  Skeleton,
  Stack,
  Typography,
  alpha,
  useMediaQuery,
} from "@mui/material";
import { Iconify, Label } from "@canmingir/link/platform/components";

function TaskMessage({ id, handleClick, onDateFetched }) {
  const { task, loading } = useTask(id);

  const { getAgent } = useAgent();

  const { agent } = getAgent(task?.agentId);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down(600));

  useEffect(() => {
    if (task) {
      onDateFetched(fDateTime(task?.createdAt, "MMM DD, YYYY"));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [task]);

  function truncateContent(content) {
    if (isSmallScreen) {
      return content?.substring(0, 10);
    }
    return content;
  }

  if (loading) {
    return (
      <Stack sx={{ flexDirection: "column", gap: 1 }}>
        <Stack sx={{ flexDirection: "row", alignItems: "center", gap: 1 }}>
          <Skeleton variant="rounded" width={80} height={24} />
          <Skeleton variant="text" width={60} />
          <Skeleton variant="rounded" width={140} height={24} />
        </Stack>
        <Skeleton variant="text" width={60} />
      </Stack>
    );
  }

  return (
    <>
      <Stack
        data-cy="task-message"
        sx={{
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Stack
          sx={{
            flexDirection: "row",
            alignItems: "center",
            width: "100%",
          }}
        >
          <Stack
            sx={{
              p: 1.5,
              minWidth: 48,
              maxWidth: "100%",
              borderRadius: 1,
              typography: "body2",
              color: "grey.800",
              background: (theme) => alpha(theme.palette.background.default, 1),
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
            }}
          >
            <Stack
              sx={{
                flexDirection: "row",
                alignItems: "center",
                flexWrap: "wrap",
                width: "100%",
              }}
            >
              <Chip
                avatar={
                  <Iconify
                    icon={cleanIconName(agent?.icon)}
                    width="40%"
                    height="40%"
                    style={{ objectFit: "contain", background: "none" }}
                  />
                }
                label={agent?.name}
                size="small"
                color="primary"
                variant="filled"
              />
              <Typography variant="body2" color="grey.500" sx={{ m: 1 }}>
                {task?.status === "DONE"
                  ? "finished"
                  : task?.status === "IN_PROGRESS"
                  ? "is in progress with"
                  : ""}
              </Typography>
              <Label
                sx={{
                  backgroundColor: "rgba(171,71,188, .6)",
                  color: "rgba(243,229,245, .6)",
                  textTransform: "none",
                  whiteSpace: "normal",
                  wordBreak: "break-word",
                  my: 0.2,
                }}
              >
                {task?.description
                  ? truncateContent(task?.description)
                  : "task"}
              </Label>
            </Stack>
          </Stack>
          {task?.status === "IN_PROGRESS" ? (
            <IconButton
              onClick={() => handleClick(task)}
              data-cy="reply-button"
            >
              <ReplyIcon />
            </IconButton>
          ) : null}
        </Stack>

        <Typography
          noWrap
          variant="caption"
          sx={{
            color: "text.disabled",
          }}
        >
          {(() => {
            switch (task?.status) {
              case "IN_PROGRESS":
                return "In Progress";
              case "COMPLETED":
                return "Completed";
              default:
                return task?.status;
            }
          })()}
        </Typography>
      </Stack>
    </>
  );
}

export default TaskMessage;
