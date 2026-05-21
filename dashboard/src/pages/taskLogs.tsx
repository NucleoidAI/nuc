import { Box } from "@mui/material";
import Page from "../components/Page/Page";
import TaskLogsWidget from "../widgets/TaskLogsWidget/TaskLogsWidget";

function TaskLogs() {
  return (
    <>
      <Page name="Task Logs" />
      <Box sx={{ px: { xs: 2, md: 4 }, pb: 1 }}>
        <TaskLogsWidget />
      </Box>
    </>
  );
}

export default TaskLogs;
